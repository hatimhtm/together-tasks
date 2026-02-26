export interface GenerateWelcomeParams {
    usersName: string
    partnerName: string
    theme: string
    goals: string
    personality: string
    habits: string
}

export async function generateRoyalWelcome(params: GenerateWelcomeParams) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set")
    }

    const prompt = `
    You are a ${params.personality} in a royal court.
    The King is ${params.usersName} and the Queen is ${params.partnerName}.
    They have chosen the "${params.theme}" theme for their kingdom.
    Their shared goal is: "${params.goals}".
    Their daily routine involves: "${params.habits}".
    
    Write a short, grand, and encouraging "Royal Decree" welcoming them to their new digital kingdom. 
    Mention how their habits will help them rule.
    Keep it under 60 words. Be majestic, fun, and personalized.
  `

    try {
        // Attempt to call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        })

        if (!response.ok) {
            // Log error but don't throw to client
            const errorData = await response.json().catch(() => ({}))
            console.error("Gemini API Error:", errorData)
            throw new Error("API_ERROR")
        }

        const data = await response.json()
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) throw new Error("NO_CONTENT")

        return aiResponse

    } catch (error) {
        console.error("AI Generation Failed, using fallback:", error)

        // Fallback "Royal Decree" so the user is never blocked
        return `Hear ye! The Stars align for ${params.usersName} and ${params.partnerName}.
        Though the Royal Sage is in deep meditation, your shared goal of "${params.goals}"
        shall be achieved through your habits of "${params.habits}".
        Rule your ${params.theme} Kingdom with love and glory!`
    }
}
