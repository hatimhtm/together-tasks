"use client"

import { Loader2 } from "lucide-react"
import { useAiNudge } from "@/hooks/use-ai-nudge"
import { motion } from "framer-motion"

export function AiNudge() {
    const { nudge, loading } = useAiNudge()

    if (loading) {
        return (
            <div className="px-4 py-3.5 bg-card border border-border/40 rounded-2xl flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-muted-foreground/50 animate-spin shrink-0" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted/40 rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted/30 rounded-full w-1/2 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!nudge) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="px-4 py-3.5 bg-card border border-border/40 rounded-2xl"
        >
            <p className="text-xs font-medium text-muted-foreground/70 mb-1.5 flex items-center gap-1.5">
                <span>💌</span>
                <span>A little note for you</span>
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
                {nudge}
            </p>
        </motion.div>
    )
}
