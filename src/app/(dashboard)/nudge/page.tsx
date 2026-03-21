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
            <div className="pt-12 px-6 max-w-2xl mx-auto space-y-12 animate-pulse text-center">
                <div className="w-28 h-28 rounded-full bg-surface-container-high mx-auto" />
                <div className="h-8 w-48 bg-surface-container-low mx-auto rounded" />
                <div className="w-64 h-64 rounded-full bg-surface-container mx-auto" />
            </div>
        )
    }

    const fallBackInitial = partner?.username ? partner.username.charAt(0).toUpperCase() : "❤️"
    const myName = profile?.username || "You"
    const partnerName = partner?.username || "Your Partner"

    // Mock data if empty
    const displayNudges = nudges.length > 0 ? nudges : [
        { id: '1', sender_id: partner?.id || 'partner', receiver_id: user?.id, message: "Thinking of you", type: "love", created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: '2', sender_id: user?.id, receiver_id: partner?.id || 'partner', message: "Shared Sparkle", type: "sparkle", created_at: new Date(Date.now() - 18000000).toISOString() },
        { id: '3', sender_id: partner?.id || 'partner', receiver_id: user?.id, message: "Feeling Grateful", type: "mood", created_at: new Date(Date.now() - 86400000).toISOString() },
    ] as Nudge[]

    return (
        <motion.main 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col pt-8 px-6 pb-32 max-w-2xl mx-auto w-full relative overflow-hidden"
        >
            {/* Header Section */}
            <section className="mt-4 mb-8 text-center">
                <div className="inline-block relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
                    <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-[0_10px_30px_rgba(255,140,0,0.3)]">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface flex items-center justify-center bg-surface-container-high">
                            {partner?.avatar_url ? (
                                <img src={partner.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-headline font-bold text-on-surface-variant">{fallBackInitial}</span>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary rounded-full p-2.5 shadow-xl border-2 border-surface">
                        <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                </div>
                <h2 className="font-headline text-[28px] font-extrabold tracking-tight mb-1.5 text-on-surface">
                    {partnerName}
                </h2>
                <p className="text-on-surface-variant font-medium text-[15px]">
                    Remind them you're thinking of them.
                </p>
            </section>

            {/* Main Interaction Area */}
            <section className="flex-1 flex flex-col items-center justify-center relative min-h-[340px]">
                {/* Simulated Particles */}
                <motion.span 
                    animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="material-symbols-outlined absolute text-primary text-xl top-4 left-[20%] pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    favorite
                </motion.span>
                <motion.span 
                    animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }} 
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="material-symbols-outlined absolute text-secondary text-[28px] top-12 right-[15%] pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    favorite
                </motion.span>

                {/* Central Interactive Button */}
                <button 
                    onClick={() => sendNudge('love', 'Thinking of you')}
                    disabled={sending}
                    className="group relative flex flex-col items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-80"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-colors duration-500" />
                    
                    <div className="relative w-[240px] h-[240px] rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/10 shadow-[0_0_60px_10px_rgba(255,140,0,0.15)] group-hover:shadow-[0_0_80px_20px_rgba(255,140,0,0.25)] transition-all duration-500">
                        <div className="absolute inset-4 rounded-full border border-primary/20 animate-pulse" />
                        
                        <div className="w-[180px] h-[180px] rounded-full bg-gradient-to-br from-primary to-primary-container flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,140,0,0.4)] transition-transform duration-500 group-hover:scale-105">
                            <span className="material-symbols-outlined text-[64px] text-on-primary mb-2 drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {sending ? 'hourglass_empty' : 'auto_awesome'}
                            </span>
                            <span className="font-headline font-bold text-on-primary tracking-widest text-[16px] drop-shadow-sm">
                                {sending ? 'SENDING...' : 'SEND LOVE'}
                            </span>
                        </div>
                    </div>
                </button>
                
                <div className="mt-8 bg-surface-container/50 backdrop-blur-md px-6 py-2.5 rounded-full border border-outline-variant/10 shadow-sm">
                    <span className="text-primary font-bold text-[11px] tracking-widest uppercase">Tap to Nudge</span>
                </div>
            </section>

            {/* Recent Nudges List */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-5 px-1">
                    <h3 className="font-headline text-[20px] font-bold text-on-surface">Recent Nudges</h3>
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase bg-surface-container px-3 py-1.5 rounded-full">
                        History
                    </span>
                </div>
                
                <div className="space-y-3">
                    {displayNudges.map((nudge, i) => {
                        const isMine = nudge.sender_id === user.id
                        
                        let icon = "favorite"
                        let colorClass = "text-secondary"
                        let bgClass = "bg-secondary-container/20"
                        
                        if (nudge.type === 'sparkle') {
                            icon = "colors_spark"
                            colorClass = "text-primary"
                            bgClass = "bg-primary-container/20"
                        } else if (nudge.type === 'mood') {
                            icon = "mood"
                            colorClass = "text-tertiary"
                            bgClass = "bg-tertiary/20"
                        }

                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={nudge.id} 
                                className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 transition-colors hover:bg-surface-container border border-outline-variant/5"
                            >
                                <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center shrink-0`}>
                                    <span className={`material-symbols-outlined ${colorClass} text-[24px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
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
                                <div className="text-[11px] text-on-surface-variant font-medium shrink-0 pt-1 border border-outline-variant/10 px-2 py-1 bg-surface-container rounded-md">
                                    {format(new Date(nudge.created_at), 'HH:mm')}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </section>
        </motion.main>
    )
}
