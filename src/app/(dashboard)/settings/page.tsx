"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ThemeSelector } from "@/components/settings/theme-selector"

const APP_VERSION = "2.4.0"

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
            <div className="pt-4 px-6 max-w-2xl mx-auto space-y-10 animate-pulse text-center">
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
        <motion.main 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-4 px-6 max-w-2xl mx-auto space-y-10 pb-32"
        >
            {/* Header / Identity Anchor could go to root layout, omitting it since Next layout is universal */}
            
            {/* Profile Header Section */}
            <section className="flex flex-col items-center text-center space-y-4 pt-6">
                <div className="relative">
                    <div className="w-[124px] h-[124px] rounded-full p-1 bg-gradient-to-tr from-primary to-primary-container shadow-[0_10px_30px_rgba(255,140,0,0.2)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-surface-container border-4 border-surface flex items-center justify-center">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-headline font-bold text-on-surface-variant flex items-center justify-center w-full h-full bg-surface-container-high">{fallBackInitial}</span>
                            )}
                        </div>
                    </div>
                    {profile?.role === 'king' && (
                        <div className="absolute -top-2 -right-2 bg-primary text-on-primary p-2 rounded-full shadow-lg">
                            <span className="material-symbols-outlined text-[20px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>king_bed</span>
                        </div>
                    )}
                    {profile?.role === 'queen' && (
                        <div className="absolute -top-2 -right-2 bg-secondary text-on-secondary p-2 rounded-full shadow-lg">
                            <span className="material-symbols-outlined text-[20px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>cruelty_free</span>
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">{profile?.username || "Companion"}</h1>
                    <span className="inline-flex items-center px-4 py-1.5 mt-2 rounded-full bg-primary-container/10 text-primary border border-primary/20 font-label text-[11px] font-bold tracking-widest uppercase shadow-sm">
                        {profile?.role || "Partner"} Badge
                    </span>
                </div>
            </section>

            {/* Quick Links Bento */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant/5 hover:border-outline-variant/10">
                    <div className="flex items-center gap-4">
                        <div className="w-[46px] h-[46px] rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">person</span>
                        </div>
                        <div>
                            <h3 className="font-headline font-bold text-on-surface text-[15px]">Account</h3>
                            <p className="text-[13px] text-on-surface-variant">Personal info & keys</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100">chevron_right</span>
                </div>
                
                <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors border border-outline-variant/5 hover:border-outline-variant/10">
                    <div className="flex items-center gap-4">
                        <div className="w-[46px] h-[46px] rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors">
                            <span className="material-symbols-outlined text-[24px]">verified_user</span>
                        </div>
                        <div>
                            <h3 className="font-headline font-bold text-on-surface text-[15px]">Privacy & Security</h3>
                            <p className="text-[13px] text-on-surface-variant">Shared vault settings</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100">chevron_right</span>
                </div>
            </section>

            {/* Aesthetic Theme Picker */}
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-headline font-bold text-on-surface">Aesthetic</h2>
                    <span className="text-[10px] font-label uppercase tracking-widest text-primary/80 font-bold bg-primary/10 px-3 py-1.5 rounded-full">
                        Theme Picker
                    </span>
                </div>
                <ThemeSelector userId={user.id} currentDbTheme={profile?.theme || 'light'} />
            </section>

            {/* Notifications Section */}
            <section className="space-y-4">
                <h2 className="text-[20px] font-headline font-bold text-on-surface">Notifications</h2>
                <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                    <div className="flex items-center gap-4.5">
                        <div className="w-12 h-12 rounded-full bg-tertiary-fixed/10 flex items-center justify-center text-tertiary-fixed-dim">
                            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                        </div>
                        <div className="ml-2">
                            <h3 className="font-headline font-bold text-on-surface text-[15px]">Morning AI Briefing</h3>
                            <p className="text-[13px] text-on-surface-variant mt-0.5">Daily summary of shared goals</p>
                        </div>
                    </div>
                    
                    {/* Custom Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer active:scale-95 transition-transform" onClick={(e) => { e.preventDefault(); toggleBriefing(); }}>
                        <input type="checkbox" className="sr-only peer" checked={briefingEnabled} readOnly />
                        <div className={\`w-14 h-8 rounded-full transition-colors duration-300 \${briefingEnabled ? 'bg-primary shadow-[0_0_15px_rgba(255,183,125,0.4)]' : 'bg-surface-container-highest border border-outline-variant/10'}\`}>
                            <motion.div 
                                className="absolute top-[4px] left-[4px] bg-auto bg-white rounded-full h-6 w-6 shadow-sm"
                                animate={{ x: briefingEnabled ? 24 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </div>
                    </label>
                </div>
            </section>

            {/* Logout / Danger Zone */}
            <section className="pt-8 space-y-8">
                <button 
                    onClick={handleSignOut}
                    className="w-full py-4.5 rounded-[1rem] bg-error/10 text-error font-headline font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2.5 active:scale-[0.98] border border-error/20"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sign Out
                </button>
                <p className="text-center text-[10px] text-on-surface-variant mt-8 opacity-40 font-label tracking-widest">
                    TOGETHER v{APP_VERSION} • CRAFTED WITH LOVE
                </p>
            </section>

        </motion.main>
    )
}
