"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useRouter } from "next/navigation"

export function QuickAdd({
    onTaskCreated,
    onAddTask
}: {
    onTaskCreated?: () => void
    onAddTask?: (input: string) => Promise<any>
}) {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [forPartner, setForPartner] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setLoading(true)
        const finalInput = forPartner ? `@partner ${input}` : input

        try {
            if (onAddTask) {
                // Delegated creation (Optimistic)
                await onAddTask(finalInput)
                toast.success(forPartner ? "Task assigned to partner! 💕" : "Task created! ✨")
            } else {
                // Local creation (Legacy/Standalone)
                const response = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input: finalInput, useAI: true })
                })

                if (!response.ok) throw new Error("Failed to create task")

                const { task } = await response.json()
                toast.success(forPartner ? "Task sent to partner! 💕" : "Task created! ✨", {
                    description: task.title
                })
            }

            setInput("")
            setForPartner(false) // reset toggle
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
                <Button
                    type="button"
                    variant={forPartner ? "default" : "secondary"}
                    onClick={() => setForPartner(!forPartner)}
                    className="shrink-0 px-3 h-10 w-10 md:w-auto md:px-4 rounded-full transition-all duration-300 group"
                    title={forPartner ? "Assigning to Partner" : "Assign to me"}
                >
                    <span className="md:hidden">
                        {forPartner ? '💕' : '👤'}
                    </span>
                    <span className="hidden md:inline">
                        {forPartner ? 'For Partner 💕' : 'For Me 👤'}
                    </span>
                </Button>
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
