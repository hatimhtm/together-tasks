import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { location, context } = await request.json()

        // Update user's current location context in their profile
        const { error } = await supabase
            .from('profiles')
            .update({
                // @ts-ignore - Columns added to schema but types not yet generated
                current_location_context: context.currentPlace,
                last_location_update: new Date().toISOString()
            })
            .eq('id', user.id)

        if (error) throw error

        // Optionally: Store location history for analytics
        // (You can add a location_history table later)

        return NextResponse.json({ success: true, context })
    } catch (error: any) {
        console.error('Location update error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
