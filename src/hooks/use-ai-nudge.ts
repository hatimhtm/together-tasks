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
                // 1. Handle Recurring Tasks locally (if implemented)
                // This would be replaced by local Supabase logic or Edge Functions

                // 2. Local AI Notifications (Static Array to avoid server ping)
                const nudges = [
                    "Just a reminder that you're amazing! 💕",
                    "Take a deep breath, you're doing great! 😊",
                    "You and your partner make a great team! 🤝",
                    "Don't forget to stay hydrated! 💧",
                    "Thinking of you! Keep up the great work today. ✨",
                    "A small step forward is still a step forward! 🚶‍♂️",
                    "You've got this! 🌟"
                ];

                if (isMounted) {
                    // Pick a random notification
                    const randomNudge = nudges[Math.floor(Math.random() * nudges.length)]
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
                                // Desktop Web / Electron Native — never prompt here.
                                // Only fire if the user already opted in via Settings.
                                if ('Notification' in window && Notification.permission === 'granted') {
                                    new Notification("Together Tasks 💌", { body: randomNudge });
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
