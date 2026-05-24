"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { GEMINI_MODEL, geminiGenerateUrl, resolveGeminiKey } from "@/lib/ai/config"

interface Message {
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export function AIChatWidget({
    userName,
    userRole
}: {
    userName?: string
    userRole?: "king" | "queen"
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: userRole === "queen"
                ? `Hey my Queen! 👑 I'm Sage, your AI assistant. Need a productivity tip, or want me to ping the King?`
                : `Good morning, King! 👑 I'm Sage. I can help you create tasks, check your schedule, or send a nudge. What do you need?`,
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; }
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isOpen])

    const handleSend = async (forcedText?: string) => {
        const textToSend = forcedText || input
        if (!textToSend.trim() || loading) return

        const userMessage: Message = { role: "user", content: textToSend, timestamp: new Date() }
        setMessages(prev => [...prev, userMessage])
        if (!forcedText) setInput("")
        setLoading(true)

        try {
            const apiKey = resolveGeminiKey()
            if (!apiKey) {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "Please configure your Gemini API key to use the chat assistant.",
                    timestamp: new Date()
                }])
                return
            }

            const systemPrompt = `You are a warm, helpful AI assistant named Sage embedded in "Together Tasks" — a personal task app built for a couple.
The user is ${userName || "there"} (${userRole || "partner"}).
Personality:
- Warm, supportive, like a trusted friend.
- Help with tasks, productivity tips, or cute nudges for the partner.
User says: "${textToSend}"`

            const res = await fetch(
                `${geminiGenerateUrl(GEMINI_MODEL)}?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
                }
            )
            if (!res.ok) throw new Error(`API error ${res.status}`)

            const data = await res.json()
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that — could you rephrase?"
            setMessages(prev => [...prev, { role: "assistant", content: aiText, timestamp: new Date() }])
        } catch (error) {
            console.error("AI chat error:", error)
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I'm having a little trouble connecting right now! 💙",
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Floating FAB - Visible when chat is closed */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open AI assistant"
                        className="fixed right-5 lg:right-8 z-50 h-14 w-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center active:scale-[0.96] transition-transform duration-200 bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-6"
                    >
                        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Full-Screen Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col lg:items-center lg:justify-center lg:p-8"
                    >
                      <div className="relative flex flex-col w-full h-full lg:max-w-2xl lg:h-[min(80vh,720px)] lg:rounded-2xl lg:border lg:border-outline-variant/60 lg:bg-surface-container lg:overflow-hidden lg:shadow-xl">
                        {/* Header */}
                        <header className="absolute top-0 left-0 right-0 z-50 bg-background/90 lg:bg-surface-container/90 backdrop-blur-md flex items-center justify-between px-6 py-4 pt-safe lg:pt-4 border-b border-outline-variant/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center border border-outline-variant/60">
                                    <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                </div>
                                <span className="text-on-surface font-headline font-extrabold tracking-tight text-lg">Sage</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Close assistant"
                                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-[0.96]"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-48 lg:pb-40 no-scrollbar">
                            
                            {/* AI Personality Header Section */}
                            <div className="mb-6 px-1">
                                <div className="bg-surface-container border border-outline-variant/60 rounded-2xl p-4 flex items-center gap-4">
                                    <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    <div>
                                        <h2 className="font-headline font-bold text-on-surface text-sm tracking-wide">AI Sage</h2>
                                        <p className="text-on-surface-variant text-xs">{loading ? "Thinking…" : "Always here to help."}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat History */}
                            <div className="space-y-6 flex flex-col">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
                                    >
                                        <div className={`p-4 ${
                                            msg.role === "user"
                                                ? "bg-primary text-on-primary rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
                                                : "bg-surface-container text-on-surface rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-outline-variant/60"
                                        }`}>
                                            <p className="font-body text-[14.5px] leading-relaxed whitespace-pre-wrap font-medium">
                                                {msg.content}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant px-2 font-label opacity-70">
                                            {msg.role === "user" ? "You" : "Sage"} • {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </motion.div>
                                ))}
                                
                                {loading && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1 max-w-[85%] self-start">
                                        <div className="bg-surface-container p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-outline-variant/60">
                                            <div className="flex gap-1.5 items-center justify-center py-1">
                                                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Fixed Interaction Layer */}
                        <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-5 bg-gradient-to-t from-background lg:from-surface-container via-background lg:via-surface-container to-transparent">
                            {/* Suggestions */}
                            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                                {["Give me a tip", "What's on my schedule?", "Send a nudge"].map((sug) => (
                                    <button
                                        key={sug}
                                        onClick={() => handleSend(sug)}
                                        disabled={loading}
                                        className="whitespace-nowrap shrink-0 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-label font-semibold px-4 py-2 rounded-full border border-outline-variant/60 transition-colors active:scale-[0.96] disabled:opacity-50"
                                    >
                                        {sug}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input Area */}
                            <div className="bg-surface-container-high rounded-full p-1.5 pl-5 flex items-center border border-outline-variant/60">
                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 px-2 font-body outline-none"
                                    placeholder="Whisper something to Sage…"
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                                    disabled={loading}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                    aria-label="Send message"
                                    className="bg-primary text-on-primary p-2.5 rounded-full active:scale-[0.96] transition-transform disabled:opacity-50 disabled:active:scale-100 shrink-0"
                                >
                                    {loading ? (
                                        <Loader2 className="h-[20px] w-[20px] animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
                                    )}
                                </button>
                            </div>
                        </div>
                      </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
