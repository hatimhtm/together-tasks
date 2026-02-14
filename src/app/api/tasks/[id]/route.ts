import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH - Update a task (complete/uncomplete)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const updates = await request.json()
        const { id: taskId } = await params // Await params for Next.js 15+

        // Update the task
        const { data: task, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single()

        if (error) throw error

        // If task was completed, update XP
        if (updates.is_completed) {
            // XP logic handled by triggers ideally, or RPC call if exists
            // TODO: Implement add_xp function in database
            /* await supabase.rpc('add_xp', {
              user_id: user.id,
              amount: 10
            }).catch(() => {
              // RPC function doesn't exist yet, ignore error
            }) */
        }

        return NextResponse.json({ task })
    } catch (error: any) {
        console.error('Task update error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// DELETE - Remove a task
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: taskId } = await params

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
