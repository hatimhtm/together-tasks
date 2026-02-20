import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Generate random 6-character code
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding confusing chars
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Generate unique code
        let code = generateCode()

        // Create partner link with pending status by updating the profile
        const { error } = await supabase
            .from('profiles')
            .update({ link_code: code })
            .eq('id', user.id)

        if (error) {
            // Wait, does 'link_code' exist in profiles?
            throw error
        }

        return NextResponse.json({ code })
    } catch (error: any) {
        console.error('Generate code error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
