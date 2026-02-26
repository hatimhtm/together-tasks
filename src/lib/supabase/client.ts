import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
    if (process.env.NODE_ENV === 'test' && (global as any).__MOCK_SUPABASE__) {
        return (global as any).__MOCK_SUPABASE__
    }
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
