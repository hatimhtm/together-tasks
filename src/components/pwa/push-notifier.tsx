"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { base64ToUint8Array } from "@/lib/encoding"

// Callable web-push subscribe logic, shared by the standalone card and the
// explicit opt-in control rendered in Settings. Never auto-prompts — the caller
// must invoke subscribe() in response to a user tap.
export function useWebPushSubscribe() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const checkSubscription = useCallback(async () => {
        try {
            const registrationPromise = navigator.serviceWorker.getRegistration()
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000))
            const registration = await Promise.race([registrationPromise, timeoutPromise]) as ServiceWorkerRegistration | null

            if (registration) {
                const subscription = await registration.pushManager.getSubscription()
                setIsSubscribed(!!subscription)
            } else if (Notification.permission === 'granted') {
                setIsSubscribed(false)
            }
        } catch (error) {
            console.error("Error checking subscription", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        } else {
            setIsLoading(false)
        }
    }, [checkSubscription])

    const subscribe = useCallback(async () => {
        setIsLoading(true)
        try {
            // Explicit OS permission request — only ever runs from a user tap.
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                throw new Error("You must grant notification permissions in your browser.")
            }

            let registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js')
            }
            const activeRegistration = await navigator.serviceWorker.ready

            const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!pubKey) {
                toast.error("VAPID key missing. Push notifications can't be enabled in this environment.")
                return
            }

            const subscription = await activeRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(pubKey),
            })

            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user && subscription) {
                const subJSON = subscription.toJSON()
                await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subJSON.keys?.p256dh || "",
                    auth: subJSON.keys?.auth || "",
                }, { onConflict: 'endpoint' })
            }

            setIsSubscribed(true)
            toast.success("Notifications enabled on this device.")
        } catch (error: any) {
            console.error("Failed to subscribe user", error)
            toast.error(error?.message || "Please allow notifications in your browser settings.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    return { isSubscribed, isSupported, isLoading, subscribe }
}

export function PushNotifier() {
    const { isSubscribed, isSupported, isLoading, subscribe } = useWebPushSubscribe()

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
