import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = await request.json()

        // Find the partner link with this code
        const { data: linkRequest, error: findError } = (await supabase
            .from('partner_links' as any)
            .select('*')
            .eq('link_code', code)
            .eq('status', 'pending')
            .single()) as any

        if (findError || !linkRequest) {
            console.error('Link error (find):', findError)
            return NextResponse.json(
                { error: 'Invalid or expired code' },
                { status: 400 }
            )
        }

        // Can't link with yourself
        if (linkRequest.user1_id === user.id) {
            return NextResponse.json(
                { error: 'Cannot link with yourself' },
                { status: 400 }
            )
        }

        // Update partner link to active
        const { error: updateLinkError } = (await supabase
            .from('partner_links' as any)
            .update({
                user2_id: user.id,
                status: 'active',
                activated_at: new Date().toISOString()
            })
            .eq('id', linkRequest.id)) as any

        if (updateLinkError) throw updateLinkError

        // Update both profiles with partner_id
        const { error: update1Error } = await supabase
            .from('profiles')
            .update({ partner_id: user.id })
            .eq('id', linkRequest.user1_id)

        if (update1Error) throw update1Error

        const { error: update2Error } = await supabase
            .from('profiles')
            .update({ partner_id: linkRequest.user1_id })
            .eq('id', user.id)

        if (update2Error) throw update2Error

        return NextResponse.json({
            success: true,
            partnerId: linkRequest.user1_id
        })
    } catch (error: any) {
        console.error('Link error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
