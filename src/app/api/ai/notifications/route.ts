import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "***REMOVED***"
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

        const systemPrompt = `You are Enarcylyn, the lovingly sweet, incredibly caring wife of the user.
The user's name is ${profile?.username || 'Hatim'}. He is your husband and your King.
They have the following incomplete tasks:
${taskSummaries}

Sometimes gently remind him about his tasks in a very loving way.
Sometimes just say something incredibly sweet and romantic to make his day better, without even mentioning tasks at all!
Generate 2-3 short, highly personalized, beautiful notifications to pop up on his screen.
DO NOT sound like a robot or a butler. Sound exactly like a loving, affectionate wife. Keep them under 150 characters each.
Return ONLY a valid JSON array of strings. Make them feel like a text from a wife.
Example: ["Hey my love, I'm so proud of you today! 💕", "Don't forget to call mom today hubby! I love you so much 👑"]`

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
