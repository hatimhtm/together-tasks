"use client"

import { useAiNudge } from "@/hooks/use-ai-nudge"

export function AiNudge() {
    const { nudge, loading } = useAiNudge()

    if (loading) {
        return (
            <section className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant/40">auto_awesome</span>
                    </div>
                    <div className="space-y-3 flex-1 mt-1">
                        <div className="h-3.5 w-1/3 rounded-full bg-surface-container-high" />
                        <div className="h-3 w-3/4 rounded-full bg-surface-container-high" />
                    </div>
                </div>
            </section>
        )
    }

    if (!nudge) return null

    return (
        <section className="rounded-2xl bg-surface-container border border-outline-variant/60 p-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div className="space-y-1 min-w-0">
                    <h3 className="font-headline font-bold text-secondary text-sm uppercase tracking-[0.08em]">Thinking of you</h3>
                    <p className="text-on-surface font-body leading-relaxed text-[15px]">
                        {nudge}
                    </p>
                </div>
            </div>
        </section>
    )
}
