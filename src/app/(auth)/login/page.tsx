"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { AuthHeader } from "./components/auth-header"
import { AuthSlider } from "./components/auth-slider"
import { AuthForm } from "./components/auth-form"

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [showForm, setShowForm] = useState(false)

    return (
        <div className="w-full relative min-h-[600px] flex flex-col justify-center pb-24">
            <AuthHeader isVerified={isVerified} showForm={showForm} isSignUp={isSignUp} />

            <div className="relative w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
                {/* Background Card */}
                <div className="absolute inset-0 bg-[#231f1d]/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/10">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 w-full h-full p-6 flex flex-col items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {(!isVerified || !showForm) ? (
                            <AuthSlider isVerified={isVerified} setIsVerified={setIsVerified} />
                        ) : (
                            <AuthForm isSignUp={isSignUp} setIsSignUp={setIsSignUp} loading={loading} setLoading={setLoading} />
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
