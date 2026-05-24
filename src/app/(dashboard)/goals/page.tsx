"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Profile } from "@/types/task"


export default function GoalsPage() {
    const supabase = createClient()
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [goals, setGoals] = useState("")

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            setProfile(profile)
            if (profile?.goals) setGoals(profile.goals)
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])

    async function handleSaveGoals(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return

        setSaving(true)
        const { error } = await supabase.from("profiles").update({ goals: goals }).eq("id", user.id)

        setSaving(false)
        if (error) {
            toast.error("Failed to save vision board")
            console.error(error)
        } else {
            toast.success("Vision board updated! ✨")
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading vision board…</div>
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-headline font-extrabold text-on-surface">
                    Vision Board
                </h1>
                <p className="text-on-surface-variant text-sm">
                    Define and manifest your shared relationship goals here.
                </p>
            </div>

            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5">
                <form onSubmit={handleSaveGoals} className="flex flex-col gap-5">
                    <div className="space-y-2">
                        <label htmlFor="goals" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Our distant future</label>
                        <textarea
                            name="goals"
                            id="goals"
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                            className="w-full min-h-[280px] p-4 rounded-xl bg-surface-container-high border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y text-base text-on-surface placeholder:text-on-surface-variant/60 leading-relaxed"
                            placeholder="Describe your dream life, your core values, and what you're working towards together…"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold px-5 h-11 active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {saving ? "Saving…" : "Save vision"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
