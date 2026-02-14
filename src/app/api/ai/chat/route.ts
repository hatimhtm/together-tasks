import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAI } from '@/lib/ai/task-parser'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { message } = await request.json()

        // Get user profile for context
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', user.id)
            .single()

        const response = await chatWithAI(message, {
            userName: profile?.username || 'User',
            role: profile?.role || undefined
        })

        return NextResponse.json({ response })
    } catch (error) {
        console.error('AI Chat error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
