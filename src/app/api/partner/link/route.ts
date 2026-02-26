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

        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({ error: 'Partner code is required' }, { status: 400 })
        }

        // 1. Find partner by code
        const { data: partnerProfile, error: partnerError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('link_code', code.toUpperCase())
            .single()

        if (partnerError || !partnerProfile) {
            return NextResponse.json({ error: 'Partner not found or code is invalid.' }, { status: 404 })
        }

        if (partnerProfile.id === user.id) {
            return NextResponse.json({ error: 'You cannot link with yourself' }, { status: 400 })
        }

        // 2. Perform Mutual Link (Update both profiles)
        await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', user.id)
        await supabase.from('profiles').update({ partner_id: user.id }).eq('id', partnerProfile.id)

        // 3. Send Notification to Partner
        const myName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Your partner";
        await sendWebPush(
            partnerProfile.id,
            "You are now linked! 💕",
            `${myName} just linked their account with yours. You can now share tasks!`,
            createClient
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
