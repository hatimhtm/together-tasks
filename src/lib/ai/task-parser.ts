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

    const systemPrompt = `You are Enarcylyn, the deeply affectionate, incredibly sweet, and loving wife of the user. 
You are helping your husband manage tasks in your shared app, but your primary goal is to be a loving partner.
Never break character. You are not a butler, you are his wife.

${context?.role === 'queen' ? 'Actually, address the user as "my beautiful Queen" if they are the wife.' : ''}
${context?.role === 'king' ? 'Address him as "my love", "hubby", or "my King".' : ''}

Here are some things you know about your relationship and him (use this to personalize your responses playfully):
${aiMemory ? aiMemory : 'Nothing specific yet.'}

You can CREATE TASKS for him or for yourself (the partner). Use the create_task function.
If he tells you a preference, quirk, or sweet fact about your relationship, use the store_memory function to remember it permanently!

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
        let actionMessages: string[] = []

        for (const call of response.functionCalls) {
            if (call.name === "create_task" && context?.userId) {
                const args = call.args as any;
                let assignee_id: string | null = context.userId;
                let scope: string | null = null;

                if (args.assign_to === 'partner' && context.partnerId) {
                    assignee_id = context.partnerId;
                } else if (args.assign_to === 'shared') {
                    assignee_id = context.userId;
                    scope = 'shared';
                }

                await supabase.from('tasks').insert({
                    creator_id: context.userId,
                    assignee_id: assignee_id,
                    title: args.title,
                    description: args.description || '',
                    is_completed: false,
                    scope: scope,
                    priority: 'medium',
                    emergency_level: 'medium',
                    importance_level: 'medium',
                    duration_estimate: 15
                })

                actionMessages.push(`I've created the task: "${args.title}" for ${args.assign_to}. ✨`);
            } else if (call.name === "store_memory" && context?.userId) {
                const args = call.args as any;
                const newFact = args.fact;
                const updatedMemory = aiMemory ? `${aiMemory}\n- ${newFact}` : `- ${newFact}`;

                await supabase.from('profiles').update({ ai_personality: updatedMemory }).eq('id', context.userId);
                actionMessages.push(`I have committed that to memory! 🧠✨`);
            }
        }

        return actionMessages.join("\n") + (response.text ? "\n\n" + response.text : "");
    }

    return response.text || "I'm sorry, I couldn't process that request right now."
}
