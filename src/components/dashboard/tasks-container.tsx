"use client"

import { useState } from "react"
import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskList } from "@/components/tasks/task-list"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { format } from "date-fns"

type Tab = "my" | "partner" | "shared"

function getDateBuckets(tasks: any[], userId: string, partnerId: string | null | undefined, activeTab: Tab) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayEndMs = todayEnd.getTime();

    const todayTasks = [];
    const upcomingTasks = [];

    // O(N) traversal, categorizing into today/upcoming while checking tabs
    for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];

        let include = true;
        if (activeTab === "shared") {
            include = t.scope === 'shared';
        } else if (activeTab === "my") {
            include = t.assignee_id === userId || t.scope === 'shared';
        } else if (activeTab === "partner") {
            include = t.assignee_id === partnerId || t.scope === 'shared';
        }

        if (!include) continue;

        if (t.is_completed) {
            if (t.completed_at && new Date(t.completed_at).getTime() >= todayStartMs) {
                todayTasks.push(t);
            }
        } else {
            if (!t.due_date) {
                todayTasks.push(t);
            } else {
                if (new Date(t.due_date).getTime() <= todayEndMs) {
                    todayTasks.push(t);
                } else {
                    upcomingTasks.push(t);
                }
            }
        }
    }

    return { todayTasks, upcomingTasks };
}

export function TasksContainer({
    userId,
    partnerId,
    partnerName,
    initialTasks,
    userTheme = 'light',
    partnerTheme = 'light',
    sidebarSlot
}: {
    userId: string,
    partnerId?: string | null,
    partnerName?: string,
    initialTasks?: any[],
    userTheme?: string,
    partnerTheme?: string,
    sidebarSlot?: React.ReactNode
}) {
    const { tasks, loading, addTask, updateTask, deleteTask } = useRealtimeTasks(userId, partnerId, initialTasks, partnerName)
    const [activeTab, setActiveTab] = useState<Tab>("my")
    const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false)
    const { setTheme } = useTheme()

    const { todayTasks, upcomingTasks } = getDateBuckets(tasks, userId, partnerId, activeTab)

    return (
        <div className="w-full max-w-5xl mx-auto pb-10 pt-2 px-2 sm:px-0 flex flex-col md:flex-row gap-6 items-start">
            {/* Left Sidebar */}
            <div className="w-full md:w-[320px] shrink-0 space-y-4 md:sticky md:top-28 z-10 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {sidebarSlot}

                {/* Focus Tabs */}
                {partnerId && (
                    <div className="w-full">
                        <div className="flex p-1 space-x-1 bg-muted/50 rounded-full">
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
                                        "flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                                        activeTab === tab
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
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
                    <QuickAdd onAddTask={addTask} hasPartner={!!partnerId} userId={userId} partnerId={partnerId} />
                </div>
            </div>

            {/* Task List (Right Column) */}
            <div className="flex-1 w-full min-w-0 md:bg-transparent rounded-t-3xl md:rounded-none space-y-6">
                {/* Today's Tasks */}
                <TaskList
                    userId={userId}
                    partnerId={partnerId}
                    propTasks={todayTasks}
                    propLoading={loading}
                    propUpdateTask={updateTask}
                    propDeleteTask={deleteTask}
                />

                {/* Upcoming Tasks */}
                {upcomingTasks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/20">
                        <button
                            onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                            className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity w-full"
                        >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex-1 text-left">
                                Upcoming ({upcomingTasks.length})
                            </h3>
                            {isUpcomingExpanded
                                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            }
                        </button>

                        <AnimatePresence>
                            {isUpcomingExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/20 opacity-80">
                                        {upcomingTasks.map(task => (
                                            <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="flex-1 text-sm text-foreground/80 font-medium truncate">{task.title}</span>
                                                {task.due_date && (
                                                    <span className="text-xs text-muted-foreground shrink-0 bg-muted/40 px-2 py-0.5 rounded-full">
                                                        {format(new Date(task.due_date), 'MMM d')}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
