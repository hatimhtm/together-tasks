"use client"

import { motion } from "framer-motion"
import { Check, Flame, Trash2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/ui/glass-card"
import { Routine, RoutineCompletion, CADENCE_LABELS, isRoutineDueOn, isRoutineDueToday, routineStreak } from "@/types/routine"

interface Props {
    routine: Routine
    completions: RoutineCompletion[]  // already filtered to this routine
    userId: string
    partnerId: string | null
    onToggleToday: () => void
    onArchive: () => void
}

const WEEK = ["S", "M", "T", "W", "T", "F", "S"]

export function RoutineCard({ routine, completions, userId, partnerId, onToggleToday, onArchive }: Props) {
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)
    const dueToday = isRoutineDueToday(routine)

    const userCompletions = completions.filter(c => c.user_id === userId)
    const partnerCompletions = partnerId ? completions.filter(c => c.user_id === partnerId) : []

    const isDoneToday = userCompletions.some(c => c.completed_on === todayKey)
    const partnerDoneToday = partnerCompletions.some(c => c.completed_on === todayKey)

    const streak = routineStreak(routine, userCompletions, today)

    // Build the 7-day strip (oldest → today).
    const week: Array<{ date: Date; label: string; userDone: boolean; partnerDone: boolean; due: boolean }> = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        const key = d.toISOString().slice(0, 10)
        week.push({
            date: d,
            label: WEEK[d.getDay()],
            userDone: userCompletions.some(c => c.completed_on === key),
            partnerDone: partnerCompletions.some(c => c.completed_on === key),
            due: isRoutineDueOn(routine, d.getDay()),
        })
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
        >
            <GlassCard className="p-5 space-y-4 group">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-headline font-extrabold text-lg text-on-surface truncate">
                                {routine.title}
                            </span>
                            {routine.is_shared && (
                                <Users className="w-4 h-4 text-tertiary-fixed-dim shrink-0" aria-label="Shared with partner" />
                            )}
                        </div>
                        {routine.description && (
                            <p className="text-sm text-tertiary-fixed-dim line-clamp-2">{routine.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-tertiary-fixed-dim">
                            <span>{CADENCE_LABELS[routine.cadence]}</span>
                            <span>·</span>
                            <span>+{routine.xp_reward} XP</span>
                            {streak > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-1 text-amber-500">
                                        <Flame className="w-3.5 h-3.5" /> {streak} day{streak === 1 ? "" : "s"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onArchive}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-tertiary-fixed-dim hover:text-error hover:bg-error/10"
                        aria-label="Archive routine"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* 7-day strip */}
                <div className="flex items-center justify-between gap-1">
                    {week.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <span className="text-[10px] font-mono uppercase text-tertiary-fixed-dim/60">
                                {day.label}
                            </span>
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                                    !day.due && "bg-muted/20",
                                    day.due && !day.userDone && "bg-muted/30 border border-outline-variant/20",
                                    day.due && day.userDone && "bg-primary text-primary-foreground shadow-md",
                                )}
                                title={day.due ? (day.userDone ? "You ✓" : "Missed") : "Off day"}
                            >
                                {day.userDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </div>
                            {partnerId && (
                                <span
                                    className={cn(
                                        "h-1 w-5 rounded-full transition-all",
                                        day.partnerDone ? "bg-secondary" : "bg-muted/20",
                                    )}
                                    title={day.partnerDone ? "Partner ✓" : ""}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Today action */}
                <button
                    type="button"
                    onClick={onToggleToday}
                    disabled={!dueToday}
                    className={cn(
                        "w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                        !dueToday && "bg-muted/20 text-tertiary-fixed-dim cursor-not-allowed",
                        dueToday && !isDoneToday && "bg-primary text-primary-foreground hover:opacity-90 shadow-md",
                        dueToday && isDoneToday && "bg-emerald-500/15 text-emerald-500",
                    )}
                >
                    {!dueToday ? (
                        "Off today"
                    ) : isDoneToday ? (
                        <>
                            <Check className="w-4 h-4" strokeWidth={3} /> Done today
                            {partnerDoneToday && <span className="text-secondary"> · partner ✓</span>}
                        </>
                    ) : (
                        <>Mark complete</>
                    )}
                </button>
            </GlassCard>
        </motion.div>
    )
}
