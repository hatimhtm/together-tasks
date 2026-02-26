"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Bell, Phone, MessageCircle, CheckCircle, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface PartnerNotification {
    id: string
    task_id: string
    message: string
    notification_type: string
    ai_reasoning: string
    sent_at: string
    read_at: string | null
    task: {
        title: string
        due_date: string | null
    }
}

export function PartnerNotificationCenter() {
    const [notifications, setNotifications] = useState<PartnerNotification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/partner/notifications")
            if (!response.ok) return // Silently fail if endpoint doesn"t exist yet

            const { notifications: data } = await response.json()
            setNotifications(data || [])
        } catch (error) {
            console.error("Fetch notifications error:", error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/partner/notifications/${notificationId}/read`, {
                method: "POST"
            })

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                )
            )
        } catch (error) {
            console.error("Mark read error:", error)
        }
    }

    const handleAction = async (
        notificationId: string,
        action: "called" | "messaged" | "dismissed"
    ) => {
        try {
            await fetch(`/api/partner/notifications/${notificationId}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })

            markAsRead(notificationId)

            if (action === "called") {
                toast.success("Great! She\"ll appreciate the call 📞")
            } else if (action === "messaged") {
                toast.success("Message sent! 💬")
            }
        } catch (error) {
            toast.error("Failed to record action")
        }
    }

    const unreadCount = notifications.filter(n => !n.read_at).length

    if (loading) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Partner Reminders
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                            {unreadCount}
                        </span>
                    )}
                </h3>
            </div>

            {notifications.length === 0 ? (
                <GlassCard className="p-8 text-center opacity-50">
                    <Bell className="h-12 w-12 mx-auto text-white/30 mb-2" />
                    <p className="text-white/60">No partner reminders</p>
                </GlassCard>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <GlassCard
                            key={notification.id}
                            className={`p-4 ${!notification.read_at ? "border-l-4 border-primary" : "opacity-70"}`}
                        >
                            <div className="space-y-3">
                                {/* Task Title */}
                                <div>
                                    <h4 className="font-medium text-white">
                                        {notification.task?.title || "Unknown Task"}
                                    </h4>
                                    {notification.task?.due_date && (
                                        <p className="text-xs text-white/50">
                                            Due: {format(new Date(notification.task.due_date), "PPp")}
                                        </p>
                                    )}
                                </div>

                                {/* AI Message */}
                                <p className="text-sm text-white/80">
                                    {notification.message}
                                </p>

                                {/* AI Reasoning (collapsible) */}
                                <details className="text-xs text-white/50">
                                    <summary className="cursor-pointer hover:text-white/70">
                                        Why am I seeing this?
                                    </summary>
                                    <p className="mt-1">{notification.ai_reasoning}</p>
                                </details>

                                {/* Action Buttons (only if unread) */}
                                {!notification.read_at && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAction(notification.id, "called")}
                                            className="flex-1"
                                        >
                                            <Phone className="h-3 w-3 mr-1" />
                                            Called
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAction(notification.id, "messaged")}
                                            className="flex-1"
                                        >
                                            <MessageCircle className="h-3 w-3 mr-1" />
                                            Texted
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleAction(notification.id, "dismissed")}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {notification.read_at && (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Handled
                                    </p>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}
