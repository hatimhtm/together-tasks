"use client"

import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AIChatWidget } from "@/components/ai/chat-widget"
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
                .select("username, role, has_completed_onboarding, partner_id")
                .eq("id", user.id)
                .single()

            if (profile && !profile.has_completed_onboarding) {
                router.push("/onboarding")
                return
            }

            setProfile(profile)
            setLoading(false)
        }
        loadLayoutData()
    }, [router, supabase])

    if (loading || !user) {
        return <div className="min-h-screen bg-transparent pb-32 pt-24 animate-pulse p-8 text-center text-muted-foreground">Loading dashboard...</div>
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
        </div>
    )
}
