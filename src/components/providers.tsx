'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { CapacitorUpdater } from '@capgo/capacitor-updater'

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    }))

    useEffect(() => {
        const init = async () => {
            // Notify the updater the bundle loaded successfully
            try {
                await CapacitorUpdater.notifyAppReady()
            } catch {
                // Not native, ignore
            }

            // Hide splash screen
            try {
                const { SplashScreen } = await import('@capacitor/splash-screen')
                await SplashScreen.hide({ fadeOutDuration: 400 })
            } catch {
                // Not available on web/Tauri
            }
        }
        init()
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    )
}
