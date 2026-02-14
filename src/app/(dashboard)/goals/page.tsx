import { GlassCard } from "@/components/ui/glass-card"
import { Trophy } from "lucide-react"

export default function GoalsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Goals</h1>
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <Trophy className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Goal Tracking Coming Soon</h2>
                <p className="text-white/60 max-w-md">
                    Soon you'll be able to set and track shared goals with your partner.
                    Gamification and rewards are on the way!
                </p>
            </GlassCard>
        </div>
    )
}
