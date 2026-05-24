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
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open AI assistant"
                        style={{ bottom: "calc(7rem + env(safe-area-inset-bottom))" }}
                        className="fixed right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container shadow-[0_8px_32px_rgba(255,183,125,0.4)] flex items-center justify-center active:scale-90 transition-transform duration-200"
                    >
                        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Full-Screen Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col"
                    >
                        {/* Header */}
                        <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-3xl flex items-center justify-between px-6 py-4 pt-safe border-b border-outline-variant/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant/15">
                                    <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                </div>
                                <span className="text-primary font-headline font-bold tracking-tight text-xl drop-shadow-[0_0_8px_rgba(255,183,125,0.3)]">Sage</span>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-primary hover:bg-surface-bright/50 transition-colors p-2 rounded-full active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[28px]">stat_minus_1</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-48 no-scrollbar bg-surface/30">
                            
                            {/* AI Personality Header Section */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="mb-8 px-2"
                            >
                                <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 shadow-[0_0_30px_rgba(255,183,125,0.05)] border border-outline-variant/5">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
                                        <span className="material-symbols-outlined text-primary relative z-10 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    </div>
                                    <div>
                                        <h2 className="font-headline font-bold text-on-surface text-sm tracking-wide">AI Sage</h2>
                                        <p className="text-tertiary-fixed-dim text-xs italic">{loading ? "Thinking..." : "Always here to help."}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Chat History */}
                            <div className="space-y-6 flex flex-col">
                                {messages.map((msg, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
                                    >
                                        <div className={`p-4 shadow-sm ${
                                            msg.role === "user" 
                                                ? "bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-[0_4px_20px_rgba(255,140,0,0.15)]" 
                                                : "bg-surface-container/80 backdrop-blur-xl text-on-surface rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-outline-variant/10"
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
                                        <div className="bg-surface-container/60 backdrop-blur-xl p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-outline-variant/10">
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
                        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
                            {/* Floating Suggestions */}
                            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                                {["Give me a tip", "What's on my schedule?", "Send a nudge"].map((sug) => (
                                    <button 
                                        key={sug}
                                        onClick={() => handleSend(sug)}
                                        disabled={loading}
                                        className="whitespace-nowrap shrink-0 bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-label font-bold px-5 py-2.5 rounded-full border border-outline-variant/15 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {sug}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Chat Input Area */}
                            <div className="bg-surface-container/90 backdrop-blur-2xl rounded-full p-1.5 pl-5 flex items-center shadow-2xl border border-outline-variant/20">
                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 px-2 font-body outline-none" 
                                    placeholder="Whisper something to Sage..." 
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
                                    className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container p-2.5 rounded-full shadow-[0_0_15px_rgba(255,183,125,0.4)] active:scale-90 transition-all disabled:opacity-50 disabled:active:scale-100 shrink-0"
                                >
                                    {loading ? (
                                        <Loader2 className="h-[20px] w-[20px] animate-spin text-on-primary" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
