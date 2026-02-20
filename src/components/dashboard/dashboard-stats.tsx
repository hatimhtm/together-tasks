"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { useRealtimeProfile } from "@/hooks/use-realtime-profile"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"

export function DashboardStats({
    userId,
    partnerId,
    initialTasks,
    initialStreak,
}: {
    userId: string,
    partnerId?: string | null,
    initialTasks?: any[],
    initialStreak?: number,
}) {
    // 1. Hook into realtime arrays and profiles!
    const { tasks } = useRealtimeTasks(userId, partnerId, initialTasks)
    const { profile } = useRealtimeProfile(userId)

    // Calculate dynamic active tasks left for the user today
    const tasksCount = tasks.filter(t => {
        if (t.is_completed) return false;
        // Count my tasks that are active
        if (t.assignee_id === userId) return true;
        return false;
    }).length || 0;

    const streak = profile?.streak || initialStreak || 0

    return (
        <a href="#tasks" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <GlassCard className="p-6 transition-all hover:bg-muted/10 active:scale-[0.98]">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
                        <p className="text-3xl font-bold text-foreground">
                            {tasksCount} <span className="text-sm font-normal text-muted-foreground">left</span>
                        </p>
                    </div>

                    <div className="h-12 w-px bg-border/50" />

                    <div className="space-y-1 text-right">
                        <p className="text-sm font-medium text-muted-foreground">Couple Streak</p>
                        <p className="text-3xl font-bold text-accent">🔥 {streak}</p>
                    </div>
                </div>
            </GlassCard>
        </a>
    )
}
