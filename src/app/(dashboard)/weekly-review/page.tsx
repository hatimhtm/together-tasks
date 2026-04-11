"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { CheckCircle2, Heart, Star, ArrowRight, Flame } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import confetti from "canvas-confetti"

interface WeekReview {
    myName: string
    partnerName: string
    myCompleted: number
    partnerCompleted: number
    totalTogether: number
    streak: number
    bestDayLabel: string
    weekLabel: string
}

export default function WeeklyReviewPage() {
    const supabase = createClient()
    const router = useRouter()
    const [review, setReview] = useState<WeekReview | null>(null)
    const [loading, setLoading] = useState(true)
    const [celebrated, setCelebrated] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }

            const { data: myProfile } = await supabase.from('profiles').select('username, partner_id, streak').eq('id', user.id).single()
            const partnerRes = myProfile?.partner_id
                ? await supabase.from('profiles').select('username').eq('id', myProfile.partner_id).single()
                : null

            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
            const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

            let tasksQuery = supabase.from('tasks').select('*').gte('completed_at', weekStart.toISOString()).lte('completed_at', weekEnd.toISOString())
            const { data: weekTasks } = await tasksQuery

            const allTasks = weekTasks || []
            let myCompleted = 0
            let partnerCompleted = 0
            const partnerId = myProfile?.partner_id
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

            let bestDayLabel = "—"
            let maxCount = 0
            const dayCounts = [0, 0, 0, 0, 0, 0, 0]

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                if (t.is_completed) {
                    if (t.assignee_id === user.id) {
                        myCompleted++
                        if (t.completed_at) {
                            const dayIndex = new Date(t.completed_at).getDay()
                            const count = ++dayCounts[dayIndex]
                            if (count > maxCount) {
                                maxCount = count
                                bestDayLabel = days[dayIndex]
                            }
                        }
                    } else if (partnerId && t.assignee_id === partnerId) {
                        partnerCompleted++
                    }
                }
            }

            setReview({
                myName: myProfile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
                myCompleted,
                partnerCompleted,
                totalTogether: myCompleted + partnerCompleted,
                streak: myProfile?.streak || 0,
                bestDayLabel,
                weekLabel: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
            })
            setLoading(false)
        }
        load()
    }, [router, supabase])

    function celebrate() {
        if (celebrated) return
        setCelebrated(true)
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#FFD700', '#FF69B4', '#00BFFF', '#FF2D55'] })
    }

    if (loading || !review) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="space-y-3 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 animate-pulse mx-auto" />
                    <div className="h-4 w-40 bg-muted/40 rounded-full animate-pulse mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto pb-24 space-y-6">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 24 }}
                className="text-center pt-4 space-y-2"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                    className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-4"
                >
                    <Star className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </motion.div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Weekly Review</h1>
                <p className="text-muted-foreground text-sm">{review.weekLabel}</p>
            </motion.div>

            {/* Big Number */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 22 }}
                onAnimationComplete={celebrate}
            >
                <GlassCard className="p-8 text-center space-y-2 border-primary/20 bg-primary/5">
                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Together you completed</p>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        {review.totalTogether}
                    </motion.p>
                    <p className="text-foreground font-semibold text-lg">tasks this week</p>
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Heart className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm text-muted-foreground">{review.myName} & {review.partnerName}</span>
                        <Heart className="h-4 w-4 text-primary fill-primary" />
                    </div>
                </GlassCard>
            </motion.div>

            {/* Split Stats */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <GlassCard className="p-5 text-center space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{review.myName}</p>
                        <p className="text-4xl font-black text-foreground">{review.myCompleted}</p>
                        <p className="text-xs text-muted-foreground">tasks done</p>
                    </GlassCard>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <GlassCard className="p-5 text-center space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{review.partnerName}</p>
                        <p className="text-4xl font-black text-foreground">{review.partnerCompleted}</p>
                        <p className="text-xs text-muted-foreground">tasks done</p>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Highlights */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <GlassCard className="p-6 space-y-4">
                    <h2 className="font-bold text-foreground">Highlights</h2>
                    <div className="space-y-3">
                        {review.streak > 0 && (
                            <HighlightRow
                                icon={<Flame className="h-5 w-5 text-orange-500" />}
                                label="Current streak"
                                value={`${review.streak} day${review.streak !== 1 ? 's' : ''}`}
                            />
                        )}
                        {review.bestDayLabel !== "—" && (
                            <HighlightRow
                                icon={<Star className="h-5 w-5 text-amber-500" />}
                                label="Most productive day"
                                value={review.bestDayLabel}
                            />
                        )}
                        <HighlightRow
                            icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                            label="Tasks together"
                            value={`${review.totalTogether} this week`}
                        />
                    </div>
                </GlassCard>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <button
                    onClick={() => router.push("/")}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    Start Fresh This Week
                    <ArrowRight className="h-5 w-5" />
                </button>
            </motion.div>
        </div>
    )
}

function HighlightRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <p className="font-bold text-foreground text-sm">{value}</p>
        </div>
    )
}
