import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCQfpCBocq37dw2PGTVtx-dVZUaq9vQeb0"
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', user.id)
            .single()

        // Fetch incomplete tasks for today or overdue
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('assignee_id', user.id)
            .eq('is_completed', false)
            .order('due_date', { ascending: true })

        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ notifications: [] })
        }

        const taskSummaries = tasks.map(t =>
            `- ${t.title} (Priority: ${t.priority}, Emergency: ${t.emergency_level || 'medium'}, Duration: ${t.duration_estimate || 15}m)`
        ).join('\n')

        const systemPrompt = `You are a supportive, caring AI assistant for a couple's productivity app.
The user's name is ${profile?.username || 'Love'} (${profile?.role || 'partner'}).
They have the following incomplete tasks:
${taskSummaries}

Generate 2-3 short, highly personalized, beautiful notifications string messages to gently nudge them to complete their tasks.
DO NOT sound like a robot. Sound like a loving partner or a very caring assistant. Keep them under 150 characters each.
Return ONLY a valid JSON array of strings. Example: ["Hey beautiful, you have a few quick tasks left today! You got this 💖"]`

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate my notifications.",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });

        const notifications = JSON.parse(response.text || "[]")

        return NextResponse.json({ notifications })
    } catch (error: any) {
        console.error('Notification Generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate notifications' },
            { status: 500 }
        )
    }
}
