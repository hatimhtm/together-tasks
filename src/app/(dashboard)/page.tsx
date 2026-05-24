"use client"

import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { ThinkingOfYouButton } from "@/components/dashboard/thinking-of-you-button"
import { TasksTodayCounter } from "@/components/dashboard/tasks-today-counter"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDisplayName } from "@/lib/user"
import { useEffect, useState } from "react"
import { Profile, Task } from "@/types/task"
import { scheduleMorningBriefing, scheduleWeeklyReview } from "@/lib/notifications/briefing-scheduler"
import { format } from "date-fns"

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerName, setPartnerName] = useState<string | undefined>(undefined)
  const [initialTasks, setInitialTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
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

      // Self-Healing Hardlink Logic
      if (currentProfile && !currentProfile.partner_id) {
        const oppositeRole = currentProfile.role === 'king' ? 'queen' : 'king'
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', oppositeRole)
          .single()
        if (partnerProfile) {
          await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', user.id)
          currentProfile.partner_id = partnerProfile.id
        }
      }
      setProfile(currentProfile)

      if (currentProfile?.partner_id) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("theme, username, briefing_time, briefing_enabled, weekly_review_enabled")
          .eq("id", currentProfile.partner_id)
          .single()
        if (partnerProfile?.username) setPartnerName(partnerProfile.username)
      }

      let tasksQuery = supabase.from("tasks").select("*")
      if (currentProfile?.partner_id) {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${currentProfile.partner_id},assignee_id.eq.${currentProfile.partner_id}`)
      } else {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
      }
      const { data: fetchTasks } = await tasksQuery.order("created_at", { ascending: false })
      if (fetchTasks) setInitialTasks(fetchTasks)

      if (currentProfile?.briefing_enabled && currentProfile?.briefing_time) {
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        const todayTasks = (fetchTasks || []).filter((t: Task) => {
          if (t.assignee_id !== user.id) return false
          if (t.is_completed) return false
          return !t.due_date || new Date(t.due_date) <= todayEnd
        })
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0)
        const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23, 59, 59, 999)
        const partnerCompletedYesterday = currentProfile.partner_id
          ? (fetchTasks || []).filter((t: Task) =>
              t.assignee_id === currentProfile.partner_id &&
              t.is_completed && t.completed_at &&
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
      <div className="space-y-6 lg:space-y-8 pb-10 animate-in fade-in duration-200">
        {/* Greeting skeleton */}
        <div className="space-y-3">
          <div className="h-3.5 w-36 rounded-full bg-surface-container-high animate-pulse" />
          <div className="h-9 w-72 rounded-xl bg-surface-container-high animate-pulse" />
        </div>
        {/* Two-column skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[380px] shrink-0 space-y-4">
            <div className="h-32 rounded-2xl bg-surface-container border border-outline-variant/60 animate-pulse" />
            <div className="h-[88px] rounded-2xl bg-surface-container border border-outline-variant/60 animate-pulse" />
          </div>
          <div className="flex-1 grid gap-4 grid-cols-1 xl:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-surface-container border border-outline-variant/60 animate-pulse"
              >
                <div className="flex items-center gap-4 h-full px-5">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3.5 w-1/2 rounded-full bg-surface-container-high" />
                    <div className="h-2.5 w-1/4 rounded-full bg-surface-container-high" />
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
  if (hour < 12) greeting = "Good morning"
  else if (hour < 18) greeting = "Good afternoon"

  return (
    <div className="space-y-6 lg:space-y-8 pb-10 animate-in fade-in duration-200">
      {/* ── Greeting ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="font-label text-on-surface-variant text-xs font-medium uppercase tracking-[0.12em]">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="font-headline font-extrabold text-2xl lg:text-3xl text-on-surface">
            {greeting}, <span className="text-primary">{displayName}</span>
          </h1>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {profile?.partner_id && (
            <ThinkingOfYouButton partnerId={profile.partner_id} />
          )}
          {user && (
            <TasksTodayCounter userId={user.id} partnerId={profile?.partner_id} />
          )}
        </div>
      </div>

      {/* ── Main Tasks Container ── */}
      <div id="tasks">
        <TasksContainer
          userId={user.id}
          partnerId={profile?.partner_id}
          partnerName={partnerName}
          initialTasks={initialTasks}
          sidebarSlot={<AiNudge />}
        />
      </div>
    </div>
  )
}
