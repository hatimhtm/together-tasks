"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type NudgeType = 'love' | 'sparkle' | 'mood' | 'support'

// Nudges persist in the shared `partner_notifications` table (notification_type='nudge').
// sender → task_owner_id, receiver → partner_id. There's no `type` column, so the
// intent is derived from the message on the way back out.
interface Nudge {
    id: string
    sender_id: string
    receiver_id: string
    message: string
    type: NudgeType
    created_at: string
}

// Pre-set affectionate intents (Lovestruck pattern) — expressive, zero typing, de-gendered.
const INTENTS: Array<{ type: NudgeType; label: string; message: string; icon: string }> = [
    { type: 'love',    label: "Thinking of you", message: "Thinking of you", icon: "favorite" },
    { type: 'sparkle', label: "Proud of you",    message: "Proud of you", icon: "auto_awesome" },
    { type: 'mood',    label: "Call when free",  message: "Call when you're free", icon: "call" },
    { type: 'support', label: "I've got dinner", message: "I've got dinner tonight", icon: "restaurant" },
]

const ICON_STYLES: Record<NudgeType, { icon: string; color: string; bg: string }> = {
    love:    { icon: "favorite", color: "text-secondary", bg: "bg-secondary/15" },
    sparkle: { icon: "auto_awesome", color: "text-primary", bg: "bg-primary/12" },
    mood:    { icon: "call", color: "text-tertiary", bg: "bg-tertiary/15" },
    support: { icon: "restaurant", color: "text-primary", bg: "bg-primary/12" },
}

// Map a stored message back to its intent type for icon styling.
function typeFromMessage(message: string): NudgeType {
    const match = INTENTS.find(i => i.message === message)
    return match?.type ?? 'love'
}

export default function NudgePage() {
    const supabase = createClient()
    const router = useRouter()
    const reduceMotion = useReducedMotion()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [partner, setPartner] = useState<any>(null)
    const [nudges, setNudges] = useState<Nudge[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [pulse, setPulse] = useState(0)

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            setProfile(profile)

            if (profile?.partner_id) {
                const { data: partnerProfile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", profile.partner_id)
                    .single()
                setPartner(partnerProfile)

                const { data: nudgesData } = await supabase
                    .from('partner_notifications')
                    .select('*')
                    .eq('notification_type', 'nudge')
                    .or(`task_owner_id.eq.${user.id},partner_id.eq.${user.id}`)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (nudgesData) {
                    setNudges((nudgesData as any[]).map((n) => ({
                        id: n.id,
                        sender_id: n.task_owner_id,
                        receiver_id: n.partner_id,
                        message: n.message ?? "",
                        type: typeFromMessage(n.message ?? ""),
                        created_at: n.created_at,
                    })))
                }
            }

            setLoading(false)
        }
        loadData()
    }, [router, supabase])

    async function sendNudge(type: NudgeType, message: string) {
        if (!user || !partner) {
            toast.error("Pair with your partner to send a nudge.")
            return
        }

        setSending(true)
        setPulse(p => p + 1)

        const optimistic: Nudge = {
            id: `tmp-${Date.now()}`,
            sender_id: user.id,
            receiver_id: partner.id,
            message,
            type,
            created_at: new Date().toISOString(),
        }
        setNudges(prev => [optimistic, ...prev])

        const { error } = await supabase.from('partner_notifications').insert({
            task_owner_id: user.id,
            partner_id: partner.id,
            message,
            notification_type: 'nudge',
            ai_reasoning: 'Your partner sent you a nudge.',
        })

        if (error) {
            // Roll back the optimistic row; never fake a success.
            setNudges(prev => prev.filter(n => n.id !== optimistic.id))
            toast.error("Couldn't send that nudge — try again in a moment.")
        } else {
            toast.success("Nudge on its way.")
        }
        setSending(false)
    }

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse text-center">
                <div className="w-24 h-24 rounded-full bg-surface-container-high mx-auto" />
                <div className="h-8 w-48 bg-surface-container-low mx-auto rounded" />
                <div className="w-44 h-44 rounded-full bg-surface-container mx-auto" />
            </div>
        )
    }

    const fallBackInitial = partner?.username ? partner.username.charAt(0).toUpperCase() : "♥"
    const partnerName = partner?.username || "your partner"
    const hasPartner = Boolean(partner)

    return (
        <div className="space-y-6 lg:space-y-8 max-w-3xl">
            <div className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold text-on-surface">Thinking of you</h1>
                <p className="text-on-surface-variant text-sm">A small, wordless way to reach {partnerName}.</p>
            </div>

            {!hasPartner ? (
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-10 text-center flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant/60 text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <h2 className="text-xl font-headline font-bold text-on-surface">Pair up first</h2>
                    <p className="text-on-surface-variant max-w-md text-sm">
                        Once you and your partner are linked, you can send each other a one-tap nudge from here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 lg:gap-8 xl:grid-cols-2 items-start">
                    {/* Send card */}
                    <section className="rounded-2xl bg-surface-container border border-outline-variant/60 p-6 flex flex-col items-center text-center gap-5">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border border-outline-variant/60 flex items-center justify-center bg-surface-container-high">
                                {partner?.avatar_url ? (
                                    <img src={partner.avatar_url} alt={partnerName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-headline font-bold text-on-surface-variant">{fallBackInitial}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary rounded-full p-1.5">
                                <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">{partner?.username || "Your partner"}</h2>
                            <p className="text-on-surface-variant text-sm mt-1">Let them know you&apos;re thinking of them.</p>
                        </div>

                        {/* The affectionate pulse */}
                        <button
                            onClick={() => sendNudge('love', 'Thinking of you')}
                            disabled={sending}
                            className="group relative w-44 h-44 rounded-full bg-primary text-on-primary flex flex-col items-center justify-center active:scale-[0.97] transition-transform disabled:opacity-70 min-h-[44px]"
                            aria-label="Send a thinking-of-you pulse"
                        >
                            {!reduceMotion && (
                                <motion.span
                                    key={pulse}
                                    initial={{ scale: 1, opacity: 0.5 }}
                                    animate={{ scale: 1.6, opacity: 0 }}
                                    transition={{ duration: 0.9, ease: "easeOut" }}
                                    className="absolute inset-0 rounded-full bg-primary"
                                    aria-hidden
                                />
                            )}
                            <span className="material-symbols-outlined text-[56px] mb-1 relative" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {sending ? 'hourglass_empty' : 'favorite'}
                            </span>
                            <span className="font-headline font-bold tracking-widest text-[14px] relative">
                                {sending ? 'SENDING…' : 'SEND LOVE'}
                            </span>
                        </button>

                        {/* Pre-set intents */}
                        <div className="w-full pt-1 space-y-2">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Or pick an intent</p>
                            <div className="grid grid-cols-2 gap-2">
                                {INTENTS.map((intent) => (
                                    <button
                                        key={intent.label}
                                        onClick={() => sendNudge(intent.type, intent.message)}
                                        disabled={sending}
                                        className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high border border-outline-variant/60 px-3 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-highest active:scale-[0.98] transition-colors disabled:opacity-60"
                                    >
                                        <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{intent.icon}</span>
                                        {intent.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Recent + AI gift note */}
                    <section className="space-y-4">
                        {/* AI gift framing + cap note */}
                        <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-on-surface font-semibold text-sm">Gentle nudges, never nagging</p>
                                <p className="text-on-surface-variant text-[13px] mt-0.5">
                                    When {partnerName} clears something big, we may surface one warm note — like &ldquo;{partner?.username || "Your partner"} just finished the taxes 🎉&rdquo;. At most once a day, and you can turn it off in settings.
                                </p>
                            </div>
                        </div>

                        <h3 className="font-headline text-lg font-bold text-on-surface">Recent nudges</h3>

                        <div className="space-y-3">
                            {nudges.length === 0 && (
                                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-8 flex flex-col items-center gap-3 text-center">
                                    <span className="material-symbols-outlined text-on-surface-variant/60 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                    <p className="text-on-surface font-semibold text-[15px]">No nudges yet</p>
                                    <p className="text-on-surface-variant text-[13px] max-w-[240px]">Send {partnerName} a little love — your history will show up here.</p>
                                </div>
                            )}
                            {nudges.map((nudge, i) => {
                                const isMine = nudge.sender_id === user.id
                                const style = ICON_STYLES[nudge.type] ?? ICON_STYLES.love

                                return (
                                    <motion.div
                                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(i, 6) * 0.03 }}
                                        key={nudge.id}
                                        className="rounded-2xl bg-surface-container border border-outline-variant/60 p-4 flex items-center gap-4"
                                    >
                                        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", style.bg)}>
                                            <span className={cn("material-symbols-outlined text-[22px]", style.color)} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {style.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-on-surface font-semibold text-[15px] truncate">
                                                {isMine ? `You nudged ${partnerName}` : `${partner?.username || "Your partner"} reached out`}
                                            </p>
                                            <p className="text-on-surface-variant text-[13px] truncate mt-0.5">
                                                {nudge.message}
                                            </p>
                                        </div>
                                        <div className="text-[11px] text-on-surface-variant font-medium shrink-0">
                                            {format(new Date(nudge.created_at), 'HH:mm')}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}
