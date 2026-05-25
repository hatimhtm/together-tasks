"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns"
import { CoupleDonut } from "@/components/analytics/couple-donut"
import { WeekdayHeatmap } from "@/components/analytics/weekday-heatmap"
import { FairnessBar } from "@/components/analytics/fairness-bar"

interface DayStats {
    date: Date
    label: string
    completed: number
    total: number
}

interface HeatmapCell {
    date: Date
    count: number
}

interface Analytics {
    // Real, DB-backed progression.
    xp: number
    level: number
    streak: number
    // Personal vs shared completion counts.
    myCompletedAllTime: number
    myCompletedThisWeek: number
    partnerCompletedAllTime: number
    partnerCompletedThisWeek: number
    sharedCompletedAllTime: number
    sharedCompletedThisWeek: number
    completionRate: number
    bestDay: { label: string; count: number } | null
    weekData: DayStats[]
    heatmap: HeatmapCell[]
    heatmapShared: HeatmapCell[]
    bestHour: number | null
    myName: string
    partnerName: string
    hasPartner: boolean
}

// Milestones at which a quiet celebration is warranted.
const STREAK_MILESTONES = [7, 30, 100, 365]

export default function AnalyticsPage() {
    const supabase = createClient()
    const router = useRouter()
    const reduceMotion = useReducedMotion()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    // "together" = shared-scope only; "personal" = my own work.
    const [view, setView] = useState<"together" | "personal">("together")
    const celebratedRef = useRef(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('username, partner_id, streak, xp, level')
                .eq('id', user.id)
                .single()

            const orFilter = profile?.partner_id
                ? `creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${profile.partner_id},assignee_id.eq.${profile.partner_id}`
                : `creator_id.eq.${user.id},assignee_id.eq.${user.id}`

            const [{ data: tasks }, partnerRes] = await Promise.all([
                supabase.from('tasks').select('*').or(orFilter),
                profile?.partner_id
                    ? supabase.from('profiles').select('username').eq('id', profile.partner_id).single()
                    : Promise.resolve({ data: null }),
            ])

            const allTasks = tasks || []
            const weekAgoTime = subDays(new Date(), 7).getTime()

            let myCompletedAllTime = 0
            let myCompletedThisWeek = 0
            let partnerCompletedAllTime = 0
            let partnerCompletedThisWeek = 0
            let sharedCompletedAllTime = 0
            let sharedCompletedThisWeek = 0
            let totalAll = 0
            const hourCounts: Record<number, number> = {}

            // 12-week heatmaps — one couple-wide, one shared-scope only.
            const heatmapStart = subDays(new Date(), 12 * 7).getTime()
            const heatmapBuckets: Record<string, number> = {}
            const heatmapSharedBuckets: Record<string, number> = {}

            const now = new Date()
            const weekData: DayStats[] = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(now, 6 - i)
                return {
                    date,
                    label: format(date, 'EEE'),
                    start: startOfDay(date).getTime(),
                    end: endOfDay(date).getTime(),
                    completed: 0,
                    total: 0
                } as DayStats & { start: number; end: number }
            })

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                const isMyTask = t.assignee_id === user.id
                const isPartnerTask = profile?.partner_id && t.assignee_id === profile.partner_id
                const isShared = t.scope === 'shared'

                if (isMyTask) {
                    totalAll++
                    if (t.created_at) {
                        const createdTime = new Date(t.created_at).getTime()
                        for (let j = 0; j < 7; j++) {
                            const day = weekData[j] as DayStats & { start: number; end: number }
                            if (createdTime >= day.start && createdTime <= day.end) {
                                day.total++
                                if (t.is_completed) day.completed++
                                break
                            }
                        }
                    }

                    if (t.is_completed) {
                        myCompletedAllTime++
                        if (t.completed_at) {
                            const completedTime = new Date(t.completed_at).getTime()
                            if (completedTime >= weekAgoTime) myCompletedThisWeek++
                            const h = new Date(t.completed_at).getHours()
                            hourCounts[h] = (hourCounts[h] || 0) + 1
                        }
                    }
                } else if (isPartnerTask) {
                    if (t.is_completed && t.completed_at) {
                        partnerCompletedAllTime++
                        const completedTime = new Date(t.completed_at).getTime()
                        if (completedTime >= weekAgoTime) partnerCompletedThisWeek++
                    }
                }

                if (t.is_completed && t.completed_at) {
                    const completedTime = new Date(t.completed_at).getTime()
                    if (isShared) {
                        sharedCompletedAllTime++
                        if (completedTime >= weekAgoTime) sharedCompletedThisWeek++
                    }
                    if (completedTime >= heatmapStart) {
                        const key = format(new Date(t.completed_at), 'yyyy-MM-dd')
                        heatmapBuckets[key] = (heatmapBuckets[key] || 0) + 1
                        if (isShared) heatmapSharedBuckets[key] = (heatmapSharedBuckets[key] || 0) + 1
                    }
                }
            }

            const toCells = (buckets: Record<string, number>): HeatmapCell[] =>
                Object.entries(buckets).map(([k, count]) => ({
                    date: new Date(k + 'T00:00:00'),
                    count,
                }))

            const bestHour = Object.keys(hourCounts).length > 0
                ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
                : null

            const bestDay = weekData.reduce(
                (best, d) => (!best || d.completed > best.count) ? { label: d.label, count: d.completed } : best,
                null as { label: string; count: number } | null
            )

            const rate = totalAll > 0 ? Math.round((myCompletedAllTime / totalAll) * 100) : 0

            setAnalytics({
                xp: profile?.xp ?? 0,
                level: profile?.level ?? 1,
                streak: profile?.streak || 0,
                myCompletedAllTime,
                myCompletedThisWeek,
                partnerCompletedAllTime,
                partnerCompletedThisWeek,
                sharedCompletedAllTime,
                sharedCompletedThisWeek,
                completionRate: rate,
                bestDay: bestDay?.count ? bestDay : null,
                weekData,
                heatmap: toCells(heatmapBuckets),
                heatmapShared: toCells(heatmapSharedBuckets),
                bestHour,
                myName: profile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
                hasPartner: Boolean(profile?.partner_id),
            })
            setLoading(false)
        }
        load()
    }, [router, supabase])

    // Celebrate ONLY at a real milestone (streak threshold) — never on every visit.
    useEffect(() => {
        if (!analytics || celebratedRef.current || reduceMotion) return
        if (STREAK_MILESTONES.includes(analytics.streak)) {
            celebratedRef.current = true
            import("canvas-confetti").then(({ default: confetti }) => {
                confetti({ particleCount: 70, spread: 80, origin: { y: 0.4 }, disableForReducedMotion: true })
            }).catch(() => {})
        }
    }, [analytics, reduceMotion])

    if (loading || !analytics) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-10 w-48 bg-surface-container-high rounded-lg mb-2" />
                <div className="h-32 bg-surface-container-low rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-surface-container rounded-2xl" />
                    <div className="aspect-square bg-surface-container rounded-2xl" />
                </div>
                <div className="h-64 bg-surface-container-low rounded-2xl" />
            </div>
        )
    }

    const { xp, level, streak, completionRate, weekData, bestDay, bestHour, hasPartner } = analytics

    // Level/XP read straight from the DB trigger (100 XP per level — see migration).
    const xpIntoLevel = xp % 100
    const xpForLevel = 100
    const levelProgress = (xpIntoLevel / xpForLevel) * 100

    const nextStreakMilestone = STREAK_MILESTONES.find(m => m > streak) ?? null

    const bestHourLabel = bestHour !== null
        ? format(new Date().setHours(bestHour, 0, 0, 0), 'h a')
        : "—"

    const maxChartComplete = Math.max(...weekData.map(d => d.completed), 1)

    const togetherView = view === "together"
    // Couple charts use shared-scope counts in "together"; personal uses each partner's own.
    const donutMe = togetherView ? analytics.sharedCompletedAllTime : analytics.myCompletedAllTime
    const donutPartner = togetherView ? 0 : analytics.partnerCompletedAllTime
    const splitMe = analytics.myCompletedThisWeek
    const splitPartner = analytics.partnerCompletedThisWeek
    const heatmapCells = togetherView ? analytics.heatmapShared : analytics.heatmap

    return (
        <div className="space-y-6 lg:space-y-8 max-w-3xl">
            {/* Hero Section */}
            <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="space-y-1.5">
                    <h1 className="text-2xl lg:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Our Progress</h1>
                    <p className="text-on-surface-variant text-sm">Building a legacy, one task at a time.</p>
                </div>
                {hasPartner && (
                    <div
                        role="tablist"
                        aria-label="Metric scope"
                        className="inline-flex shrink-0 rounded-full bg-surface-container-high border border-outline-variant/60 p-1 text-sm"
                    >
                        {(["together", "personal"] as const).map((v) => (
                            <button
                                key={v}
                                role="tab"
                                aria-selected={view === v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-4 h-9 rounded-full font-medium transition-colors capitalize",
                                    view === v ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface",
                                )}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Level / XP — quiet accent, real DB values */}
            <section className="bg-surface-container p-6 rounded-2xl space-y-4 border border-outline-variant/60">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wide">Level</span>
                        <h2 className="text-3xl font-headline font-extrabold text-on-surface">Level {level}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wide">Total XP</span>
                        <p className="text-lg font-headline font-bold text-on-surface tabular-nums">{xp.toLocaleString()}</p>
                    </div>
                </div>
                <div className="relative w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div
                        initial={reduceMotion ? false : { width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-primary/70 rounded-full"
                    />
                </div>
                <p className="text-xs text-on-surface-variant">
                    {xpForLevel - xpIntoLevel} XP to level {level + 1}
                </p>
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Shared streak */}
                <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[160px] border border-outline-variant/60">
                    <div className="bg-primary/12 w-11 h-11 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    </div>
                    <div className="space-y-0.5 mt-4">
                        <p className="text-4xl font-headline font-black text-on-surface tabular-nums">{streak}</p>
                        <p className="text-[13px] font-medium text-on-surface-variant">
                            {hasPartner ? "Day shared streak" : "Day streak"}
                        </p>
                        {nextStreakMilestone && (
                            <p className="text-[11px] text-on-surface-variant/70 pt-0.5">
                                {nextStreakMilestone - streak} to {nextStreakMilestone}-day milestone
                            </p>
                        )}
                    </div>
                </div>

                {/* Task Rate */}
                <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[160px] border border-outline-variant/60">
                    <div className="bg-secondary/15 w-11 h-11 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <div className="space-y-0.5 mt-4">
                        <p className="text-4xl font-headline font-black text-on-surface tabular-nums">{completionRate}%</p>
                        <p className="text-[13px] font-medium text-on-surface-variant">Your completion rate</p>
                    </div>
                </div>
            </div>

            {/* Productivity Analytics: Bar Chart */}
            <section className="bg-surface-container p-6 rounded-2xl space-y-6 border border-outline-variant/60">
                <div className="flex justify-between items-center">
                    <h3 className="font-headline font-bold text-lg text-on-surface">Task Output</h3>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full tracking-wider">
                        Last 7 Days
                    </span>
                </div>
                <div className="flex items-end justify-between h-44 gap-2.5">
                    {weekData.map((day, i) => {
                        const isToday = isSameDay(day.date, new Date())
                        const heightPct = Math.max((day.completed / maxChartComplete) * 100, day.completed > 0 ? 8 : 0)

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full h-full flex items-end relative overflow-hidden rounded-t-[10px]">
                                    <motion.div
                                        initial={reduceMotion ? false : { height: 0 }}
                                        animate={{ height: `${heightPct}%` }}
                                        transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.04, ease: "easeOut" }}
                                        className={cn(
                                            "w-full rounded-t-[10px] transition-colors duration-200",
                                            isToday ? "bg-primary" :
                                            day.completed > 0 ? "bg-surface-container-highest group-hover:bg-primary/40" : "bg-transparent"
                                        )}
                                        style={{ minHeight: day.completed > 0 ? "4px" : "0px" }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[11px] font-bold tracking-wide",
                                    isToday ? "text-primary" : "text-on-surface-variant/60 group-hover:text-on-surface-variant"
                                )}>
                                    {day.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Insights Bento Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-5 rounded-2xl flex items-center gap-4 border border-outline-variant/60">
                    <div className="p-3 bg-primary/12 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">Most Prod.</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestDay?.label || "—"}</p>
                    </div>
                </div>
                <div className="bg-surface-container p-5 rounded-2xl flex items-center gap-4 border border-outline-variant/60">
                    <div className="p-3 bg-primary/12 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">Best Hour</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestHourLabel}</p>
                    </div>
                </div>
            </div>

            {/* ─────── Couple Insights ─────── */}
            {hasPartner && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-headline font-bold text-lg text-on-surface">Couple Insights</h3>
                        <span className="text-[11px] text-on-surface-variant">
                            {togetherView ? "Shared tasks" : "Each of you"}
                        </span>
                    </div>

                    {togetherView ? (
                        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/60 flex items-center gap-5">
                            <div className="bg-primary/12 w-14 h-14 rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Shared work, all time</p>
                                <p className="text-3xl font-headline font-black text-on-surface tabular-nums">{donutMe}</p>
                                <p className="text-sm text-on-surface-variant">tasks you tackled together</p>
                            </div>
                        </div>
                    ) : (
                        <CoupleDonut
                            me={donutMe}
                            partner={donutPartner}
                            myLabel={analytics.myName}
                            partnerLabel={analytics.partnerName}
                            title="Lifetime completions"
                        />
                    )}

                    <FairnessBar
                        me={splitMe}
                        partner={splitPartner}
                        myLabel={analytics.myName}
                        partnerLabel={analytics.partnerName}
                        title="This week's balance"
                        period={`Last 7 days · ${splitMe + splitPartner} tasks`}
                    />

                    <WeekdayHeatmap
                        cells={heatmapCells}
                        weeks={12}
                        title={togetherView ? "Shared activity · last 12 weeks" : "Couple activity · last 12 weeks"}
                    />
                </section>
            )}

            {/* Together totals — real counts only */}
            {hasPartner && (
                <section className="space-y-4">
                    <h3 className="font-headline font-bold text-lg text-on-surface">Together</h3>
                    <div className="bg-surface-container divide-y divide-outline-variant/60 rounded-2xl overflow-hidden border border-outline-variant/60">
                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                                <span className="font-medium text-on-surface">Tasks completed together</span>
                            </div>
                            <span className="text-xl font-headline font-bold text-on-surface tabular-nums">
                                {analytics.myCompletedAllTime + analytics.partnerCompletedAllTime}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                <span className="font-medium text-on-surface">Shared streak</span>
                            </div>
                            <span className="text-xl font-headline font-bold text-on-surface tabular-nums">
                                {streak} day{streak === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
