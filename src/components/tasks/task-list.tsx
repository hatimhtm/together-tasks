"use client"

import { Check, Trash2, CheckCircle2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { useMemo, useState } from "react"
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

type Group = "today" | "upcoming" | "anytime"

function groupTasks(activeTasks: Task[]): Record<Group, Task[]> {
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const groups: Record<Group, Task[]> = { today: [], upcoming: [], anytime: [] }

    for (const t of activeTasks) {
        if (!t.due_date) {
            groups.anytime.push(t)
        } else if (new Date(t.due_date) <= todayEnd) {
            groups.today.push(t) // due today or overdue
        } else {
            groups.upcoming.push(t)
        }
    }

    // Sort dated groups by soonest due first; anytime keeps insertion (newest-first) order.
    const byDue = (a: Task, b: Task) =>
        new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime()
    groups.today.sort(byDue)
    groups.upcoming.sort(byDue)

    return groups
}

const GROUP_META: { key: Group; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "anytime", label: "Anytime" },
]

export function TaskList({
    userId,
    partnerId,
    propTasks,
    propLoading,
    propUpdateTask,
    propDeleteTask,
    onClaim,
    showPoolClaim,
}: {
    userId: string
    partnerId?: string | null
    propTasks?: Task[]
    propLoading?: boolean
    propUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>
    propDeleteTask?: (taskId: string) => Promise<void>
    onClaim?: (taskId: string) => void
    showPoolClaim?: boolean
}) {
    // If props are provided, use them (Controlled mode)
    // Otherwise, use the hook locally (Uncontrolled mode)
    const hookData = useRealtimeTasks(userId, partnerId)

    const tasks = propTasks ?? hookData.tasks
    const loading = propLoading ?? hookData.loading
    const updateTask = propUpdateTask ?? hookData.updateTask
    const deleteTask = propDeleteTask ?? hookData.deleteTask

    // Expand ⇒ edit: a single set tracks which tasks are open (and therefore editing).
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)

    const expand = (taskId: string) => {
        setExpandedTasks(prev => {
            if (prev.has(taskId)) return prev
            const newSet = new Set(prev)
            newSet.add(taskId)
            return newSet
        })
    }

    const collapse = (taskId: string) => {
        setExpandedTasks(prev => {
            if (!prev.has(taskId)) return prev
            const newSet = new Set(prev)
            newSet.delete(taskId)
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
                completed_at: newStatus ? new Date().toISOString() : null,
            }
        } else {
            // Simple completion: personal task, or completed_by column not yet in DB
            updates = {
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null,
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
                colors: ['#FFD700', '#FF69B4', '#00BFFF'],
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

    // Swipe-delete → instant delete with an Undo toast (no destructive modal).
    const handleSwipeDelete = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return
        const snapshot: Task = { ...task }
        deleteTask(taskId)
        toast("Task deleted", {
            description: snapshot.title,
            action: {
                label: "Undo",
                onClick: () => { void recreateTask(snapshot) },
            },
        })
    }

    // Re-insert a deleted task on Undo by writing back only a safe column subset.
    // (The full row may carry columns that don't exist in every environment;
    // inserting those would fail. The realtime INSERT event re-adds it to the list.)
    const recreateTask = async (snapshot: Task) => {
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const safeRow = {
                title: snapshot.title,
                description: snapshot.description,
                creator_id: snapshot.creator_id,
                assignee_id: snapshot.assignee_id,
                priority: snapshot.priority,
                scope: snapshot.scope,
                due_date: snapshot.due_date,
                is_completed: snapshot.is_completed,
            }
            const { error } = await supabase.from("tasks").insert(safeRow)
            if (error) throw error
            // The realtime INSERT subscription re-adds the row to the list.
        } catch {
            toast.error("Couldn't undo — task may have changed.")
        }
    }

    const activeTasks = useMemo(() => tasks.filter(t => !t.is_completed), [tasks])
    const completedTasks = useMemo(() => tasks.filter(t => t.is_completed), [tasks])
    const grouped = useMemo(() => groupTasks(activeTasks), [activeTasks])

    if (loading) {
        return (
            <div className="divide-y divide-outline-variant/40">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-3 py-3">
                            <div className="w-[22px] h-[22px] rounded-full bg-surface-container-high" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-1/2 rounded-full bg-surface-container-high" />
                                <div className="h-2.5 w-1/4 rounded-full bg-surface-container-high" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    let rowIndex = 0

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Dialog (explicit trash button only) */}
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

            {activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-200">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-7 w-7 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="font-headline font-bold text-lg text-on-surface mb-1.5">All clear</h3>
                    <p className="text-on-surface-variant text-sm max-w-[280px] leading-relaxed">
                        {partnerId
                            ? "You and your partner are all caught up. Add a task to keep the momentum going."
                            : "You're all caught up. Add a task to keep the momentum going."}
                    </p>
                </div>
            ) : (
                GROUP_META.map(({ key, label }) => {
                    const list = grouped[key]
                    if (list.length === 0) return null
                    return (
                        <section key={key}>
                            <h3 className="flex items-baseline gap-1.5 px-1 pb-1 text-[11px] font-label font-semibold uppercase tracking-[0.1em] text-on-surface-variant/80">
                                {label}
                                <span className="text-on-surface-variant/50 font-medium">{list.length}</span>
                            </h3>
                            <div className="divide-y divide-outline-variant/40">
                                {list.map(task => {
                                    const i = rowIndex++
                                    return (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            index={i}
                                            userId={userId}
                                            partnerId={partnerId}
                                            isExpanded={expandedTasks.has(task.id)}
                                            onExpand={() => expand(task.id)}
                                            onCollapse={() => collapse(task.id)}
                                            onComplete={(isCompleted) => handleComplete(task.id, isCompleted)}
                                            onDelete={() => handleSwipeDelete(task.id)}
                                            onRequestDelete={() => setTaskToDelete(task.id)}
                                            onClaim={onClaim ? () => onClaim(task.id) : undefined}
                                            showClaim={!!showPoolClaim && task.scope === "shared" && task.assignee_id === task.creator_id}
                                            onUpdate={(updates) => updateTask(task.id, updates)}
                                        />
                                    )
                                })}
                            </div>
                        </section>
                    )
                })
            )}

            {/* Completed Tasks (Collapsible) */}
            {completedTasks.length > 0 && (
                <div>
                    <button
                        onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                        className="flex items-center gap-1.5 px-1 h-11 -my-1 text-on-surface-variant/80 hover:text-on-surface transition-colors w-full active:opacity-80"
                    >
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isCompletedExpanded && "rotate-180")} />
                        <span className="text-[11px] font-label font-semibold uppercase tracking-[0.1em]">
                            Completed
                        </span>
                        <span className="text-on-surface-variant/50 font-medium text-[11px]">{completedTasks.length}</span>
                    </button>

                    {isCompletedExpanded && (
                        <div className="divide-y divide-outline-variant/40 animate-in fade-in slide-in-from-top-1 duration-200">
                            {completedTasks.map(task => (
                                <div key={task.id} className="group flex items-center gap-3 py-2.5">
                                    <button
                                        onClick={() => handleComplete(task.id, task.is_completed)}
                                        aria-label="Mark incomplete"
                                        className="h-[22px] w-[22px] -m-[11px] p-[11px] box-content rounded-full flex items-center justify-center shrink-0 active:opacity-80"
                                    >
                                        <span className="h-[22px] w-[22px] rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center transition-colors group-hover:bg-primary/25">
                                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                        </span>
                                    </button>
                                    <span className="flex-1 text-sm text-on-surface-variant line-through truncate">
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => setTaskToDelete(task.id)}
                                        aria-label="Delete task"
                                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 h-9 w-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error transition-all shrink-0"
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
