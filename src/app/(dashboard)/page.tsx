import { GlassCard } from "@/components/ui/glass-card"
import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
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

  // Self-Healing Hardlink Logic (For King and Queen Pairing)
  if (profile && !profile.partner_id) {
    // If they don't have a partner, look up the opposite role
    const oppositeRole = profile.role === 'king' ? 'queen' : 'king'
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', oppositeRole)
      .single()

    if (partnerProfile) {
      // Because RLS allows users to update their OWN profile, this works perfectly.
      await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', user.id)

      profile.partner_id = partnerProfile.id
    }
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

      {/* Main Tasks Container (Handles QuickAdd and List) */}
      <div id="tasks">
        <TasksContainer
          userId={user.id}
          partnerId={profile?.partner_id}
          initialTasks={initialTasks || []}
          userTheme={profile?.theme || 'light'}
          partnerTheme={partnerTheme}
          sidebarSlot={<AiNudge />}
        />
      </div>
    </div>
  )
}
