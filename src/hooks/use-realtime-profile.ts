import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface Profile {
    id: string
    username: string
    role: "king" | "queen"
    avatar_url: string | null
    theme: string
    streak: number
    partner_id: string | null
    has_completed_onboarding: boolean
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
                (payload: any) => {
                    setProfile(payload.new as Profile)
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
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
