"use client"

import { Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
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
import { ChevronDown, ChevronUp } from "lucide-react"
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
                className: "bg-background/80 backdrop-blur-md border-border/50",
            })
        }
    }

    const confirmDelete = async () => {
        if (!taskToDelete) return
        deleteTask(taskToDelete)
        toast.success("Task deleted.", {
            className: "bg-background/80 backdrop-blur-md border-border/50",
        })
        setTaskToDelete(null)
    }

    if (loading) {
        return (
            <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i, index) => (
                    <div
                        key={i}
                        className="h-20 rounded-2xl bg-card border border-border/40 relative overflow-hidden"
                        style={{ opacity: 1 - (index * 0.25) }}
                    >
                        <div className="flex items-center gap-4 h-full px-5">
                            <div className="w-5 h-5 rounded-md bg-muted/40 animate-pulse" />
                            <div className="flex-1 space-y-3">
                                <div className="h-3.5 w-1/2 bg-muted/40 rounded-full animate-pulse" />
                                <div className="h-2.5 w-1/4 bg-muted/30 rounded-full animate-pulse" />
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
        <div className="space-y-8 pb-24">
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
            <AnimatePresence mode="popLayout">
                {activeTasks.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Active ({activeTasks.length})
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {activeTasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
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
                    </div>
                ) : (
                    tasks.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border/40 rounded-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 shadow-inner relative">
                                <Check className="h-10 w-10 text-primary drop-shadow-sm relative z-10" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">All Clear!</h3>
                            <p className="text-muted-foreground text-sm max-w-[260px] leading-relaxed relative z-10">
                                {partnerId ? "You and your partner are all caught up. Take a break or add a new goal!" : "You're all caught up. Add a task to keep the momentum going!"}
                            </p>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* Completed Tasks (Collapsible) */}
            {completedTasks.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/20">
                    <button
                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                        className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity"
                    >
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Completed ({completedTasks.length})
                        </h3>
                        {isCompletedExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                        {isCompletedExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-300 overflow-hidden"
                            >
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
                                                onClick={() => setTaskToDelete(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:text-destructive transition-opacity"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
