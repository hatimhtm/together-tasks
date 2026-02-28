"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Check, Loader2, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const themes = [
    { id: 'daylight', name: 'Daylight', color: '#f8fafc', icon: '☀️' },
    { id: 'midnight', name: 'Midnight', color: '#080c14', icon: '🌙' },
    { id: 'burgundy', name: 'Burgundy', color: '#150008', icon: '👑' },
    { id: 'aurora', name: 'Aurora', color: '#07080f', icon: '🌌' },
    { id: 'obsidian', name: 'Obsidian', color: '#0a0a0a', icon: '🔥' },
    { id: 'ocean', name: 'Ocean', color: '#040d1a', icon: '🌊' },
    { id: 'rose', name: 'Rose', color: '#0f0a0d', icon: '🌹' },
]

export function ThemeSelector({ userId, currentDbTheme }: { userId: string, currentDbTheme: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [saving, setSaving] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme)

        // Only save to DB if it's different from what we loaded initially
        if (newTheme === currentDbTheme && !saving) return

        setSaving(newTheme)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ theme: newTheme })
                .eq('id', userId)

            if (error) throw error
            toast.success("Theme updated globally!", {
                icon: <Sparkles className="h-4 w-4 text-primary" />
            })
        } catch (error) {
            console.error(error)
            toast.error("Failed to save theme to your profile.")
        } finally {
            setSaving(null)
        }
    }

    if (!mounted) return <div className="animate-pulse h-32 bg-muted/20 rounded-xl w-full" />

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themes.map((t) => {
                const isActive = theme === t.id
                return (
                    <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={cn(
                            "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden",
                            isActive
                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]"
                                : "border-border/50 bg-card/60 hover:bg-card hover:border-primary/50"
                        )}
                    >
                        <div
                            className="w-12 h-12 rounded-full mb-3 shadow-sm border border-black/10 flex items-center justify-center text-xl transition-transform group-hover:scale-110"
                            style={{ backgroundColor: t.color }}
                        >
                            {t.icon}
                        </div>
                        <span className={cn(
                            "font-semibold text-sm transition-colors",
                            isActive ? "text-primary" : "text-foreground"
                        )}>{t.name}</span>

                        {isActive && (
                            <div className="absolute top-2 right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                                <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                            </div>
                        )}
                        {saving === t.id && (
                            <div className="absolute top-2 right-2 h-6 w-6 bg-background/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Loader2 className="h-3 w-3 text-primary animate-spin" />
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
