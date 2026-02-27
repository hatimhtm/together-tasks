"use client"

import { TasksContainer } from "@/components/dashboard/tasks-container"
import { AiNudge } from "@/components/dashboard/ai-nudge"
import { ThinkingOfYouButton } from "@/components/dashboard/thinking-of-you-button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getDisplayName } from "@/lib/user"
import { useEffect, useState } from "react"
import { Profile, Task } from "@/types/task"

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerTheme, setPartnerTheme] = useState("light")
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
          .select("theme")
          .eq("id", currentProfile.partner_id)
          .single()
        if (partnerProfile?.theme) pTheme = partnerProfile.theme
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

      setLoading(false)
    }

    loadDashboard()
  }, [router, supabase])

  if (loading || !user) {
    return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground animate-pulse">Loading items...</div>
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
          initialTasks={initialTasks}
          userTheme={profile?.theme || 'light'}
          partnerTheme={partnerTheme}
          sidebarSlot={<AiNudge />}
        />
      </div>
    </div>
  )
}
