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
        <div className="space-y-8">
            {/* Quick Add Task */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Quick Create</h2>
                <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} />
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Focus</h2>

                    {/* Multi-View Tabs (Only show if linked to a partner) */}
                    {partnerId && (
                        <div className="flex p-1 space-x-1 bg-muted/50 rounded-lg">
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
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                        activeTab === tab
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab === 'my' ? 'Mine' : tab === 'partner' ? 'Partner' : 'Shared'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Passed down filtered tasks */}
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
