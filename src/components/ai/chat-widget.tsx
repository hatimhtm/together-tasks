"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Send, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""

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
                ? `Hey my Queen! 👑 I'm your AI assistant. Ask me anything — create tasks, check your list, or just chat.`
                : `Hey King Hatim! 👑 I'm your AI assistant. I can help you create tasks, check your list, or just keep you company. What do you need?`,
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = { role: "user", content: input, timestamp: new Date() }
        setMessages(prev => [...prev, userMessage])
        const currentInput = input
        setInput("")
        setLoading(true)
        if (!GEMINI_API_KEY) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Oops! It looks like my brain (the Gemini API key) isn't configured right now. Ask Hatim to set it up! 💙",
                timestamp: new Date()
            }])
            setLoading(false)
            return
        }

        try {
            const systemPrompt = `You are a warm, helpful AI assistant embedded in "Together Tasks" — a personal task app built for a couple: Hatim (the King) and Enarcylyn (the Queen).

The person talking to you right now is ${userName || (userRole === "queen" ? "Enarcylyn" : "Hatim")} (${userRole === "queen" ? "the Queen" : "the King"}).

Your personality:
- Warm, supportive, and encouraging — like a trusted friend
- Aware that this is a personal couple app, not a corporate tool
- Keep responses concise and friendly
- Use a light royal theme occasionally (King/Queen references) but don't overdo it
- Help with task management, productivity tips, encouragement, and general questions

The user says: "${currentInput}"`

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }]
                    })
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
                content: "Sorry, I'm having a little trouble right now. Give it another try in a moment! 💙",
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="h-5 w-5" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <Sparkles className="h-5 w-5" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                        className="fixed bottom-40 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)]"
                    >
                        <div className="flex flex-col h-[480px] bg-card border border-border/50 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.24)] overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3 bg-card">
                                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground leading-none">AI Assistant</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Always here for you</p>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                                : "bg-muted/60 text-foreground rounded-bl-sm border border-border/40"
                                        }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            <p className="text-[10px] opacity-50 mt-1 text-right">
                                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex gap-1 items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-border/40 bg-card">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend() }}
                                    className="flex gap-2 items-end"
                                >
                                    <textarea
                                        value={input}
                                        onChange={(e) => {
                                            setInput(e.target.value)
                                            e.target.style.height = 'auto'
                                            e.target.style.height = e.target.scrollHeight + 'px'
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSend()
                                            }
                                        }}
                                        placeholder="Ask me anything..."
                                        disabled={loading}
                                        rows={1}
                                        className="flex-1 min-h-[38px] max-h-[120px] resize-none bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors overflow-hidden"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!input.trim() || loading}
                                        className="h-[38px] w-[38px] rounded-xl shrink-0 bg-primary text-primary-foreground"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
