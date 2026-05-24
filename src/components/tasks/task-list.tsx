"use client"

import { Check, Trash2, CheckCircle2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Task } from "@/types/task"
import { TaskItem } from "./task-item"

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

    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)

    const startEditing = (task: Task, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingTaskId(task.id)
        if (!expandedTasks.has(task.id)) toggleExpand(task.id)
    }

    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev)
            if (newSet.has(taskId)) newSet.delete(taskId)
            else newSet.add(taskId)
            return newSet
        })
    }

    // Handle task completion
    const handleComplete = async (taskId: string, isCompleted: boolean) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        let updates: Partial<Task> = {}
        let newStatus = !isCompleted

        if (task.scope === 'shared' && Array.isArray(task.completed_by)) {
            // completed_by column exists (migration applied) — track per-user completion
            const currentArray = task.completed_by
            let newArray = [...currentArray]

            if (currentArray.includes(userId)) {
                // Unmark — remove from array, only unmark is_completed if nobody else marked it
                newArray = newArray.filter(id => id !== userId)
                newStatus = newArray.length > 0
            } else {
                // Mark — any single person marking = task is done
                newArray.push(userId)
                newStatus = true
            }
            updates = {
                completed_by: newArray,
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            }
        } else {
            // Simple completion: personal task, or completed_by column not yet in DB
            updates = {
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            }
        }

        // Optimistic Update call
        updateTask(taskId, updates)

        // CELEBRATION!
        if (newStatus) {
            confetti({
                particleCount: 40,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FF69B4', '#00BFFF']
            })

            toast.success("Task completed!", {
                description: "Keep up the great work!",
            })
        }
    }

    const confirmDelete = async () => {
        if (!taskToDelete) return
        deleteTask(taskToDelete)
        toast.success("Task deleted.")
        setTaskToDelete(null)
    }

    if (loading) {
        return (
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-24 rounded-2xl bg-surface-container border border-outline-variant/60 animate-pulse"
                    >
                        <div className="flex items-center gap-4 h-full px-5">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high" />
                            <div className="flex-1 space-y-3">
                                <div className="h-3.5 w-1/2 rounded-full bg-surface-container-high" />
                                <div className="h-2.5 w-1/4 rounded-full bg-surface-container-high" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // Separate active and completed tasks
    const activeTasks = tasks.filter(t => !t.is_completed)
    const completedTasks = tasks.filter(t => t.is_completed)

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your task.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Active Tasks */}
            {activeTasks.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 items-start">
                    {activeTasks.map((task, i) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            index={i}
                            userId={userId}
                            isExpanded={expandedTasks.has(task.id)}
                            isEditing={editingTaskId === task.id}
                            onToggleExpand={() => toggleExpand(task.id)}
                            onStartEditing={(e) => startEditing(task, e)}
                            onCancelEditing={() => setEditingTaskId(null)}
                            onComplete={(isCompleted) => handleComplete(task.id, isCompleted)}
                            onDelete={() => setTaskToDelete(task.id)}
                            onUpdate={(updates) => {
                                updateTask(task.id, updates)
                                if (editingTaskId === task.id) {
                                    setEditingTaskId(null)
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl bg-surface-container border border-outline-variant/60 animate-in fade-in duration-200">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                            <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={2} />
                        </div>
                        <h3 className="font-headline font-bold text-lg text-on-surface mb-1.5">All clear</h3>
                        <p className="text-on-surface-variant text-sm max-w-[280px] leading-relaxed">
                            {partnerId
                                ? "You and your partner are all caught up. Add a task to keep the momentum going."
                                : "You're all caught up. Add a task to keep the momentum going."}
                        </p>
                    </div>
                )
            )}

            {/* Completed Tasks (Collapsible) */}
            {completedTasks.length > 0 && (
                <div className="space-y-3">
                    <button
                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                        className="flex items-center gap-2 px-1 text-on-surface-variant hover:text-on-surface transition-colors w-full active:scale-[0.98]"
                    >
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isCompletedExpanded && "rotate-180")} />
                        <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                            {completedTasks.length} completed
                        </span>
                    </button>

                    {isCompletedExpanded && (
                        <div className="rounded-2xl bg-surface-container border border-outline-variant/60 divide-y divide-outline-variant/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                            {completedTasks.map(task => (
                                <div key={task.id} className="group flex items-center gap-3 px-4 py-3">
                                    <button
                                        onClick={() => handleComplete(task.id, task.is_completed)}
                                        className="h-6 w-6 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0 transition-colors hover:bg-primary/25 active:scale-[0.98]"
                                    >
                                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                    </button>
                                    <span className="flex-1 text-sm text-on-surface-variant line-through truncate">
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => setTaskToDelete(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-on-surface-variant hover:text-error transition-all shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
