"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

export function ThinkingOfYouButton({ partnerId }: { partnerId: string }) {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleNudge = async () => {
        if (loading || sent) return
        setLoading(true)

        try {
            confetti({
                particleCount: 24,
                spread: 55,
                origin: { y: 0.15, x: 0.85 },
                colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#ff80ab'],
            })

            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await supabase.from('partner_notifications').insert({
                    partner_id: partnerId,
                    message: "Thinking of you! ❤️",
                    notification_type: "nudge",
                    ai_reasoning: "Your partner manually sent you some love.",
                })
            }

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
        <motion.button
            onClick={handleNudge}
            disabled={loading || sent}
            whileTap={{ scale: 0.88 }}
            title="Send some love"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 hover:bg-pink-500/18 border border-pink-500/20 text-pink-500 transition-all duration-200 disabled:cursor-not-allowed"
        >
            <AnimatePresence mode="wait">
                {sent ? (
                    <motion.span
                        key="sent"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-sm"
                    >
                        ❤️
                    </motion.span>
                ) : (
                    <motion.div key="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <Heart className={`h-4 w-4 transition-all ${loading ? 'opacity-50' : 'hover:fill-pink-500'}`} />
                    </motion.div>
                )}
            </AnimatePresence>
            <span className="text-xs font-semibold hidden sm:block">
                {sent ? "Sent!" : "Thinking of you"}
            </span>
        </motion.button>
    )
}
