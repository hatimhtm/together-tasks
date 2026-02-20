import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "***REMOVED***"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function parseTaskInput(input: string) {
    const systemInstruction = `You are an expert productivity assistant for a couple's task manager app. 
Analyze the user's natural language input and extract structured task details. 
You must break down the task into smaller, actionable subtasks if it's complex, to reduce anxiety and make it doable.
You must provide a reasonable duration_estimate (in minutes) for the whole task.
You must classify the task's emergency_level and importance_level ('low', 'medium', 'high', 'critical').

Return ONLY valid JSON matching this schema:
{
  "title": "Clean, actionable task title",
  "description": "Brief details",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM or null", 
  "priority": "low" | "medium" | "high" | "urgent" | null,
  "category": "work" | "school" | "home" | "personal" | null,
  "emergency_level": "low" | "medium" | "high" | "critical",
  "importance_level": "low" | "medium" | "high" | "critical",
  "duration_estimate": number (in minutes, e.g. 15, 30, 60),
  "subtasks": ["subtask 1", "subtask 2"] (empty array if task is very simple)
}

Today's date is: ${new Date().toISOString().split('T')[0]}`

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: input,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.1,
            }
        });

        const text = response.text || "{}"
        return JSON.parse(text)
    } catch (error) {
        console.error("AI Task Parsing Failed:", error)

        // Fallback for obvious errors
        return {
            title: input,
            dueDate: null,
            priority: 'medium',
            category: 'personal',
            emergency_level: 'medium',
            importance_level: 'medium',
            duration_estimate: 15,
            subtasks: []
        }
    }
}

export async function chatWithAI(
    userMessage: string,
    context?: {
        userName?: string
        role?: 'king' | 'queen'
        recentTasks?: any[]
        locationContext?: 'work' | 'home' | 'unknown'
    }
) {
    const systemPrompt = `You are a personal AI butler for a couple's productivity app. 
You are helpful, warm, and encouraging.

${context?.role === 'queen' ? 'Address her as "my Queen".' : ''}
${context?.role === 'king' ? 'Address him as "my King".' : ''}

${context?.locationContext === 'work' ? 'The user is currently at work. Keep suggestions professional and work-focused.' : ''}
${context?.locationContext === 'home' ? 'The user is at home. You can suggest personal tasks or relaxation.' : ''}

Help with: task management, settings, motivation, schedule planning.
Be concise but friendly.`

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
        }
    });

    return response.text || "I'm sorry, I couldn't process that request right now."
}
