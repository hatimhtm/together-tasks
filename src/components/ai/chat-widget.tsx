"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

// Message type definition
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
            content: `Hello, ${userRole === "queen" ? "my Queen" : userRole === "king" ? "my King" : "there"}! How may I assist you today? 👑`,
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date()
        }

        // Add user message immediately (optimistic UI)
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
            // Call AI API
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            })

            if (!response.ok) throw new Error("AI request failed")

            const { response: aiResponse } = await response.json()

            // Add AI response
            const assistantMessage: Message = {
                role: "assistant",
                content: aiResponse,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])

            // If the AI actually took action (create task, etc.), refresh the page data
            if (aiResponse.includes("I've created the task") || aiResponse.includes("to memory")) {
                setTimeout(() => {
                    router.refresh()
                }, 1000)
            }
        } catch (error) {
            console.error("AI chat error:", error)

            // Fallback response if AI fails
            const errorMessage: Message = {
                role: "assistant",
                content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="h-6 w-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <Sparkles className="h-6 w-6 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-36 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
                    >
                        <GlassCard className="flex flex-col h-[500px]">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">Your AI Butler</h3>
                                        <p className="text-xs text-white/60">Always here to help</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user"
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className="text-xs opacity-50 mt-1">
                                                {msg.timestamp.toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/10 rounded-2xl px-4 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-white/10">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSend()
                                    }}
                                    className="flex gap-2"
                                >
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything..."
                                        disabled={loading}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!input.trim() || loading}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence >
        </>
    )
}
