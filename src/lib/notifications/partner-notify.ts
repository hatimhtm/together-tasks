import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { GoogleGenAI } from '@google/genai'

// NEXT_PUBLIC_ prefix required for client-side access in Capacitor static builds
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "***REMOVED***"

// AI-generated message for when a partner completes a task you created for them
async function generateCompletionMessage(taskTitle: string, partnerName: string): Promise<string> {
    const fallbacks = [
        `Don't worry love, I got you! ✓ "${taskTitle}"`,
        `Done! I took care of "${taskTitle}" for you 💕`,
        `"${taskTitle}" is all handled, relax! 💪`,
        `I've got your back — just finished "${taskTitle}" ✓`,
        `All done with "${taskTitle}"! Love you 💕`,
    ]

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short, sweet, loving push notification message (max 70 characters) from ${partnerName} saying they just completed the task: "${taskTitle}". Sound warm and caring, like a loving partner. Be casual. Include a checkmark or heart emoji. Return ONLY the message text, nothing else.`,
            config: { temperature: 0.8 }
        })
        const text = response.text?.trim()
        if (text && text.length > 0 && text.length <= 120) return text
    } catch {
        // Fall through to random fallback
    }

    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

export async function sendPartnerCompletionNotification(taskTitle: string, partnerName: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
        // On web/desktop, use browser Notification API
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const body = await generateCompletionMessage(taskTitle, partnerName)
            new Notification(`${partnerName} just checked something off 💕`, { body })
        }
        return
    }

    try {
        const permStatus = await LocalNotifications.requestPermissions()
        if (permStatus.display !== 'granted') return

        const body = await generateCompletionMessage(taskTitle, partnerName)

        await LocalNotifications.schedule({
            notifications: [{
                title: `${partnerName} 💕`,
                body,
                id: Math.floor(Date.now() / 1000) % 2147483647,
                schedule: { at: new Date(Date.now() + 500) }, // fire almost immediately
                smallIcon: 'ic_stat_notification',
                iconColor: '#FF2D55',
            }]
        })
    } catch (e) {
        console.warn('Partner notification failed:', e)
    }
}
