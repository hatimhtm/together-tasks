"use client"

import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function TasksTodayCounter({ userId, partnerId }: { userId: string, partnerId?: string | null }) {
    const { tasks } = useRealtimeTasks(userId, partnerId)

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // All tasks assigned to me (personal + shared that involve me)
    const myTasks = tasks.filter(t => t.assignee_id === userId)

    // Determine if I've personally completed a task (handles both shared and personal)
    // Check completed_by first (shared path), then fall back to is_completed (personal + old tasks)
    const iDoneIt = (t: any): boolean => {
        if (Array.isArray(t.completed_by) && t.completed_by.includes(userId)) return true
        return t.is_completed
    }

    // Today's relevant set: incomplete tasks + tasks I completed today
    const relevantTasks = myTasks.filter(t => {
        if (iDoneIt(t)) {
            // For shared: no date available, just count it; for personal: check date
            if (t.scope === 'shared') return true
            return t.completed_at ? new Date(t.completed_at) >= todayStart : true
        }
        if (t.is_completed) return false // completed by someone else
        if (t.due_date) return new Date(t.due_date) <= todayEnd
        return true // Undated = always pending
    })

    const completedTasks = relevantTasks.filter(t => iDoneIt(t)).length || 0
    const totalTasks = relevantTasks.length || 0
    const pendingTasks = totalTasks - completedTasks;

    if (totalTasks === 0 || pendingTasks === 0) {
        return (
            <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 pointer-events-auto shadow-sm backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">All done</span>
            </div>
        )
    }

    const percentage = Math.round((completedTasks / totalTasks) * 100);
    const radius = 9;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm bg-glass-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-glass-border pointer-events-auto shadow-sm hover:bg-glass-white/70 transition-colors">
            <div className="relative w-6 h-6 flex items-center justify-center -ml-1">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="12"
                        cy="12"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        className="text-muted/20"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        cx="12"
                        cy="12"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-primary drop-shadow-sm"
                    />
                </svg>
            </div>
            <span className="text-foreground/90 tracking-wide font-medium">
                {completedTasks}/{totalTasks} <span className="hidden sm:inline opacity-70">done</span>
            </span>
        </div>
    )
}
