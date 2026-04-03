"use client"

import { useAiNudge } from "@/hooks/use-ai-nudge"
import { motion } from "framer-motion"

export function AiNudge() {
    const { nudge, loading } = useAiNudge()

    if (loading) {
        return (
            <section className="relative group animate-pulse opacity-70">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-primary opacity-20 blur-xl rounded-xl"></div>
                <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-secondary/30">auto_awesome</span>
                        </div>
                        <div className="space-y-3 flex-1 mt-1">
                            <div className="h-4 bg-outline-variant/30 rounded-full w-1/3"></div>
                            <div className="h-3 bg-outline-variant/20 rounded-full w-3/4"></div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (!nudge) return null

    return (
        <motion.section 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative group mb-8"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-primary opacity-20 blur-xl rounded-xl group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-headline font-bold text-secondary text-lg">Thinking of you</h3>
                        <p className="text-on-surface font-body leading-relaxed italic text-[15px]">
                            {nudge}
                        </p>
                    </div>
                </div>
            </div>
        </motion.section>
    )
}
