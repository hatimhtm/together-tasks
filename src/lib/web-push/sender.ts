import webpush from 'web-push'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

export async function sendWebPush(
    userId: string,
    title: string,
    body: string,
    createClient: () => Promise<SupabaseClient<Database>>,
    webPushLib: typeof webpush = webpush
) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn("VAPID keys not configured, skipping push.")
        return
    }

    webPushLib.setVapidDetails(
        'mailto:hatimelhassak.official@gmail.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )

    const supabase = await createClient()

    // Fetch user's subscriptions
    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (error || !subs || subs.length === 0) return

    const payload = JSON.stringify({
        title,
        body
    })

    const expiredIds: number[] = [];

    const promises = subs.map(async (sub) => {
        try {
            await webPushLib.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload)
        } catch (e: any) {
            // Subscription might be invalid/expired, remove it
            if (e.statusCode === 410 || e.statusCode === 404) {
                expiredIds.push(sub.id)
            }
            console.error("Error sending push:", e)
        }
    })

    await Promise.allSettled(promises)

    if (expiredIds.length > 0) {
        await supabase.from('push_subscriptions').delete().in('id', expiredIds)
    }
}
