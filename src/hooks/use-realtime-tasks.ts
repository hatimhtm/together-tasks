import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { Task } from "@/types/task"
import { sendPartnerCompletionNotification } from "@/lib/notifications/partner-notify"
import { parseTaskInput } from "@/lib/ai/task-parser"

export function useRealtimeTasks(userId: string, partnerId?: string | null, initialTasks?: Task[], partnerName?: string) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
    const [loading, setLoading] = useState(!initialTasks)
    const supabase = createClient()
    // Each hook instance needs its own channel name to avoid subscription collisions
    // (e.g. TasksContainer and TasksTodayCounter both call this hook)
    const channelName = useRef(`tasks-${userId}-${Math.random().toString(36).slice(2)}`).current

    useEffect(() => {
        // Initial fetch only if we don't have initial tasks
        if (!initialTasks) {
            fetchTasks()
        }

        // Set up real-time subscription
        let channel: RealtimeChannel | null = null;

        // Defer the subscription slightly to ensure client is ready
        const timer = setTimeout(() => {
            channel = setupRealtimeSubscription()
        }, 100)

        return () => {
            clearTimeout(timer)
            if (channel) channel.unsubscribe()
        }
    }, [userId, partnerId])

    const fetchTasks = async () => {
        try {
            // Fetch tasks for user AND partner
            let query = supabase
                .from("tasks")
                .select("*")

            if (partnerId) {
                query = query.or(`creator_id.eq.${userId},assignee_id.eq.${userId},creator_id.eq.${partnerId},assignee_id.eq.${partnerId}`)
            } else {
                // Just my tasks
                query = query.or(`creator_id.eq.${userId},assignee_id.eq.${userId}`)
            }

            const { data, error } = await query.order("created_at", { ascending: false })

            if (error) throw error

            setTasks(data || [])
        } catch (error) {
            console.error("Fetch tasks error:", error)
        } finally {
            setLoading(false)
        }
    }

    const setupRealtimeSubscription = (): RealtimeChannel => {
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "tasks",
                    filter: `creator_id=eq.${userId}` // Your created tasks
                },
                (payload: any) => {
                    handleRealtimeEvent(payload)
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `assignee_id=eq.${userId}` // Tasks assigned to you
                },
                (payload: any) => {
                    handleRealtimeEvent(payload)
                }
            )

        // If partner exists, also listen to their tasks
        if (partnerId) {
            channel.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `creator_id=eq.${partnerId}` // Partner's created tasks
                },
                (payload: any) => {
                    handleRealtimeEvent(payload)
                }
            ).on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `assignee_id=eq.${partnerId}` // Tasks assigned to partner
                },
                (payload: any) => {
                    handleRealtimeEvent(payload)
                }
            )
        }

        channel.subscribe()

        return channel
    }

    const handleRealtimeEvent = (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
            case "INSERT":
                // New task added - add to list
                setTasks(prev => {
                    if (prev.some(t => t.id === newRecord.id)) return prev;
                    return [newRecord as Task, ...prev]
                })
                break

            case "UPDATE":
                // Task updated - replace in list
                setTasks(prev =>
                    prev.map(task =>
                        task.id === newRecord.id ? (newRecord as Task) : task
                    )
                )
                // If partner completed a task I created for them, notify me
                if (
                    newRecord.is_completed &&
                    !oldRecord?.is_completed &&
                    newRecord.creator_id === userId &&
                    newRecord.assignee_id === partnerId &&
                    partnerName
                ) {
                    sendPartnerCompletionNotification(newRecord.title, partnerName)
                }
                break

            case "DELETE":
                // Task deleted - remove from list
                setTasks(prev => prev.filter(task => task.id !== oldRecord.id))
                break
        }
    }

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        // 1. Optimistic Update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
        ))

        try {
            // 2. Direct Supabase Call (Replacing API route for static export)
            const { error: updateError } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId)

            if (updateError) throw updateError
        } catch (error) {
            console.error("Update failed, rolling back", error)
            // 3. Rollback (re-fetch or undo)
            fetchTasks()
        }
    }

    const deleteTask = async (taskId: string) => {
        // 1. Optimistic Update
        const previousTasks = [...tasks]
        setTasks(prev => prev.filter(t => t.id !== taskId))

        try {
            // 2. Direct Supabase Call
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw error
        } catch (error) {
            console.error("Delete failed, rolling back", error)
            // 3. Rollback
            setTasks(previousTasks)
        }
    }

    const addTask = async (input: string) => {
        // 1. Optimistic Update
        const tempId = crypto.randomUUID()
        const optimisticTask: Task = {
            id: tempId,
            title: input, // We don't have the parsed AI title yet, so we use input as title for now
            description: null,
            due_date: null,
            priority: "medium",
            is_completed: false,
            creator_id: userId,
            assignee_id: userId,
            created_at: new Date().toISOString(),
            completed_at: null
        }

        setTasks(prev => [optimisticTask, ...prev])

        try {
            // 2. Client-side Parsing & Supabase Call
            let finalAssigneeId = userId;
            let finalTitle = input;

            if (input.toLowerCase().includes("@partner") && partnerId) {
                finalAssigneeId = partnerId;
                finalTitle = input.replace(/@partner/gi, "").trim();
            } else if (input.toLowerCase().includes("@shared") && partnerId) {
                // Shared logic: Assign to partner but created by you means both see it
                finalAssigneeId = partnerId;
                finalTitle = input.replace(/@shared/gi, "").trim();
            }

            // AI-enrich the task (parse due date, priority, etc.)
            const parsed = await parseTaskInput(finalTitle).catch(() => null)

            // Build due_date: combine date + time if both present
            let due_date: string | null = null
            if (parsed?.dueDate) {
                due_date = parsed.dueTime
                    ? `${parsed.dueDate}T${parsed.dueTime}:00`
                    : parsed.dueDate
            }

            const newTaskData = {
                title: parsed?.title || finalTitle,
                description: parsed?.description || null,
                due_date,
                priority: parsed?.priority || "medium",
                creator_id: userId,
                assignee_id: finalAssigneeId,
                is_completed: false,
                emergency_level: parsed?.emergency_level || 'medium',
                importance_level: parsed?.importance_level || 'medium',
                duration_estimate: parsed?.duration_estimate || 15,
            };

            const { data: realTask, error } = await supabase
                .from('tasks')
                .insert(newTaskData)
                .select()
                .single();

            if (error) throw error;

            // 3. Replace Optimistic Task with Real Task securely to avoid overriding Realtime INSERT
            setTasks(prev => {
                if (prev.some(t => t.id === realTask.id)) {
                    return prev.filter(t => t.id !== tempId)
                }
                return prev.map(t => t.id === tempId ? realTask : t)
            })

            return realTask
        } catch (error) {
            console.error("Create failed, rolling back", error)
            // 4. Rollback
            setTasks(prev => prev.filter(t => t.id !== tempId))
            throw error
        }
    }

    return { tasks, loading, refetch: fetchTasks, updateTask, deleteTask, addTask }
}
