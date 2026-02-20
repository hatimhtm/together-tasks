import { GlassCard } from "@/components/ui/glass-card"
import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { PushNotifier } from "@/components/pwa/push-notifier"
import { PartnerPairingFlow } from "@/components/partner/pairing-flow"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ThinkingOfYouButton } from "@/components/dashboard/thinking-of-you-button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay } from "date-fns"

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profile && !profile.has_completed_onboarding) {
    redirect("/onboarding")
  }

  let partnerTheme = "light"
  if (profile?.partner_id) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", profile.partner_id)
      .single()
    if (partnerProfile?.theme) partnerTheme = partnerProfile.theme
  }

  const displayName = profile?.role === 'king' ? 'King Hatim' : (profile?.role === 'queen' ? 'Queen Pookie' : (profile?.username?.includes('hatimhtm2003') || profile?.username?.includes('.official') ? 'Love' : (profile?.username || 'Love')));

  return (
    <div className="space-y-8 pb-10">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
            Hello, {displayName} 👋
          </h1>
          {profile?.partner_id && <ThinkingOfYouButton partnerId={profile.partner_id} />}
        </div>
        <p className="text-muted-foreground">
          Ready to conquer the day together?
        </p>
      </div>

      {/* AI Nudge & Notifications */}
      <div className="space-y-4">
        <AiNudge />
        <PushNotifier />
      </div>

      {/* Stats / Quick Glance */}
      <DashboardStats
        userId={user.id}
        partnerId={profile?.partner_id}
        initialTasks={initialTasks || []}
        initialStreak={profile?.streak || 0}
      />

      {/* Main Tasks Container (Handles QuickAdd and List) */}
      <div id="tasks">
        {!profile?.partner_id && <PartnerPairingFlow profile={profile} />}
        <TasksContainer
          userId={user.id}
          partnerId={profile?.partner_id}
          initialTasks={initialTasks || []}
          userTheme={profile?.theme || 'light'}
          partnerTheme={partnerTheme}
        />
      </div>
    </div>
  )
}
