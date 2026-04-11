import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function useProfile() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    if (mounted) router.push("/login")
                    return
                }
                if (mounted) setUser(user)

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if (mounted) setProfile(profile)
            } catch (error) {
                console.error("Error loading profile:", error)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadProfile()

        return () => {
            mounted = false;
        };
    }, [router, supabase])

    return { user, profile, loading, setProfile }
}
