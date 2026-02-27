import { createClient as createBrowserClient } from './client'

// In a static export (Next.js output: 'export'), there is no server.
// Everything runs on the client. We alias this to the client instance
// so we don't have to refactor thousands of imports instantly.
export async function createClient() {
    return createBrowserClient()
}
