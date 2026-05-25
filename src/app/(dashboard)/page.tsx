"use client"

import { TasksContainer } from "@/components/dashboard/tasks-container"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { ThinkingOfYouButton } from "@/components/dashboard/thinking-of-you-button"
import { TasksTodayCounter } from "@/components/dashboard/tasks-today-counter"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDisplayName } from "@/lib/user"
import { useEffect } from "react"
import { Profile, Task } from "@/types/task"
import { scheduleMorningBriefing, scheduleWeeklyReview } from "@/lib/notifications/briefing-scheduler"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"

type DashboardProfile = Profile & {
  briefing_enabled?: boolean
  briefing_time?: string
  weekly_review_enabled?: boolean
}

interface DashboardData {
  user: { id: string }
  profile: DashboardProfile | null
  partnerName?: string
  initialTasks: Task[]
}

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  // Bootstrap data lives in React Query so navigating away and back is instant
  // (served from cache; realtime + optimistic updates keep tasks live after).
  const { data, isLoading, isError } = useQuery<DashboardData | null>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return null }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (currentProfile && !currentProfile.has_completed_onboarding) {
        router.push("/onboarding")
        return null
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

      let partnerName: string | undefined
      if (currentProfile?.partner_id) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("theme, username, briefing_time, briefing_enabled, weekly_review_enabled")
          .eq("id", currentProfile.partner_id)
          .single()
        if (partnerProfile?.username) partnerName = partnerProfile.username
      }

      let tasksQuery = supabase.from("tasks").select("*")
      if (currentProfile?.partner_id) {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${currentProfile.partner_id},assignee_id.eq.${currentProfile.partner_id}`)
      } else {
        tasksQuery = tasksQuery.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
      }
      const { data: fetchTasks } = await tasksQuery.order("created_at", { ascending: false })

      return {
        user: { id: user.id },
        profile: currentProfile,
        partnerName,
        initialTasks: fetchTasks || [],
      }
    },
  })

  const user = data?.user ?? null
  const profile = data?.profile ?? null
  const partnerName = data?.partnerName
  const initialTasks = data?.initialTasks ?? []

  // Single source of truth for tasks (optimistic + realtime). Both the task list
  // AND the today-counter read from THIS one instance, so they never drift.
  const taskState = useRealtimeTasks(user?.id || "", profile?.partner_id, initialTasks, partnerName)

  // Schedule notifications once the bootstrap data is available.
  useEffect(() => {
    if (!user || !profile) return
    if (!profile.briefing_enabled || !profile.briefing_time) return

    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const todayTasks = initialTasks.filter((t: Task) => {
      if (t.assignee_id !== user.id) return false
      if (t.is_completed) return false
      return !t.due_date || new Date(t.due_date) <= todayEnd
    })
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23, 59, 59, 999)
    const partnerCompletedYesterday = profile.partner_id
      ? initialTasks.filter((t: Task) =>
          t.assignee_id === profile.partner_id &&
          t.is_completed && t.completed_at &&
          new Date(t.completed_at) >= yesterday &&
          new Date(t.completed_at) <= yesterdayEnd
        ).length
      : 0
    scheduleMorningBriefing({
      userName: profile.username || "there",
      partnerName: partnerName || "your partner",
      todayTaskCount: todayTasks.length,
      partnerCompletedYesterday,
      briefingTime: profile.briefing_time,
    })
    if (profile.weekly_review_enabled) {
      scheduleWeeklyReview(profile.username || "there", profile.briefing_time)
    }
  }, [user, profile, partnerName, initialTasks])

  // Skeleton only on a true cold load (no cached data yet).
  if ((isLoading && !data) || (!user && !isError)) {
    return (
      <div className="space-y-6 lg:space-y-8 pb-10 animate-in fade-in duration-200">
        {/* Greeting skeleton */}
        <div className="space-y-3">
          <div className="h-3.5 w-36 rounded-full bg-surface-container-high animate-pulse" />
          <div className="h-9 w-72 rounded-xl bg-surface-container-high animate-pulse" />
        </div>
        {/* Single-column list skeleton */}
        <div className="mx-auto w-full max-w-2xl space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[68px] rounded-xl bg-surface-container border border-outline-variant/50 animate-pulse"
            >
              <div className="flex items-center gap-4 h-full px-4">
                <div className="w-6 h-6 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 w-1/2 rounded-full bg-surface-container-high" />
                  <div className="h-2.5 w-1/4 rounded-full bg-surface-container-high" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  const displayName = getDisplayName(profile)
  const hour = new Date().getHours()
  let greeting = "Good evening"
  if (hour < 12) greeting = "Good morning"
  else if (hour < 18) greeting = "Good afternoon"

  return (
    <div className="space-y-6 lg:space-y-8 pb-10 animate-in fade-in duration-200">
      {/* ── Greeting ── */}
      <div className="mx-auto w-full max-w-5xl flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="font-label text-on-surface-variant text-xs font-medium uppercase tracking-[0.12em]">
            {format(new Date(), "EEEE, MMM d")}
          </p>
          <h1 className="font-headline font-extrabold text-2xl lg:text-3xl text-on-surface tracking-tight">
            {greeting}, <span className="text-primary">{displayName}</span>
          </h1>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {profile?.partner_id && (
            <ThinkingOfYouButton partnerId={profile.partner_id} />
          )}
          {user && (
            <TasksTodayCounter userId={user.id} tasks={taskState.tasks} />
          )}
        </div>
      </div>

      {/* ── Two-column on desktop: task list is the hero (visible immediately);
            the AI nudge moves to a right rail. Mobile stacks (nudge first). ── */}
      <div className="mx-auto w-full max-w-5xl grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div id="tasks" className="order-2 lg:order-1 min-w-0">
          <TasksContainer
            userId={user.id}
            partnerId={profile?.partner_id}
            tasks={taskState.tasks}
            loading={taskState.loading}
            addTask={taskState.addTask}
            updateTask={taskState.updateTask}
            deleteTask={taskState.deleteTask}
          />
        </div>
        <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
          <AiNudge />
        </aside>
      </div>
    </div>
  )
}
