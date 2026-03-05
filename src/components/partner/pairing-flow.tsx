"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Heart, Copy, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

interface Profile {
    id: string
    username: string | null
    role: "king" | "queen"
    partner_id: string | null
}

export function PartnerPairingFlow({ profile }: { profile: Profile }) {
    const router = useRouter()
    const [step, setStep] = useState<"initial" | "generate" | "enter" | "confirm">("initial")
    const [linkCode, setLinkCode] = useState("")
    const [partnerCode, setPartnerCode] = useState("")
    const [partnerName, setPartnerName] = useState("")
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Check if already paired
    if (profile.partner_id) {
        return (
            <GlassCard className="p-8 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mb-4">
                    <Heart className="h-8 w-8 text-white fill-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                    💕 Connected!
                </h3>
                <p className="text-white/70">
                    You're linked with your {profile.role === "king" ? "Queen" : "King"}
                </p>
            </GlassCard>
        )
    }

    // Generate link code for YOUR profile
    const handleGenerateCode = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            // Generate 6-char code securely
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
            let code = ''
            const randomValues = new Uint8Array(6)
            crypto.getRandomValues(randomValues)
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(randomValues[i] % chars.length)
            }

            const { error } = await supabase
                .from('profiles')
                .update({ link_code: code } as any)
                .eq('id', user.id)

            if (error) throw error

            setLinkCode(code)
            setStep("generate")

            toast.success("Code generated!", {
                description: "Share this with your partner"
            })
        } catch (error: any) {
            toast.error(error.message || "Failed to generate code")
        } finally {
            setLoading(false)
        }
    }

    // Check partner's code to link
    const handleCheckCode = async () => {
        if (!partnerCode.trim()) {
            toast.error("Please enter a code")
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { data: partner, error } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('link_code', partnerCode.toUpperCase())
                .single()

            if (error || !partner) {
                throw new Error("Invalid or expired code")
            }

            setPartnerName(partner.username || "Your Partner")
            setStep("confirm")
        } catch (error: any) {
            toast.error(error.message || "Failed to find partner")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmLink = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not logged in")

            const { data: partnerProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('link_code', partnerCode.toUpperCase())
                .single()

            if (!partnerProfile) throw new Error("Partner vanished")

            // Perform Mutual Link
            await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', user.id)
            await supabase.from('profiles').update({ partner_id: user.id }).eq('id', partnerProfile.id)

            // SUCCESS! 🎉
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })

            toast.success("💕 Connected!", {
                description: "You are now linked with your partner"
            })

            // Refresh the page to update UI
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to link")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(linkCode)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            {/* Initial Choice */}
            {step === "initial" && (
                <GlassCard className="p-8">
                    <div className="text-center space-y-6">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
                            <Heart className="h-10 w-10 text-white" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Link with Your Partner
                            </h2>
                            <p className="text-white/70">
                                Choose how you want to connect
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleGenerateCode}
                                disabled={loading}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Generate My Code"
                                )}
                            </Button>

                            <Button
                                onClick={() => setStep("enter")}
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                Enter Partner's Code
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Show Generated Code */}
            {step === "generate" && linkCode && (
                <GlassCard className="p-8">
                    <div className="text-center space-y-6">
                        <h3 className="text-xl font-semibold text-white">
                            Your Link Code
                        </h3>

                        <div className="relative">
                            <div className="text-4xl font-mono font-bold text-primary tracking-widest py-6 px-4 bg-white/5 rounded-xl border-2 border-primary/30">
                                {linkCode}
                            </div>

                            <Button
                                onClick={copyToClipboard}
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-white/70 text-sm">
                                Share this code with your partner.
                            </p>
                            <p className="text-white/50 text-xs">
                                Code expires in 24 hours
                            </p>
                        </div>

                        <Button
                            onClick={() => setStep("initial")}
                            variant="ghost"
                            size="sm"
                        >
                            Back
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* Enter Partner Code */}
            {step === "enter" && (
                <GlassCard className="p-8">
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Enter Partner's Code
                            </h3>
                            <p className="text-white/70 text-sm">
                                Ask your partner to generate a code and share it with you
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                value={partnerCode}
                                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                                placeholder="XXXXXX"
                                className="text-center text-2xl font-mono tracking-widest"
                                maxLength={6}
                            />

                            <Button
                                onClick={handleCheckCode}
                                disabled={loading || partnerCode.length !== 6}
                                className="w-full"
                                size="lg"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Find Partner"
                                )}
                            </Button>

                            <Button
                                onClick={() => setStep("initial")}
                                variant="ghost"
                                size="sm"
                                className="w-full"
                            >
                                Back
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Romantic Confirmation Step */}
            {step === "confirm" && (
                <GlassCard className="p-8 border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.15)] bg-pink-500/5">
                    <div className="space-y-6 text-center">
                        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-xl mb-4 animate-in zoom-in duration-500">
                            <Heart className="h-12 w-12 text-white fill-white animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-400 leading-tight">
                                {partnerName} wants to pair their heart with yours! 💕
                            </h3>
                            <p className="text-muted-foreground">
                                Do you accept this invitation to share your tasks, goals, and journey together?
                            </p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={handleConfirmLink}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 h-12 text-lg font-semibold"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Yes, I Accept! ✨"
                                )}
                            </Button>

                            <Button
                                onClick={() => setStep("enter")}
                                variant="ghost"
                                className="w-full"
                                disabled={loading}
                            >
                                Wait, not yet
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
