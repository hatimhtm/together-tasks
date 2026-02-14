import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeTaskForPartnerNotification } from '@/lib/ai/task-analyzer'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { taskId } = await request.json()

        if (!taskId) {
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
        }

        // Get task details
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId as string)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Get task owner profile
        const { data: taskOwner } = await supabase
            .from('profiles')
            .select('username, role, partner_id')
            .eq('id', task.creator_id as string)
            .single()

        if (!taskOwner || !taskOwner.partner_id) {
            return NextResponse.json({ error: 'No partner linked' }, { status: 400 })
        }

        // Get partner profile
        const { data: partner } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', taskOwner.partner_id)
            .single()

        if (!partner) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
        }

        // Analyze with AI
        const analysis = await analyzeTaskForPartnerNotification(
            task,
            {
                name: taskOwner.username || undefined,
                role: (taskOwner.role || 'king') as 'king' | 'queen'
            },
            {
                name: partner.username || undefined,
                role: (partner.role || 'queen') as 'king' | 'queen'
            }
        )

        // If AI says to notify, create notification
        if (analysis.shouldNotifyPartner) {
            const { error: notifyError } = (await supabase
                .from('partner_notifications' as any)
                .insert({
                    task_id: task.id,
                    task_owner_id: task.creator_id,
                    partner_id: taskOwner.partner_id,
                    notification_type: analysis.notificationType,
                    ai_reasoning: analysis.reasoning,
                    message: analysis.suggestedMessage
                })) as any

            if (notifyError) {
                console.error('Failed to create notification:', notifyError)
            }
        }

        return NextResponse.json({
            analysis,
            notificationCreated: analysis.shouldNotifyPartner
        })
    } catch (error: any) {
        console.error('Analysis error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
