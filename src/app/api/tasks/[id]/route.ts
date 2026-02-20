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
            // Fetch current profile stats
            const { data: profile } = await supabase
                .from('profiles')
                .select('xp, level')
                .eq('id', user.id)
                .single()

            if (profile) {
                const newXp = (profile.xp || 0) + 10 // Base 10 XP per task! Can scale with priority later
                const newLevel = Math.floor(newXp / 100) + 1

                await supabase
                    .from('profiles')
                    .update({ xp: newXp, level: newLevel })
                    .eq('id', user.id)
            }
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
