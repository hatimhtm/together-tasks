"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Props {
    me: number
    partner: number
    myLabel: string
    partnerLabel: string
    title?: string
    /** Period this measures, shown as a subline. */
    period?: string
}

/** Single horizontal bar split between two contributors, with a centre marker for 50/50. */
export function FairnessBar({ me, partner, myLabel, partnerLabel, title = "Fairness", period }: Props) {
    const total = me + partner
    const myShare = total === 0 ? 0.5 : me / total
    const partnerShare = total === 0 ? 0.5 : partner / total

    const myPct = Math.round(myShare * 100)
    const partnerPct = 100 - myPct

    const balanced = Math.abs(myPct - 50) < 8

    return (
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/5 space-y-4">
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-tertiary-fixed-dim">
                        {title}
                    </h3>
                    {period && <p className="text-xs text-tertiary-fixed-dim mt-0.5">{period}</p>}
                </div>
                <span className={cn(
                    "text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                    balanced
                        ? "bg-emerald-500/15 text-emerald-500"
                        : myPct > partnerPct
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary/15 text-secondary",
                )}>
                    {balanced ? "Balanced" : myPct > partnerPct ? `${myLabel} +${myPct - partnerPct}%` : `${partnerLabel} +${partnerPct - myPct}%`}
                </span>
            </div>

            <div className="relative">
                <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${myPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="bg-primary"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${partnerPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
                        className="bg-secondary"
                    />
                </div>
                {/* 50% marker */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3 w-px bg-on-surface/30" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-tertiary-fixed-dim/60">
                    50/50
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 text-xs">
                <span className="flex items-center gap-2 text-on-surface">
                    <span className="w-2 h-2 rounded-sm bg-primary" />
                    <span className="font-mono tabular-nums">{me}</span>
                    <span className="text-tertiary-fixed-dim">{myLabel}</span>
                </span>
                <span className="flex items-center gap-2 text-on-surface">
                    <span className="text-tertiary-fixed-dim">{partnerLabel}</span>
                    <span className="font-mono tabular-nums">{partner}</span>
                    <span className="w-2 h-2 rounded-sm bg-secondary" />
                </span>
            </div>
        </div>
    )
}
