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

        const { partnerEmail } = await request.json()

        if (!partnerEmail) {
            return NextResponse.json({ error: 'Partner email is required' }, { status: 400 })
        }

        if (partnerEmail.toLowerCase() === user.email?.toLowerCase()) {
            return NextResponse.json({ error: 'You cannot link with yourself' }, { status: 400 })
        }

        // 1. Find partner by email
        const { data: partnerProfile, error: partnerError } = await supabase
            .from('profiles')
            .select('id, username')
            .ilike('email', partnerEmail)
            .single()

        if (partnerError || !partnerProfile) {
            return NextResponse.json({ error: 'Partner not found. Ensure they have signed up first!' }, { status: 404 })
        }

        // 2. Perform Mutual Link (Update both profiles)
        await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', user.id)
        await supabase.from('profiles').update({ partner_id: user.id }).eq('id', partnerProfile.id)

        // 3. Send Notification to Partner
        const myName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Your partner";
        await sendWebPush(
            partnerProfile.id,
            "You are now linked! 💕",
            `${myName} just linked their account with yours. You can now share tasks!`
        ).catch(console.error)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Partner link error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to link partner' },
            { status: 500 }
        )
    }
}
