"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { useAiNudge } from "@/hooks/use-ai-nudge"
import { motion } from "framer-motion"

export function AiNudge() {
    const { nudge, loading } = useAiNudge()

    if (loading) {
        return (
            <div className="p-4 bg-card border border-border/40 rounded-2xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-muted/50 rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted/30 rounded-full w-1/2 animate-pulse" />
                </div>
            </div>
        )
    }

    if (!nudge) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="p-4 bg-gradient-to-br from-primary/8 via-card to-secondary/5 border border-primary/15 rounded-2xl"
        >
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
                        Gemini Insight
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                        {nudge}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
