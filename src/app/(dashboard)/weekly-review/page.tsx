"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { CheckCircle2, Heart, Star, ArrowRight, Flame } from "lucide-react"
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

            const orFilter = myProfile?.partner_id
                ? `creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${myProfile.partner_id},assignee_id.eq.${myProfile.partner_id}`
                : `creator_id.eq.${user.id},assignee_id.eq.${user.id}`

            const { data: weekTasks } = await supabase.from('tasks').select('*')
                .gte('completed_at', weekStart.toISOString())
                .lte('completed_at', weekEnd.toISOString())
                .or(orFilter)

            const allTasks = weekTasks || []
            let myCompleted = 0
            let partnerCompleted = 0
            const dayMap: Record<string, number> = {}
            const partnerId = myProfile?.partner_id
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                if (t.is_completed) {
                    if (t.assignee_id === user.id) {
                        myCompleted++
                        if (t.completed_at) {
                            const d = days[new Date(t.completed_at).getDay()]
                            dayMap[d] = (dayMap[d] || 0) + 1
                        }
                    } else if (partnerId && t.assignee_id === partnerId) {
                        partnerCompleted++
                    }
                }
            }

            let bestDay: [string, number] | undefined
            let maxCount = 0
            for (const d in dayMap) {
                if (dayMap[d] > maxCount) {
                    maxCount = dayMap[d]
                    bestDay = [d, maxCount]
                }
            }

            setReview({
                myName: myProfile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
                myCompleted,
                partnerCompleted,
                totalTogether: myCompleted + partnerCompleted,
                streak: myProfile?.streak || 0,
                bestDayLabel: bestDay?.[0] || "—",
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
                    <div className="h-4 w-40 bg-surface-container-high rounded-full animate-pulse mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onAnimationComplete={celebrate}
            className="space-y-6 max-w-2xl mx-auto"
        >
            {/* Hero Header */}
            <div className="text-center space-y-2">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/12 flex items-center justify-center mb-3">
                    <Star className="h-8 w-8 text-primary" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Weekly Review</h1>
                <p className="text-on-surface-variant text-sm">{review.weekLabel}</p>
            </div>

            {/* Big Number */}
            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-8 text-center space-y-2">
                <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">Together you completed</p>
                <p className="text-6xl lg:text-7xl font-headline font-black text-primary">
                    {review.totalTogether}
                </p>
                <p className="text-on-surface font-semibold text-lg">tasks this week</p>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Heart className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-sm text-on-surface-variant">{review.myName} & {review.partnerName}</span>
                    <Heart className="h-4 w-4 text-primary fill-primary" />
                </div>
            </div>

            {/* Split Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 text-center space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary truncate">{review.myName}</p>
                    <p className="text-4xl font-headline font-black text-on-surface">{review.myCompleted}</p>
                    <p className="text-xs text-on-surface-variant">tasks done</p>
                </div>
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 text-center space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary truncate">{review.partnerName}</p>
                    <p className="text-4xl font-headline font-black text-on-surface">{review.partnerCompleted}</p>
                    <p className="text-xs text-on-surface-variant">tasks done</p>
                </div>
            </div>

            {/* Highlights */}
            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 space-y-4">
                <h2 className="font-headline font-bold text-on-surface">Highlights</h2>
                <div className="space-y-3">
                    {review.streak > 0 && (
                        <HighlightRow
                            icon={<Flame className="h-5 w-5 text-primary" />}
                            label="Current streak"
                            value={`${review.streak} day${review.streak !== 1 ? 's' : ''}`}
                        />
                    )}
                    {review.bestDayLabel !== "—" && (
                        <HighlightRow
                            icon={<Star className="h-5 w-5 text-primary" />}
                            label="Most productive day"
                            value={review.bestDayLabel}
                        />
                    )}
                    <HighlightRow
                        icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                        label="Tasks together"
                        value={`${review.totalTogether} this week`}
                    />
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={() => router.push("/")}
                className="w-full h-12 rounded-full bg-primary text-on-primary font-semibold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
                Start Fresh This Week
                <ArrowRight className="h-5 w-5" />
            </button>
        </motion.div>
    )
}

function HighlightRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm text-on-surface-variant">{label}</p>
            </div>
            <p className="font-bold text-on-surface text-sm">{value}</p>
        </div>
    )
}
