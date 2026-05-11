"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Cadence } from "@/types/routine"
import { Button } from "@/components/ui/button"

const CADENCES: Array<{ value: Cadence; label: string }> = [
    { value: "daily",    label: "Every day" },
    { value: "weekdays", label: "Weekdays" },
    { value: "weekends", label: "Weekends" },
    { value: "custom",   label: "Pick days" },
]

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const ICONS = ["star", "heart", "coffee", "moon", "sun", "dumbbell", "book", "phone", "leaf", "flower"]
const COLORS = ["primary", "secondary", "tertiary", "success", "warning", "danger"]

export interface NewRoutineInput {
    title: string
    description: string
    cadence: Cadence
    days_of_week: number[] | null
    xp_reward: number
    icon: string
    color: string
    is_shared: boolean
}

interface Props {
    open: boolean
    onClose: () => void
    onCreate: (input: NewRoutineInput) => Promise<void> | void
    defaultPartnered: boolean
}

export function NewRoutineDialog({ open, onClose, onCreate, defaultPartnered }: Props) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [cadence, setCadence] = useState<Cadence>("daily")
    const [days, setDays] = useState<number[]>([1, 3, 5])
    const [xp, setXp] = useState(5)
    const [icon, setIcon] = useState("star")
    const [color, setColor] = useState("primary")
    const [isShared, setIsShared] = useState(defaultPartnered)
    const [saving, setSaving] = useState(false)

    function toggleDay(d: number) {
        setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()))
    }

    async function handleSubmit() {
        if (!title.trim()) return
        setSaving(true)
        try {
            await onCreate({
                title,
                description,
                cadence,
                days_of_week: cadence === "custom" ? days : null,
                xp_reward: xp,
                icon,
                color,
                is_shared: isShared,
            })
            // Reset
            setTitle("")
            setDescription("")
            setCadence("daily")
            setDays([1, 3, 5])
            setXp(5)
            setIcon("star")
            setColor("primary")
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                        className="w-full max-w-md bg-surface-container border border-outline-variant/10 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="font-headline font-extrabold text-xl">New routine</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-tertiary-fixed-dim hover:text-on-surface hover:bg-muted/30"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary-fixed-dim">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Morning walk together"
                                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-tertiary-fixed-dim/60"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary-fixed-dim">Notes (optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="What does success look like? When does it happen?"
                                className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-tertiary-fixed-dim/60 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary-fixed-dim">Cadence</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CADENCES.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setCadence(c.value)}
                                        className={cn(
                                            "px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                                            cadence === c.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted/30 text-on-surface border-outline-variant/20 hover:bg-muted/50",
                                        )}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            {cadence === "custom" && (
                                <div className="flex gap-1 pt-2">
                                    {WEEK.map((label, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => toggleDay(i)}
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all border",
                                                days.includes(i)
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-muted/30 text-on-surface border-outline-variant/20",
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary-fixed-dim">XP per completion</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={25}
                                    step={1}
                                    value={xp}
                                    onChange={(e) => setXp(parseInt(e.target.value))}
                                    className="flex-1 accent-primary"
                                />
                                <span className="font-mono text-sm w-12 text-right">+{xp} XP</span>
                            </div>
                        </div>

                        {defaultPartnered && (
                            <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-outline-variant/20 cursor-pointer">
                                <span className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-tertiary-fixed-dim" />
                                    Share with partner
                                </span>
                                <input
                                    type="checkbox"
                                    checked={isShared}
                                    onChange={(e) => setIsShared(e.target.checked)}
                                    className="accent-primary w-4 h-4"
                                />
                            </label>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 rounded-xl"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 rounded-xl"
                                onClick={handleSubmit}
                                disabled={!title.trim() || saving}
                            >
                                {saving ? "Creating…" : "Create routine"}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
