"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, TrendingUp, Zap, Trophy, Calendar } from "lucide-react"
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

function BarChart({ data }: { data: DayStats[] }) {
    const max = Math.max(...data.map(d => d.completed), 1)
    const today = new Date()

    return (
        <div className="flex items-end gap-2 h-28">
            {data.map((day, i) => {
                const height = Math.max((day.completed / max) * 100, day.completed > 0 ? 8 : 0)
                const isToday = isSameDay(day.date, today)

                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: `${height}%`, opacity: 1 }}
                                transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                                className={cn(
                                    "w-full rounded-t-lg",
                                    isToday
                                        ? "bg-gradient-to-t from-primary to-primary/60 shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
                                        : day.completed > 0
                                            ? "bg-gradient-to-t from-primary/60 to-primary/30"
                                            : "bg-muted/30"
                                )}
                                style={{ minHeight: day.completed > 0 ? 6 : 0 }}
                            />
                        </div>
                        <span className={`text-[10px] font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            {day.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function StatCard({ icon, label, value, sub, delay = 0 }: {
    icon: React.ReactNode, label: string, value: string | number, sub?: string, delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", stiffness: 260, damping: 26 }}
        >
            <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                </div>
                <p className="text-sm font-semibold text-foreground/80 leading-none">{label}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </GlassCard>
        </motion.div>
    )
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

            // Fetch profile first so we can use partner_id in the tasks query
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
            const weekAgoTime = subDays(new Date(), 7).getTime()

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
                                if (t.is_completed) {
                                    day.completed++
                                }
                                break
                            }
                        }
                    }

                    if (t.is_completed) {
                        totalCompletedAllTime++
                        if (t.completed_at) {
                            const completedTime = new Date(t.completed_at).getTime()
                            if (completedTime >= weekAgoTime) {
                                completedThisWeek++
                            }
                            const h = new Date(t.completed_at).getHours()
                            hourCounts[h] = (hourCounts[h] || 0) + 1
                        }
                    }
                } else if (isPartnerTask) {
                    if (t.is_completed && t.completed_at) {
                        const completedTime = new Date(t.completed_at).getTime()
                        if (completedTime >= weekAgoTime) {
                            partnerCompletedThisWeek++
                        }
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
            <div className="space-y-6 pb-20">
                <div className="space-y-1">
                    <div className="h-8 w-40 bg-muted/40 rounded-lg animate-pulse" />
                    <div className="h-4 w-64 bg-muted/30 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card border border-border/40 animate-pulse" />)}
                </div>
                <div className="h-48 rounded-2xl bg-card border border-border/40 animate-pulse" />
            </div>
        )
    }

    const bestHourLabel = analytics.bestHour !== null
        ? format(new Date().setHours(analytics.bestHour, 0, 0, 0), 'h a')
        : null

    return (
        <div className="space-y-7 pb-20 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Analytics</h1>
                <p className="text-muted-foreground">How you two have been doing.</p>
            </motion.div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                    label="Done this week"
                    value={analytics.completedThisWeek}
                    sub={`${analytics.totalCompletedAllTime} all time`}
                    delay={0}
                />
                <StatCard
                    icon={<Trophy className="h-5 w-5 text-amber-500" />}
                    label="Streak"
                    value={`${analytics.streak}d`}
                    sub="Days in a row"
                    delay={0.06}
                />
                <StatCard
                    icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                    label="Completion rate"
                    value={`${analytics.completionRate}%`}
                    sub="Of all your tasks"
                    delay={0.12}
                />
                <StatCard
                    icon={<Zap className="h-5 w-5 text-secondary" />}
                    label="Best hour"
                    value={bestHourLabel || "—"}
                    sub="Most productive time"
                    delay={0.18}
                />
            </div>

            {/* 7-Day Chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">Last 7 Days</h2>
                    </div>
                    <BarChart data={analytics.weekData} />
                    {analytics.bestDay && (
                        <p className="text-xs text-muted-foreground">
                            Your best day this week was <span className="font-semibold text-foreground">{analytics.bestDay.label}</span> with {analytics.bestDay.count} task{analytics.bestDay.count !== 1 ? 's' : ''} done.
                        </p>
                    )}
                </GlassCard>
            </motion.div>

            {/* Couple Comparison */}
            {analytics.partnerCompletedThisWeek > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <GlassCard className="p-6 space-y-4">
                        <h2 className="font-semibold text-foreground">This Week Together 💕</h2>
                        <div className="space-y-3">
                            <CompareBar
                                name={analytics.myName}
                                count={analytics.completedThisWeek}
                                max={Math.max(analytics.completedThisWeek, analytics.partnerCompletedThisWeek)}
                                color="bg-primary"
                            />
                            <CompareBar
                                name={analytics.partnerName}
                                count={analytics.partnerCompletedThisWeek}
                                max={Math.max(analytics.completedThisWeek, analytics.partnerCompletedThisWeek)}
                                color="bg-secondary"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.completedThisWeek + analytics.partnerCompletedThisWeek} tasks completed together this week. Keep it up!
                        </p>
                    </GlassCard>
                </motion.div>
            )}
        </div>
    )
}

function CompareBar({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
    const pct = max > 0 ? (count / max) * 100 : 0
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground font-semibold">{count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    )
}
