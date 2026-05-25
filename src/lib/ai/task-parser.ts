const systemInstruction = `You are an expert productivity assistant for a couple's task manager app.
Analyze the user's natural language input and extract structured task details.
Clean up the user's wording into a clear, well-phrased title (fix grammar/typos, make it concise and actionable).
Break the task into 2–4 short, actionable subtasks WHENEVER it involves more than one step (errands, projects, anything multi-part) — these help the couple organize. Only return an empty subtasks array for genuinely single-action tasks (e.g. "call mom"). Keep each subtask a few words.
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

Time-of-day mapping (use these EXACT times when user uses vague time expressions):
- "morning" / "this morning" → 09:00
- "afternoon" / "this afternoon" → 14:00
- "evening" / "this evening" → 19:00
- "tonight" / "tonight" → 21:00
- "night" / "late" → 22:00
- "noon" / "lunchtime" / "lunch" → 12:00
- "end of day" / "EOD" / "end of the day" → 17:00
- "early" / "first thing" → 07:00
CRITICAL: NEVER default to 08:00 unless the user explicitly said "8am" or "8:00". If no time is specified at all, set dueTime to null.`

import { GEMINI_MODEL, geminiGenerateUrl, resolveGeminiKey } from "@/lib/ai/config"

export async function parseTaskInput(input: string) {
    const apiKey = resolveGeminiKey()
    if (!apiKey) {
        throw new Error('Gemini API key is not configured');
    }
    const now = new Date()
    const todayDate = now.toLocaleDateString('en-CA')
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })

    const fullInstruction = `${systemInstruction}

Today's date is: ${todayDate} (YYYY-MM-DD format)
Current time is: ${currentTime}
Current day of week: ${dayOfWeek}`

    try {
        const res = await fetch(
            `${geminiGenerateUrl(GEMINI_MODEL)}?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: fullInstruction }] },
                    contents: [{ parts: [{ text: input }] }],
                    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
                })
            }
        )

        if (!res.ok) throw new Error(`Gemini API returned ${res.status}`)
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('Empty response from Gemini')
        return JSON.parse(text)
    } catch (error) {
        console.error("AI Task Parsing Failed:", error)
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
