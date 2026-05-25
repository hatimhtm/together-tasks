"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ThemeSelector } from "@/components/settings/theme-selector"
import { APP_VERSION } from "@/lib/version"
import { requestUpdateCheck } from "@/lib/updater"

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [briefingEnabled, setBriefingEnabled] = useState(true)
    const [savingNotifs, setSavingNotifs] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            setProfile(profile)
            if (profile?.briefing_enabled != null) setBriefingEnabled(profile.briefing_enabled)
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    async function toggleBriefing() {
        if (!user) return
        const newVal = !briefingEnabled
        setBriefingEnabled(newVal)
        setSavingNotifs(true)
        try {
            await supabase.from('profiles').update({ briefing_enabled: newVal }).eq('id', user.id)
        } catch {
            setBriefingEnabled(!newVal)
            toast.error("Failed to update notification settings.")
        } finally {
            setSavingNotifs(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="max-w-2xl mx-auto space-y-10 animate-pulse text-center">
                <div className="w-32 h-32 rounded-full bg-surface-container-high mx-auto mb-4" />
                <div className="h-8 w-48 bg-surface-container-low mx-auto rounded" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-surface-container-low rounded-xl" />
                    <div className="h-24 bg-surface-container-low rounded-xl" />
                </div>
            </div>
        )
    }

    const fallBackInitial = profile?.username ? profile.username.charAt(0).toUpperCase() : "U"

    return (
        <div className="space-y-6 lg:space-y-8">
            <h1 className="text-2xl lg:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Settings</h1>

            {/* Profile card */}
            <section className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
                <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/60 flex items-center justify-center">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-headline font-bold text-on-surface-variant">{fallBackInitial}</span>
                        )}
                    </div>
                    {profile?.role === 'king' && (
                        <div className="absolute -top-1 -right-1 bg-primary text-on-primary p-1.5 rounded-full">
                            <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>king_bed</span>
                        </div>
                    )}
                    {profile?.role === 'queen' && (
                        <div className="absolute -top-1 -right-1 bg-secondary text-on-secondary p-1.5 rounded-full">
                            <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>cruelty_free</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-headline font-extrabold tracking-tight text-on-surface">{profile?.username || "Companion"}</h2>
                    <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full bg-primary/12 text-primary border border-primary/20 font-label text-[10px] font-bold tracking-widest uppercase">
                        {profile?.role || "Partner"}
                    </span>
                </div>
            </section>

            {/* Aesthetic Theme Picker */}
            <section className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-headline font-bold text-on-surface">Aesthetic</h2>
                    <p className="text-[13px] text-on-surface-variant">Pick a look — or open more themes for the full palette.</p>
                </div>
                <ThemeSelector userId={user.id} currentDbTheme={profile?.theme || 'obsidian'} />
            </section>

            {/* Notifications Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-headline font-bold text-on-surface">Notifications</h2>
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-primary/12 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-headline font-bold text-on-surface text-[15px]">Morning AI Briefing</h3>
                            <p className="text-[13px] text-on-surface-variant mt-0.5">Daily summary of shared goals</p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={briefingEnabled}
                        aria-label="Morning AI Briefing"
                        onClick={() => toggleBriefing()}
                        disabled={savingNotifs}
                        className="relative inline-flex items-center active:scale-[0.98] transition-transform shrink-0"
                    >
                        <div className={`w-14 h-8 rounded-full transition-colors duration-200 ${briefingEnabled ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/60'}`}>
                            <motion.div
                                className="absolute top-[4px] left-[4px] bg-on-primary rounded-full h-6 w-6"
                                animate={{ x: briefingEnabled ? 24 : 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            />
                        </div>
                    </button>
                </div>
            </section>

            {/* App updates + Sign out */}
            <section className="space-y-4">
                <button
                    type="button"
                    onClick={() => requestUpdateCheck()}
                    className="w-full flex items-center justify-between gap-3 p-5 rounded-2xl bg-surface-container border border-outline-variant/60 hover:bg-surface-container-high transition-colors active:scale-[0.99] text-left"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[22px]">system_update</span>
                        <div>
                            <p className="font-headline font-bold text-[15px] text-on-surface">Check for updates</p>
                            <p className="text-[12px] text-on-surface-variant">You're on v{APP_VERSION}</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                </button>

                <button
                    onClick={handleSignOut}
                    className="w-full h-12 rounded-2xl bg-error/10 text-error font-headline font-bold hover:bg-error/15 transition-colors flex items-center justify-center gap-2.5 active:scale-[0.98] border border-error/20"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sign Out
                </button>
            </section>

            <p className="text-center text-[10px] text-on-surface-variant/50 font-label tracking-widest">
                TOGETHER v{APP_VERSION} • CRAFTED WITH LOVE
            </p>
        </div>
    )
}
