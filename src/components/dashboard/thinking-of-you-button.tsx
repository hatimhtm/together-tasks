"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

export function ThinkingOfYouButton({ partnerId }: { partnerId: string }) {
    const [loading, setLoading] = useState(false)

    const handleNudge = async () => {
        if (loading) return
        setLoading(true)

        try {
            // Optimistic Celebration
            confetti({
                particleCount: 20,
                spread: 50,
                origin: { y: 0.2, x: 0.8 },
                colors: ['#FF1493', '#FF69B4', '#FFB6C1']
            })

            const res = await fetch("/api/partner/nudge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partnerId })
            })

            if (!res.ok) throw new Error("Failed to send nudge")

            toast.success("Sent some love! ❤️")
        } catch (error: any) {
            toast.error("Couldn't send love right now. Try again!")
        } finally {
            setTimeout(() => setLoading(false), 2000) // Cooldown to prevent spam
        }
    }

    return (
        <button
            onClick={handleNudge}
            disabled={loading}
            title="Thinking of You Nudge"
            className="flex items-center justify-center p-2 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
            <Heart className={`h-5 w-5 ${loading ? 'opacity-50' : 'group-hover:fill-pink-500'}`} />
        </button>
    )
}
