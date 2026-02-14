import { generateRoyalWelcome } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { theme, goals, personality, habits } = body

        // Get user profile to know if they are King or Queen
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        const usersName = profile?.role === 'king' ? "King Hatim" : "Queen Enarcylyn"
        const partnerName = profile?.role === 'king' ? "Queen Enarcylyn" : "King Hatim"

        const message = await generateRoyalWelcome({
            usersName,
            partnerName,
            theme,
            goals,
            personality,
            habits
        })

        return NextResponse.json({ message })
    } catch (error: any) {
        console.error("AI Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate welcome" },
            { status: 500 }
        )
    }
}
