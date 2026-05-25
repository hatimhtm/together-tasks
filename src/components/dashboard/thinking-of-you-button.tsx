"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

export function ThinkingOfYouButton({ partnerId }: { partnerId: string }) {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleNudge = async () => {
        if (loading || sent) return
        setLoading(true)

        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Sign in to send love.")
                return
            }

            const { error } = await supabase.from('partner_notifications').insert({
                task_owner_id: user.id,
                partner_id: partnerId,
                message: "Thinking of you! ❤️",
                notification_type: "nudge",
                ai_reasoning: "Your partner manually sent you some love.",
            })

            if (error) throw error

            confetti({
                particleCount: 24,
                spread: 55,
                origin: { y: 0.15, x: 0.85 },
                colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#ff80ab'],
            })

            setSent(true)
            toast.success("Sent some love! ❤️")
            setTimeout(() => setSent(false), 4000)
        } catch {
            toast.error("Couldn't send love right now.")
        } finally {
            setTimeout(() => setLoading(false), 2000)
        }
    }

    return (
        <button
            onClick={handleNudge}
            disabled={loading || sent}
            title="Send some love"
            className={cn(
                "flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm font-medium transition-colors active:scale-[0.98] disabled:cursor-not-allowed",
                "border-outline-variant/60 bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                loading && "opacity-60"
            )}
        >
            <Heart className={cn("h-4 w-4 text-pink-500 transition-all", sent && "fill-pink-500")} />
            <span className="hidden sm:inline">{sent ? "Sent!" : "Thinking of you"}</span>
        </button>
    )
}
