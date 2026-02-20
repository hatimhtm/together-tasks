import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface Profile {
    id: string
    username: string
    role: "king" | "queen"
    xp: number
    level: number
    avatar_url: string | null
    theme: string
}

export function useRealtimeProfile(userId: string | undefined) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        // Initial fetch
        fetchProfile()

        // Realtime Subscription
        const channel = supabase
            .channel(`profile-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    setProfile(payload.new as Profile)
                }
            )
            .subscribe()

        const handleRefresh = () => fetchProfile()
        window.addEventListener('profile-updated', handleRefresh)

        return () => {
            channel.unsubscribe()
            window.removeEventListener('profile-updated', handleRefresh)
        }
    }, [userId])

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error("Error fetching profile:", error)
        } finally {
            setLoading(false)
        }
    }

    return { profile, loading }
}
