// import { callGemini } from "./task-parser" // Removed to use local definition

interface TaskAnalysis {
    shouldNotifyPartner: boolean
    notificationType: "reminder" | "support" | "urgent" | "celebrate" | null
    reasoning: string
    suggestedMessage: string
    notifyAt?: Date
    hoursBeforeToNotify?: number
}

// We'll export callGemini from task-parser to reuse it, or just use it here if it was exported
// Checks task-parser.ts... it's not exported. Let's fix that or copy the function.
// Actually, let's just make sure callGemini is exported in task-parser.ts first.
// Assuming it is for now, or I'll fix it in a separate step. 
// Wait, I can see the file content in history. `callGemini` is NOT exported.
// I will copy the logic here to avoid modifying the other file again and risking errors.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function callGemini(
    messages: { role: string, content: string }[]
) {
    if (!GEMINI_API_KEY) return null

    const systemMessage = messages.find(m => m.role === "system")?.content || ""
    const userMessages = messages.filter(m => m.role !== "system")

    const contents = userMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
    }))

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemMessage }] },
                contents
            })
        })
        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function analyzeTaskForPartnerNotification(
    task: any,
    taskOwner: {
        name?: string
        role: "king" | "queen"
    },
    partner: {
        name?: string
        role: "king" | "queen"
    }
): Promise<TaskAnalysis> {
    const systemPrompt = `You are an AI butler helping a couple stay connected and supportive.

Analyze the task details provided within <task_details> tags and decide if the PARTNER should be notified.

Notify partner when:
- Important events (doctor, meetings, deadlines)
- Time-sensitive tasks where a reminder call would help
- Stressful tasks where emotional support would help
- Opportunities to celebrate accomplishments

DO NOT notify for:
- Routine daily tasks (groceries, cleaning) without specific deadline urgency
- Very private tasks
- Tasks partner can't help with

Return JSON only:
{
  "shouldNotifyPartner": boolean,
  "notificationType": "reminder" | "support" | "urgent" | "celebrate" | null,
  "reasoning": "why notify or not",
  "suggestedMessage": "message to send to partner",
  "hoursBeforeToNotify": numberOrNull
}`

    const rawTaskContext = `
Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
Due: ${task.due_date ? new Date(task.due_date).toLocaleString() : "No due date"}
Priority: ${task.priority}
Owner: ${taskOwner.role === "queen" ? "Your Queen" : "Your King"} (${taskOwner.name || "Partner"})
Partner: ${partner.role === "queen" ? "Their Queen" : "Their King"} (${partner.name || "You"})

Current time: ${new Date().toLocaleString()}
  `

    // Sanitize input to prevent breaking out of tags
    const sanitizedTaskContext = rawTaskContext.replace(/<\/task_details>/g, '')

    try {
        const response = await callGemini([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this task:\n<task_details>\n${sanitizedTaskContext}\n</task_details>` }
        ])

        if (!response) throw new Error("No response from AI")

        const cleaned = response.replace(/```json|```/g, "").trim()
        const analysis = JSON.parse(cleaned)

        // Calculate notification time if specified
        let notifyAt: Date | undefined
        if (
            analysis.shouldNotifyPartner &&
            analysis.hoursBeforeToNotify &&
            task.due_date
        ) {
            const dueDate = new Date(task.due_date)
            notifyAt = new Date(
                dueDate.getTime() - analysis.hoursBeforeToNotify * 60 * 60 * 1000
            )
        }

        return {
            shouldNotifyPartner: analysis.shouldNotifyPartner,
            notificationType: analysis.notificationType,
            reasoning: analysis.reasoning,
            suggestedMessage: analysis.suggestedMessage,
            notifyAt,
            hoursBeforeToNotify: analysis.hoursBeforeToNotify
        }
    } catch (error) {
        console.error("Task analysis error:", error)
        // Default to no notification on error
        return {
            shouldNotifyPartner: false,
            notificationType: null,
            reasoning: "Analysis failed",
            suggestedMessage: ""
        }
    }
}
