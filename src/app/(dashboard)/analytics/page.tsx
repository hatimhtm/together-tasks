"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns"

interface DayStats {
    date: Date
    label: string
    completed: number
    total: number
}

interface Analytics {
    totalCompletedAllTime: number
    completedThisWeek: number
    partnerCompletedThisWeek: number
    completionRate: number
    streak: number
    bestDay: { label: string; count: number } | null
    weekData: DayStats[]
    bestHour: number | null
    myName: string
    partnerName: string
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

            const [{ data: tasks }, partnerRes] = await Promise.all([
                supabase.from('tasks').select('*').or(orFilter),
                profile?.partner_id
                    ? supabase.from('profiles').select('username').eq('id', profile.partner_id).single()
                    : Promise.resolve({ data: null }),
            ])

            const allTasks = tasks || []
            const weekAgoDate = subDays(new Date(), 7)
            const weekAgoStr = weekAgoDate.toISOString()

            let totalCompletedAllTime = 0
            let completedThisWeek = 0
            let partnerCompletedThisWeek = 0
            let totalAll = 0
            const hourCounts: Record<number, number> = {}

            const now = new Date()
            const weekData: DayStats[] = Array.from({ length: 7 }, (_, i) => {
                const date = subDays(now, 6 - i)
                return {
                    date,
                    label: format(date, 'EEE'),
                    startStr: startOfDay(date).toISOString(),
                    endStr: endOfDay(date).toISOString(),
                    completed: 0,
                    total: 0
                } as DayStats & { startStr: string; endStr: string }
            })

            const weekStartStr = (weekData[0] as DayStats & { startStr: string }).startStr
            const weekEndStr = (weekData[6] as DayStats & { endStr: string }).endStr

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                const isMyTask = t.assignee_id === user.id
                const isPartnerTask = profile?.partner_id && t.assignee_id === profile.partner_id

                if (isMyTask) {
                    totalAll++
                    if (t.created_at) {
                        if (t.created_at >= weekStartStr && t.created_at <= weekEndStr) {
                            for (let j = 0; j < 7; j++) {
                                const day = weekData[j] as DayStats & { startStr: string; endStr: string }
                                if (t.created_at >= day.startStr && t.created_at <= day.endStr) {
                                    day.total++
                                    if (t.is_completed) day.completed++
                                    break
                                }
                            }
                        }
                    }

                    if (t.is_completed) {
                        totalCompletedAllTime++
                        if (t.completed_at) {
                            if (t.completed_at >= weekAgoStr) completedThisWeek++
                            if (t.completed_at.length >= 13) {
                                const h = parseInt(t.completed_at.substring(11, 13), 10)
                                if (!isNaN(h)) {
                                    hourCounts[h] = (hourCounts[h] || 0) + 1
                                }
                            }
                        }
                    }
                } else if (isPartnerTask) {
                    if (t.is_completed && t.completed_at) {
                        if (t.completed_at >= weekAgoStr) partnerCompletedThisWeek++
                    }
                }
            }

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
                completionRate: rate,
                streak: profile?.streak || 0,
                bestDay: bestDay?.count ? bestDay : null,
                weekData,
                bestHour,
                myName: profile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
            })
            setLoading(false)
        }
        load()
    }, [router, supabase])

    if (loading || !analytics) {
        return (
            <div className="pt-8 px-6 max-w-2xl mx-auto space-y-8 animate-pulse text-center">
                <div className="h-10 w-48 bg-surface-container-high rounded-lg mx-auto mb-2" />
                <div className="h-32 bg-surface-container-low rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-surface-container rounded-xl" />
                    <div className="aspect-square bg-surface-container rounded-xl" />
                </div>
                <div className="h-64 bg-surface-container-low rounded-xl" />
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
        <motion.main 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="pt-8 px-6 max-w-2xl mx-auto space-y-8 pb-32"
        >
            {/* Hero Section */}
            <section className="space-y-2">
                <h1 className="text-[32px] font-headline font-extrabold tracking-tight text-on-surface">Our Progress</h1>
                <p className="text-on-surface-variant font-label text-sm tracking-wide">Building a legacy, one task at a time.</p>
            </section>

            {/* XP Progress Bar */}
            <section className="bg-surface-container-low p-7 rounded-2xl space-y-4 shadow-[0_0_40px_rgba(255,140,0,0.08)] border border-outline-variant/10">
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
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-container to-primary rounded-full shadow-[0_0_15px_rgba(255,183,125,0.4)]"
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
                {/* Royal Streaks */}
                <div className="col-span-1 bg-surface-container p-6 rounded-2xl flex flex-col justify-between aspect-square border border-outline-variant/5">
                    <div className="bg-primary-container/10 w-12 h-12 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-container text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    </div>
                    <div className="space-y-0.5 mt-4">
                        <p className="text-4xl font-headline font-black text-on-surface">{streak}</p>
                        <p className="text-[13px] font-label font-medium text-on-surface-variant">Days Streak</p>
                    </div>
                </div>

                {/* Love Pulse Harmony */}
                <div className="col-span-1 bg-surface-container p-6 rounded-2xl flex flex-col justify-between aspect-square overflow-hidden relative border border-outline-variant/5 group">
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-secondary text-[28px] group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        <p className="text-[13px] font-label font-medium text-on-surface-variant mt-1.5">Task Rate</p>
                    </div>
                    <div className="relative z-10 mt-2">
                        <p className="text-3xl font-headline font-bold text-on-surface">{completionRate}%</p>
                        <p className="text-xs font-label font-medium text-secondary">In Harmony</p>
                    </div>
                    {/* Abstract Heart Rate Visualizer */}
                    <div className="absolute bottom-0 left-0 w-full h-[55%] opacity-30 flex items-center justify-center">
                        <svg className="w-full h-full text-secondary stroke-current fill-none stroke-2" viewBox="0 0 100 40">
                            <path 
                                style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black, transparent)", maskImage: "linear-gradient(to right, transparent, black, transparent)" }} 
                                d="M0 20 L20 20 L25 5 L35 35 L40 20 L60 20 L65 10 L75 30 L80 20 L100 20" 
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Productivity Analytics: Bar Chart */}
            <section className="bg-surface-container-low p-7 rounded-2xl space-y-8 border border-outline-variant/10">
                <div className="flex justify-between items-center">
                    <h3 className="font-headline font-bold text-xl text-on-surface">Task Output</h3>
                    <span className="text-[10px] uppercase font-bold font-label text-tertiary-fixed-dim bg-tertiary-fixed/10 px-3 py-1.5 rounded-full tracking-wider">
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
                                            "w-full rounded-t-[10px] transition-colors duration-300",
                                            isToday ? "bg-primary shadow-[0_0_15px_rgba(255,183,125,0.4)]" : 
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
                <div className="bg-surface-container p-6 rounded-2xl flex items-center gap-4 border border-outline-variant/5">
                    <div className="p-3 bg-tertiary-fixed/10 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">Most Prod.</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestDay?.label || "—"}</p>
                    </div>
                </div>
                <div className="bg-surface-container p-6 rounded-2xl flex items-center gap-4 border border-outline-variant/5">
                    <div className="p-3 bg-tertiary-fixed/10 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">Best Hour</p>
                        <p className="text-lg font-headline font-bold text-on-surface truncate">{bestHourLabel}</p>
                    </div>
                </div>
            </div>

            {/* Romantic Milestones */}
            <section className="space-y-4 pt-2">
                <h3 className="font-headline font-bold text-xl px-2 text-on-surface">Romantic Milestones</h3>
                <div className="bg-surface-container-low divide-y divide-outline-variant/10 rounded-2xl overflow-hidden border border-outline-variant/10">
                    <div className="flex items-center justify-between p-6 hover:bg-surface-container-low/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>quick_phrases</span>
                            <span className="font-label font-medium text-on-surface">Nudges Sent</span>
                        </div>
                        <span className="text-xl font-headline font-bold text-secondary">312</span>
                    </div>
                    <div className="flex items-center justify-between p-6 hover:bg-surface-container-low/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                            <span className="font-label font-medium text-on-surface">Memories Saved</span>
                        </div>
                        <span className="text-xl font-headline font-bold text-secondary">84</span>
                    </div>
                </div>
            </section>
        </motion.main>
    )
}
