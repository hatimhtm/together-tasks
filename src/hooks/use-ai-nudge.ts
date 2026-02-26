import { useState, useEffect } from "react"
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export function useAiNudge() {
    const [nudge, setNudge] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const initializeDashboard = async () => {
            try {
                // 1. Trigger recurring tasks spawn (fire & forget)
                fetch('/api/tasks/recurring', { method: 'POST' }).catch(console.error)

                // 2. Fetch AI Notifications
                const res = await fetch('/api/ai/notifications')
                if (!res.ok) throw new Error("Failed to fetch notification")

                const data = await res.json()
                if (isMounted && data.notifications && data.notifications.length > 0) {
                    // Pick a random notification from the array generated
                    const randomNudge = data.notifications[Math.floor(Math.random() * data.notifications.length)]
                    setNudge(randomNudge)

                    // Fire Native Notification
                    try {
                        const lastNotified = localStorage.getItem('last_ai_nudge_time');
                        const now = new Date().getTime();
                        const fourHours = 4 * 60 * 60 * 1000;

                        if (!lastNotified || now - parseInt(lastNotified) > fourHours) {
                            if (Capacitor.isNativePlatform()) {
                                const permStatus = await LocalNotifications.requestPermissions();
                                if (permStatus.display === 'granted') {
                                    await LocalNotifications.schedule({
                                        notifications: [
                                            {
                                                title: "Together Tasks 💌",
                                                body: randomNudge,
                                                id: Math.floor(now / 1000),
                                                schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 seconds
                                            }
                                        ]
                                    });
                                }
                            } else {
                                // Desktop Web / Electron Native
                                if ('Notification' in window) {
                                    if (Notification.permission === 'granted') {
                                        new Notification("Together Tasks 💌", { body: randomNudge });
                                    } else if (Notification.permission !== 'denied') {
                                        const perm = await Notification.requestPermission();
                                        if (perm === 'granted') {
                                            new Notification("Together Tasks 💌", { body: randomNudge });
                                        }
                                    }
                                }
                            }
                            localStorage.setItem('last_ai_nudge_time', now.toString());
                        }
                    } catch (e) {
                        console.error("Native notification error:", e)
                    }
                }
            } catch (error) {
                console.error("AI Nudge Error:", error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        initializeDashboard()

        return () => { isMounted = false }
    }, [])

    return { nudge, loading }
}
