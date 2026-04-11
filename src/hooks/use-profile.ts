import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Profile } from "@/types/task"
import { User } from "@supabase/supabase-js"

export function useProfile() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadProfile() {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                if (!isMounted) return

                if (userError || !user) {
                    router.push("/login")
                    return
                }

                setUser(user)

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if (!isMounted) return

                if (profile && !profileError) {
                    setProfile(profile as Profile)
                }
            } catch (error) {
                console.error("Error loading profile:", error)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadProfile()

        return () => {
            isMounted = false
        }
    }, [router, supabase])

    return { user, profile, loading }
}
