import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTaskInput } from '@/lib/ai/task-parser'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { input, useAI = true } = await request.json()

        let rawInput = input
        let isForPartner = false
        if (typeof rawInput === 'string' && rawInput.startsWith('@partner ')) {
            isForPartner = true
            rawInput = rawInput.replace('@partner ', '')
        }

        let taskData: any = {}

        if (useAI && rawInput) {
            // Parse with AI
            taskData = await parseTaskInput(rawInput)
        } else {
            // Manual input
            taskData = JSON.parse(rawInput)
        }

        // Ensure profile exists (Self-healing for legacy users)
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (!profile) {
            console.log("Profile missing for user, auto-creating...")
            const email = user.email || ''
            let role = null
            if (email === 'hatimhtm2003@gmail.com') role = 'king'
            if (email === 'enarcylyn@gmail.com') role = 'queen'

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: email,
                    role: role as any,
                    username: user.user_metadata?.full_name || email.split('@')[0],
                    has_completed_onboarding: false
                })

            if (profileError) {
                console.error("Failed to auto-create profile:", profileError)
                // We don't throw here, we let the task insert fail with a clear FK error if it must
            }
        }

        const assignee_id = isForPartner && profile?.partner_id ? profile.partner_id : user.id;

        // Create task in database
        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                creator_id: user.id,
                assignee_id: assignee_id,
                title: taskData.title,
                description: taskData.description || '', // Ensure description is not undefined
                due_date: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
                priority: taskData.priority || 'medium',
                category_id: null,
                is_completed: false,
                emergency_level: taskData.emergency_level || 'medium',
                importance_level: taskData.importance_level || 'medium',
                duration_estimate: taskData.duration_estimate || 15,
                subtasks: taskData.subtasks || []
            })
            .select()
            .single()

        if (error) throw error

        // AI Analysis for Partner Notification (Fire & Forget)
        if (task) {
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/partner/analyze-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: task.id })
            }).catch(err => console.error("Analysis trigger failed:", err))
        }

        return NextResponse.json({ task })
    } catch (error: any) {
        console.error('Task creation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create task' },
            { status: 500 }
        )
    }
}

// GET tasks
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ tasks })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
