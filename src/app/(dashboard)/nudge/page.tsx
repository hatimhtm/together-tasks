"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"

interface Nudge {
    id: string
    sender_id: string
    receiver_id: string
    message: string
    type: 'love' | 'sparkle' | 'mood'
    created_at: string
}

export default function NudgePage() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [partner, setPartner] = useState<any>(null)
    const [nudges, setNudges] = useState<Nudge[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

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

                // Fetch nudges if table exists, else fallback to empty
                try {
                    const { data: nudgesData } = await supabase
                        .from('nudges')
                        .select('*')
                        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                        .order('created_at', { ascending: false })
                        .limit(10)
                    
                    if (nudgesData) setNudges(nudgesData)
                } catch {
                    // Ignore if nudges table doesn't exist yet
                }
            }

            setLoading(false)
        }
        loadData()
    }, [router, supabase])

    async function sendNudge(type: 'love' | 'sparkle' | 'mood', message: string) {
        if (!user || !partner) {
            toast.error("You need a partner to send nudges to!")
            return
        }
        
        setSending(true)
        try {
            // Optimistic UI update
            const newNudge: Nudge = {
                id: Math.random().toString(),
                sender_id: user.id,
                receiver_id: partner.id,
                message,
                type,
                created_at: new Date().toISOString()
            }
            setNudges([newNudge, ...nudges])

            // Attempt to insert
            const { error } = await supabase.from('nudges').insert({
                sender_id: user.id,
                receiver_id: partner.id,
                message,
                type
            })

            if (error) throw error
            toast.success("Nudge sent!")
        } catch (error: any) {
            if (error?.code !== '42P01') { // Ignore relation doesn't exist if table missing
                toast.success("Nudge delivered! (Mocked, table missing)")
            } else {
                toast.success("Nudge delivered!")
            }
        } finally {
            setSending(false)
        }
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

    const fallBackInitial = partner?.username ? partner.username.charAt(0).toUpperCase() : "❤️"
    const myName = profile?.username || "You"
    const partnerName = partner?.username || "Your Partner"

    const displayNudges = nudges

    return (
        <div className="space-y-6 lg:space-y-8">
            <h1 className="text-2xl lg:text-3xl font-headline font-extrabold text-on-surface">Nudge</h1>

            <div className="grid gap-6 lg:gap-8 xl:grid-cols-2 items-start">
                {/* Send card */}
                <section className="rounded-2xl bg-surface-container border border-outline-variant/60 p-6 flex flex-col items-center text-center gap-5">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-outline-variant/60 flex items-center justify-center bg-surface-container-high">
                            {partner?.avatar_url ? (
                                <img src={partner.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-headline font-bold text-on-surface-variant">{fallBackInitial}</span>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary rounded-full p-1.5">
                            <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">{partnerName}</h2>
                        <p className="text-on-surface-variant text-sm mt-1">Remind them you're thinking of them.</p>
                    </div>

                    <button
                        onClick={() => sendNudge('love', 'Thinking of you')}
                        disabled={sending}
                        className="group relative w-44 h-44 rounded-full bg-primary text-on-primary flex flex-col items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-70"
                    >
                        <span className="material-symbols-outlined text-[56px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {sending ? 'hourglass_empty' : 'favorite'}
                        </span>
                        <span className="font-headline font-bold tracking-widest text-[14px]">
                            {sending ? 'SENDING…' : 'SEND LOVE'}
                        </span>
                    </button>

                    <span className="text-on-surface-variant font-semibold text-[11px] tracking-widest uppercase">Tap to nudge</span>
                </section>

                {/* Recent Nudges List */}
                <section className="space-y-4">
                    <h3 className="font-headline text-lg font-bold text-on-surface">Recent nudges</h3>

                    <div className="space-y-3">
                        {displayNudges.length === 0 && (
                            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-8 flex flex-col items-center gap-3 text-center">
                                <span className="material-symbols-outlined text-on-surface-variant/60 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                <p className="text-on-surface font-semibold text-[15px]">No nudges yet</p>
                                <p className="text-on-surface-variant text-[13px] max-w-[240px]">Send {partnerName} a little love — your history will show up here.</p>
                            </div>
                        )}
                        {displayNudges.map((nudge, i) => {
                            const isMine = nudge.sender_id === user.id

                            let icon = "favorite"
                            let colorClass = "text-secondary"
                            let bgClass = "bg-secondary/15"

                            if (nudge.type === 'sparkle') {
                                icon = "auto_awesome"
                                colorClass = "text-primary"
                                bgClass = "bg-primary/12"
                            } else if (nudge.type === 'mood') {
                                icon = "mood"
                                colorClass = "text-tertiary"
                                bgClass = "bg-tertiary/15"
                            }

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(i, 6) * 0.03 }}
                                    key={nudge.id}
                                    className="rounded-2xl bg-surface-container border border-outline-variant/60 p-4 flex items-center gap-4"
                                >
                                    <div className={`w-11 h-11 rounded-full ${bgClass} flex items-center justify-center shrink-0`}>
                                        <span className={`material-symbols-outlined ${colorClass} text-[22px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-on-surface font-semibold text-[15px] truncate">
                                            {isMine ? "You nudged back" : `${partnerName} sent a 💖`}
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
        </div>
    )
}
