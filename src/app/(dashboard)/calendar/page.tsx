"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, isSameDay } from "date-fns"
import { Clock, CheckCircle2, Circle } from "lucide-react"
import { useEffect, useState } from "react"
import { Task } from "@/types/task"

export default function CalendarPage() {
    const supabase = createClient()
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCalendar() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // Fetch profile
            const { data: profile } = await supabase.from("profiles").select("partner_id").eq("id", user.id).single()

            // Fetch all tasks with due dates
            let query = supabase.from("tasks").select("*").not("due_date", "is", null).order("due_date", { ascending: true })

            if (profile?.partner_id) {
                query = query.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id},creator_id.eq.${profile.partner_id},assignee_id.eq.${profile.partner_id}`)
            } else {
                query = query.or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
            }

            const { data: fetchTasks } = await query
            if (fetchTasks) setTasks(fetchTasks)
            setLoading(false)
        }
        loadCalendar()
    }, [router, supabase])

    if (loading) {
        return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading journey…</div>
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold text-on-surface">
                    Upcoming
                </h1>
                <p className="text-on-surface-variant text-sm">
                    Your scheduled tasks and events.
                </p>
            </div>

            {tasks.length > 0 ? (
                <div className="relative border-l-2 border-outline-variant/60 ml-1.5 space-y-5">
                    {tasks.map((task) => {
                        const date = new Date(task.due_date!)
                        const isToday = isSameDay(date, new Date())
                        const isPast = date < new Date() && !isToday

                        return (
                            <div key={task.id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className={`absolute top-5 -left-[7px] h-3.5 w-3.5 rounded-full border-2 ${isToday ? 'bg-primary border-primary' : isPast ? 'bg-surface-container-high border-outline-variant/60' : 'bg-background border-primary'}`} />

                                <div className={`rounded-2xl bg-surface-container border border-outline-variant/60 p-5 ${isPast && !task.is_completed ? 'opacity-60' : ''}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {task.is_completed ? (
                                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-on-surface-variant shrink-0" />
                                                )}
                                                <h3 className={`font-semibold text-base ${task.is_completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                                                    {task.title}
                                                </h3>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-on-surface-variant ml-6 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : 'text-on-surface'}`}>
                                                {format(date, "MMM d, yyyy")}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1 text-xs text-on-surface-variant">
                                                <Clock className="h-3 w-3" />
                                                {format(date, "h:mm a")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-10 text-center flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                    <h2 className="text-lg font-headline font-bold text-on-surface">All caught up</h2>
                    <p className="text-on-surface-variant text-sm">No upcoming tasks scheduled.</p>
                </div>
            )}
        </div>
    )
}
