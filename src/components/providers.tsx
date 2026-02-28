'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { toast } from 'sonner'

const APP_VERSION = '2.0.7'
const GITHUB_REPO = 'hatimhtm/together-tasks'

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

            // Background OTA check — only on native, only once per session
            try {
                const { Capacitor } = await import('@capacitor/core')
                if (!Capacitor.isNativePlatform()) return
                if (sessionStorage.getItem('ota_checked')) return
                sessionStorage.setItem('ota_checked', '1')

                const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
                    headers: { Accept: 'application/vnd.github.v3+json' }
                })
                if (!res.ok) return
                const release = await res.json()
                const latestVersion = release.tag_name?.replace('v', '')

                if (!latestVersion || latestVersion === APP_VERSION) return

                // Find the web bundle asset
                const bundleAsset = release.assets?.find((a: any) => a.name === 'bundle.zip')
                if (!bundleAsset) return

                // Download silently in background
                const bundle = await CapacitorUpdater.download({
                    url: bundleAsset.browser_download_url,
                    version: latestVersion,
                })

                // Queue for next launch (do not force restart)
                await CapacitorUpdater.next({ id: bundle.id })

                toast.info(`Update v${latestVersion} ready`, {
                    description: 'Restart the app to apply the latest update.',
                    duration: 6000,
                })
            } catch {
                // OTA is non-critical — fail silently
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
