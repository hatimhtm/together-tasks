"use client"

import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { ThinkingOfYouButton } from "@/components/dashboard/thinking-of-you-button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDisplayName } from "@/lib/user"
import { useEffect, useState } from "react"
import { Profile, Task } from "@/types/task"
import { scheduleMorningBriefing, scheduleWeeklyReview } from "@/lib/notifications/briefing-scheduler"

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerTheme, setPartnerTheme] = useState("light")
  const [partnerName, setPartnerName] = useState<string | undefined>(undefined)
  const [initialTasks, setInitialTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      let { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (currentProfile && !currentProfile.has_completed_onboarding) {
        router.push("/onboarding")
        return
      }

      // Self-Healing Hardlink Logic (For King and Queen Pairing)
      if (currentProfile && !currentProfile.partner_id) {
        const oppositeRole = currentProfile.role === 'king' ? 'queen' : 'king'
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', oppositeRole)
          .single()

        if (partnerProfile) {
          await supabase
            .from('profiles')
            .update({ partner_id: partnerProfile.id })
            .eq('id', user.id)
          currentProfile.partner_id = partnerProfile.id
        }
      }
      setProfile(currentProfile)

      let pTheme = "light"
      if (currentProfile?.partner_id) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("theme, username, briefing_time, briefing_enabled, weekly_review_enabled")
          .eq("id", currentProfile.partner_id)
          .single()
        if (partnerProfile?.theme) pTheme = partnerProfile.theme
        if (partnerProfile?.username) setPartnerName(partnerProfile.username)
      }
      setPartnerTheme(pTheme)

      // Fetch Tasks
      let tasksQuery = supabase
        .from("tasks")
        .select("*")

      if (currentProfile?.partner_id) {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${currentProfile.partner_id},assignee_id.eq.${currentProfile.partner_id}`)
      } else {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
      }
      const { data: fetchTasks } = await tasksQuery.order("created_at", { ascending: false })
      if (fetchTasks) setInitialTasks(fetchTasks)

      // Schedule morning briefing and weekly review if enabled (uses fetched tasks)
      if (currentProfile?.briefing_enabled && currentProfile?.briefing_time) {
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        const todayTasks = (fetchTasks || []).filter((t: Task) => {
          if (t.assignee_id !== user.id) return false
          if (t.is_completed) return false
          return !t.due_date || new Date(t.due_date) <= todayEnd
        })

        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0,0,0,0)
        const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23,59,59,999)
        const partnerCompletedYesterday = currentProfile.partner_id
          ? (fetchTasks || []).filter((t: Task) =>
              t.assignee_id === currentProfile.partner_id &&
              t.is_completed &&
              t.completed_at &&
              new Date(t.completed_at) >= yesterday &&
              new Date(t.completed_at) <= yesterdayEnd
            ).length
          : 0

        scheduleMorningBriefing({
          userName: currentProfile.username || "there",
          partnerName: partnerName || "your partner",
          todayTaskCount: todayTasks.length,
          partnerCompletedYesterday,
          briefingTime: currentProfile.briefing_time,
        })

        if (currentProfile?.weekly_review_enabled) {
          scheduleWeeklyReview(currentProfile.username || "there", currentProfile.briefing_time)
        }
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router, supabase])

  if (loading || !user) {
    return (
      <div className="space-y-8 pb-10">
        {/* Greeting skeleton */}
        <div className="space-y-3">
          <div className="h-9 w-64 bg-muted/40 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-muted/30 rounded-lg animate-pulse" />
        </div>
        {/* Task container skeleton */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[350px] space-y-4">
            <div className="h-32 rounded-2xl bg-card border border-border/40 animate-pulse" />
            <div className="h-12 rounded-xl bg-muted/30 animate-pulse" />
            <div className="h-28 rounded-2xl bg-card border border-border/40 animate-pulse" />
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-card border border-border/40 animate-pulse"
                style={{ opacity: 1 - (i - 1) * 0.25 }}
              >
                <div className="flex items-center gap-4 h-full px-5">
                  <div className="w-5 h-5 rounded-md bg-muted/40 animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3.5 w-1/2 bg-muted/40 rounded-full animate-pulse" />
                    <div className="h-2.5 w-1/4 bg-muted/30 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayName = getDisplayName(profile)
  const hour = new Date().getHours()
  let greeting = "Good evening"
  let icon = "🌙"
  if (hour < 12) {
    greeting = "Good morning"
    icon = "☀️"
  } else if (hour < 18) {
    greeting = "Good afternoon"
    icon = "🌤️"
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
            {greeting}, {displayName} {icon}
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
          partnerName={partnerName}
          initialTasks={initialTasks}
          userTheme={profile?.theme || 'light'}
          partnerTheme={partnerTheme}
          sidebarSlot={<AiNudge />}
        />
      </div>
    </div>
  )
}
