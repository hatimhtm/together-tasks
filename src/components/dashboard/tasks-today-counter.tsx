"use client"

import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { CheckCircle2 } from "lucide-react"

export function TasksTodayCounter({ userId, partnerId }: { userId: string, partnerId?: string | null }) {
    const { tasks } = useRealtimeTasks(userId, partnerId)
    const tasksCount = tasks.filter(t => !t.is_completed && (t.assignee_id === userId || t.scope === 'shared')).length || 0;

    if (tasksCount === 0) {
        return (
            <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 pointer-events-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All done</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm bg-muted/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 pointer-events-auto shadow-sm">
            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
                {tasksCount}
            </span>
            <span className="text-foreground/80 hidden sm:inline">left today</span>
        </div>
    )
}
