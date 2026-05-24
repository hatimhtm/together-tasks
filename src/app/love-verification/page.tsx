"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Heart, Crown } from "lucide-react"
import { QUEEN_EMAIL } from "@/lib/constants"

// Custom slider component to allow the "overflow" effect
function LoveSlider({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    return (
        <div className="relative w-full h-12 flex items-center select-none touch-none">
            <div className="absolute inset-0 bg-surface-container-high rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>

            {/* Thumb / Interaction Area */}
            <input
                type="range"
                min="0"
                max="1000" // Allow going way beyond
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div
                className="absolute h-8 w-8 bg-on-primary rounded-full shadow-sm flex items-center justify-center pointer-events-none transition-all duration-75"
                style={{ left: `${Math.min(value / 10, 100)}%`, transform: `translateX(-50%)` }}
            >
                <Heart className={`w-4 h-4 text-primary ${value > 100 ? "fill-primary" : ""}`} />
            </div>
        </div>
    )
}

export default function LoveVerificationPage() {
    const [loveLevel, setLoveLevel] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isQueen, setIsQueen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !QUEEN_EMAIL || user.email !== QUEEN_EMAIL) {
                toast.error("You are not the Queen! Be gone!")
                router.push("/")
                return
            }
            setIsQueen(true)
            setLoading(false)
        }
        checkUser()
    }, [router, supabase])

    useEffect(() => {
        if (loveLevel > 900) {
            toast.success("My Queen! Your love allows you to enter!")
            setTimeout(() => router.push("/"), 1500)
        }
    }, [loveLevel, router])

    if (loading) return null

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
            <div className="app-bg" />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant/60 p-6 sm:p-8 text-center space-y-8">
                <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/12 rounded-full">
                        <Crown className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-headline font-extrabold text-on-surface">
                        Royal Verification
                    </h1>
                    <p className="text-on-surface-variant text-sm">
                        How much do you love me?
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="text-5xl font-headline font-black tracking-tight text-primary">
                        {loveLevel}%
                    </div>

                    <LoveSlider value={loveLevel} onChange={setLoveLevel} />

                    <p className="text-sm text-on-surface-variant min-h-[20px]">
                        {loveLevel === 0 ? "Drag it…" :
                            loveLevel < 50 ? "Hmmm…" :
                                loveLevel < 100 ? "Getting closer…" :
                                    loveLevel === 100 ? "Is that it?" :
                                        loveLevel < 500 ? "Wow! Keep going!" :
                                            "INFINITE LOVE DETECTED! ❤️"}
                    </p>
                </div>
            </div>
        </div>
    )
}
