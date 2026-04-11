"use client"

import { motion, AnimatePresence } from "framer-motion"

interface AuthHeaderProps {
    isVerified: boolean
    showForm: boolean
    isSignUp: boolean
}

export function AuthHeader({ isVerified, showForm, isSignUp }: AuthHeaderProps) {
    return (
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
    )
}
