"use client"

import { motion } from "framer-motion"

interface DayCell { date: Date; count: number }

interface Props {
    /** 7×N grid (rows: weekday Sun..Sat, columns: weeks oldest..newest). */
    cells: DayCell[]
    weeks?: number
    title?: string
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

/** Github-style activity heatmap, 7 rows × `weeks` columns. */
export function WeekdayHeatmap({ cells, weeks = 12, title = "Activity heatmap" }: Props) {
    // Bucket by week column (newest on the right).
    const maxCount = Math.max(...cells.map(c => c.count), 1)

    function intensity(n: number) {
        if (n === 0) return 0
        return Math.min(4, Math.ceil((n / maxCount) * 4))
    }

    const grid: DayCell[][] = Array.from({ length: weeks }, () => Array(7).fill(null) as any)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - (weeks * 7 - 1 - today.getDay()))

    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(start)
            date.setDate(start.getDate() + w * 7 + d)
            const match = cells.find(c =>
                c.date.getFullYear() === date.getFullYear() &&
                c.date.getMonth() === date.getMonth() &&
                c.date.getDate() === date.getDate(),
            )
            grid[w][d] = { date, count: match?.count ?? 0 }
        }
    }

    const colors = ["bg-surface-container-high/40", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]

    return (
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/60 space-y-4 overflow-x-auto">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {title}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                    <span>Less</span>
                    {colors.map((c, i) => (
                        <span key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                    ))}
                    <span>More</span>
                </div>
            </div>

            <div className="flex gap-2">
                {/* Day labels column */}
                <div className="flex flex-col gap-1 pt-0">
                    {DAY_LABELS.map((d, i) => (
                        <span key={i} className="h-3.5 text-[9px] font-mono text-on-surface-variant/60 leading-3">
                            {i % 2 === 1 ? d : ""}
                        </span>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex gap-1">
                    {grid.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                            {week.map((cell, di) => (
                                <motion.div
                                    key={di}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: (wi * 7 + di) * 0.003, duration: 0.18 }}
                                    title={`${cell.date.toLocaleDateString()} — ${cell.count} done`}
                                    className={`w-3.5 h-3.5 rounded-sm ${colors[intensity(cell.count)]}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
