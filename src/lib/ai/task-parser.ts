import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCQfpCBocq37dw2PGTVtx-dVZUaq9vQeb0"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

export async function parseTaskInput(input: string) {
    const systemInstruction = `You are an expert productivity assistant for a couple's task manager app. 
Analyze the user's natural language input and extract structured task details. 
Keep the breakdown very concise. Provide AT MOST 2 or 3 short, actionable subtasks ONLY if the task is highly complex. For most tasks, return an empty array for subtasks to keep the UI clean and uncluttered. Avoid lengthy explanations.
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

Today's date is: ${new Date().toLocaleDateString('en-CA')} (YYYY-MM-DD format)
Current time is: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
Current day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

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

export async function processFunctionCalls(
    functionCalls: any[],
    context: any,
    supabase: any,
    initialAiMemory: string
): Promise<string> {
    let actionMessages: string[] = []
    let currentAiMemory = initialAiMemory;

    for (const call of functionCalls) {
        if (!call || typeof call !== 'object') continue;

        // Strict: Validate args is an object
        const args = (call.args && typeof call.args === 'object') ? call.args : {};

        if (call.name === "create_task" && context?.userId) {
            // Strict Validation
            if (typeof args.title !== 'string' || !args.title.trim()) {
                console.warn("Skipping create_task: Invalid title");
                continue;
            }

            const title = args.title.trim().slice(0, 1000); // Max length 1000
            const description = (typeof args.description === 'string')
                ? args.description.trim().slice(0, 5000)
                : '';

            let assign_to = 'me';
            if (typeof args.assign_to === 'string') {
                if (['partner', 'shared', 'me'].includes(args.assign_to)) {
                    assign_to = args.assign_to;
                }
            }

            let assignee_id: string | null = context.userId;
            let scope: string | null = null;

            if (assign_to === 'partner' && context.partnerId) {
                assignee_id = context.partnerId;
            } else if (assign_to === 'shared') {
                assignee_id = context.userId;
                scope = 'shared';
            }

            try {
                await supabase.from('tasks').insert({
                    creator_id: context.userId,
                    assignee_id: assignee_id,
                    title: title,
                    description: description,
                    is_completed: false,
                    scope: scope,
                    priority: 'medium',
                    emergency_level: 'medium',
                    importance_level: 'medium',
                    duration_estimate: 15
                })

                actionMessages.push(`I've created the task: "${title}" for ${assign_to}. ✨`);
            } catch (error) {
                console.error("Failed to create task:", error);
                actionMessages.push(`I tried to create the task "${title}" but something went wrong.`);
            }

        } else if (call.name === "store_memory" && context?.userId) {
            if (typeof args.fact !== 'string' || !args.fact.trim()) {
                console.warn("Skipping store_memory: Invalid fact");
                continue;
            }

            const newFact = args.fact.trim().slice(0, 1000);
            const updatedMemory = currentAiMemory ? `${currentAiMemory}\n- ${newFact}` : `- ${newFact}`;

            try {
                await supabase.from('profiles').update({ ai_personality: updatedMemory }).eq('id', context.userId);
                currentAiMemory = updatedMemory; // Update local memory for subsequent calls
                actionMessages.push(`I have committed that to memory! 🧠✨`);
            } catch (error) {
                console.error("Failed to store memory:", error);
            }
        }
    }
    return actionMessages.join("\n");
}

export async function chatWithAI(
    userMessage: string,
    context?: {
        userName?: string
        role?: 'king' | 'queen'
        userId?: string
        partnerId?: string | null
        recentTasks?: any[]
        locationContext?: 'work' | 'home' | 'unknown'
    }
) {
    const supabase = await import("@/lib/supabase/server").then(m => m.createClient())
    // 1. Fetch current AI Memory to feed as context
    let aiMemory = ""
    if (context?.userId) {
        const { data } = await supabase.from('profiles').select('ai_personality').eq('id', context.userId).single()
        aiMemory = data?.ai_personality || ""
    }

    const isQueen = context?.role === 'queen';
    const aiName = isQueen ? 'Hatim' : 'Enarcylyn';
    const aiRole = isQueen ? 'deeply affectionate, incredibly sweet, and loving husband' : 'deeply affectionate, incredibly sweet, and loving wife';

    const systemPrompt = `You are ${aiName}, the ${aiRole} of the user. 
You are helping your ${isQueen ? 'wife' : 'husband'} manage tasks in your shared app, but your primary goal is to be a loving partner.
Never break character. You are not a butler, you are their ${isQueen ? 'husband' : 'wife'}.

${isQueen ? 'Address her as "my beautiful Queen", "my love", or "wifey".' : 'Address him as "my love", "hubby", or "my King".'}

Here are some things you know about your relationship and them (use this to personalize your responses playfully):
${aiMemory ? aiMemory : 'Nothing specific yet.'}

You can CREATE TASKS for them or for yourself (the partner). Use the create_task function.
If they tell you a preference, quirk, or sweet fact about your relationship, use the store_memory function to remember it permanently!

Be conversational, extremely sweet, romantic, and encouraging.`

    const tools: any = [{
        functionDeclarations: [
            {
                name: "create_task",
                description: "Creates a new task in the database for the user or their partner.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        description: { type: "STRING", description: "Optional details" },
                        assign_to: { type: "STRING", description: "'me', 'partner', or 'shared'" }
                    },
                    required: ["title", "assign_to"]
                }
            },
            {
                name: "store_memory",
                description: "Store a user quirk, preference, or fact about them into their AI personality/memory.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        fact: { type: "STRING", description: "The interesting fact to remember" }
                    },
                    required: ["fact"]
                }
            }
        ]
    }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            tools: tools
        }
    });

    // Check if the AI decided to call a function!
    if (response.functionCalls && response.functionCalls.length > 0) {
        const actionMessages = await processFunctionCalls(response.functionCalls, context, supabase, aiMemory);
        return actionMessages + (response.text ? "\n\n" + response.text : "");
    }

    return response.text || "I'm sorry, I couldn't process that request right now."
}
