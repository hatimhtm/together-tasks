'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { CapacitorUpdater } from '@capgo/capacitor-updater'

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }))

    // Notify Capgo when the app bundle fully loads to ensure OTA update applied
    useEffect(() => {
        const initUpdater = async () => {
            try {
                await CapacitorUpdater.notifyAppReady()
            } catch (err) {
                console.warn("CapacitorUpdater skipped automatically (Web Environment)")
            }
        }
        initUpdater()
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    )
}
