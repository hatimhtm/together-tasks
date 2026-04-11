"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Sparkles, Save, Heart, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { toast } from "sonner"
import { Profile } from "@/types/task"


export default function GoalsPage() {
    const supabase = createClient()
    const router = useRouter()
    const { user, profile, loading } = useProfile()
    const [saving, setSaving] = useState(false)
    const [goals, setGoals] = useState("")

    useEffect(() => {
        if (profile?.goals) {
            setGoals(profile.goals)
        }
    }, [profile])

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
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading vision board...</div>
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground drop-shadow-sm flex items-center gap-3">
                    <Heart className="h-8 w-8 text-pink-500 fill-pink-500/20" />
                    Vision Board
                </h1>
                <p className="text-muted-foreground">
                    Define and manifest your shared relationship goals here.
                </p>
            </div>


            <GlassCard className="p-6 mt-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                    <Sparkles className="w-32 h-32" />
                </div>

                <form onSubmit={handleSaveGoals} className="relative z-10 flex flex-col gap-6">
                    <div className="space-y-2">
                        <label htmlFor="goals" className="text-sm font-semibold text-primary uppercase tracking-wider">Our Distant Future</label>
                        <textarea
                            name="goals"
                            id="goals"
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                            className="w-full min-h-[300px] p-6 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/20 dark:border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y text-lg text-foreground placeholder:text-muted-foreground/50 transition-all font-medium leading-relaxed"
                            placeholder="Describe your dream life, your core values, and what you're working towards together..."
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving} size="lg" className="rounded-full shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300 gap-2 font-semibold">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {saving ? "Saving..." : "Save Vision"}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </div>
    )
}
