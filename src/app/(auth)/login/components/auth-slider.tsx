"use client"

import { useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { triggerHaptic, triggerHapticSuccess } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { cn } from "@/lib/utils"

interface AuthSliderProps {
    isVerified: boolean
    setIsVerified: (val: boolean) => void
}

export function AuthSlider({ isVerified, setIsVerified }: AuthSliderProps) {
    const x = useMotionValue(0)
    const affectionLevel = useTransform(x, [0, 200], [0, 100])
    const sprungAffection = useSpring(affectionLevel, { stiffness: 400, damping: 25 })
    const roundedPercentage = useTransform(sprungAffection, (v) => `${Math.min(100, Math.max(0, Math.round(v)))}%`)
    const dashOffset = useTransform(x, [0, 200], [1000, 250])
    const bgColor = useTransform(x, [0, 200], ["rgba(255, 177, 199, 0)", "rgba(255, 140, 0, 0.4)"])

    // Handle heart drag complete
    useEffect(() => {
        const unsubscribe = x.on("change", (latest) => {
            if (latest >= 180 && !isVerified) {
                triggerHapticSuccess()
                setIsVerified(true)
            }
        })
        return () => unsubscribe()
    }, [x, isVerified, setIsVerified])

    return (
        <motion.div
            key="slider-gate"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="w-full flex justify-center items-center flex-col h-full mt-4"
        >
            <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(255,177,199,0.3)]" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="roseGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffb77d" />
                            <stop offset="100%" stopColor="#ffb1c7" />
                        </linearGradient>
                    </defs>

                    {/* Background Track */}
                    <path
                        className="text-outline-variant/30"
                        d="M50 85c-20-15-40-30-40-50 0-15 10-25 25-25 7 0 12 5 15 10 3-5 8-10 15-10 15 0 25 10 25 25 0 20-20 35-40 50z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />

                    {/* Progress Path */}
                    <motion.path
                        d="M50 85c-20-15-40-30-40-50 0-15 10-25 25-25 7 0 12 5 15 10 3-5 8-10 15-10 15 0 25 10 25 25 0 20-20 35-40 50z"
                        fill="none"
                        stroke="url(#roseGradient)"
                        strokeLinecap="round"
                        strokeWidth="4"
                        initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                        style={{ strokeDashoffset: dashOffset }}
                    />
                </svg>
            </div>

            <motion.div className="text-center relative -mt-4 mb-10 w-full h-[60px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {isVerified ? (
                        <motion.div
                            key="verified-text"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, scale: [1, 1.2, 1] }}
                            className="text-4xl font-headline font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-secondary-container"
                        >
                            VERIFIED
                        </motion.div>
                    ) : (
                        <motion.div
                            key="percentage-text"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div className="text-5xl font-headline font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-secondary-container">
                                {roundedPercentage}
                            </motion.div>
                            <p className="text-secondary font-headline font-bold tracking-[0.2em] text-[10px] mt-1 uppercase">Current Affection Level</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Drag Interface */}
            <div className="absolute bottom-8 left-8 right-8 h-12 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-label font-bold text-on-surface-variant/40 tracking-widest uppercase pointer-events-none">
                    {isVerified ? "Love Confirmed" : "Slide to unlock"}
                </div>
                <motion.div
                    className="h-full w-full absolute left-0 top-0 cursor-grab active:cursor-grabbing origin-left"
                    style={{ backgroundColor: bgColor }}
                />
                <motion.div
                    drag={!isVerified ? "x" : false}
                    dragConstraints={{ left: 0, right: 200 }}
                    dragElastic={0.1}
                    onDrag={() => { triggerHaptic(ImpactStyle.Light) }}
                    onDragEnd={(_, info) => {
                        if (info.offset.x < 180) {
                            x.set(0)
                        }
                    }}
                    style={{ x }}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                        "relative h-12 w-16 bg-gradient-to-br from-secondary to-secondary-container rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(181,1,94,0.4)] z-10",
                        isVerified && "pointer-events-none"
                    )}
                >
                    <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isVerified ? 'check' : 'favorite'}
                    </span>
                </motion.div>
            </div>
        </motion.div>
    )
}
