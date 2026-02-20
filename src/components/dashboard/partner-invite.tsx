"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeartHandshake, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function PartnerInvite({ partnerId }: { partnerId?: string | null }) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // If already linked, show nothing or a small connected status
    if (partnerId) return null

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            const res = await fetch("/api/partner/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partnerEmail: email })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to link partner")

            toast.success("Partner linked successfully! 💕", {
                description: "All features are now unlocked instantly!"
            })
            router.refresh()

        } catch (error: any) {
            toast.error(error.message || "Failed to link")
        } finally {
            setLoading(false)
        }
    }

    return (
        <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-primary text-xl font-bold">
                        <HeartHandshake className="h-6 w-6 text-pink-500" />
                        <h2>Link with your Partner</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Unlock shared tasks, goals, AI relationship insights, and cute features by entering your partner's account email below. They just need to be registered!
                    </p>
                </div>

                <form onSubmit={handleInvite} className="flex-1 flex gap-2 w-full max-w-sm">
                    <Input
                        type="email"
                        placeholder="partner@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/50 backdrop-blur-sm"
                        required
                    />
                    <Button type="submit" disabled={loading || !email} className="shrink-0 group">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Link</span>
                                <Send className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>
                </form>
            </div>
        </GlassCard>
    )
}
