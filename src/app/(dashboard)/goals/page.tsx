import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Sparkles, Save, Heart } from "lucide-react"
import { revalidatePath } from "next/cache"
import { PartnerInvite } from "@/components/dashboard/partner-invite"

export default async function GoalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("partner_id, goals").eq("id", user.id).single()

    async function saveGoals(formData: FormData) {
        "use server"
        const newGoals = formData.get("goals") as string
        const sb = await createClient()
        const { data: { user } } = await sb.auth.getUser()
        if (user) {
            await sb.from("profiles").update({ goals: newGoals }).eq("id", user.id)
            revalidatePath("/goals")
        }
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

            {!profile?.partner_id ? (
                <div className="mt-8">
                    <PartnerInvite partnerId={null} />
                </div>
            ) : (
                <GlassCard className="p-6 mt-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Sparkles className="w-32 h-32" />
                    </div>

                    <form action={saveGoals} className="relative z-10 flex flex-col gap-6">
                        <div className="space-y-2">
                            <label htmlFor="goals" className="text-sm font-semibold text-primary uppercase tracking-wider">Our Distant Future</label>
                            <textarea
                                name="goals"
                                id="goals"
                                defaultValue={profile?.goals || "We want to travel the world, buy a cute house, and adopt a dog named Pookie!"}
                                className="w-full min-h-[300px] p-6 rounded-2xl bg-white/5 dark:bg-black/20 border border-white/20 dark:border-white/10 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y text-lg text-foreground placeholder:text-muted-foreground/50 transition-all font-medium leading-relaxed"
                                placeholder="Describe your dream life, your core values, and what you're working towards together..."
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" size="lg" className="rounded-full shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300 gap-2 font-semibold">
                                <Save className="h-5 w-5" />
                                Save Vision
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            )}
        </div>
    )
}
