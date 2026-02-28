"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, User, Shield, LogOut, ChevronRight, Palette, Clock, Calendar, RefreshCw, Sparkles } from "lucide-react"
import { ThemeSelector } from "@/components/settings/theme-selector"
import { useEffect, useState } from "react"
import { Profile } from "@/types/task"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const APP_VERSION = "2.0.8"

const BRIEFING_TIME_OPTIONS = [
    { label: "7:00 AM", value: "07:00" },
    { label: "8:00 AM", value: "08:00" },
    { label: "9:00 AM", value: "09:00" },
    { label: "10:00 AM", value: "10:00" },
]

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [savingNotifs, setSavingNotifs] = useState(false)
    const [briefingEnabled, setBriefingEnabled] = useState(false)
    const [briefingTime, setBriefingTime] = useState("08:00")
    const [weeklyEnabled, setWeeklyEnabled] = useState(true)
    const [checkingUpdate, setCheckingUpdate] = useState(false)

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
            if (profile?.briefing_time) setBriefingTime(profile.briefing_time.substring(0, 5))
            if (profile?.weekly_review_enabled != null) setWeeklyEnabled(profile.weekly_review_enabled)
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    async function saveNotificationPrefs() {
        if (!user) return
        setSavingNotifs(true)
        try {
            await supabase.from('profiles').update({
                briefing_enabled: briefingEnabled,
                briefing_time: briefingTime,
                weekly_review_enabled: weeklyEnabled,
                notification_prefs_set: true,
            }).eq('id', user.id)
            toast.success("Notification preferences saved!")
        } catch {
            toast.error("Failed to save. Try again.")
        } finally {
            setSavingNotifs(false)
        }
    }

    async function checkForUpdates() {
        setCheckingUpdate(true)
        try {
            const res = await fetch('https://api.github.com/repos/hatimhtm/together-tasks/releases/latest')
            const data = await res.json()
            const latestTag = data.tag_name?.replace('v', '') || APP_VERSION

            if (latestTag !== APP_VERSION) {
                toast.success(`Update available: v${latestTag}`, {
                    description: "Tap to open GitHub Releases and download.",
                    duration: 8000,
                    action: {
                        label: "Download",
                        onClick: () => window.open('https://github.com/hatimhtm/together-tasks/releases/latest', '_blank'),
                    },
                })
            } else {
                toast.success("You're on the latest version!", {
                    description: `v${APP_VERSION} is up to date.`,
                })
            }
        } catch {
            toast.error("Couldn't check for updates. Are you online?")
        } finally {
            setCheckingUpdate(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="space-y-6 pb-20">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-card border border-border/40 animate-pulse" />
                ))}
            </div>
        )
    }

    const fallBackInitial = profile?.username ? profile.username.charAt(0).toUpperCase() : "U"

    return (
        <div className="space-y-8 pb-20 max-w-2xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground">Customize your experience.</p>
            </div>

            {/* Profile Card */}
            <GlassCard className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-4 mb-5">
                    <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{fallBackInitial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">{profile?.username || "Love"}</h3>
                        <p className="text-sm text-primary uppercase tracking-wider font-medium">{profile?.role || "Partner"}</p>
                    </div>
                </div>
                <div className="space-y-1 pt-4 border-t border-border/40">
                    <SettingRow icon={<User className="h-5 w-5" />} title="Account" description={user.email || "No email linked"} />
                    <SettingRow icon={<Shield className="h-5 w-5" />} title="Privacy & Security" description="Manage password and sessions" />
                </div>
            </GlassCard>

            {/* Aesthetic */}
            <section className="space-y-4">
                <SectionHeader icon={<Palette className="h-5 w-5 text-primary" />} title="Aesthetic" />
                <GlassCard className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">Your theme. Your vibe.</p>
                    <ThemeSelector userId={user.id} currentDbTheme={profile?.theme || 'light'} />
                </GlassCard>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
                <SectionHeader icon={<Bell className="h-5 w-5 text-primary" />} title="Notifications" />
                <GlassCard className="p-6 space-y-5">
                    {/* Morning Briefing */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">Morning Briefing</p>
                                    <p className="text-xs text-muted-foreground">AI daily summary notification</p>
                                </div>
                            </div>
                            <Toggle enabled={briefingEnabled} onChange={setBriefingEnabled} />
                        </div>

                        <AnimatePresence>
                            {briefingEnabled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden pl-12"
                                >
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        Wake-up time
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {BRIEFING_TIME_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setBriefingTime(opt.value)}
                                                className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all duration-200 ${briefingTime === opt.value
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.04]'
                                                    : 'bg-muted/40 text-foreground border-border/40 hover:bg-muted/70'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-px bg-border/30" />

                    {/* Weekly Review */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-secondary" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground">Weekly Review</p>
                                <p className="text-xs text-muted-foreground">Sunday summary of your week</p>
                            </div>
                        </div>
                        <Toggle enabled={weeklyEnabled} onChange={setWeeklyEnabled} />
                    </div>

                    <button
                        onClick={saveNotificationPrefs}
                        disabled={savingNotifs}
                        className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-all duration-200 disabled:opacity-60 border border-primary/20"
                    >
                        {savingNotifs ? "Saving..." : "Save Notification Preferences"}
                    </button>
                </GlassCard>
            </section>

            {/* App Updates */}
            <section className="space-y-4">
                <SectionHeader icon={<RefreshCw className="h-5 w-5 text-primary" />} title="App" />
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-semibold text-foreground">Together Tasks</p>
                            <p className="text-xs text-muted-foreground">Version {APP_VERSION}</p>
                        </div>
                        <button
                            onClick={checkForUpdates}
                            disabled={checkingUpdate}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-all border border-primary/20 disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${checkingUpdate ? 'animate-spin' : ''}`} />
                            {checkingUpdate ? "Checking..." : "Check for Updates"}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Check for the latest version on GitHub Releases. New versions can be downloaded manually.
                    </p>
                </GlassCard>
            </section>

            {/* Sign Out */}
            <div className="pt-2">
                <Button onClick={handleSignOut} variant="destructive" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-12 text-base font-medium transition-all hover:scale-[1.02]">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}

function Toggle({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? 'bg-primary' : 'bg-muted'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div className="flex items-center gap-2 px-1">
            {icon}
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
    )
}

function SettingRow({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</div>
                <div className="text-left">
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-1" />
        </button>
    )
}
