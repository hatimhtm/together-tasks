"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function PushNotifier() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        try {
            // Add a timeout in case getRegistration hangs on certain browsers
            const registrationPromise = navigator.serviceWorker.getRegistration()
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000))

            const registration = await Promise.race([registrationPromise, timeoutPromise]) as ServiceWorkerRegistration | null

            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                setIsSubscribed(!!subscription)
            } else {
                // If they already granted permission but SW isn't active, we might need them to click "Enable" to register the SW
                if (Notification.permission === 'granted') {
                    setIsSubscribed(false)
                }
            }
        } catch (error) {
            console.error("Error checking subscription", error)
        } finally {
            setIsLoading(false)
        }
    }

    const base64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    const subscribe = async () => {
        setIsLoading(true)
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                throw new Error("You must grant notification permissions in your browser.")
            }

            let registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                // Try registering it
                registration = await navigator.serviceWorker.register('/sw.js')
            }
            const activeRegistration = await navigator.serviceWorker.ready

            const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!pubKey) {
                toast.error("VAPID Key missing. Push Notifications cannot be enabled in this environment.")
                setIsLoading(false)
                return
            }

            const subscription = await activeRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(pubKey)
            })

            // Send subscription to our backend
            await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            setIsSubscribed(true)
        } catch (error: any) {
            console.error("Failed to subscribe user", error)
            toast.error(error.message || "Please allow notifications in your browser settings.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) return null

    return (
        <GlassCard className="p-4 flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                    {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                </div>
                <div>
                    <h4 className="font-medium text-foreground">Push Notifications</h4>
                    <p className="text-xs text-muted-foreground">
                        {isSubscribed ? "You're receiving task updates & nudges" : "Get notified when your partner adds a task"}
                    </p>
                </div>
            </div>

            <Button
                variant={isSubscribed ? "outline" : "default"}
                size="sm"
                onClick={isSubscribed ? undefined : subscribe}
                disabled={isLoading || isSubscribed}
                className="rounded-full"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSubscribed ? "Active" : "Enable")}
            </Button>
        </GlassCard>
    )
}
