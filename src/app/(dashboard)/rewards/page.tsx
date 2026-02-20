import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Check, Coins } from "lucide-react"
import { PartnerInvite } from "@/components/dashboard/partner-invite"

export default async function RewardsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Fetch profile for XP/Level info
    const { data: profile } = await supabase
        .from("profiles")
        .select("xp, partner_id")
        .eq("id", user.id)
        .single()

    // Fetch active rewards
    const { data: rewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Love Shop 💕</h1>
                <p className="text-muted-foreground text-sm">Create and redeem custom rewards together.</p>
            </div>

            {!profile?.partner_id ? (
                <div className="mt-8">
                    <PartnerInvite partnerId={null} />
                </div>
            ) : (
                <>
                    <GlassCard className="p-4 bg-primary/10 border-primary/20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Coins className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Available XP Balance</p>
                                <p className="text-2xl font-bold">{profile?.xp || 0} XP</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Reward
                        </Button>
                    </GlassCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rewards && rewards.length > 0 ? (
                            rewards.map((reward) => (
                                <GlassCard key={reward.id} className="p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{reward.title}</h3>
                                        {reward.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                            {reward.point_cost} XP
                                        </span>
                                        <form action={async () => {
                                            'use server'
                                            // Add purchase logic here later (deduct XP, send notification)
                                        }}>
                                            <Button size="sm" variant="secondary" className="gap-2">
                                                <Check className="h-4 w-4" /> Redeem
                                            </Button>
                                        </form>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <GlassCard className="p-8 text-center col-span-full border-dashed">
                                <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="font-medium text-lg">No Rewards Yet!</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">
                                    Set up some fun relationship goals or favors to buy with your XP.
                                </p>
                                <Button variant="default">Create Your First Reward</Button>
                            </GlassCard>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
