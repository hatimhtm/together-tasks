"use client"

import { CheckCircle2 } from "lucide-react"
import { Task } from "@/types/task"

export function TasksTodayCounter({ userId, tasks }: { userId: string, tasks: Task[] }) {
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
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-medium">
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
        <div className="flex items-center gap-2 h-9 px-3 rounded-full border border-outline-variant/60 bg-surface-container text-on-surface text-sm font-medium">
            <div className="relative w-6 h-6 flex items-center justify-center -ml-1">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="12"
                        cy="12"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        className="text-outline-variant/40"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="text-primary transition-[stroke-dashoffset] duration-200 ease-out"
                    />
                </svg>
            </div>
            <span className="text-on-surface-variant">
                {completedTasks}/{totalTasks} <span className="hidden sm:inline">done</span>
            </span>
        </div>
    )
}
