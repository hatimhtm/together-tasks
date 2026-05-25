'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { CapacitorUpdater } from '@capgo/capacitor-updater'

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Data stays "fresh" for 2 min: revisiting a route inside that
                // window reads straight from cache — no spinner, no refetch.
                staleTime: 2 * 60 * 1000,
                // Keep cached data around for 30 min after a route unmounts so
                // back-navigation is instant.
                gcTime: 30 * 60 * 1000,
                // Realtime subscriptions already keep tasks live; don't thrash
                // the network on every focus/reconnect.
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: 1,
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
