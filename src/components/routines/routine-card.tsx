"use client"

import { motion } from "framer-motion"
import { Check, Flame, Trash2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 space-y-4 group"
        >
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
                            <p className="text-sm text-on-surface-variant line-clamp-2">{routine.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                            <span>{CADENCE_LABELS[routine.cadence]}</span>
                            <span>·</span>
                            <span>+{routine.xp_reward} XP</span>
                            {streak > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-1 text-primary">
                                        <Flame className="w-3.5 h-3.5" /> {streak} day{streak === 1 ? "" : "s"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onArchive}
                        className="opacity-0 group-hover:opacity-100 lg:opacity-0 transition-opacity p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10"
                        aria-label="Archive routine"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* 7-day strip */}
                <div className="flex items-center justify-between gap-1">
                    {week.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <span className="text-[10px] font-mono uppercase text-on-surface-variant/60">
                                {day.label}
                            </span>
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                                    !day.due && "bg-surface-container-high/40",
                                    day.due && !day.userDone && "bg-surface-container-high border border-outline-variant/60",
                                    day.due && day.userDone && "bg-primary text-on-primary",
                                )}
                                title={day.due ? (day.userDone ? "You ✓" : "Missed") : "Off day"}
                            >
                                {day.userDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                            </div>
                            {partnerId && (
                                <span
                                    className={cn(
                                        "h-1 w-5 rounded-full transition-colors",
                                        day.partnerDone ? "bg-secondary" : "bg-surface-container-high",
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
                        "w-full h-11 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]",
                        !dueToday && "bg-surface-container-high text-on-surface-variant cursor-not-allowed",
                        dueToday && !isDoneToday && "bg-primary text-on-primary hover:opacity-90",
                        dueToday && isDoneToday && "bg-primary/12 text-primary",
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
        </motion.div>
    )
}
