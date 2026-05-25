"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { VoiceButton } from "@/components/tasks/voice-button"

// Lightweight, client-only heuristic preview of how the input will be parsed.
// The authoritative parse still happens server-side in addTask → parseTaskInput;
// this just builds trust by echoing what we detect, with zero API calls.
type ParsePreview = { title: string; due?: string; priority?: string; duration?: string }

function previewParse(raw: string): ParsePreview {
    let title = raw.replace(/@partner/gi, "").replace(/@shared/gi, "").trim()
    let due: string | undefined
    let priority: string | undefined
    let duration: string | undefined

    const lower = raw.toLowerCase()

    const dueMatchers: [RegExp, string][] = [
        [/\btoday\b/, "Today"],
        [/\btomorrow\b|\btmrw\b/, "Tomorrow"],
        [/\btonight\b/, "Tonight"],
        [/\bthis morning\b|\bmorning\b/, "Morning"],
        [/\bthis afternoon\b|\bafternoon\b/, "Afternoon"],
        [/\bthis evening\b|\bevening\b/, "Evening"],
        [/\bmon(day)?\b/, "Mon"], [/\btue(s|sday)?\b/, "Tue"], [/\bwed(nesday)?\b/, "Wed"],
        [/\bthu(r|rs|rsday)?\b/, "Thu"], [/\bfri(day)?\b/, "Fri"], [/\bsat(urday)?\b/, "Sat"], [/\bsun(day)?\b/, "Sun"],
    ]
    for (const [re, label] of dueMatchers) {
        if (re.test(lower)) { due = label; break }
    }
    const timeMatch = lower.match(/\b(\d{1,2})(:\d{2})?\s?(am|pm)\b/)
    if (timeMatch) due = due ? `${due} ${timeMatch[0].replace(/\s/g, "")}` : timeMatch[0].replace(/\s/g, "")

    if (/\burgent\b|\basap\b|!!/.test(lower)) priority = "urgent"
    else if (/\bimportant\b|\bhigh prio\b|\bhigh priority\b/.test(lower)) priority = "high"
    else if (/\bwhenever\b|\blow prio\b|\blow priority\b/.test(lower)) priority = "low"

    const durMatch = lower.match(/\b(\d{1,3})\s?(min|mins|minutes|m|h|hr|hrs|hours?)\b/)
    if (durMatch) {
        const n = parseInt(durMatch[1], 10)
        const unit = durMatch[2]
        duration = /h/.test(unit) ? `${n}h` : `${n}m`
    }

    return { title, due, priority, duration }
}

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

    const preview = useMemo(() => previewParse(input), [input])
    const hasPreviewMeta = !!(preview.due || preview.priority || preview.duration) && input.trim().length > 0

    const autoGrow = (el: HTMLTextAreaElement | null) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }

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
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }

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

    const assignLabel = assignMode === 'partner' ? 'Partner 💕' : assignMode === 'shared' ? 'Shared 🤝' : 'Mine 👤'
    const assignHint = assignMode === 'shared' ? 'Goes to the shared pool — either of you can claim it' : undefined

    // Light & inline (Google "+ Add a task"): a quiet row until you engage with it.
    // It opens the moment the field is focused or has content, and the extra
    // controls (assign / voice / preview) only appear once open.
    const isOpen = focused || input.trim().length > 0

    return (
        <div className="relative">
            {isPartnerTyping && (
                <div className="absolute -top-3 left-4 flex items-center gap-2 text-xs font-semibold text-primary bg-surface-container-high border border-outline-variant/60 px-3 py-1 rounded-full z-20 animate-in fade-in duration-200">
                    <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    </span>
                    <span>Partner is typing…</span>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className={cn(
                    "rounded-xl transition-colors",
                    isOpen ? "bg-surface-container-low" : "hover:bg-surface-container-low/60",
                )}
            >
                {/* Input row — a circular "+" leads it, mirroring a task's checkbox column */}
                <div className="flex items-start gap-2.5 px-1 py-1.5">
                    <span className="mt-1 shrink-0 h-[22px] w-[22px] rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </span>
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
                        placeholder="Add a task"
                        className="flex-1 min-h-[28px] max-h-[40vh] overflow-y-auto py-1 bg-transparent resize-none outline-none text-[15px] leading-relaxed text-on-surface placeholder:text-on-surface-variant/70"
                        disabled={loading}
                        rows={1}
                        onFocus={() => setFocused(true)}
                        onBlur={(e) => {
                            // Keep the panel open if focus moves to one of its own controls
                            // (assign toggle, voice, submit) — only collapse on a true exit.
                            if (e.currentTarget.form?.contains(e.relatedTarget as Node)) return
                            setFocused(false)
                        }}
                    />
                </div>

                {isOpen && (
                    <div className="px-1 pb-2 space-y-2.5 animate-in fade-in duration-150">
                        {/* Live parse preview */}
                        {hasPreviewMeta && (
                            <div className="flex items-center gap-1.5 flex-wrap font-label text-[11px] pl-[34px]">
                                <span className="text-on-surface-variant/70 font-medium pr-0.5">Detected</span>
                                {preview.due && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-on-surface-variant bg-surface-container-high font-medium">
                                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                                        {preview.due}
                                    </span>
                                )}
                                {preview.duration && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-on-surface-variant bg-surface-container-high font-medium">
                                        <span className="material-symbols-outlined text-[13px]">timer</span>
                                        {preview.duration}
                                    </span>
                                )}
                                {preview.priority && (
                                    <span className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold capitalize",
                                        preview.priority === "urgent" ? "text-error bg-error/10"
                                            : preview.priority === "high" ? "text-secondary bg-secondary/10"
                                            : "text-primary bg-primary/10",
                                    )}>
                                        <span className="material-symbols-outlined text-[13px]">flag</span>
                                        {preview.priority}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 pl-[34px]">
                            {hasPartner && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (assignMode === "me") setAssignMode("partner")
                                        else if (assignMode === "partner") setAssignMode("shared")
                                        else setAssignMode("me")
                                    }}
                                    title={assignHint || `Assigning to: ${assignMode}`}
                                    className="shrink-0 h-9 px-3 rounded-full bg-surface-container-high text-on-surface-variant text-[13px] font-label font-medium hover:bg-surface-container-highest hover:text-on-surface transition-colors active:scale-[0.98]"
                                >
                                    {assignLabel}
                                </button>
                            )}

                            {assignHint && (
                                <span className="hidden md:inline text-[11px] font-label text-on-surface-variant/70 leading-tight max-w-[200px]">
                                    {assignHint}
                                </span>
                            )}

                            <div className="flex-1" />

                            <VoiceButton
                                disabled={loading}
                                onInterim={(text) => { setInput(text); autoGrow(textareaRef.current) }}
                                onTranscript={(text) => { setInput(text); autoGrow(textareaRef.current) }}
                            />

                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="h-9 px-4 shrink-0 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                <span>Add</span>
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
