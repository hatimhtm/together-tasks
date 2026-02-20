import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

interface Task {
    id: string
    title: string
    description: string | null
    due_date: string | null
    priority: "low" | "medium" | "high" | "urgent"
    is_completed: boolean
    creator_id: string
    assignee_id: string
    created_at: string
    completed_at: string | null
    emergency_level?: "low" | "medium" | "high" | "critical"
    importance_level?: "low" | "medium" | "high" | "critical"
    duration_estimate?: number
    scope?: string | null
    subtasks?: { id: string, title: string, is_completed: boolean }[] | null
}

export function useRealtimeTasks(userId: string, partnerId?: string | null, initialTasks?: Task[]) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks || [])
    const [loading, setLoading] = useState(!initialTasks)
    const supabase = createClient()

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

        const handleTasksUpdate = () => fetchTasks()
        window.addEventListener('tasks-updated', handleTasksUpdate)

        // Cleanup
        return () => {
            clearTimeout(timer)
            if (channel) channel.unsubscribe()
            window.removeEventListener('tasks-updated', handleTasksUpdate)
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
            .channel("tasks-changes")
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "tasks",
                    filter: `creator_id=eq.${userId}` // Your tasks
                },
                (payload) => {
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
                    filter: `creator_id=eq.${partnerId}` // Partner's tasks
                },
                (payload) => {
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
                setTasks(prev => [newRecord as Task, ...prev])
                break

            case "UPDATE":
                // Task updated - replace in list
                setTasks(prev =>
                    prev.map(task =>
                        task.id === newRecord.id ? (newRecord as Task) : task
                    )
                )
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
            // 2. API Call
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            })

            if (!response.ok) throw new Error("Failed to update")

            // No need to update state again if successful, as realtime will confirm it 
            // or the optimistic update is already there. 
            // Actually, to be safe against server-side sanitization, we could update with response data
            // but for "instant" feel, we stick with optimistic.
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
            // 2. API Call
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "DELETE"
            })

            if (!response.ok) throw new Error("Failed to delete")
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
            // 2. API Call to existing endpoint (which does AI parsing)
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input, useAI: true })
            })

            if (!response.ok) throw new Error("Failed to create task")

            const { task: realTask } = await response.json()

            // 3. Replace Optimistic Task with Real Task
            setTasks(prev => prev.map(t => t.id === tempId ? realTask : t))

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
