"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/types/task"
import { Routine, RoutineCompletion } from "@/types/routine"
import { RoutineCard } from "@/components/routines/routine-card"
import { NewRoutineDialog } from "@/components/routines/new-routine-dialog"

export default function RoutinesPage() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [routines, setRoutines] = useState<Routine[]>([])
    const [completions, setCompletions] = useState<RoutineCompletion[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push("/login"); return }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("id, role, partner_id, username")
                .eq("id", user.id)
                .single()
            setProfile(profile as Profile)

            const { data: routinesData } = await supabase
                .from("routines")
                .select("*")
                .is("archived_at", null)
                .order("created_at", { ascending: false })
            setRoutines((routinesData ?? []) as Routine[])

            // Pull the last 60 days of completions so the streak math has data.
            const sixtyDaysAgo = new Date()
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
            const { data: completionsData } = await supabase
                .from("routine_completions")
                .select("*")
                .gte("completed_on", sixtyDaysAgo.toISOString().slice(0, 10))
            setCompletions((completionsData ?? []) as RoutineCompletion[])

            setLoading(false)
        }
        load()
    }, [router, supabase])

    async function handleToggleToday(routine: Routine) {
        if (!user) return
        const today = new Date().toISOString().slice(0, 10)
        const existing = completions.find(
            c => c.routine_id === routine.id && c.user_id === user.id && c.completed_on === today,
        )

        if (existing) {
            // Un-complete
            const { error } = await supabase
                .from("routine_completions")
                .delete()
                .eq("id", existing.id)
            if (error) { toast.error("Could not un-mark"); return }
            setCompletions(prev => prev.filter(c => c.id !== existing.id))
        } else {
            const { data, error } = await supabase
                .from("routine_completions")
                .insert({
                    routine_id: routine.id,
                    user_id: user.id,
                    completed_on: today,
                })
                .select()
                .single()
            if (error) { toast.error("Could not log"); return }
            setCompletions(prev => [...prev, data as RoutineCompletion])
            toast.success("Done for today.")
        }
    }

    async function handleArchive(routine: Routine) {
        const { error } = await supabase
            .from("routines")
            .update({ archived_at: new Date().toISOString() })
            .eq("id", routine.id)
        if (error) { toast.error("Could not archive"); return }
        setRoutines(prev => prev.filter(r => r.id !== routine.id))
        toast.success("Routine archived")
    }

    async function handleCreate(input: {
        title: string
        description: string
        cadence: Routine["cadence"]
        days_of_week: number[] | null
        xp_reward: number
        icon: string
        color: string
        is_shared: boolean
    }) {
        if (!user) return
        const { data, error } = await supabase
            .from("routines")
            .insert({
                creator_id: user.id,
                assignee_id: user.id,
                partner_id: profile?.partner_id ?? null,
                title: input.title.trim(),
                description: input.description.trim() || null,
                cadence: input.cadence,
                days_of_week: input.days_of_week,
                xp_reward: input.xp_reward,
                icon: input.icon,
                color: input.color,
                is_shared: input.is_shared,
            })
            .select()
            .single()
        if (error) { toast.error("Could not create routine"); return }
        setRoutines(prev => [data as Routine, ...prev])
        setShowNew(false)
        toast.success("Routine created")
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading routines…
            </div>
        )
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5">
                    <h1 className="text-2xl lg:text-3xl font-headline font-extrabold text-on-surface">
                        Routines
                    </h1>
                    <p className="text-on-surface-variant text-sm max-w-prose">
                        Shared habits you keep together. Streaks live here, not in tasks — miss a day and a grace day keeps the chain alive.
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold px-5 h-11 active:scale-[0.98] transition-transform"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span> New routine
                </button>
            </div>

            {routines.length === 0 ? (
                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-10 text-center flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>repeat</span>
                    <h2 className="text-xl font-headline font-bold text-on-surface">No routines yet</h2>
                    <p className="text-on-surface-variant max-w-md mx-auto text-sm">
                        Start with something small you both want to do together — a morning walk,
                        a 9pm phone-down, a Sunday review. Keep the chain going.
                    </p>
                    <button
                        onClick={() => setShowNew(true)}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold px-5 h-11 active:scale-[0.98] transition-transform"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span> Create your first routine
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                    {routines.map((r) => (
                        <RoutineCard
                            key={r.id}
                            routine={r}
                            completions={completions.filter(c => c.routine_id === r.id)}
                            userId={user.id}
                            partnerId={profile?.partner_id ?? null}
                            onToggleToday={() => handleToggleToday(r)}
                            onArchive={() => handleArchive(r)}
                        />
                    ))}
                </div>
            )}

            <NewRoutineDialog
                open={showNew}
                onClose={() => setShowNew(false)}
                onCreate={handleCreate}
                defaultPartnered={Boolean(profile?.partner_id)}
            />
        </div>
    )
}
