import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AIChatWidget } from "@/components/ai/chat-widget"
import { LocationTracker } from "@/components/location/location-tracker"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Get user profile for AI personalization
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, role, has_completed_onboarding, partner_id")
        .eq("id", user.id)
        .single()

    if (profile && !profile.has_completed_onboarding) {
        redirect("/onboarding")
    }

    return (
        <div className="min-h-screen bg-transparent pb-32 pt-24">
            <Header partnerId={profile?.partner_id} userRole={profile?.role} userId={user.id} />
            <main className="container mx-auto px-4">
                {children}
            </main>
            <BottomNav />

            {/* AI Chat Widget - Available on all dashboard pages */}
            <AIChatWidget
                userName={profile?.username || "User"}
                userRole={profile?.role || undefined}
            />

            {/* Background Location Tracker */}
            <LocationTracker userId={user.id} />
        </div>
    )
}
