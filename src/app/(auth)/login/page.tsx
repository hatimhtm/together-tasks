"use client"

import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { KING_EMAIL, QUEEN_EMAIL, QUEEN_LABEL } from "@/lib/constants"
import { triggerHaptic, triggerHapticSuccess } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
    // Auth State
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phone, setPhone] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    
    // UI State
    const [isVerified, setIsVerified] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Slider State
    const x = useMotionValue(0)
    const affectionLevel = useTransform(x, [0, 200], [0, 100])
    const sprungAffection = useSpring(affectionLevel, { stiffness: 400, damping: 25 })
    const roundedPercentage = useTransform(sprungAffection, (v) => `${Math.min(100, Math.max(0, Math.round(v)))}%`)
    const dashOffset = useTransform(x, [0, 200], [1000, 250])
    const bgColor = useTransform(x, [0, 200], ["rgba(255, 177, 199, 0)", "rgba(255, 140, 0, 0.4)"])

    const router = useRouter()
    const supabase = createClient()

    // Handle heart drag complete
    useEffect(() => {
        const unsubscribe = x.on("change", (latest) => {
            if (latest >= 180 && !isVerified) {
                triggerHapticSuccess()
                setIsVerified(true)
            }
        })
        return () => unsubscribe()
    }, [x, isVerified])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const allowedEmails = [KING_EMAIL, QUEEN_EMAIL]
        const normalizedEmail = email.toLowerCase().trim()

        if (isSignUp) {
            if (!allowedEmails.includes(normalizedEmail)) {
                toast.error("Sorry, this app is only for the King and Queen.")
                setLoading(false)
                return
            }
            const cleanPhone = phone.replace(/\D/g, '')
            if (!cleanPhone.startsWith("9") || cleanPhone.length !== 10) {
                toast.error("Please enter a valid PH mobile number (e.g., 912 345 6789)")
                setLoading(false)
                return
            }
        }

        try {
            if (isSignUp) {
                const cleanPhone = phone.replace(/\D/g, '')
                const fullPhone = `+63${cleanPhone}`

                const { data, error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: { data: { phone: fullPhone } }
                })

                if (error) throw error

                if (data.session) {
                    toast.success("Welcome, Your Highness!")
                    router.refresh()
                    router.push("/onboarding")
                } else {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password,
                    })

                    if (signInError) {
                        toast.success("Account created! Please log in.")
                    } else {
                        toast.success("Welcome, Your Highness!")
                        router.refresh()
                        router.push("/onboarding")
                    }
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                })
                if (error) throw error

                toast.success("Welcome back!")
                router.refresh()
                router.push("/")
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md mx-auto"
        >
            <div className="rounded-2xl bg-surface-container border border-outline-variant/60 p-6 sm:p-8 space-y-6">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <Logo size={28} className="shrink-0" />
                    <span className="text-on-surface font-headline font-extrabold tracking-tight text-lg">
                        Together Tasks
                    </span>
                </div>

                {/* Header */}
                <div className="space-y-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/12 border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-sm mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span className="text-primary font-label font-bold text-[10px] tracking-widest uppercase">
                            {isVerified && showForm ? "Authentication" : "Security Gate"}
                        </span>
                    </div>
                    <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
                        {isVerified && showForm ? (isSignUp ? "Join the Kingdom" : "Enter Kingdom") : "Love Verification"}
                    </h1>
                    <p className="text-on-surface-variant text-sm">
                        {isVerified && showForm ? (
                            isSignUp ? "Prove your identity to start" : "Welcome back, my love."
                        ) : (
                            <>Prove your love, <span className="text-secondary font-semibold">{QUEEN_LABEL}!</span></>
                        )}
                    </p>
                </div>

                {/* Body */}
                <AnimatePresence mode="wait">
                    {(!isVerified || !showForm) ? (
                        /* ── SLIDER GATE ── */
                        <motion.div
                            key="slider-gate"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col items-center gap-5"
                        >
                            <div className="relative w-32 h-32 shrink-0">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="roseGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ffb77d" />
                                            <stop offset="100%" stopColor="#ffb1c7" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        className="text-outline-variant/60"
                                        d="M50 85c-20-15-40-30-40-50 0-15 10-25 25-25 7 0 12 5 15 10 3-5 8-10 15-10 15 0 25 10 25 25 0 20-20 35-40 50z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
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

                            <div className="text-center relative w-full h-[52px] flex items-center justify-center">
                                {isVerified ? (
                                    <div className="text-3xl font-headline font-extrabold text-primary">
                                        VERIFIED
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <motion.div className="text-4xl font-headline font-extrabold text-primary">
                                            {roundedPercentage}
                                        </motion.div>
                                        <p className="text-on-surface-variant font-label font-bold tracking-[0.2em] text-[10px] mt-1 uppercase">Affection Level</p>
                                    </div>
                                )}
                            </div>

                            {/* Drag Interface */}
                            <div className="relative w-full h-12 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/60">
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-label font-bold text-on-surface-variant/60 tracking-widest uppercase pointer-events-none">
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
                                    className={cn(
                                        "relative h-12 w-16 bg-secondary text-on-secondary rounded-full flex items-center justify-center z-10",
                                        isVerified && "pointer-events-none"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {isVerified ? 'check' : 'favorite'}
                                    </span>
                                </motion.div>
                            </div>

                            <button
                                disabled={!isVerified}
                                onClick={() => { triggerHaptic(ImpactStyle.Heavy); setShowForm(true); }}
                                className="w-full h-12 bg-primary text-on-primary rounded-full font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isVerified ? "Enter Kingdom" : "Unlock"}
                            </button>
                        </motion.div>
                    ) : (
                        /* ── AUTH FORM ── */
                        <motion.form
                            key="auth-form"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            onSubmit={handleAuth}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <label className="text-xs font-label font-bold text-on-surface-variant tracking-wide uppercase">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="royal@palace.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-surface-container-high border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60 h-11 rounded-xl text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-label font-bold text-on-surface-variant tracking-wide uppercase">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-surface-container-high border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60 h-11 rounded-xl text-sm pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-xs font-label font-bold text-on-surface-variant tracking-wide uppercase">Mobile Number</label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                                                <span className="text-[14px]">🇵🇭</span>
                                                <span className="text-xs font-medium text-on-surface-variant">+63</span>
                                                <div className="w-px h-3 bg-outline-variant/60 mx-0.5" />
                                            </div>
                                            <Input
                                                type="tel"
                                                placeholder="912 345 6789"
                                                value={phone}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '')
                                                    if (val.length > 10) val = val.slice(0, 10)
                                                    setPhone(val)
                                                }}
                                                className="pl-20 bg-surface-container-high border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60 h-11 rounded-xl font-mono text-[13px] tracking-wide"
                                                maxLength={10}
                                                required={isSignUp}
                                            />
                                            {phone.length === 10 && phone.startsWith('9') && (
                                                <div className="absolute right-3 text-primary">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                onClick={() => triggerHaptic(ImpactStyle.Medium)}
                                className="w-full h-12 flex items-center justify-center bg-primary text-on-primary rounded-full font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Create Identity" : "Log In")}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-[12px] font-label font-medium text-on-surface-variant hover:text-primary transition-colors"
                                >
                                    {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
