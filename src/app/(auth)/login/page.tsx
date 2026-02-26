"use client"

import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phone, setPhone] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const allowedEmails = ["hatimhtm2003@gmail.com", "queen@example.com"]
        const normalizedEmail = email.toLowerCase().trim()

        if (isSignUp) {
            if (!allowedEmails.includes(normalizedEmail)) {
                toast.error("Sorry, this app is only for the King and Queen.")
                setLoading(false)
                return
            }
            // Remove spaces for validation
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
                    options: {
                        data: {
                            phone: fullPhone
                        }
                    }
                })

                if (error) throw error

                if (data.session) {
                    toast.success("Welcome, Your Highness!")
                    router.refresh()
                    router.push("/onboarding")
                } else {
                    // Explicitly sign in after sign up if email confirmation is disabled
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password,
                    })

                    if (signInError) {
                        // If sign in fails (maybe email confirm IS on?), just show success
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
        <div className="space-y-6 w-full max-w-md mx-auto">
            <div className="text-center space-y-2">
                <motion.h1
                    key={isSignUp ? "signup" : "signin"}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                >
                    {isSignUp ? "Begin Your Reign" : "Welcome Back"}
                </motion.h1>
                <p className="text-muted-foreground">
                    {isSignUp ? "Sign up to start your shared journey." : "Enter the kingdom."}
                </p>
            </div>

            <GlassCard className="p-8 space-y-6 shadow-2xl border-white/20">
                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Email Address</label>
                        <Input
                            type="email"
                            placeholder="royal@palace.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background/50 border-input/50 focus:bg-background transition-all h-12"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Password</label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-background/50 border-input/50 focus:bg-background transition-all h-12 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
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
                                className="space-y-2 overflow-hidden"
                            >
                                <label className="text-sm font-medium ml-1">Mobile Number</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 flex items-center gap-2 pointer-events-none">
                                        <span className="text-lg">🇵🇭</span>
                                        <span className="text-sm font-medium text-muted-foreground">+63</span>
                                        <div className="w-px h-4 bg-border/50 mx-1" />
                                    </div>
                                    <Input
                                        type="tel"
                                        placeholder="912 345 6789"
                                        value={phone}
                                        onChange={(e) => {
                                            // Format as 9XX XXX XXXX
                                            let val = e.target.value.replace(/\D/g, '')
                                            if (val.length > 10) val = val.slice(0, 10)
                                            setPhone(val)
                                        }}
                                        className="pl-24 bg-background/50 border-input/50 focus:bg-background transition-all h-12 font-mono tracking-wide"
                                        maxLength={10}
                                        required
                                    />
                                    {phone.length === 10 && phone.startsWith('9') && (
                                        <div className="absolute right-3 text-green-500 animate-in zoom-in">
                                            <Check size={18} />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground ml-1">
                                    Requires a valid Philippines mobile number.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all mt-6"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Create Account" : "Enter Kingdom")}
                    </Button>
                </form>

                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                    >
                        {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                    </button>
                </div>
            </GlassCard>
        </div>
    )
}
