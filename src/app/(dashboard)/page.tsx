
import { GlassCard } from "@/components/ui/glass-card"
import { TasksContainer } from "@/components/dashboard/tasks-container"
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

  // Calculate Tasks Today
  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()

  const { count: tasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("is_completed", false)
    .gte("due_date", todayStart)
    .lte("due_date", todayEnd)

  return (
    <div className="space-y-8 pb-10">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Hello, {profile?.username || "Love"} 👋
        </h1>
        <p className="text-white/60">
          Ready to conquer the day together?
        </p>
      </div>

      {/* Stats / Quick Glance */}
      <GlassCard className="p-6">
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

      {/* Main Tasks Container (Handles QuickAdd and List) */}
      <TasksContainer userId={user.id} partnerId={profile?.partner_id} />
    </div>
  )
}
