"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Sparkles, Loader2 } from "lucide-react"
import { useAiNudge } from "@/hooks/use-ai-nudge"

export function AiNudge() {
    const { nudge, loading } = useAiNudge()

    if (loading) {
        return (
            <GlassCard className="p-4 flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/60 rounded w-3/4" />
                    <div className="h-3 bg-muted/40 rounded w-1/2" />
                </div>
            </GlassCard>
        )
    }

    if (!nudge) return null

    return (
        <GlassCard className="p-4 border-l-4 border-l-primary/60 hover:bg-white/50 transition-colors">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                        {nudge}
                    </p>
                </div>
            </div>
        </GlassCard>
    )
}
