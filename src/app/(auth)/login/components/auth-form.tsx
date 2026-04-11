"use client"

import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { KING_EMAIL, QUEEN_EMAIL } from "@/lib/constants"

interface AuthFormProps {
    isSignUp: boolean
    setIsSignUp: (val: boolean) => void
    loading: boolean
    setLoading: (val: boolean) => void
}

export function AuthForm({ isSignUp, setIsSignUp, loading, setLoading }: AuthFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phone, setPhone] = useState("")
    const [showPassword, setShowPassword] = useState(false)
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
    )
}
