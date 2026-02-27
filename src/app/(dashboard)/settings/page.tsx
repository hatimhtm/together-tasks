"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, User, Shield, LogOut, ChevronRight, Palette } from "lucide-react"
import { ThemeSelector } from "@/components/settings/theme-selector"
import { useEffect, useState } from "react"
import { Profile } from "@/types/task"

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            setProfile(profile)
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    if (loading || !user) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>
    }

    const fallBackInitial = profile?.username ? profile.username.charAt(0).toUpperCase() : "U"

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground">
                    Customize your experience and manage your profile.
                </p>
            </div>

            {/* Profile Section */}
            <GlassCard className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{fallBackInitial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">{profile?.username || "Love"}</h3>
                        <p className="text-sm text-primary uppercase tracking-wider font-medium">{profile?.role || "Partner"}</p>
                    </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
                    <SettingRow
                        icon={<User className="h-5 w-5" />}
                        title="Account Information"
                        description={user.email || "No email linked"}
                    />
                    <SettingRow
                        icon={<Shield className="h-5 w-5" />}
                        title="Privacy & Security"
                        description="Manage your password and active sessions"
                    />
                </div>
            </GlassCard>

            {/* Appearance */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Aesthetic</h2>
                </div>
                <GlassCard className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">Choose your preferred app experience. This determines how Together Tasks looks for you.</p>
                    <ThemeSelector userId={user.id} currentDbTheme={profile?.theme || 'light'} />
                </GlassCard>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground px-1">Notifications</h2>
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-lg">Push Notifications</h3>
                                <p className="text-sm text-muted-foreground">Real-time alerts for partner tasks and nudges.</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="pt-4">
                <Button onClick={handleSignOut} variant="destructive" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-12 text-lg font-medium transition-all hover:scale-[1.02]">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}

function SettingRow({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 dark:hover:bg-black/10 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div className="text-left">
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-1" />
        </button>
    )
}
