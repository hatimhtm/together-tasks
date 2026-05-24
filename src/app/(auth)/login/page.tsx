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
        <div className="w-full relative min-h-[600px] flex flex-col justify-center pb-24">
            
            {/* Header */}
            <AnimatePresence mode="wait">
                <motion.header
                    key={isVerified && showForm ? "auth-header" : "gate-header"}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-10 w-full"
                >
                    <div className="inline-flex items-center justify-center mb-6 px-4 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-secondary text-sm mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span className="text-secondary font-headline font-bold text-xs tracking-widest uppercase">
                            {isVerified && showForm ? "Authentication" : "Security Gate"}
                        </span>
                    </div>
                    
                    <h1 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-4 leading-tight">
                        {isVerified && showForm ? (isSignUp ? "Join the Kingdom" : "Enter Kingdom") : "Love Verification"}
                    </h1>
                    
                    <p className="font-body text-on-surface-variant text-lg">
                        {isVerified && showForm ? (
                            isSignUp ? "Prove your identity to start" : "Welcome back, my love."
                        ) : (
                            <>Prove your love, <span className="text-secondary font-semibold italic">{QUEEN_LABEL}!</span></>
                        )}
                    </p>
                </motion.header>
            </AnimatePresence>

            <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
                
                {/* Background Card */}
                <div className="absolute inset-0 bg-[#231f1d]/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/10">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 w-full h-full p-6 flex flex-col items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {(!isVerified || !showForm) ? (
                            
                            /* ── SLIDER GATE ── */
                            <motion.div
                                key="slider-gate"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                transition={{ duration: 0.5 }}
                                className="w-full flex justify-center items-center flex-col h-full gap-4"
                            >
                                <div className="relative w-40 h-40 shrink-0">
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

                                <motion.div className="text-center relative w-full h-[56px] flex items-center justify-center shrink-0">
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
                                <div className="relative w-full max-w-[280px] h-12 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10 shadow-inner shrink-0">
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

                        ) : (

                            /* ── AUTH FORM ── */
                            <motion.form
                                key="auth-form"
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                onSubmit={handleAuth}
                                className="w-full flex-col justify-center h-full space-y-4"
                            >
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-label font-bold text-on-surface-variant ml-1 tracking-wide uppercase">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="royal@palace.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-surface-container-low border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline/40 h-11 rounded-xl transition-all font-body text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-label font-bold text-on-surface-variant ml-1 tracking-wide uppercase">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-surface-container-low border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline/40 h-11 rounded-xl transition-all font-body text-sm pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors"
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
                                            <label className="text-xs font-label font-bold text-on-surface-variant ml-1 tracking-wide uppercase">Mobile Number</label>
                                            <div className="relative flex items-center">
                                                <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none">
                                                    <span className="text-[14px]">🇵🇭</span>
                                                    <span className="text-xs font-medium text-on-surface-variant">+63</span>
                                                    <div className="w-px h-3 bg-outline-variant/30 mx-0.5" />
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
                                                    className="pl-20 bg-surface-container-low border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline/40 h-11 rounded-xl transition-all font-mono text-[13px] tracking-wide"
                                                    maxLength={10}
                                                    required={isSignUp}
                                                />
                                                {phone.length === 10 && phone.startsWith('9') && (
                                                    <div className="absolute right-3 text-emerald-400 animate-in zoom-in">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-[11px] font-label font-medium text-on-surface-variant hover:text-primary transition-colors underline-offset-4"
                                    >
                                        {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                                    </button>
                                </div>
                            </motion.form>

                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Action Button */}
            <div className="w-full absolute -bottom-16 left-0 right-0">
                <AnimatePresence mode="wait">
                    {!showForm ? (
                        <motion.div
                            key="btn-enter-gate"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <button 
                                disabled={!isVerified}
                                onClick={() => { triggerHaptic(ImpactStyle.Heavy); setShowForm(true); }}
                                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-extrabold text-[15px] shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:shadow-[0_20px_40px_rgba(255,140,0,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-wider disabled:active:scale-100"
                            >
                                {isVerified ? "Enter Kingdom" : "Unlock"}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="btn-submit"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <button 
                                onClick={(e) => {
                                    triggerHaptic(ImpactStyle.Medium)
                                    const form = document.querySelector('form')
                                    if (form) form.requestSubmit()
                                }}
                                disabled={loading}
                                className="w-full flex items-center justify-center bg-gradient-to-r from-primary/90 to-primary-container/90 hover:from-primary hover:to-primary-container text-on-primary py-4 rounded-full font-headline font-extrabold text-[15px] shadow-[0_15px_30px_rgba(255,140,0,0.2)] hover:shadow-[0_20px_40px_rgba(255,140,0,0.3)] active:scale-[0.98] transition-all uppercase tracking-wider"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Create Identity" : "Log In")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Identity Anchor */}
            <div className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 pb-10 pointer-events-none">
                <div className="flex items-center gap-2 opacity-80">
                    <Logo size={22} className="shrink-0" />
                    <span className="text-primary font-headline font-extrabold tracking-tighter text-lg">
                        Together Tasks
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
            </div>
            
        </div>
    )
}
