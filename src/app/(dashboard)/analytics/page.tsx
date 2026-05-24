"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
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
    totalCompletedAllTime: number
    completedThisWeek: number
    partnerCompletedThisWeek: number
    partnerCompletedAllTime: number
    completionRate: number
    streak: number
    bestDay: { label: string; count: number } | null
    weekData: DayStats[]
    heatmap: HeatmapCell[]
    bestHour: number | null
    myName: string
    partnerName: string
    nudgesSent: number
}

export default function AnalyticsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }

            const { data: profile } = await supabase
                .from('profiles')
                .select('username, partner_id, streak')
                .eq('id', user.id)
                .single()

            const orFilter = profile?.partner_id
                ? `creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${profile.partner_id},assignee_id.eq.${profile.partner_id}`
                : `creator_id.eq.${user.id},assignee_id.eq.${user.id}`

            const nudgeTargets = profile?.partner_id
                ? [user.id, profile.partner_id]
                : [user.id]

            const [{ data: tasks }, partnerRes, nudgeRes] = await Promise.all([
                supabase.from('tasks').select('*').or(orFilter),
                profile?.partner_id
                    ? supabase.from('profiles').select('username').eq('id', profile.partner_id).single()
                    : Promise.resolve({ data: null }),
                supabase
                    .from('partner_notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('notification_type', 'nudge')
                    .in('partner_id', nudgeTargets),
            ])
            const nudgesSent = nudgeRes?.count ?? 0

            const allTasks = tasks || []
            const weekAgoTime = subDays(new Date(), 7).getTime()

            let totalCompletedAllTime = 0
            let completedThisWeek = 0
            let partnerCompletedThisWeek = 0
            let partnerCompletedAllTime = 0
            let totalAll = 0
            const hourCounts: Record<number, number> = {}

            // 12-week heatmap data — combined couple completions per day.
            const heatmapStart = subDays(new Date(), 12 * 7).getTime()
            const heatmapBuckets: Record<string, number> = {}

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
                        totalCompletedAllTime++
                        if (t.completed_at) {
                            const completedTime = new Date(t.completed_at).getTime()
                            if (completedTime >= weekAgoTime) completedThisWeek++
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

                // Heatmap: count couple-wide completions per day for the last 12 weeks.
                if (t.is_completed && t.completed_at) {
                    const completedTime = new Date(t.completed_at).getTime()
                    if (completedTime >= heatmapStart) {
                        const key = format(new Date(t.completed_at), 'yyyy-MM-dd')
                        heatmapBuckets[key] = (heatmapBuckets[key] || 0) + 1
                    }
                }
            }

            const heatmap: HeatmapCell[] = Object.entries(heatmapBuckets).map(([k, count]) => ({
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

            const rate = totalAll > 0 ? Math.round((totalCompletedAllTime / totalAll) * 100) : 0

            setAnalytics({
                totalCompletedAllTime,
                completedThisWeek,
                partnerCompletedThisWeek,
                partnerCompletedAllTime,
                completionRate: rate,
                streak: profile?.streak || 0,
                bestDay: bestDay?.count ? bestDay : null,
                weekData,
                heatmap,
                bestHour,
                myName: profile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
                nudgesSent,
            })
            setLoading(false)
        }
        load()
    }, [router, supabase])

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

    const { totalCompletedAllTime, completionRate, streak, weekData, bestDay, bestHour } = analytics

    // Gamification Logic
    const currentLevel = Math.floor(totalCompletedAllTime / 10) + 1
    const nextLevel = currentLevel + 1
    const xpInCurrentLevel = (totalCompletedAllTime % 10) * 100 // 1 task = 100 XP
    const xpRequiredForNextLevel = 1000 // 10 tasks to level up
    const levelProgress = (xpInCurrentLevel / xpRequiredForNextLevel) * 100

    const bestHourLabel = bestHour !== null
        ? format(new Date().setHours(bestHour, 0, 0, 0), 'h a')
        : "—"

    const maxChartComplete = Math.max(...weekData.map(d => d.completed), 1)

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Hero Section */}
            <section className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Our Progress</h1>
                <p className="text-on-surface-variant text-sm">Building a legacy, one task at a time.</p>
            </section>

            {/* XP Progress Bar */}
            <section className="bg-surface-container p-6 rounded-2xl space-y-4 border border-outline-variant/60">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-primary font-label text-xs uppercase tracking-widest font-bold">Current Level</span>
                        <h2 className="text-3xl font-headline font-extrabold text-on-surface">Level {currentLevel}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant font-label text-xs uppercase tracking-widest">Next Level</span>
                        <p className="text-lg font-headline font-bold text-on-surface">Level {nextLevel}</p>
                    </div>
                </div>
                <div className="relative w-full h-3.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    />
                </div>
                <div className="flex justify-between items-center text-xs font-label text-on-surface-variant">
                    <span>{xpInCurrentLevel} / {xpRequiredForNextLevel} XP</span>
                    <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                        {xpRequiredForNextLevel - xpInCurrentLevel} XP to level up
                    </span>
                </div>
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Streak */}
                <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[160px] border border-outline-variant/60">
                    <div className="bg-primary/12 w-11 h-11 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    </div>
                    <div className="space-y-0.5 mt-4">
                        <p className="text-4xl font-headline font-black text-on-surface">{streak}</p>
                        <p className="text-[13px] font-label font-medium text-on-surface-variant">Days streak</p>
                    </div>
                </div>

                {/* Task Rate */}
                <div className="bg-surface-container p-6 rounded-2xl flex flex-col justify-between min-h-[160px] border border-outline-variant/60">
                    <div className="bg-secondary/15 w-11 h-11 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <div className="space-y-0.5 mt-4">
                        <p className="text-4xl font-headline font-black text-on-surface">{completionRate}%</p>
                        <p className="text-[13px] font-label font-medium text-on-surface-variant">Task rate</p>
                    </div>
                </div>
            </div>

            {/* Productivity Analytics: Bar Chart */}
            <section className="bg-surface-container p-6 rounded-2xl space-y-6 border border-outline-variant/60">
                <div className="flex justify-between items-center">
                    <h3 className="font-headline font-bold text-lg text-on-surface">Task Output</h3>
                    <span className="text-[10px] uppercase font-bold font-label text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full tracking-wider">
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
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPct}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.05 }}
                                        className={cn(
                                            "w-full rounded-t-[10px] transition-colors duration-200",
                                            isToday ? "bg-primary" :
                                            day.completed > 0 ? "bg-surface-container-highest group-hover:bg-primary/40" : "bg-transparent"
                                        )}
                                        style={{ minHeight: day.completed > 0 ? "4px" : "0px" }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[11px] font-label font-bold tracking-wide",
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
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider truncate">Most Prod.</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestDay?.label || "—"}</p>
                    </div>
                </div>
                <div className="bg-surface-container p-5 rounded-2xl flex items-center gap-4 border border-outline-variant/60">
                    <div className="p-3 bg-primary/12 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider truncate">Best Hour</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestHourLabel}</p>
                    </div>
                </div>
            </div>

            {/* ─────── v2 Couple Insights ─────── */}
            <section className="space-y-4">
                <h3 className="font-headline font-bold text-lg text-on-surface">Couple Insights</h3>

                <CoupleDonut
                    me={analytics.totalCompletedAllTime}
                    partner={analytics.partnerCompletedAllTime}
                    myLabel={analytics.myName}
                    partnerLabel={analytics.partnerName}
                    title="Lifetime completions"
                />

                <FairnessBar
                    me={analytics.completedThisWeek}
                    partner={analytics.partnerCompletedThisWeek}
                    myLabel={analytics.myName}
                    partnerLabel={analytics.partnerName}
                    title="This week's split"
                    period={`Last 7 days · ${analytics.completedThisWeek + analytics.partnerCompletedThisWeek} tasks`}
                />

                <WeekdayHeatmap cells={analytics.heatmap} weeks={12} title="Couple activity · last 12 weeks" />
            </section>

            {/* Romantic Milestones */}
            <section className="space-y-4">
                <h3 className="font-headline font-bold text-lg text-on-surface">Romantic Milestones</h3>
                <div className="bg-surface-container divide-y divide-outline-variant/60 rounded-2xl overflow-hidden border border-outline-variant/60">
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>quick_phrases</span>
                            <span className="font-label font-medium text-on-surface">Nudges Sent</span>
                        </div>
                        <span className="text-xl font-headline font-bold text-on-surface">{analytics.nudgesSent}</span>
                    </div>
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                            <span className="font-label font-medium text-on-surface">Tasks Completed Together</span>
                        </div>
                        <span className="text-xl font-headline font-bold text-on-surface">{analytics.totalCompletedAllTime + analytics.partnerCompletedAllTime}</span>
                    </div>
                </div>
            </section>
        </div>
    )
}
