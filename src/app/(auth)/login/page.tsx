"use client"

import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { KING_EMAIL, QUEEN_EMAIL } from "@/lib/constants"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { SliderGate } from "./components/slider-gate"
import { AuthForm } from "./components/auth-form"

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

    const router = useRouter()
    const supabase = createClient()

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
                            <>Prove your love, <span className="text-secondary font-semibold italic">Enarcylyn!</span></>
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
                            <SliderGate
                                isVerified={isVerified}
                                onVerify={() => setIsVerified(true)}
                            />
                        ) : (
                            <AuthForm
                                isSignUp={isSignUp}
                                setIsSignUp={setIsSignUp}
                                email={email}
                                setEmail={setEmail}
                                password={password}
                                setPassword={setPassword}
                                phone={phone}
                                setPhone={setPhone}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                handleAuth={handleAuth}
                            />
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
                
                <AnimatePresence>
                    {!showForm && (
                        <motion.button 
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full mt-4 text-on-surface-variant/70 font-label text-xs font-medium hover:text-secondary transition-colors py-2 text-center"
                        >
                            Need a hint?
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Identity Anchor */}
            <div className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 pb-10 pointer-events-none">
                <div className="text-primary font-headline font-extrabold tracking-tighter text-lg opacity-80">
                    Together Tasks
                </div>
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
            </div>
            
        </div>
    )
}
