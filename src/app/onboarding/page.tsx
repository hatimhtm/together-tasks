"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Crown, Sparkles, Scroll, ArrowRight, Check, Clock, User } from "lucide-react"
import { QUEEN_EMAIL } from "@/lib/constants"

const steps = [
    { id: "theme", title: "Royal Aesthetic", icon: Crown },
    { id: "goals", title: "Shared Mission", icon: Scroll },
    { id: "habits", title: "Royal Habits", icon: Clock },
    { id: "personality", title: "The Sage", icon: User },
    { id: "decree", title: "The Decree", icon: Sparkles },
]

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const { setTheme } = useTheme()
    const [formData, setFormData] = useState({
        theme: "obsidian",
        goals: "",
        habits: "",
        personality: "sage",
    })
    const [decree, setDecree] = useState("")

    const router = useRouter()
    const supabase = createClient()

    const handleNext = async () => {
        // Determine the index of the "decree" step (final step logic)
        const decreeStepIndex = steps.findIndex(s => s.id === "decree")

        if (currentStep === decreeStepIndex - 1) {
            // Just before decree -> Generate Decree
            setLoading(true)
            try {
                const res = await fetch("/api/ai/welcome", {
                    method: "POST",
                    body: JSON.stringify(formData),
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setDecree(data.message)
                setCurrentStep(prev => prev + 1)
            } catch (error: any) {
                toast.error("Failed to summon the sage: " + error.message)
            } finally {
                setLoading(false)
            }
        } else if (currentStep === decreeStepIndex) {
            // Final Step -> Save & Complete
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error("User not found")

                // Update user auth metadata
                await supabase.auth.updateUser({
                    data: { has_completed_onboarding: true }
                })

                // Update profile
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        theme: formData.theme,
                        goals: formData.goals,
                        schedule_habits: formData.habits,
                        ai_personality: formData.personality,
                        has_completed_onboarding: true
                    })
                    .eq("id", user.id)

                if (profileError) throw profileError

                toast.success("Welcome to your Kingdom!")

                // Queen routes through the love-verification gate; everyone else to the dashboard.
                if (QUEEN_EMAIL && user.email === QUEEN_EMAIL) {
                    router.push("/love-verification")
                } else {
                    router.push("/")
                }
                router.refresh()
            } catch (error: any) {
                toast.error(error.message)
            } finally {
                setLoading(false)
            }
        } else {
            // Normal step
            setCurrentStep(prev => prev + 1)
        }
    }

    const stepVariants = {
        initial: { opacity: 0, x: 8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -8 },
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
            <div className="app-bg" />
            <div className="relative z-10 w-full max-w-lg space-y-6">
                {/* Progress */}
                <div className="flex justify-between gap-1">
                    {steps.map((step, idx) => {
                        const Icon = step.icon
                        const isActive = idx === currentStep
                        const isCompleted = idx < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 min-w-0 flex-1">
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 ${isActive ? "bg-primary text-on-primary" : isCompleted ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}
                                >
                                    <Icon size={16} />
                                </div>
                                <span className={`text-[10px] font-medium text-center truncate w-full transition-colors duration-200 ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-6 sm:p-8 min-h-[420px] flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex-1 space-y-6"
                        >
                            {currentStep === 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-headline font-bold text-center text-on-surface">Establish Your Aesthetic</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {
                                            [
                                                { id: 'obsidian', name: 'Obsidian', desc: 'Deep black, glowing amber accents', gradient: 'from-[#1a1a1a] to-[#ff9800]', tint: 'bg-amber-500' },
                                                { id: 'daylight', name: 'Daylight', desc: 'Clean, bright, warm orange', gradient: 'from-[#f5f6f8] to-[#ff8c00]', tint: 'bg-orange-400' },
                                                { id: 'midnight', name: 'Midnight', desc: 'Sleek navy, electric blue glow', gradient: 'from-[#0d1117] to-[#4f8ef7]', tint: 'bg-blue-500' },
                                                { id: 'rose', name: 'Rose', desc: 'Soft pinks, romantic blush', gradient: 'from-[#170d12] to-[#f06292]', tint: 'bg-pink-500' },
                                                { id: 'aurora', name: 'Aurora', desc: 'Violet & cyan, dreamy glow', gradient: 'from-[#7b68ee] to-[#00bcd4]', tint: 'bg-violet-500' },
                                                { id: 'ocean', name: 'Ocean', desc: 'Deep teal, cyan currents', gradient: 'from-[#071323] to-[#00e5ff]', tint: 'bg-cyan-500' },
                                                { id: 'burgundy', name: 'Burgundy', desc: 'Deep luscious red, gold accents', gradient: 'from-[#651028] to-[#e8b84b]', tint: 'bg-rose-900' }
                                            ].map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => { setFormData({ ...formData, theme: theme.id }); setTheme(theme.id) }}
                                                    className={`p-4 rounded-xl border transition-colors flex items-center gap-4 text-left active:scale-[0.98] ${formData.theme === theme.id ? "border-primary bg-primary/10" : "border-outline-variant/60 bg-surface-container-high hover:bg-surface-container-highest"}`}
                                                >
                                                    <div className={`w-12 h-12 rounded-full z-10 shrink-0 border border-outline-variant/60 bg-gradient-to-br ${theme.gradient}`} />
                                                    <div className="text-left z-10 flex-1 min-w-0">
                                                        <h3 className="font-semibold text-[15px] text-on-surface">{theme.name}</h3>
                                                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">{theme.desc}</p>
                                                    </div>
                                                    {formData.theme === theme.id && <Check className="ml-auto text-primary z-10 shrink-0" size={18} />}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-headline font-bold text-center text-on-surface">The Royal Mission</h2>
                                    <div className="space-y-4">
                                        <p className="text-center text-on-surface-variant text-sm">What is the &quot;Crown Jewel&quot; goal you are striving for together?</p>
                                        <Input
                                            placeholder="e.g., Build our dream house..."
                                            className="h-12 text-base bg-surface-container-high border-outline-variant/60 focus:border-primary text-on-surface rounded-xl"
                                            value={formData.goals}
                                            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                        />
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {["Buy a House", "Plan Wedding", "Save $10k", "Travel Japan"].map(suggestion => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => setFormData({ ...formData, goals: suggestion })}
                                                    className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface border border-outline-variant/60 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-headline font-bold text-center text-on-surface">Daily Rituals</h2>
                                    <div className="space-y-4">
                                        <p className="text-center text-on-surface-variant text-sm">Describe your typical schedule or shared habits so the AI can serve you better.</p>
                                        <Textarea
                                            placeholder="e.g., We work 9-5, have dinner at 7, and gym on weekends. We want to read more."
                                            className="min-h-[120px] text-base bg-surface-container-high border-outline-variant/60 focus:border-primary text-on-surface rounded-xl resize-none"
                                            value={formData.habits}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, habits: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-headline font-bold text-center text-on-surface">Summon The Royal Sage</h2>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'sage', name: 'The Wiseman', desc: 'Wise, poetic, ancient wisdom.' },
                                            { id: 'jester', name: 'The Jester', desc: 'Fun, chaotic, keeps it light.' },
                                            { id: 'butler', name: 'The Butler', desc: 'Formal, precise, at your service.' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setFormData({ ...formData, personality: p.id })}
                                                className={`p-4 rounded-xl border transition-colors flex items-center gap-4 active:scale-[0.98] ${formData.personality === p.id ? "border-primary bg-primary/10" : "border-outline-variant/60 bg-surface-container-high hover:bg-surface-container-highest"}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl">
                                                    {p.id === 'sage' ? '🧙‍♂️' : p.id === 'jester' ? '🃏' : '🤵'}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-semibold text-on-surface">{p.name}</h3>
                                                    <p className="text-xs text-on-surface-variant">{p.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6 text-center h-full flex flex-col justify-center">
                                    <div className="w-16 h-16 mx-auto bg-primary/12 rounded-full flex items-center justify-center">
                                        <Scroll className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-headline font-bold text-on-surface">
                                        Your Royal Decree
                                    </h2>
                                    <div className="p-5 bg-surface-container-high rounded-xl border border-outline-variant/60 text-base leading-relaxed text-on-surface">
                                        {decree || "The stars are aligning…"}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex justify-between items-center gap-3">
                        <button
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0 || loading}
                            className={`h-11 px-5 rounded-full font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-[0.98] ${currentStep === 0 ? "invisible" : ""}`}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="h-11 px-6 min-w-[8rem] flex items-center justify-center gap-2 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {loading ? <Clock className="animate-spin w-4 h-4" /> : (
                                currentStep === steps.length - 1 ? "Enter" : "Next"
                            )}
                            {!loading && currentStep !== steps.length - 1 && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
