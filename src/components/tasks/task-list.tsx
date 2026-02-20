"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Check, Trash2, Calendar, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { format } from "date-fns"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

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
    emergency_level?: "low" | "medium" | "high" | "critical"
    importance_level?: "low" | "medium" | "high" | "critical"
    duration_estimate?: number
    scope?: string | null
    subtasks?: { id: string, title: string, is_completed: boolean }[] | null
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
    const router = useRouter()
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
            completed_at: newStatus ? new Date().toISOString() : null
        })

        // CELEBRATION! 🎉
        if (newStatus) {
            confetti({
                particleCount: 40,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FF69B4', '#00BFFF'] // Gold, Pink, Blue
            })

            toast.success("Task completed!", {
                description: "Keep up the great work!",
                className: "bg-background/80 backdrop-blur-md border-border/50",
            })

            // Trigger server refresh and force client gamification badges to refetch their XP
            setTimeout(() => {
                router.refresh()
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('profile-updated'))
                }
            }, 1000)
        }
    }

    const handleDelete = async (taskId: string) => {
        toast("Delete this task?", {
            description: "This action cannot be undone.",
            action: {
                label: "Delete",
                onClick: () => {
                    deleteTask(taskId)
                    toast.success("Task deleted permanently.")
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        })
    }

    // Handle Subtask Toggle
    const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task || !task.subtasks) return

        const updatedSubtasks = task.subtasks.map((st: any) => {
            if (typeof st !== 'string' && st.id === subtaskId) {
                return { ...st, is_completed: !st.is_completed }
            }
            return st
        })

        updateTask(taskId, { subtasks: updatedSubtasks })
    }

    // Get priority color for visual distinction
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "bg-red-500"
            case "high": return "bg-orange-500"
            case "medium": return "bg-yellow-500"
            default: return "bg-green-500" // Low
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-2xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        )
    }

    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.is_completed)
    const completedTasks = tasks.filter(t => t.is_completed)

    return (
        <div className="space-y-8 pb-24">
            {/* Active Tasks */}
            <AnimatePresence mode="popLayout">
                {activeTasks.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Active ({activeTasks.length})
                            </h3>
                        </div>

                        {activeTasks.map(task => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={task.id}
                                className="group relative"
                            >
                                <GlassCard className="p-4 active:scale-[0.99] transition-transform duration-200 hover:bg-muted/5">
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox Button */}
                                        <button
                                            onClick={() => handleComplete(task.id, task.is_completed)}
                                            className="mt-1 h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-all shrink-0 active:scale-90"
                                        >
                                            {/* Empty circle for uncompleted */}
                                        </button>

                                        {/* Task Content */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-foreground text-base leading-tight">
                                                    {task.title}
                                                </h4>

                                                {/* Priority/Emergency Indicator */}
                                                <div className="flex items-center gap-1 shrink-0 mt-1.5">
                                                    {task.scope === 'shared' && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                                            Shared
                                                        </span>
                                                    )}
                                                    {(task.emergency_level === 'high' || task.emergency_level === 'critical') && (
                                                        <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" title="High Emergency" />
                                                    )}
                                                    <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} title={`Priority: ${task.priority}`} />
                                                </div>
                                            </div>

                                            {task.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/70">
                                                {task.due_date && (
                                                    <div className={cn(
                                                        "flex items-center gap-1",
                                                        new Date(task.due_date) < new Date() && "text-red-500 font-medium"
                                                    )}>
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(task.due_date), "MMM d, h:mm a")}
                                                    </div>
                                                )}
                                                {task.priority === 'urgent' && (
                                                    <div className="flex items-center gap-1 text-red-500 font-medium">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Urgent
                                                    </div>
                                                )}
                                                {task.duration_estimate && (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {task.duration_estimate} min
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Subtasks Preview */}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="mt-2 pl-1 border-l-2 border-primary/20 space-y-1">
                                                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">AI Breakdown</p>
                                                    {task.subtasks.map((st: any, i: number) => {
                                                        if (typeof st === 'string') {
                                                            return (
                                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/80">
                                                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                                                    <span className="truncate">{st}</span>
                                                                </div>
                                                            )
                                                        }

                                                        return (
                                                            <label key={st.id} className="flex items-center gap-2 text-xs cursor-pointer group/st py-0.5">
                                                                <div className="relative flex items-center justify-center shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={st.is_completed}
                                                                        onChange={() => handleSubtaskToggle(task.id, st.id)}
                                                                        className="peer h-3.5 w-3.5 appearance-none rounded-sm border border-muted-foreground/40 checked:border-primary checked:bg-primary hover:border-primary transition-all"
                                                                    />
                                                                    <Check className="absolute h-2.5 w-2.5 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                                                                </div>
                                                                <span className={cn(
                                                                    "truncate transition-colors user-select-none",
                                                                    st.is_completed ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground group-hover/st:text-primary/90"
                                                                )}>
                                                                    {st.title}
                                                                </span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Button (Visible on hover/group-focus or simply accessible) */}
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 -mr-2 -mt-2 hover:text-destructive"
                                            aria-label="Delete task"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    tasks.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                                <Check className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">All Tasks Completed!</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mt-2">
                                You're all caught up. Take a break or add a new task to keep the momentum going.
                            </p>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* Completed Tasks (Collapsed) */}
            {completedTasks.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/20">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Completed ({completedTasks.length})
                    </h3>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                        {completedTasks.map(task => (
                            <motion.div
                                layout
                                key={task.id}
                                className="group relative"
                            >
                                <div className="p-3 rounded-xl bg-muted/10 border border-transparent flex items-center gap-3 hover:bg-muted/20 transition-colors">
                                    <button
                                        onClick={() => handleComplete(task.id, task.is_completed)}
                                        className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
                                    >
                                        <Check className="h-3 w-3" strokeWidth={3} />
                                    </button>

                                    <span className="flex-1 text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                                        {task.title}
                                    </span>

                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:text-destructive transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
