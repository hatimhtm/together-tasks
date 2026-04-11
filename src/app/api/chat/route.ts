import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const body = await req.json();
        const { userName, userRole, textToSend } = body;

        if (!textToSend) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const systemPrompt = `You are a warm, helpful AI assistant named Sage embedded in "Together Tasks" — a personal task app built for a couple.
The user is ${userName || "there"} (${userRole || "partner"}).
Personality:
- Warm, supportive, like a trusted friend.
- Help with tasks, productivity tips, or cute nudges for the partner.
User says: "${textToSend}"`;

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            }
        );

        if (!res.ok) {
            throw new Error(`API error ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("API chat error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
