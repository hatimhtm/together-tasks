import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('link_code', code.toUpperCase())
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Invalid code or expired.' }, { status: 404 })
        }

        return NextResponse.json({ partner: profile })
    } catch (error: any) {
        console.error('Check code error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check code' },
            { status: 500 }
        )
    }
}
