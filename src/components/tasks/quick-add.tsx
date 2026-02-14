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
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setLoading(true)
        try {
            if (onAddTask) {
                // Delegated creation (Optimistic)
                await onAddTask(input)
                toast.success("Task created! ✨")
            } else {
                // Local creation (Legacy/Standalone)
                const response = await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ input, useAI: true })
                })

                if (!response.ok) throw new Error("Failed to create task")

                const { task } = await response.json()
                toast.success("Task created! ✨", {
                    description: task.title
                })
            }

            setInput("")
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
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What needs to be done? (e.g. 'Call mom tomorrow at 3pm')"
                    className="flex-1"
                    disabled={loading}
                    autoFocus
                />
                <Button type="submit" disabled={loading || !input.trim()}>
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
