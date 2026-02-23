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
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-10 pt-4 px-2 sm:px-0">
            {/* Focus Tabs */}
            {partnerId && (
                <div className="w-full">
                    <div className="flex p-1.5 space-x-1.5 bg-muted/60 rounded-xl glass-card backdrop-blur-md">
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

            {/* Quick Add Task */}
            <div className="space-y-2 relative z-10 w-full">
                <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} />
            </div>

            {/* Task List */}
            <div className="w-full min-w-0 md:bg-transparent rounded-t-3xl md:rounded-none">
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
