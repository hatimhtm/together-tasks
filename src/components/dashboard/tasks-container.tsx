"use client"

import { useState } from "react"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskList } from "@/components/tasks/task-list"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { cn } from "@/lib/utils"
import { ChevronDown, Calendar } from "lucide-react"
import { format } from "date-fns"

type Tab = "my" | "partner" | "shared"

function getDateBuckets(tasks: any[], userId: string, partnerId: string | null | undefined, activeTab: Tab) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // Tab filter — Mine and Partner also show shared tasks so nothing disappears
    const tabFiltered = tasks.filter(task => {
        if (activeTab === "shared") return task.scope === 'shared'
        if (activeTab === "my") return task.assignee_id === userId || task.scope === 'shared'
        if (activeTab === "partner") return task.assignee_id === partnerId || task.scope === 'shared'
        return true
    })

    // Today/overdue bucket: due today, overdue, OR undated (always relevant until completed)
    const todayTasks = tabFiltered.filter(t => {
        if (t.is_completed) {
            // Only show completions from today
            if (t.completed_at) return new Date(t.completed_at) >= todayStart
            return false
        }
        if (t.due_date) return new Date(t.due_date) <= todayEnd
        return true // No due date = always show until done
    })

    // Upcoming: due in the future, not completed
    const upcomingTasks = tabFiltered.filter(t => {
        if (t.is_completed) return false
        if (!t.due_date) return false
        return new Date(t.due_date) > todayEnd
    })

    return { todayTasks, upcomingTasks }
}

export function TasksContainer({
    userId,
    partnerId,
    partnerName,
    initialTasks,
    sidebarSlot
}: {
    userId: string,
    partnerId?: string | null,
    partnerName?: string,
    initialTasks?: any[],
    sidebarSlot?: React.ReactNode
}) {
    const { tasks, loading, addTask, updateTask, deleteTask } = useRealtimeTasks(userId, partnerId, initialTasks, partnerName)
    const [activeTab, setActiveTab] = useState<Tab>("my")
    const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false)

    const { todayTasks, upcomingTasks } = getDateBuckets(tasks, userId, partnerId, activeTab)

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left rail */}
            <div className="w-full lg:w-[380px] shrink-0 space-y-4 lg:sticky lg:top-24">
                {sidebarSlot}

                {/* Quick Add Task */}
                <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} userId={userId} partnerId={partnerId} />

                {/* Focus Tabs */}
                {partnerId && (
                    <nav className="flex gap-2">
                        {(['my', 'partner', 'shared'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 px-4 py-2 rounded-full font-label text-sm transition-colors active:scale-[0.98] whitespace-nowrap",
                                    activeTab === tab
                                        ? "bg-primary text-on-primary font-semibold"
                                        : "bg-surface-container border border-outline-variant/60 text-on-surface-variant font-medium hover:bg-surface-container-high"
                                )}
                            >
                                {tab === 'my' ? 'Mine' : tab === 'partner' ? 'Partner' : 'Shared'}
                            </button>
                        ))}
                    </nav>
                )}
            </div>

            {/* Task list */}
            <div className="flex-1 w-full min-w-0 space-y-6">
                {/* Today / overdue / undated */}
                <TaskList
                    userId={userId}
                    partnerId={partnerId}
                    propTasks={todayTasks}
                    propLoading={loading}
                    propUpdateTask={updateTask}
                    propDeleteTask={deleteTask}
                />

                {/* Upcoming */}
                {upcomingTasks.length > 0 && (
                    <div className="space-y-3">
                        <button
                            onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                            className="flex items-center gap-2 px-1 text-on-surface-variant hover:text-on-surface transition-colors w-full active:scale-[0.98]"
                        >
                            <Calendar className="h-4 w-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] flex-1 text-left">
                                Upcoming ({upcomingTasks.length})
                            </h3>
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isUpcomingExpanded && "rotate-180")} />
                        </button>

                        {isUpcomingExpanded && (
                            <div className="grid gap-2 grid-cols-1 xl:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                {upcomingTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container border border-outline-variant/60"
                                    >
                                        <Calendar className="h-4 w-4 text-on-surface-variant shrink-0" />
                                        <span className="flex-1 text-sm text-on-surface font-medium truncate">{task.title}</span>
                                        {task.due_date && (
                                            <span className="text-xs text-on-surface-variant shrink-0 bg-surface-container-high px-2 py-0.5 rounded-full">
                                                {format(new Date(task.due_date), 'MMM d')}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
