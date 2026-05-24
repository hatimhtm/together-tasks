"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { CheckCircle2, Heart, ArrowRight, ArrowLeft, Flame, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekReview {
    myName: string
    partnerName: string
    hasPartner: boolean
    myCompleted: number
    partnerCompleted: number
    totalTogether: number
    streak: number
    bestDayLabel: string
    weekLabel: string
    topTitles: string[]
}

const STREAK_MILESTONES = [7, 30, 100, 365]
const STEPS = ["The week in numbers", "What we did together", "A shared reflection"] as const

export default function WeeklyReviewPage() {
    const supabase = createClient()
    const router = useRouter()
    const reduceMotion = useReducedMotion()
    const [review, setReview] = useState<WeekReview | null>(null)
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(0)
    const [reflection, setReflection] = useState("")
    const celebratedRef = useRef(false)

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
            const sharedTitles: { title: string; at: number }[] = []

            for (let i = 0; i < allTasks.length; i++) {
                const t = allTasks[i]
                if (!t.is_completed) continue
                if (t.assignee_id === user.id) {
                    myCompleted++
                    if (t.completed_at) {
                        const d = days[new Date(t.completed_at).getDay()]
                        dayMap[d] = (dayMap[d] || 0) + 1
                    }
                } else if (partnerId && t.assignee_id === partnerId) {
                    partnerCompleted++
                }
                if (t.scope === 'shared' && t.title && t.completed_at) {
                    sharedTitles.push({ title: t.title, at: new Date(t.completed_at).getTime() })
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

            const topTitles = sharedTitles
                .sort((a, b) => b.at - a.at)
                .slice(0, 4)
                .map(s => s.title)

            setReview({
                myName: myProfile?.username || "You",
                partnerName: partnerRes?.data?.username || "Partner",
                hasPartner: Boolean(partnerId),
                myCompleted,
                partnerCompleted,
                totalTogether: myCompleted + partnerCompleted,
                streak: myProfile?.streak || 0,
                bestDayLabel: bestDay?.[0] || "—",
                weekLabel: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`,
                topTitles,
            })
            setLoading(false)
        }
        load()
    }, [router, supabase])

    // AI-prefill the reflection once data loads (placeholder prompt, skippable).
    useEffect(() => {
        if (review && !reflection) {
            const win = review.bestDayLabel !== "—"
                ? `${review.bestDayLabel} was our strongest day`
                : "we kept showing up for each other"
            setReflection(`This week, ${win} — ${review.totalTogether} done together.`)
        }
    }, [review]) // eslint-disable-line react-hooks/exhaustive-deps

    // Celebrate only when the recap lands on a genuine streak milestone.
    useEffect(() => {
        if (!review || celebratedRef.current || reduceMotion) return
        if (STREAK_MILESTONES.includes(review.streak)) {
            celebratedRef.current = true
            import("canvas-confetti").then(({ default: confetti }) => {
                confetti({ particleCount: 80, spread: 90, origin: { y: 0.4 }, disableForReducedMotion: true })
            }).catch(() => {})
        }
    }, [review, reduceMotion])

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

    const last = STEPS.length - 1
    const transition = reduceMotion
        ? { duration: 0.15 }
        : { duration: 0.22, ease: "easeOut" as const }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header + progress */}
            <div className="text-center space-y-3">
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Weekly Review</h1>
                <p className="text-on-surface-variant text-sm">{review.weekLabel}</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                    {STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-surface-container-highest",
                            )}
                        />
                    ))}
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
                    Step {step + 1} of {STEPS.length} · {STEPS[step]}
                </p>
            </div>

            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={transition}
                        className="space-y-4"
                    >
                        {/* Step 1 — the week in numbers */}
                        {step === 0 && (
                            <>
                                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-8 text-center space-y-2">
                                    <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wide">
                                        {review.hasPartner ? "Together you completed" : "You completed"}
                                    </p>
                                    <p className="text-6xl lg:text-7xl font-headline font-black text-primary tabular-nums">
                                        {review.totalTogether}
                                    </p>
                                    <p className="text-on-surface font-semibold text-lg">tasks this week</p>
                                    {review.hasPartner && (
                                        <div className="flex items-center justify-center gap-1.5 pt-1">
                                            <Heart className="h-4 w-4 text-primary fill-primary" />
                                            <span className="text-sm text-on-surface-variant">{review.myName} &amp; {review.partnerName}</span>
                                            <Heart className="h-4 w-4 text-primary fill-primary" />
                                        </div>
                                    )}
                                </div>

                                {review.hasPartner && (review.myCompleted + review.partnerCompleted > 0) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 text-center space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-primary truncate">{review.myName}</p>
                                            <p className="text-4xl font-headline font-black text-on-surface tabular-nums">{review.myCompleted}</p>
                                            <p className="text-xs text-on-surface-variant">tasks done</p>
                                        </div>
                                        <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 text-center space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-secondary truncate">{review.partnerName}</p>
                                            <p className="text-4xl font-headline font-black text-on-surface tabular-nums">{review.partnerCompleted}</p>
                                            <p className="text-xs text-on-surface-variant">tasks done</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Step 2 — what we did together */}
                        {step === 1 && (
                            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 space-y-4">
                                <h2 className="font-headline font-bold text-on-surface">Highlights</h2>
                                <div className="space-y-3">
                                    {review.streak > 0 && (
                                        <HighlightRow
                                            icon={<Flame className="h-5 w-5 text-primary" />}
                                            label={review.hasPartner ? "Shared streak" : "Current streak"}
                                            value={`${review.streak} day${review.streak !== 1 ? 's' : ''}`}
                                        />
                                    )}
                                    {review.bestDayLabel !== "—" && (
                                        <HighlightRow
                                            icon={<Sparkles className="h-5 w-5 text-primary" />}
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

                                {review.topTitles.length > 0 ? (
                                    <div className="pt-2 space-y-2">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Shared wins</p>
                                        {review.topTitles.map((t, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-sm text-on-surface">
                                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                                <span className="truncate">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-on-surface-variant pt-1">
                                        No shared tasks logged this week — that&apos;s okay, every week is different.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 3 — a shared reflection */}
                        {step === 2 && (
                            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 space-y-4">
                                <div className="space-y-1">
                                    <h2 className="font-headline font-bold text-on-surface">One line, together</h2>
                                    <p className="text-sm text-on-surface-variant">
                                        A single thought to close the week. We&apos;ve started one for you — edit it or skip.
                                    </p>
                                </div>
                                <textarea
                                    value={reflection}
                                    onChange={(e) => setReflection(e.target.value)}
                                    rows={3}
                                    placeholder="A win this week · one thing to hand off next week…"
                                    className="w-full px-3.5 py-3 rounded-xl bg-surface-container-high border border-outline-variant/60 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/60 resize-none"
                                />
                                <p className="text-[11px] text-on-surface-variant/70 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" /> AI-prefilled from your week · always skippable
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Step controls */}
            <div className="flex items-center gap-3">
                {step > 0 ? (
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="h-12 px-5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold active:scale-[0.98] transition-colors inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                ) : (
                    <button
                        onClick={() => router.push("/")}
                        className="h-12 px-5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-semibold active:scale-[0.98] transition-colors"
                    >
                        Skip
                    </button>
                )}
                <button
                    onClick={() => (step < last ? setStep(s => s + 1) : router.push("/"))}
                    className="flex-1 h-12 rounded-full bg-primary text-on-primary font-semibold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                    {step < last ? "Continue" : "Start fresh this week"}
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </div>
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
