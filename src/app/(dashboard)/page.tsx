import { GlassCard } from "@/components/ui/glass-card"
import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { PushNotifier } from "@/components/pwa/push-notifier"
import { PartnerInvite } from "@/components/dashboard/partner-invite"
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

  // Calculate Tasks Today
  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()

  // Server-side fetch for immediate display (Optimistic UI enhancement)
  let tasksQuery = supabase
    .from("tasks")
    .select("*")

  if (profile?.partner_id) {
    tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${profile.partner_id},assignee_id.eq.${profile.partner_id}`)
  } else {
    tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
  }

  const { data: initialTasks } = await tasksQuery.order("created_at", { ascending: false })

  const tasksCount = initialTasks?.filter(t => {
    if (t.is_completed) return false;
    // Count tasks assigned to the current user (my tasks) that are pending
    if (t.assignee_id === user.id) return true;
    return false;
  }).length || 0;

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
      <a href="#tasks" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        <GlassCard className="p-6 transition-all hover:bg-muted/10 active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
              <p className="text-3xl font-bold text-foreground">{tasksCount || 0} <span className="text-sm font-normal text-muted-foreground">left</span></p>
            </div>

            <div className="h-12 w-px bg-border/50" />

            <div className="space-y-1 text-right">
              <p className="text-sm font-medium text-muted-foreground">Couple Streak</p>
              <p className="text-3xl font-bold text-accent">🔥 {profile?.streak || 0}</p>
            </div>
          </div>
        </GlassCard>
      </a>

      {/* Main Tasks Container (Handles QuickAdd and List) */}
      <div id="tasks">
        {!profile?.partner_id && <PartnerInvite partnerId={profile?.partner_id} />}
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
