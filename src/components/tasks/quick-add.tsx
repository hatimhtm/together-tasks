"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { VoiceButton } from "@/components/tasks/voice-button"

export function QuickAdd({
    onTaskCreated,
    onAddTask,
    hasPartner,
    userId,
    partnerId
}: {
    onTaskCreated?: () => void
    onAddTask?: (input: string) => Promise<any>
    hasPartner?: boolean
    userId?: string
    partnerId?: string | null
}) {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [assignMode, setAssignMode] = useState<"me" | "partner" | "shared">("me")
    const [isPartnerTyping, setIsPartnerTyping] = useState(false)
    const [focused, setFocused] = useState(false)

    // Typing indicator refs
    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const autoGrow = (el: HTMLTextAreaElement | null) => {
        if (!el) return
        el.style.height = "auto"
        el.style.height = Math.min(el.scrollHeight, 160) + "px"
    }

    // Keep height correct on mount and whenever the value changes externally
    // (voice input, reset after submit, etc.)
    useEffect(() => {
        autoGrow(textareaRef.current)
    }, [input])

    useEffect(() => {
        if (!userId || !partnerId) return;

        const supabase = createClient()
        // Unique room for this couple
        const roomId = [userId, partnerId].sort().join('-')

        const channel = supabase.channel(`typing-${roomId}`, {
            config: { presence: { key: userId } }
        })

        channel.on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState()
            const partnerState = newState[partnerId] as any[]
            if (partnerState && partnerState.length > 0) {
                setIsPartnerTyping(partnerState[0].isTyping)
            } else {
                setIsPartnerTyping(false)
            }
        }).subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ isTyping: false })
            }
        })

        channelRef.current = channel

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            channel.unsubscribe()
        }
    }, [userId, partnerId])

    const handleInput = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setInput(val)
        autoGrow(e.target)

        // Broadcast typing status
        if (channelRef.current) {
            await channelRef.current.track({ isTyping: val.length > 0 })

            // Auto-untrack after 2s of no typing to prevent getting stuck
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(async () => {
                if (channelRef.current) await channelRef.current.track({ isTyping: false })
            }, 2000)
        }
    }

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
                // Local creation (Fallback)
                const supabase = createClient()
                let assigneeId = userId || ""
                let title = finalInput

                if (finalInput.toLowerCase().includes("@partner") && partnerId) {
                    assigneeId = partnerId
                    title = finalInput.replace(/@partner/gi, "").trim()
                } else if (finalInput.toLowerCase().includes("@shared") && partnerId) {
                    assigneeId = partnerId
                    title = finalInput.replace(/@shared/gi, "").trim()
                }

                const { error } = await supabase.from('tasks').insert({
                    title: title,
                    creator_id: userId,
                    assignee_id: assigneeId,
                    priority: "medium",
                    is_completed: false
                })

                if (error) throw error

                toast.success(`Task created for ${toastTarget}`)
            }

            setInput("")
            setAssignMode("me") // reset toggle

            // Reset typing status immediately
            if (channelRef.current) {
                await channelRef.current.track({ isTyping: false })
            }

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
        <div className={cn(
            "bg-card/60 backdrop-blur-xl border rounded-2xl px-4 py-3 relative mt-6 transition-all duration-200",
            focused
                ? "border-primary/40 shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                : "border-border/60"
        )}>
            <AnimatePresence>
                {isPartnerTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute -top-8 left-4 flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 backdrop-blur-md shadow-sm z-20"
                    >
                        <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                        </span>
                        <span>Partner is typing...</span>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            "shrink-0 px-3 h-10 w-10 md:w-auto md:px-4 rounded-xl transition-all duration-300 group",
                            assignMode === "shared" && "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        )}
                        title={`Currently assigning to: ${assignMode}`}
                    >
                        <span className="md:hidden">
                            {assignMode === 'partner' ? '💕' : assignMode === 'shared' ? '🤝' : '👤'}
                        </span>
                        <span className="hidden md:inline text-xs font-semibold">
                            {assignMode === 'partner' ? 'Partner 💕' : assignMode === 'shared' ? 'Shared 🤝' : 'Mine 👤'}
                        </span>
                    </Button>
                )}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="What needs to be done? ✨"
                    className="flex-1 min-w-0 block h-10 min-h-[2.5rem] max-h-40 py-2 px-3 rounded-xl bg-transparent border-0 focus-visible:ring-0 resize-none outline-none overflow-y-auto w-full text-sm leading-6 text-foreground placeholder:text-muted-foreground/40"
                    disabled={loading}
                    rows={1}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                <VoiceButton
                    disabled={loading}
                    onInterim={(text) => setInput(text)}
                    onTranscript={(text) => {
                        // Final transcript: drop it into the box for the user to
                        // confirm + edit. They press Enter / Send to fire addTask().
                        setInput(text)
                    }}
                />
                <Button type="submit" disabled={loading || !input.trim()} className="h-10 w-10 shrink-0 rounded-xl p-0 shadow-sm bg-primary text-primary-foreground">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    )
}
