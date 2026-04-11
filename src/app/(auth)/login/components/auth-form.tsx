import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Check } from "lucide-react"

interface AuthFormProps {
    isSignUp: boolean;
    setIsSignUp: (val: boolean) => void;
    email: string;
    setEmail: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean) => void;
    handleAuth: (e: React.FormEvent) => void;
}

export function AuthForm({
    isSignUp, setIsSignUp,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    showPassword, setShowPassword,
    handleAuth
}: AuthFormProps) {
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
