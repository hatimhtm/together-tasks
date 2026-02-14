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
        let isUnique = false
        let attempts = 0

        // Ensure code is unique (rare collision but let's be safe)
        while (!isUnique && attempts < 10) {
            const { data: existing } = (await supabase
                .from('partner_links' as any)
                .select('id')
                .eq('link_code', code)
                .single()) as any

            if (!existing) {
                isUnique = true
            } else {
                code = generateCode()
                attempts++
            }
        }

        // Create partner link with pending status
        const { error } = (await supabase
            .from('partner_links' as any)
            .insert({
                user1_id: user.id,
                link_code: code,
                status: 'pending'
            })) as any

        if (error) throw error

        return NextResponse.json({ code })
    } catch (error: any) {
        console.error('Generate code error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
