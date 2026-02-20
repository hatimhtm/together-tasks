"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GlassCard } from "@/components/ui/glass-card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Crown, Sparkles, Scroll, ArrowRight, Check, Clock, User } from "lucide-react"

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
    const [formData, setFormData] = useState({
        theme: "light",
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

                // Check user email for redirection
                if (user.email === 'enarcylyn@gmail.com') {
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
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-8">
                {/* Progress */}
                <div className="flex justify-between px-4 sm:px-8 overflow-x-auto">
                    {steps.map((step, idx) => {
                        const Icon = step.icon
                        const isActive = idx === currentStep
                        const isCompleted = idx < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                                <div
                                    className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isActive ? "bg-primary text-primary-foreground scale-110 shadow-glow" :
                                            isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                  `}
                                >
                                    <Icon size={16} />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-medium transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <GlassCard className="p-8 min-h-[450px] flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="flex-1 space-y-6"
                        >
                            {currentStep === 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center">Establish Your Aesthetic</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {
                                            [
                                                { id: 'light', name: 'Glass (Light)', desc: 'Clean, bright, professional', gradient: 'from-zinc-100 to-zinc-300', tint: 'bg-zinc-500' },
                                                { id: 'dark', name: 'Midnight', desc: 'Sleek, deep greys, glowing accents', gradient: 'from-zinc-700 to-zinc-900', tint: 'bg-black' },
                                                { id: 'floral', name: 'Floral Blush', desc: 'Soft pinks, floating petals', gradient: 'from-pink-300 to-rose-400', tint: 'bg-pink-500' },
                                                { id: 'creamy', name: 'Vintage Cream', desc: 'Warm sepia, elegant, minimalist', gradient: 'from-[#fdfbf7] to-[#eaddcf]', tint: 'bg-amber-700' },
                                                { id: 'burgundy', name: 'Royal Burgundy', desc: 'Deep luscious red, gold accents', gradient: 'from-[#651028] to-[#2b0b14]', tint: 'bg-rose-900' }
                                            ].map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => setFormData({ ...formData, theme: theme.id })}
                                                    className={`
                                                      p-4 rounded-xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden text-left
                                                      ${formData.theme === theme.id ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-transparent bg-muted/30 hover:bg-muted/50"}
                                                    `}
                                                >
                                                    <div className={`absolute inset-0 opacity-10 ${theme.tint}`} />
                                                    <div className={`w-12 h-12 rounded-full shadow-lg z-10 shrink-0 border border-white/20 bg-gradient-to-br ${theme.gradient}`} />
                                                    <div className="text-left z-10 flex-1">
                                                        <h3 className="font-semibold text-[15px]">{theme.name}</h3>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{theme.desc}</p>
                                                    </div>
                                                    {formData.theme === theme.id && <Check className="ml-auto text-primary z-10 shrink-0" />}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center">The Royal Mission</h2>
                                    <div className="space-y-4">
                                        <p className="text-center text-muted-foreground">What is the "Crown Jewel" goal you are striving for together?</p>
                                        <Input
                                            placeholder="e.g., Build our dream house..."
                                            className="h-14 text-lg bg-background/50 border-primary/20 focus:border-primary"
                                            value={formData.goals}
                                            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                        />
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {["Buy a House", "Plan Wedding", "Save $10k", "Travel Japan"].map(suggestion => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => setFormData({ ...formData, goals: suggestion })}
                                                    className="px-3 py-1 rounded-full bg-secondary/10 hover:bg-secondary/20 text-xs text-secondary-foreground border border-secondary/20 transition-colors"
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
                                    <h2 className="text-2xl font-bold text-center">Daily Rituals</h2>
                                    <div className="space-y-4">
                                        <p className="text-center text-muted-foreground">Describe your typical schedule or shared habits so the AI can serve you better.</p>
                                        <Textarea
                                            placeholder="e.g., We work 9-5, have dinner at 7, and gym on weekends. We want to read more."
                                            className="min-h-[120px] text-base bg-background/50 border-primary/20 focus:border-primary resize-none"
                                            value={formData.habits}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, habits: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-center">Summon The Royal Sage</h2>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'sage', name: 'The Wiseman', desc: 'Wise, poetic, ancient wisdom.' },
                                            { id: 'jester', name: 'The Jester', desc: 'Fun, chaotic, keeps it light.' },
                                            { id: 'butler', name: 'The Butler', desc: 'Formal, precise, at your service.' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setFormData({ ...formData, personality: p.id })}
                                                className={`
                          p-4 rounded-xl border-2 transition-all flex items-center gap-4
                          ${formData.personality === p.id ? "border-primary bg-primary/10" : "border-transparent bg-muted/30 hover:bg-muted/50"}
                        `}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl shadow-sm">
                                                    {p.id === 'sage' ? '🧙‍♂️' : p.id === 'jester' ? '🃏' : '🤵'}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-semibold">{p.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6 text-center h-full flex flex-col justify-center">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary/25">
                                        <Scroll className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                        Your Royal Decree
                                    </h2>
                                    <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl border border-primary/20 italic text-lg leading-relaxed relative shadow-inner">
                                        <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                                        {decree || "The stars are aligning..."}
                                        <span className="absolute -bottom-8 -right-2 text-6xl text-primary/10 font-serif">"</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-8 flex justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0 || loading}
                            className={currentStep === 0 ? "invisible" : ""}
                        >
                            Back
                        </Button>
                        <Button onClick={handleNext} disabled={loading} className="w-32 group shadow-lg shadow-primary/20">
                            {loading ? <Clock className="animate-spin w-4 h-4" /> : (
                                currentStep === steps.length - 1 ? "Enter" : "Next"
                            )}
                            {!loading && currentStep !== steps.length - 1 && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
