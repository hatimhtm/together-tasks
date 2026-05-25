"use client"

import { useMemo, useState } from "react"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskList } from "@/components/tasks/task-list"
import { cn } from "@/lib/utils"
import { Task } from "@/types/task"

type OwnershipFilter = "mine" | "theirs" | "shared" | "pool"

// A pool task = a shared task nobody has personally taken yet. We use the
// existing assignee_id column as the claim signal (no new DB column): an
// unclaimed pool task still has assignee_id === creator_id; tapping "I've got
// this" sets assignee_id = me, which removes it from the pool.
function isPoolTask(task: Task, userId: string, partnerId?: string | null): boolean {
    if (task.scope !== "shared") return false
    if (task.is_completed) return false
    return task.assignee_id === task.creator_id
}

function matchesOwnership(
    task: Task,
    filter: OwnershipFilter,
    userId: string,
    partnerId?: string | null,
): boolean {
    switch (filter) {
        case "mine":
            return task.assignee_id === userId && task.scope !== "shared"
        case "theirs":
            return !!partnerId && task.assignee_id === partnerId && task.scope !== "shared"
        case "shared":
            return task.scope === "shared"
        case "pool":
            return isPoolTask(task, userId, partnerId)
    }
}

export function TasksContainer({
    userId,
    partnerId,
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
}: {
    userId: string
    partnerId?: string | null
    tasks: Task[]
    loading: boolean
    addTask: (input: string) => Promise<any>
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
    deleteTask: (taskId: string) => Promise<void>
}) {
    const [filter, setFilter] = useState<OwnershipFilter>("mine")

    const poolCount = useMemo(
        () => tasks.filter(t => isPoolTask(t, userId, partnerId)).length,
        [tasks, userId, partnerId],
    )

    const visibleTasks = useMemo(() => {
        if (!partnerId) return tasks
        return tasks.filter(t => matchesOwnership(t, filter, userId, partnerId))
    }, [tasks, filter, userId, partnerId])

    // Claim a pool task: set assignee to me so it leaves the pool. Keeps scope
    // shared, so it still counts as a couple task — but now I own the doing.
    const claimTask = (taskId: string) => updateTask(taskId, { assignee_id: userId })

    const filters: { key: OwnershipFilter; label: string; count?: number }[] = [
        { key: "mine", label: "Mine" },
        { key: "theirs", label: "Theirs" },
        { key: "shared", label: "Shared" },
        { key: "pool", label: "Pool", count: poolCount },
    ]

    return (
        <div className="w-full space-y-4">
            {/* Quick add */}
            <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} userId={userId} partnerId={partnerId} />

            {/* Ownership filter — subtle, secondary segmented row */}
            {partnerId && (
                <nav className="flex items-center gap-1 overflow-x-auto -mx-1 px-1">
                    {filters.map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={cn(
                                "shrink-0 inline-flex items-center gap-1 px-2.5 h-9 rounded-full font-label text-[13px] transition-colors active:opacity-80",
                                filter === key
                                    ? "bg-surface-container-high text-on-surface font-semibold"
                                    : "text-on-surface-variant/80 font-medium hover:text-on-surface hover:bg-surface-container-low",
                            )}
                        >
                            {label}
                            {typeof count === "number" && count > 0 && (
                                <span className={cn(
                                    "inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold",
                                    filter === key ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary",
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            )}

            {/* Grouped task list */}
            <TaskList
                userId={userId}
                partnerId={partnerId}
                propTasks={visibleTasks}
                propLoading={loading}
                propUpdateTask={updateTask}
                propDeleteTask={deleteTask}
                onClaim={claimTask}
                showPoolClaim={filter === "pool" || filter === "shared"}
            />
        </div>
    )
}
