"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useAiNudge } from "@/hooks/use-ai-nudge"

// The affectionate "thinking of you" nudge is a NOTIFICATION, not a card — it
// no longer takes a slot on the home. The hook still fires the OS/local
// notification; here we also surface it as a one-time in-app toast per session.
// Renders nothing.
export function AiNudge() {
    const { nudge } = useAiNudge()

    useEffect(() => {
        if (!nudge) return
        try {
            if (sessionStorage.getItem("ai_nudge_toasted")) return
            sessionStorage.setItem("ai_nudge_toasted", "1")
        } catch {}
        toast(nudge, { icon: "💕", duration: 6000 })
    }, [nudge])

    return null
}
