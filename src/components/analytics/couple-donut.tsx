"use client"

import { motion } from "framer-motion"

interface Props {
    me: number
    partner: number
    myLabel?: string
    partnerLabel?: string
    title?: string
}

/** Two-segment donut comparing the user and the partner's contribution. */
export function CoupleDonut({ me, partner, myLabel = "You", partnerLabel = "Partner", title }: Props) {
    const total = me + partner || 1
    const myShare = me / total
    const partnerShare = partner / total

    const radius = 64
    const stroke = 18
    const circumference = 2 * Math.PI * radius

    const mySegment = myShare * circumference
    const partnerSegment = partnerShare * circumference

    return (
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/60 space-y-4">
            {title && (
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {title}
                </h3>
            )}

            <div className="flex items-center gap-6">
                <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
                    {/* Track */}
                    <circle
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke="rgb(120 120 130 / 0.15)"
                        strokeWidth={stroke}
                    />

                    {/* Me */}
                    <motion.circle
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke="rgb(var(--primary-rgb, 255 183 125))"
                        strokeWidth={stroke}
                        strokeDasharray={`${mySegment} ${circumference - mySegment}`}
                        strokeDashoffset={0}
                        transform="rotate(-90 80 80)"
                        strokeLinecap="butt"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${mySegment} ${circumference - mySegment}` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                    />

                    {/* Partner */}
                    <motion.circle
                        cx="80" cy="80" r={radius}
                        fill="none"
                        stroke="rgb(var(--secondary-rgb, 168 184 230))"
                        strokeWidth={stroke}
                        strokeDasharray={`${partnerSegment} ${circumference - partnerSegment}`}
                        strokeDashoffset={-mySegment}
                        transform="rotate(-90 80 80)"
                        strokeLinecap="butt"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${partnerSegment} ${circumference - partnerSegment}` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                    />

                    <text
                        x="80" y="78"
                        textAnchor="middle"
                        className="fill-on-surface font-headline"
                        style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}
                    >
                        {total}
                    </text>
                    <text
                        x="80" y="98"
                        textAnchor="middle"
                        className="fill-on-surface-variant"
                        style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}
                    >
                        total
                    </text>
                </svg>

                <div className="flex-1 space-y-3">
                    <Row label={myLabel}      value={me}      pct={Math.round(myShare * 100)}      color="primary" />
                    <Row label={partnerLabel} value={partner} pct={Math.round(partnerShare * 100)} color="secondary" />
                </div>
            </div>
        </div>
    )
}

function Row({ label, value, pct, color }: { label: string; value: number; pct: number; color: "primary" | "secondary" }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-on-surface min-w-0">
                <span
                    className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color === "primary" ? "bg-primary" : "bg-secondary"}`}
                />
                <span className="truncate">{label}</span>
            </span>
            <span className="font-mono tabular-nums text-on-surface-variant shrink-0">
                {value} <span className="text-on-surface/40">· {pct}%</span>
            </span>
        </div>
    )
}
