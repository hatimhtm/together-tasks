"use client"

import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { SideNav } from "@/components/layout/side-nav"
import { AIChatWidget } from "@/components/ai/chat-widget"
import { NotificationPrompt } from "@/components/settings/notification-prompt"
import { UpdateChecker } from "@/components/pwa/update-checker"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Profile } from "@/types/task"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [showNotifPrompt, setShowNotifPrompt] = useState(false)

    useEffect(() => {
        async function loadLayoutData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("username, role, has_completed_onboarding, partner_id, notification_prefs_set, avatar_url")
                .eq("id", user.id)
                .single()

            if (profile && !profile.has_completed_onboarding) {
                router.push("/onboarding")
                return
            }

            setProfile(profile)
            setLoading(false)

            // Show notification setup prompt if prefs haven't been configured yet
            // Small delay so the dashboard loads first
            if (profile && !profile.notification_prefs_set) {
                setTimeout(() => setShowNotifPrompt(true), 1500)
            }
        }
        loadLayoutData()
    }, [router, supabase])

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-transparent pb-32 pt-24 flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse mx-auto" />
                    <div className="h-3 w-32 bg-muted/40 rounded-full animate-pulse mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <SideNav />
            <div className="lg:pl-64">
                <Header partnerId={profile?.partner_id} userRole={profile?.role} userId={user.id} userName={profile?.username} avatarUrl={profile?.avatar_url} />
                <main className="px-5 sm:px-6 lg:px-10 pt-[calc(env(safe-area-inset-top)+5.5rem)] lg:pt-24 pb-32 lg:pb-16 max-w-6xl mx-auto space-y-8">
                    {children}
                </main>
            </div>
            <BottomNav />

            {/* In-app updater — checks GitHub Releases on launch and on manual request */}
            <UpdateChecker />

            {/* AI Chat Widget - Available on all dashboard pages */}
            <AIChatWidget
                userName={profile?.username || "User"}
                userRole={profile?.role || undefined}
            />

            {/* Notification preferences prompt — shown once when not yet configured */}
            {showNotifPrompt && user && (
                <NotificationPrompt
                    userId={user.id}
                    userName={profile?.username || "there"}
                    onComplete={() => setShowNotifPrompt(false)}
                />
            )}
        </div>
    )
}
