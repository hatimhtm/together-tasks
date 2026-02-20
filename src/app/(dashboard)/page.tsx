import { GlassCard } from "@/components/ui/glass-card"
import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { PushNotifier } from "@/components/pwa/push-notifier"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { startOfDay, endOfDay } from "date-fns"

export default async function Home() {
  // ... omitting unchanged lines for speed in thought process ...
  return (
    <div className="space-y-8 pb-10">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
          Hello, {profile?.username || "Love"} 👋
        </h1>
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
