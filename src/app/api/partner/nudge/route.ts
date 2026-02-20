import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWebPush } from '@/lib/web-push/sender'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { partnerId } = await request.json()

        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID missing' }, { status: 400 })
        }

        const myName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Your partner";

        // Send a cute push notification instantly
        await sendWebPush(
            partnerId,
            "Thinking of you! ❤️",
            `${myName} is thinking about you right now!`
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to send nudge' },
            { status: 500 }
        )
    }
}
