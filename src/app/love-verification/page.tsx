"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Heart, Crown } from "lucide-react"

// Custom slider component to allow the "overflow" effect
function LoveSlider({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    return (
        <div className="relative w-full h-12 flex items-center select-none touch-none">
            <div className="absolute inset-0 bg-secondary/20 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 w-full"
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
                {value > 100 && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 opacity-50 mix-blend-overlay"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                )}
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
                className="absolute h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none transition-all duration-75"
                style={{ left: `${Math.min(value / 10, 100)}%`, transform: `translateX(-50%) scale(${1 + value / 500})` }}
            >
                <Heart className={`w-4 h-4 text-red-500 ${value > 100 ? "fill-red-500 animate-pulse" : ""}`} />
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
    const controls = useAnimation()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || user.email !== 'queen@example.com') {
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
        if (loveLevel > 100) {
            controls.start({
                scale: [1, 1.1, 1],
                transition: { duration: 0.5, repeat: Infinity }
            })
        } else {
            controls.stop()
        }

        if (loveLevel > 900) {
            toast.success("My Queen! Your love allows you to enter!")
            setTimeout(() => router.push("/"), 1500)
        }
    }, [loveLevel, controls, router])

    if (loading) return null

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-100 to-purple-200 dark:from-pink-950 dark:to-purple-950 overflow-hidden">

            {/* Floating Hearts BG */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-pink-500/20"
                        initial={{ y: "110vh", x: Math.random() * 100 + "vw", scale: Math.random() * 2 + 0.5 }}
                        animate={{ y: "-10vh" }}
                        transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
                    >
                        <Heart size={Math.random() * 50 + 20} className="fill-current" />
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-white/30 dark:bg-black/30 backdrop-blur-xl p-10 rounded-3xl border border-white/50 shadow-2xl text-center space-y-10"
            >
                <div>
                    <motion.div
                        className="inline-block p-4 bg-gradient-to-tr from-yellow-300 to-yellow-600 rounded-full shadow-lg mb-6"
                        animate={controls}
                    >
                        <Crown className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
                        Royal Verification
                    </h1>
                    <p className="text-lg font-medium text-foreground/80">
                        How much do you love me?
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="text-5xl font-black font-mono tracking-tighter text-pink-600 drop-shadow-sm">
                        {loveLevel}%
                    </div>

                    <LoveSlider value={loveLevel} onChange={setLoveLevel} />

                    <p className="text-sm text-muted-foreground italic min-h-[20px]">
                        {loveLevel === 0 ? "Drag it..." :
                            loveLevel < 50 ? "Hmmm..." :
                                loveLevel < 100 ? "Getting closer..." :
                                    loveLevel === 100 ? "Is that it?" :
                                        loveLevel < 500 ? "Wow! Keep going!" :
                                            "INFINITE LOVE DETECTED! ❤️"}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
