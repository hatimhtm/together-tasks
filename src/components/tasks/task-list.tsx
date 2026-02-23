"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Check, Trash2, Calendar, Clock, AlertCircle, Pencil } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { format } from "date-fns"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
    subtasks?: ({ id: string, title: string, is_completed: boolean } | string)[] | null
    completed_by?: string[] | null
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

    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Task>>({})

    const startEditing = (task: Task, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingTaskId(task.id)
        setEditForm({ title: task.title, description: task.description, subtasks: task.subtasks })
        if (!expandedTasks.has(task.id)) toggleExpand(task.id)
    }

    const saveEdit = () => {
        if (!editingTaskId) return
        updateTask(editingTaskId, editForm)
        setEditingTaskId(null)
        setEditForm({})
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

        if (task.scope === 'shared') {
            const currentArray = task.completed_by || []
            let newArray = [...currentArray]

            if (currentArray.includes(userId)) {
                // Unmark
                newArray = newArray.filter(id => id !== userId)
                newStatus = false // Definitively not complete
            } else {
                // Mark
                newArray.push(userId)
                // If partner already marked it, it will now be 2!
                if (newArray.length >= 2) {
                    newStatus = true
                } else {
                    newStatus = false
                }
            }
            updates = { completed_by: newArray, is_completed: newStatus }
        } else {
            updates = {
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            }
        }

        // Optimistic Update call
        updateTask(taskId, updates)

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

            // Trigger client gamification badges to refetch their XP if necessary
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('profile-updated'))
                }
            }, 1000)
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

            <AnimatePresence mode="popLayout">
                {activeTasks.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Active ({activeTasks.length})
                            </h3>
                        </div>

                        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-[40px] border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] rounded-[20px] overflow-hidden divide-y divide-border/20">
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
                                    <div className="p-3 sm:px-4 transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5">
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox Button */}
                                            <button
                                                onClick={() => handleComplete(task.id, task.is_completed)}
                                                className={cn(
                                                    "mt-1 h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-all shrink-0 active:scale-90",
                                                    task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "border-primary/50 bg-primary/20",
                                                    task.scope === 'shared' && task.completed_by && task.completed_by.length === 1 && !task.completed_by.includes(userId) && "border-primary/50 bg-transparent ring-2 ring-primary/20 ring-offset-1"
                                                )}
                                                title={task.scope === 'shared' ? (task.completed_by?.includes(userId) ? "Waiting for partner..." : task.completed_by && task.completed_by.length === 1 ? "Partner finished! Your turn." : "Mark complete") : "Complete task"}
                                            >
                                                {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && (
                                                    <div className="h-2.5 w-2.5 rounded-full bg-primary/70 animate-pulse" />
                                                )}
                                            </button>

                                            {/* Task Content */}
                                            {editingTaskId === task.id ? (
                                                <div className="flex-1 min-w-0 space-y-3">
                                                    <input
                                                        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                                                        value={editForm.title || ''}
                                                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                                    />
                                                    <textarea
                                                        className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none min-h-[60px] shadow-sm leading-relaxed"
                                                        value={editForm.description || ''}
                                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Description..."
                                                    />
                                                    {editForm.subtasks && editForm.subtasks.length > 0 && (
                                                        <div className="space-y-2 mt-2 pl-1 border-l-2 border-primary/20">
                                                            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Edit Subtasks</p>
                                                            {editForm.subtasks.map((st: any, i: number) => (
                                                                <div key={typeof st === 'string' ? i : st.id} className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                                                    <input
                                                                        className="flex-1 bg-background/60 border border-border/50 rounded-md px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                                                        value={typeof st === 'string' ? st : st.title}
                                                                        onChange={e => {
                                                                            const newSubtasks = [...(editForm.subtasks || [])];
                                                                            if (typeof st === 'string') newSubtasks[i] = e.target.value;
                                                                            else newSubtasks[i] = { ...st, title: e.target.value };
                                                                            setEditForm(prev => ({ ...prev, subtasks: newSubtasks }));
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2 justify-end pt-1">
                                                        <button onClick={() => setEditingTaskId(null)} className="text-xs px-3 py-1.5 hover:bg-muted font-medium rounded-md text-muted-foreground transition-colors">Cancel</button>
                                                        <button onClick={saveEdit} className="text-xs px-4 py-1.5 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:opacity-90 transition-opacity">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => toggleExpand(task.id)}>
                                                        <h4 className="font-medium text-foreground text-base leading-tight">
                                                            {task.title}
                                                        </h4>

                                                        {/* Priority/Emergency Indicator */}
                                                        <div className="flex items-center gap-1 shrink-0 mt-1.5" onClick={e => e.stopPropagation()}>
                                                            {task.scope === 'shared' && (
                                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                                                    Shared
                                                                </span>
                                                            )}
                                                            <div className={cn(
                                                                "relative flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-muted-foreground/10 hover:border-primary/30 transition-colors cursor-pointer",
                                                            )} title={`Click to change Priority`}>
                                                                <div className={cn("w-1.5 h-1.5 rounded-full pointer-events-none", getPriorityColor(task.priority))} />
                                                                <span className="hidden sm:inline-block text-[10px] font-medium text-muted-foreground capitalize tracking-wide pointer-events-none">
                                                                    {task.priority}
                                                                </span>
                                                                <select
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px]"
                                                                    value={task.priority}
                                                                    onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                                                                >
                                                                    <option value="low">Low</option>
                                                                    <option value="medium">Medium</option>
                                                                    <option value="high">High</option>
                                                                    <option value="urgent">Urgent</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {task.description && expandedTasks.has(task.id) && (
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    {/* Meta Info & Actions */}
                                                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/70">
                                                        {expandedTasks.has(task.id) && task.due_date && (
                                                            <div className={cn(
                                                                "flex items-center gap-1",
                                                                new Date(task.due_date) < new Date() && "text-red-500 font-medium"
                                                            )}>
                                                                <Calendar className="h-3 w-3" />
                                                                {format(new Date(task.due_date), "MMM d, h:mm a")}
                                                            </div>
                                                        )}
                                                        {expandedTasks.has(task.id) && task.priority === 'urgent' && (
                                                            <div className="flex items-center gap-1 text-red-500 font-medium">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Urgent
                                                            </div>
                                                        )}
                                                        {expandedTasks.has(task.id) && task.duration_estimate && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {task.duration_estimate} min
                                                            </div>
                                                        )}
                                                        <div className="ml-auto flex items-center gap-1">
                                                            {expandedTasks.has(task.id) && (
                                                                <button onClick={(e) => startEditing(task, e)} className="text-muted-foreground hover:text-primary p-1.5 rounded-md transition-colors" title="Edit task">
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => toggleExpand(task.id)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                                                {expandedTasks.has(task.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* AI Subtasks Preview */}
                                                    {expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
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
                                            )}

                                            <button
                                                onClick={() => setTaskToDelete(task.id)}
                                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 -mr-2 -mt-2 text-muted-foreground hover:text-destructive"
                                                aria-label="Delete task"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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
                                        onClick={() => setTaskToDelete(task.id)}
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
