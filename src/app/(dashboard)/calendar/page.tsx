"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { format, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from "lucide-react"
import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { Task } from "@/types/task"

export default function CalendarPage() {
    const supabase = createClient()
    const router = useRouter()
    const { user, profile, loading: profileLoading } = useProfile()
    const [tasks, setTasks] = useState<Task[]>([])
    const [tasksLoading, setTasksLoading] = useState(true)

    useEffect(() => {
        async function loadCalendar() {
            if (!user) return

            // Fetch all tasks with due dates
            let query = supabase.from("tasks").select("*").not("due_date", "is", null).order("due_date", { ascending: true })

            if (profile?.partner_id) {
                query = query.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${profile.partner_id},assignee_id.eq.${profile.partner_id}`)
            } else {
                query = query.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
            }

            const { data: fetchTasks } = await query
            if (fetchTasks) setTasks(fetchTasks)
            setTasksLoading(false)
        }

        if (!profileLoading) {
            loadCalendar()
        }
    }, [profile, user, profileLoading, supabase])

    const loading = profileLoading || tasksLoading

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading journey...</div>
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    Upcoming Journey
                </h1>
                <p className="text-muted-foreground">
                    Your scheduled tasks and events.
                </p>
            </div>

            <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 pb-8">
                {tasks.length > 0 ? (
                    tasks.map((task) => {
                        const date = new Date(task.due_date!)
                        const isToday = isSameDay(date, new Date())
                        const isPast = date < new Date() && !isToday

                        return (
                            <div key={task.id} className="relative pl-8">
                                {/* Timeline Dot */}
                                <div className={`absolute top-4 -left-[9px] h-4 w-4 rounded-full border-2 ${isToday ? 'bg-primary border-primary shadow-[0_0_10px_rgba(0,122,255,0.5)]' : isPast ? 'bg-muted border-muted-foreground' : 'bg-background border-primary'}`} />

                                <GlassCard className={`p-5 transition-transform hover:-translate-y-1 ${isPast && !task.is_completed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {task.is_completed ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <h3 className={`font-semibold text-lg ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                    {task.title}
                                                </h3>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground ml-6 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                                                {format(date, "MMM d, yyyy")}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {format(date, "h:mm a")}
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        )
                    })
                ) : (
                    <div className="pl-8 pt-4">
                        <GlassCard className="p-8 text-center text-muted-foreground">
                            No upcoming tasks scheduled! You're all caught up.
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    )
}
