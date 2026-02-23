"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User, Crown, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
                setProfile(data)
            }
            setLoading(false)
        }
        getData()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success("Logged out successfully")
        router.refresh()
        router.push("/login")
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>

    return (
        <div className="space-y-6 pb-24 pt-4">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

            <GlassCard className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">
                            {profile?.role === 'king' ? "King Hatim" : profile?.role === 'queen' ? "Queen Enarcylyn" : "Guest"}
                        </h2>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-background/40 border border-white/10 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Theme</p>
                        <p className="font-medium capitalize">{profile?.theme || "Glass (Light)"}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Settings</h3>
                    <Button variant="outline" className="w-full justify-start h-12 gap-3" onClick={() => router.push('/onboarding')}>
                        <Crown size={18} />
                        Retake Onboarding
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 gap-3" onClick={() => router.push('/settings')}>
                        <Settings size={18} />
                        App Settings
                    </Button>
                </div>

                <Button
                    variant="destructive"
                    className="w-full h-12 gap-2 mt-4"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </GlassCard>
        </div>
    )
}
