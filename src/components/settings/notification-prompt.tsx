"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Clock, Calendar, Sparkles, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface NotificationPromptProps {
    userId: string
    userName: string
    onComplete: () => void
}

const TIME_OPTIONS = [
    { label: "7:00 AM", value: "07:00", desc: "Early bird" },
    { label: "8:00 AM", value: "08:00", desc: "Standard" },
    { label: "9:00 AM", value: "09:00", desc: "Relaxed" },
    { label: "10:00 AM", value: "10:00", desc: "Late riser" },
]

export function NotificationPrompt({ userId, userName, onComplete }: NotificationPromptProps) {
    const [visible, setVisible] = useState(true)
    const [briefingTime, setBriefingTime] = useState("08:00")
    const [briefingEnabled, setBriefingEnabled] = useState(true)
    const [weeklyEnabled, setWeeklyEnabled] = useState(true)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    async function requestOsPermission() {
        try {
            const { Capacitor } = await import('@capacitor/core')
            if (Capacitor.isNativePlatform()) {
                const { LocalNotifications } = await import('@capacitor/local-notifications')
                await LocalNotifications.requestPermissions()
            } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission()
            }
        } catch (e) {
            console.warn('Notification permission request failed:', e)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            // If the user opted into any reminder, ask the OS for permission now.
            if (briefingEnabled || weeklyEnabled) {
                await requestOsPermission()
            }

            await supabase
                .from('profiles')
                .update({
                    briefing_time: briefingTime,
                    briefing_enabled: briefingEnabled,
                    weekly_review_enabled: weeklyEnabled,
                    notification_prefs_set: true,
                })
                .eq('id', userId)

            setVisible(false)
            setTimeout(onComplete, 400)
        } catch (e) {
            console.error('Failed to save notification prefs:', e)
        } finally {
            setSaving(false)
        }
    }

    async function handleDismiss() {
        // Mark as set even if dismissed so we don't keep pestering
        await supabase
            .from('profiles')
            .update({ notification_prefs_set: true })
            .eq('id', userId)
        setVisible(false)
        setTimeout(onComplete, 400)
    }

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={handleDismiss}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 32 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/40 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto pb-safe"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                        </div>

                        <div className="px-6 pt-2 pb-8 space-y-6">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                        <Bell className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Stay in the loop</h2>
                                        <p className="text-sm text-muted-foreground">Set up your notifications, {userName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 rounded-full hover:bg-muted/60 transition-colors text-muted-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Morning Briefing Toggle */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground text-sm">Morning Briefing</p>
                                            <p className="text-xs text-muted-foreground">AI summary of your day</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setBriefingEnabled(!briefingEnabled)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${briefingEnabled ? 'bg-primary' : 'bg-muted'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${briefingEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Time Picker */}
                                <AnimatePresence>
                                    {briefingEnabled && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-12"
                                        >
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                What time should I wake you up?
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {TIME_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setBriefingTime(opt.value)}
                                                        className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-center transition-all duration-200 ${briefingTime === opt.value
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.04]'
                                                            : 'bg-muted/40 text-foreground border-border/40 hover:bg-muted/70'
                                                            }`}
                                                    >
                                                        <span className="font-bold text-xs">{opt.label}</span>
                                                        <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-border/30" />

                            {/* Weekly Review Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                                        <Calendar className="h-4.5 w-4.5 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">Weekly Review</p>
                                        <p className="text-xs text-muted-foreground">Sunday summary of your week</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setWeeklyEnabled(!weeklyEnabled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${weeklyEnabled ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${weeklyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:scale-100"
                            >
                                {saving ? "Saving..." : "Save Preferences"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
