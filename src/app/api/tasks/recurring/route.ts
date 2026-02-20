import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, format } from 'date-fns'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // We find all unfinished recurring tasks or template tasks that need a "Today" clone
        // For simplicity, we assume "recurrence_rule" = "DAILY" 
        // 1. Fetch all tasks for this user where recurrence_rule = 'DAILY' and is_completed = false
        // (Wait, if they complete it, they still want it tomorrow. So we fetch ALL recurring tasks)
        const { data: recurringTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('recurrence_rule', 'DAILY')
            .or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)

        if (error) throw error
        if (!recurringTasks || recurringTasks.length === 0) {
            return NextResponse.json({ success: true, count: 0 })
        }

        const todayStart = startOfDay(new Date()).toISOString()
        const todayStr = format(new Date(), 'yyyy-MM-dd')

        let createdCount = 0

        // For each recurring task, check if there is an instance for TODAY
        for (const rTask of recurringTasks) {
            // To figure out if it's the "original" template or already an instance for today:
            // Let's assume the original template has due_date equal to its start date or something, and we clone it for today
            // If the user completes today's instance, it becomes `is_completed: true`
            // So we just check if there exists a task with the exact same title for TODAY.
            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('title', rTask.title)
                .gte('due_date', todayStart)
                .or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)

            if (count === 0) {
                // Spawn today's instance
                const { error: insertError } = await supabase
                    .from('tasks')
                    .insert({
                        creator_id: rTask.creator_id,
                        assignee_id: rTask.assignee_id,
                        title: rTask.title,
                        description: rTask.description,
                        due_date: new Date().toISOString(),
                        priority: rTask.priority,
                        emergency_level: rTask.emergency_level,
                        importance_level: rTask.importance_level,
                        duration_estimate: rTask.duration_estimate,
                        subtasks: rTask.subtasks,
                        recurrence_rule: 'DAILY', // carry over the rule so it acts as template too
                        is_completed: false
                    })

                if (!insertError) createdCount++
            }
        }

        return NextResponse.json({ success: true, count: createdCount })
    } catch (error: any) {
        console.error('Recurring spawn error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
