"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function QuickAdd({
    onTaskCreated,
    onAddTask,
    hasPartner
}: {
    onTaskCreated?: () => void
    onAddTask?: (input: string) => Promise<any>
    hasPartner?: boolean
}) {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [assignMode, setAssignMode] = useState<"me" | "partner" | "shared">("me")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setLoading(true)
        const prefix = assignMode === "partner" ? "@partner " : assignMode === "shared" ? "@shared " : ""
        const finalInput = prefix + input

        const toastTarget = assignMode === "partner" ? "partner! 💕" : assignMode === "shared" ? "both of you! 🤝" : "you! ✨"

        try {
            if (onAddTask) {
                // Delegated creation (Optimistic)
                await onAddTask(finalInput)
                toast.success(`Task created for ${toastTarget}`)
            } else {
                // Local creation (Legacy/Standalone)
                const response = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input: finalInput, useAI: true })
                })

                if (!response.ok) throw new Error("Failed to create task")

                const { task } = await response.json()
                toast.success(`Task created for ${toastTarget}`, {
                    description: task.title
                })
            }

            setInput("")
            setAssignMode("me") // reset toggle
            // Refresh the page/data
            router.refresh()

            // Legacy callback
            if (onTaskCreated) onTaskCreated()

        } catch (error) {
            toast.error("Failed to create task")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <GlassCard className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                {hasPartner && (
                    <Button
                        type="button"
                        variant={assignMode === "me" ? "secondary" : "default"}
                        onClick={() => {
                            if (assignMode === "me") setAssignMode("partner")
                            else if (assignMode === "partner") setAssignMode("shared")
                            else setAssignMode("me")
                        }}
                        className={cn(
                            "shrink-0 px-3 h-10 w-10 md:w-auto md:px-4 rounded-full transition-all duration-300 group",
                            assignMode === "shared" && "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        )}
                        title={`Currently assigning to: ${assignMode}`}
                    >
                        <span className="md:hidden">
                            {assignMode === 'partner' ? '💕' : assignMode === 'shared' ? '🤝' : '👤'}
                        </span>
                        <span className="hidden md:inline">
                            {assignMode === 'partner' ? 'For Partner 💕' : assignMode === 'shared' ? 'For Both 🤝' : 'For Me 👤'}
                        </span>
                    </Button>
                )}
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What needs to be done? (e.g. 'Call mom tomorrow at 3pm')"
                    className="flex-1 h-10 rounded-full bg-background/50 border-white/20 focus-visible:ring-primary/50"
                    disabled={loading}
                    autoFocus
                />
                <Button type="submit" disabled={loading || !input.trim()} className="h-10 w-10 shrink-0 rounded-full p-0">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </GlassCard>
    )
}
