export type Cadence = "daily" | "weekdays" | "weekends" | "weekly" | "custom"

export interface Routine {
    id: string
    creator_id: string
    assignee_id: string | null
    partner_id: string | null
    title: string
    description: string | null
    cadence: Cadence
    days_of_week: number[] | null   // 0 = Sun .. 6 = Sat
    color: string
    icon: string
    xp_reward: number
    is_shared: boolean
    archived_at: string | null
    created_at: string
}

export interface RoutineCompletion {
    id: string
    routine_id: string
    user_id: string
    completed_on: string  // ISO date (yyyy-mm-dd)
    created_at: string
}

/** Does this routine apply on the given weekday (0 = Sun .. 6 = Sat)? */
export function isRoutineDueOn(routine: Routine, weekday: number): boolean {
    switch (routine.cadence) {
        case "daily":    return true
        case "weekdays": return weekday >= 1 && weekday <= 5
        case "weekends": return weekday === 0 || weekday === 6
        case "weekly":
        case "custom":   return (routine.days_of_week ?? []).includes(weekday)
        default:         return false
    }
}

export function isRoutineDueToday(routine: Routine): boolean {
    return isRoutineDueOn(routine, new Date().getDay())
}

/**
 * Compute a running streak for one user against one routine.
 * The streak counts consecutive eligible days ending today on which a completion exists.
 */
export function routineStreak(
    routine: Routine,
    completions: RoutineCompletion[],
    today: Date = new Date(),
): number {
    const done = new Set(completions
        .filter(c => c.user_id !== undefined)
        .map(c => c.completed_on));

    let streak = 0
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)

    // Allow up to ~365 days back
    for (let i = 0; i < 365; i++) {
        const weekday = d.getDay()
        if (isRoutineDueOn(routine, weekday)) {
            const key = d.toISOString().slice(0, 10)
            if (done.has(key)) {
                streak++
            } else if (i === 0) {
                // Today not yet done — streak runs through yesterday.
                d.setDate(d.getDate() - 1)
                continue
            } else {
                break
            }
        }
        d.setDate(d.getDate() - 1)
    }
    return streak
}

export const CADENCE_LABELS: Record<Cadence, string> = {
    daily:    "Every day",
    weekdays: "Weekdays",
    weekends: "Weekends",
    weekly:   "Weekly",
    custom:   "Custom days",
}
