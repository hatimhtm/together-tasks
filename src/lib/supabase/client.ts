import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Database } from '@/types/database.types'

// Singleton instance to prevent recreation on every render
let supabase: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
    if (process.env.NODE_ENV === 'test' && (global as any).__MOCK_SUPABASE__) {
        return (global as any).__MOCK_SUPABASE__
    }

    if (!supabase) {
        supabase = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
        )
    }

    return supabase
}
