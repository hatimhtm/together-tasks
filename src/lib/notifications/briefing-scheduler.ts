import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { GoogleGenAI } from '@google/genai'

const BRIEFING_NOTIF_ID = 1001
const WEEKLY_REVIEW_NOTIF_ID = 1002
const BRIEFING_SCHEDULED_KEY = 'briefing_scheduled_date'

interface BriefingContext {
    userName: string
    partnerName: string
    todayTaskCount: number
    partnerCompletedYesterday: number
    briefingTime: string // "HH:MM"
}

async function generateBriefingMessage(ctx: BriefingContext): Promise<string> {
    const fallback = `Good morning ${ctx.userName} ☀️ You have ${ctx.todayTaskCount} task${ctx.todayTaskCount !== 1 ? 's' : ''} today. ${ctx.partnerCompletedYesterday > 0 ? `${ctx.partnerName} knocked out ${ctx.partnerCompletedYesterday} yesterday. ` : ''}Let's make it a great day!`

    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
        if (!apiKey) {
            return fallback
        }

        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a warm, loving morning briefing notification (max 100 chars) for ${ctx.userName}. They have ${ctx.todayTaskCount} task${ctx.todayTaskCount !== 1 ? 's' : ''} today. Their partner ${ctx.partnerName} completed ${ctx.partnerCompletedYesterday} task${ctx.partnerCompletedYesterday !== 1 ? 's' : ''} yesterday. Keep it sweet, encouraging, couple-focused. Return ONLY the message text.`,
            config: { temperature: 0.8 }
        })
        const text = response.text?.trim()
        if (text && text.length > 0 && text.length <= 150) return text
    } catch {
        // fall through
    }

    return fallback
}

function parseTimeString(timeStr: string): { hours: number, minutes: number } {
    const [h, m] = timeStr.split(':').map(Number)
    return { hours: h || 8, minutes: m || 0 }
}

function getNextOccurrence(timeStr: string): Date {
    const now = new Date()
    const { hours, minutes } = parseTimeString(timeStr)
    const next = new Date()
    next.setHours(hours, minutes, 0, 0)
    // If the time has already passed today, schedule for tomorrow
    if (next <= now) next.setDate(next.getDate() + 1)
    return next
}

function getNextSunday(timeStr: string): Date {
    const now = new Date()
    const { hours, minutes } = parseTimeString(timeStr)
    const next = new Date()
    const dayOfWeek = next.getDay() // 0=Sun
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
    next.setDate(next.getDate() + daysUntilSunday)
    next.setHours(hours, minutes, 0, 0)
    return next
}

export async function scheduleMorningBriefing(ctx: BriefingContext): Promise<void> {
    if (!Capacitor.isNativePlatform()) return

    try {
        const permStatus = await LocalNotifications.requestPermissions()
        if (permStatus.display !== 'granted') return

        // Avoid scheduling twice on the same day
        const today = new Date().toDateString()
        const lastScheduled = localStorage.getItem(BRIEFING_SCHEDULED_KEY)
        if (lastScheduled === today) return

        // Cancel existing briefing before rescheduling
        await LocalNotifications.cancel({ notifications: [{ id: BRIEFING_NOTIF_ID }] })

        const body = await generateBriefingMessage(ctx)
        const fireAt = getNextOccurrence(ctx.briefingTime)

        await LocalNotifications.schedule({
            notifications: [{
                title: `Good morning ${ctx.userName} ☀️`,
                body,
                id: BRIEFING_NOTIF_ID,
                schedule: { at: fireAt },
                smallIcon: 'ic_stat_notification',
                iconColor: '#007AFF',
                extra: { type: 'morning_briefing' }
            }]
        })

        localStorage.setItem(BRIEFING_SCHEDULED_KEY, today)
    } catch (e) {
        console.warn('Morning briefing scheduling failed:', e)
    }
}

export async function scheduleWeeklyReview(userName: string, briefingTime: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return

    try {
        const permStatus = await LocalNotifications.requestPermissions()
        if (permStatus.display !== 'granted') return

        await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REVIEW_NOTIF_ID }] })

        const fireAt = getNextSunday(briefingTime)

        await LocalNotifications.schedule({
            notifications: [{
                title: 'Your Weekly Review is Ready 📊',
                body: `See how you and your partner did this week, ${userName}!`,
                id: WEEKLY_REVIEW_NOTIF_ID,
                schedule: { at: fireAt },
                smallIcon: 'ic_stat_notification',
                iconColor: '#5856D6',
                extra: { type: 'weekly_review' }
            }]
        })
    } catch (e) {
        console.warn('Weekly review scheduling failed:', e)
    }
}
