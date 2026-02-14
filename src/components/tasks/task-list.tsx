"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Check, Circle, Trash2, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { format } from "date-fns"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"

// Define TypeScript interface for type safety
interface Task {
    id: string
    title: string
    description: string | null
    due_date: string | null
    is_completed: boolean
    priority: "low" | "medium" | "high" | "urgent"
    creator_id: string
    assignee_id: string
    created_at: string
    completed_at: string | null
}

export function TaskList({
    userId,
    partnerId,
    propTasks,
    propLoading,
    propUpdateTask,
    propDeleteTask
}: {
    userId: string
    partnerId?: string | null
    propTasks?: Task[]
    propLoading?: boolean
    propUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>
    propDeleteTask?: (taskId: string) => Promise<void>
}) {
    // If props are provided, use them (Controlled mode)
    // Otherwise, use the hook locally (Uncontrolled mode)
    const hookData = useRealtimeTasks(userId, partnerId)

    const tasks = propTasks ?? hookData.tasks
    const loading = propLoading ?? hookData.loading
    const updateTask = propUpdateTask ?? hookData.updateTask
    const deleteTask = propDeleteTask ?? hookData.deleteTask

    // Handle task completion
    const handleComplete = async (taskId: string, isCompleted: boolean) => {
        const newStatus = !isCompleted

        // Optimistic Update call
        updateTask(taskId, {
            is_completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null // This might be string/null type mismatch in TS
        })

        // CELEBRATION! 🎉
        if (newStatus) {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            })

            toast.success("Task completed! 🎉", {
                description: "+10 XP earned"
            })
        }
    }

    const handleDelete = async (taskId: string) => {
        if (!confirm("Delete this task?")) return

        // Optimistic Delete call
        deleteTask(taskId)
        toast.success("Task deleted")
    }

    // Get priority color for visual distinction
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "text-red-500 border-red-500/30"
            case "high": return "text-orange-500 border-orange-500/30"
            case "medium": return "text-yellow-500 border-yellow-500/30"
            default: return "text-green-500 border-green-500/30"
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <GlassCard key={i} className="h-20 animate-pulse" />
                ))}
            </div>
        )
    }

    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.is_completed)
    const completedTasks = tasks.filter(t => t.is_completed)

    return (
        <div className="space-y-6">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">
                        Active Tasks ({activeTasks.length})
                    </h3>
                    {activeTasks.map(task => (
                        <GlassCard
                            key={task.id}
                            className={`p-4 transition-all hover:scale-[1.01] border-l-4 ${getPriorityColor(task.priority)}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox Button */}
                                <button
                                    onClick={() => handleComplete(task.id, task.is_completed)}
                                    className="mt-1 shrink-0"
                                >
                                    <Circle className="h-5 w-5 text-white/50 hover:text-primary transition-colors" />
                                </button>

                                {/* Task Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white text-base">
                                        {task.title}
                                    </h4>

                                    {task.description && (
                                        <p className="text-sm text-white/60 mt-1">
                                            {task.description}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                                        {task.due_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(task.due_date), "MMM d, h:mm a")}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {task.priority}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    className="shrink-0 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 text-red-400/70 hover:text-red-400" />
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Completed Tasks (Collapsed) */}
            {completedTasks.length > 0 && (
                <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-white/60 hover:text-white/80 transition-colors">
                        Completed ({completedTasks.length}) ▼
                    </summary>
                    <div className="space-y-2 mt-4">
                        {completedTasks.map(task => (
                            <GlassCard key={task.id} className="p-3 opacity-50">
                                <div className="flex items-center gap-3">
                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                    <span className="line-through text-white/70 text-sm flex-1">
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="shrink-0"
                                    >
                                        <Trash2 className="h-3 w-3 text-white/40" />
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </details>
            )}

            {/* Empty State */}
            {tasks.length === 0 && (
                <GlassCard className="p-12 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                        <Check className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">All clear!</h3>
                    <p className="text-white/60 text-sm">
                        No tasks yet. Add one above to get started.
                    </p>
                </GlassCard>
            )}
        </div>
    )
}
