"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Loader2, Sparkles, Download } from "lucide-react"
import { checkForUpdate, applyUpdate, CHECK_UPDATE_EVENT, type UpdateInfo } from "@/lib/updater"
import { APP_VERSION } from "@/lib/version"
import { triggerHaptic, triggerHapticSuccess } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

const DISMISS_KEY = "togethertasks:dismissed-update"

// Mounted once in the dashboard layout. Auto-checks GitHub Releases on launch and
// when Settings fires a manual check, then surfaces a bottom-sheet to install.
export function UpdateChecker() {
    const [update, setUpdate] = useState<UpdateInfo | null>(null)
    const [checking, setChecking] = useState(false)

    const run = useCallback(async (manual: boolean) => {
        if (checking) return
        setChecking(true)
        try {
            const info = await checkForUpdate()
            if (info) {
                // On the quiet launch check, respect a previously-dismissed version.
                const dismissed = typeof localStorage !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null
                if (!manual && dismissed === info.version) return
                triggerHapticSuccess()
                setUpdate(info)
            } else if (manual) {
                toast.success(`You're on the latest version (v${APP_VERSION}).`)
            }
        } catch {
            if (manual) toast.error("Couldn't check for updates. Try again later.")
        } finally {
            setChecking(false)
        }
    }, [checking])

    useEffect(() => {
        // Quiet auto-check shortly after launch.
        const t = setTimeout(() => run(false), 4000)
        const onManual = () => run(true)
        window.addEventListener(CHECK_UPDATE_EVENT, onManual)
        return () => {
            clearTimeout(t)
            window.removeEventListener(CHECK_UPDATE_EVENT, onManual)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <AnimatePresence>
            {update && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setUpdate(null)}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-surface-container rounded-t-[2rem] border-t border-outline-variant/15 p-7 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl"
                    >
                        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-outline-variant/30" />

                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">Update available</h2>
                                <p className="text-on-surface-variant text-sm font-body">
                                    v{APP_VERSION} → <span className="text-primary font-semibold">v{update.version}</span>
                                </p>
                            </div>
                        </div>

                        {update.notes && (
                            <div className="max-h-44 overflow-y-auto no-scrollbar rounded-2xl bg-surface-container-low border border-outline-variant/10 p-4 mb-6">
                                <p className="text-on-surface-variant text-[13px] font-body leading-relaxed whitespace-pre-wrap">
                                    {update.notes.slice(0, 600)}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => { triggerHaptic(ImpactStyle.Heavy); applyUpdate(update); setUpdate(null) }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-extrabold text-[15px] shadow-[0_15px_30px_rgba(255,140,0,0.2)] active:scale-[0.98] transition-all uppercase tracking-wider"
                        >
                            <Download className="h-5 w-5" />
                            Update now
                        </button>
                        <button
                            onClick={() => {
                                try { localStorage.setItem(DISMISS_KEY, update.version) } catch {}
                                setUpdate(null)
                            }}
                            className="w-full mt-3 text-on-surface-variant/70 font-label text-xs font-medium py-2 hover:text-on-surface transition-colors"
                        >
                            Later
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
