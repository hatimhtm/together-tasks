"use client"

import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AIChatWidget } from "@/components/ai/chat-widget"
import { NotificationPrompt } from "@/components/settings/notification-prompt"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { PageTransition } from "@/components/ui/page-transition"
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
                .select("username, role, has_completed_onboarding, partner_id, notification_prefs_set")
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
        <div className="min-h-screen bg-transparent pb-32 pt-24">
            <Header partnerId={profile?.partner_id} userRole={profile?.role} userId={user.id} />
            <main className="container mx-auto px-4">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
            <BottomNav />

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
