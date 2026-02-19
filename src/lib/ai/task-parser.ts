const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

async function callGemini(
    messages: Message[],
    options?: {
        temperature?: number
        maxTokens?: number
    }
) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set")

    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const userMessages = messages.filter(m => m.role !== 'system')

    // Construct prompt for Gemini
    const contents = userMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemMessage }]
            },
            contents,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 1000,
            }
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Gemini API Error:", errorData)
        throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

// Parse natural language task input
export async function parseTaskInput(input: string) {
    const systemPrompt = `You are a task parsing AI. Extract structured data from natural language provided within <user_input> tags.
Return ONLY valid JSON with these fields:
{
  "title": "clean task title",
  "description": "brief details or likely description or null",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM or null", 
  "priority": "low/medium/high/urgent",
  "category": "work/school/home/personal or null",
  "estimatedMinutes": number or null
}`

    // Sanitize input to prevent breaking out of tags
    const sanitizedInput = input.replace(/<\/user_input>/g, '')

    const userPrompt = `Current date: ${new Date().toISOString().split('T')[0]}
<user_input>
${sanitizedInput}
</user_input>

Extract task details as JSON:`

    try {
        const response = await callGemini([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ])

        // Clean response and parse JSON
        const cleaned = response.replace(/```json|```/g, '').trim()
        return JSON.parse(cleaned)
    } catch (error) {
        console.error("AI Task Parsing Failed, falling back to manual parser:", error)

        // FALLBACK: Manual Regex Parser
        const now = new Date()
        let dueDate = null
        let estimatedMinutes = null

        // Try to find time (e.g. 5pm, 17:00)
        const timeMatch = input.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i)
        if (timeMatch) {
            // Very basic date handling - assumes today/tomorrow if "tomorrow" is in text
            const isTomorrow = input.toLowerCase().includes('tomorrow')
            const date = new Date()
            if (isTomorrow) date.setDate(date.getDate() + 1)

            // We'd parse the time here properly in a real app, 
            // for now just ISO string it to satisfy the return type or leave null if complex
            dueDate = date.toISOString()
        }

        return {
            title: input,
            dueDate: dueDate,
            priority: 'medium',
            category: 'personal',
            estimatedMinutes: 15
        }
    }
}

// AI Chat for settings/assistance
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

    const response = await callGemini([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ])

    return response
}
