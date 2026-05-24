"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

type SpeechAPI = typeof window extends { SpeechRecognition: infer T } ? T : any

interface Props {
    onTranscript: (text: string) => void
    onInterim?: (text: string) => void
    disabled?: boolean
}

/**
 * Live voice-to-task button. Uses the Web Speech API to stream a transcript
 * while the user holds / toggles the mic. On the final result we hand the
 * transcript to the parent so it can flow through the existing parseTaskInput
 * → addTask pipeline (the same one that powers the typed quick-add).
 *
 * On platforms without SpeechRecognition (Firefox, some embedded webviews),
 * the button is hidden — no fallback, no broken UX.
 */
export function VoiceButton({ onTranscript, onInterim, disabled }: Props) {
    const [supported, setSupported] = useState(true)
    const [listening, setListening] = useState(false)
    const recogRef = useRef<any>(null)
    const interimRef = useRef("")
    const finalRef = useRef("")

    useEffect(() => {
        if (typeof window === "undefined") return
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SR) {
            setSupported(false)
            return
        }
        const r = new SR()
        r.continuous = true
        r.interimResults = true
        r.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US"

        r.onresult = (event: any) => {
            let interim = ""
            let final = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const piece = event.results[i][0].transcript
                if (event.results[i].isFinal) final += piece
                else interim += piece
            }
            if (interim) {
                interimRef.current = interim
                onInterim?.(interim)
            }
            if (final) {
                finalRef.current += final
                onInterim?.(finalRef.current + interim)
            }
        }

        r.onend = () => {
            setListening(false)
            const result = (finalRef.current + interimRef.current).trim()
            if (result) onTranscript(result)
            finalRef.current = ""
            interimRef.current = ""
        }

        r.onerror = () => {
            setListening(false)
            finalRef.current = ""
            interimRef.current = ""
        }

        recogRef.current = r
        return () => {
            try { r.stop() } catch { /* swallow */ }
        }
    }, [onTranscript, onInterim])

    function start() {
        if (!recogRef.current) return
        finalRef.current = ""
        interimRef.current = ""
        try {
            recogRef.current.start()
            setListening(true)
        } catch { /* already started */ }
    }

    function stop() {
        if (!recogRef.current) return
        try { recogRef.current.stop() } catch { /* ignore */ }
    }

    if (!supported) return null

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={listening ? stop : start}
            className={cn(
                "h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-colors active:scale-[0.98]",
                listening
                    ? "bg-error/10 text-error border border-error/40"
                    : "bg-surface-container-high text-on-surface border border-outline-variant/60 hover:bg-surface-container-highest",
                disabled && "opacity-50 pointer-events-none",
            )}
            title={listening ? "Stop listening" : "Voice → task"}
            aria-label={listening ? "Stop voice capture" : "Start voice capture"}
        >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
    )
}
