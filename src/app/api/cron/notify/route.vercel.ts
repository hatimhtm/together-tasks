import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { sendWebPush } from '@/lib/web-push/sender'

// This is the missing server-side delivery piece: sendWebPush() was never called
// anywhere. Vercel Cron hits this route on a schedule (see vercel.json). It reads
// the users due for a morning briefing / weekly review and pushes to every device
// they've subscribed via the Settings opt-in.
//
// Guarded by a CRON_SECRET header. Degrades gracefully when env (VAPID / service
// role / secret) is unset — it never throws, so a misconfigured deploy won't 500.

// Vercel-only route. The Capacitor build (output: 'export') excludes it via
// `pageExtensions` in next.config.mjs, since static export can't host a dynamic
// route handler.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Service-role client — server-only, bypasses RLS for the cross-user reads the
// cron needs (every due user + their push_subscriptions). sendWebPush expects a
// factory returning a typed client.
function serviceClientFactory() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return null
    const client = createSupabaseClient<Database>(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    return async () => client
}

// Cron fires hourly; treat any profile whose briefing_time falls in the current
// UTC hour as due. Briefing time is stored as "HH:MM[:SS]".
function isDueThisHour(briefingTime: string | null, nowHourUtc: number): boolean {
    if (!briefingTime) return false
    const hour = parseInt(briefingTime.slice(0, 2), 10)
    return Number.isFinite(hour) && hour === nowHourUtc
}

async function handle(req: NextRequest) {
    // Auth gate — constant work whether or not the secret is set, but if unset we
    // refuse rather than run unauthenticated.
    const expected = process.env.CRON_SECRET
    if (!expected) {
        return NextResponse.json({ ok: false, reason: 'CRON_SECRET not configured' }, { status: 503 })
    }
    const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
        || req.headers.get('x-cron-secret')
    if (provided !== expected) {
        return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        // No keys yet — accept the call so the cron doesn't alarm, but do nothing.
        return NextResponse.json({ ok: true, sent: 0, reason: 'VAPID not configured' })
    }

    const factory = serviceClientFactory()
    if (!factory) {
        return NextResponse.json({ ok: false, reason: 'Supabase service role not configured' }, { status: 503 })
    }

    const type = new URL(req.url).searchParams.get('type') === 'weekly' ? 'weekly' : 'morning'
    const supabase = await factory()
    const nowHourUtc = new Date().getUTCHours()

    let sent = 0
    try {
        if (type === 'weekly') {
            // Weekly review — fire for everyone opted in, at their briefing hour.
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, briefing_time, weekly_review_enabled')
                .eq('weekly_review_enabled', true)

            for (const u of users ?? []) {
                if (!isDueThisHour(u.briefing_time, nowHourUtc)) continue
                await sendWebPush(
                    u.id,
                    'Your Weekly Review is ready 📊',
                    `See how you and your partner did this week${u.username ? `, ${u.username}` : ''}!`,
                    factory,
                )
                sent++
            }
        } else {
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, briefing_time, briefing_enabled')
                .eq('briefing_enabled', true)

            for (const u of users ?? []) {
                if (!isDueThisHour(u.briefing_time, nowHourUtc)) continue
                await sendWebPush(
                    u.id,
                    `Good morning${u.username ? ` ${u.username}` : ''} ☀️`,
                    'Your shared goals for today are ready. Have a great one together!',
                    factory,
                )
                sent++
            }
        }
    } catch (e) {
        console.error('Cron notify failed:', e)
        return NextResponse.json({ ok: false, reason: 'send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, type, sent })
}

export async function POST(req: NextRequest) {
    return handle(req)
}

// Vercel Cron issues GET requests; accept both so the schedule works while a
// manual POST (with the same secret) can be used for testing.
export async function GET(req: NextRequest) {
    return handle(req)
}
