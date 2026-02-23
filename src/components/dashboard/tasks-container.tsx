"use client"

import { useState } from "react"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskList } from "@/components/tasks/task-list"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

type Tab = "my" | "partner" | "shared"

export function TasksContainer({
    userId,
    partnerId,
    initialTasks,
    userTheme = 'light',
    partnerTheme = 'light'
}: {
    userId: string,
    partnerId?: string | null,
    initialTasks?: any[],
    userTheme?: string,
    partnerTheme?: string
}) {
    const { tasks, loading, addTask, updateTask, deleteTask } = useRealtimeTasks(userId, partnerId, initialTasks)
    const [activeTab, setActiveTab] = useState<Tab>("my")
    const { setTheme } = useTheme()

    // Filter tasks based on selected tab and scope
    const filteredTasks = tasks.filter(task => {
        if (activeTab === "shared") return task.scope === 'shared'
        if (activeTab === "my") return task.assignee_id === userId || task.scope === 'shared'
        if (activeTab === "partner") return task.assignee_id === partnerId || task.scope === 'shared'
        return true
    })

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start pb-10">
            {/* Left side: Quick Add & Filters */}
            <div className="w-full lg:w-[350px] shrink-0 space-y-8 lg:sticky lg:top-24 z-10">
                {/* Quick Add Task */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold px-1 text-foreground/90">Quick Create</h2>
                    <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} />
                </div>

                {/* Focus Tabs */}
                {partnerId && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold px-1 text-foreground/90">Your Focus</h2>
                        <div className="flex p-1.5 space-x-1.5 bg-muted/60 p-1 rounded-xl glass-card backdrop-blur-md">
                            {(['my', 'partner', 'shared'] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab)
                                        if (tab === 'partner') {
                                            setTheme(partnerTheme)
                                        } else {
                                            setTheme(userTheme)
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300",
                                        activeTab === tab
                                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50 scale-[1.02]"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    {tab === 'my' ? 'Mine' : tab === 'partner' ? 'Partner' : 'Shared'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Task List */}
            <div className="flex-1 w-full min-w-0 md:bg-transparent rounded-t-3xl md:rounded-none pt-4 md:pt-0">
                <TaskList
                    userId={userId}
                    partnerId={partnerId}
                    propTasks={filteredTasks}
                    propLoading={loading}
                    propUpdateTask={updateTask}
                    propDeleteTask={deleteTask}
                />
            </div>
        </div>
    )
}
