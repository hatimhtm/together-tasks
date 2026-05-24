"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const themes = [
    { id: 'obsidian', name: 'Obsidian', icon: 'dark_mode', bg: 'bg-surface-container border-primary ring-2 ring-primary bg-gradient-to-br from-primary/10 to-transparent', iconBg: 'bg-surface-container-highest text-primary shadow-xl', text: 'text-on-surface' },
    { id: 'daylight', name: 'Daylight', icon: 'light_mode', bg: 'bg-[#f5f5f5] hover:bg-white border-black/5', iconBg: 'bg-white text-orange-500 shadow-sm', text: 'text-neutral-800' },
    { id: 'midnight', name: 'Midnight', icon: 'nights_stay', bg: 'bg-[#0a192f] hover:brightness-110', iconBg: 'bg-blue-900/50 text-blue-300', text: 'text-blue-100' },
    { id: 'burgundy', name: 'Burgundy', icon: 'palette', bg: 'bg-[#2d0a0a] hover:brightness-110', iconBg: 'bg-red-900/50 text-red-300', text: 'text-red-100' },
    { id: 'aurora', name: 'Aurora', icon: 'eco', bg: 'bg-[#0a2d1a] hover:brightness-110', iconBg: 'bg-green-900/50 text-green-300', text: 'text-green-100' },
    { id: 'ocean', name: 'Ocean', icon: 'waves', bg: 'bg-[#0a232d] hover:brightness-110', iconBg: 'bg-cyan-900/50 text-cyan-300', text: 'text-cyan-100' },
    { id: 'rose', name: 'Rose', icon: 'favorite', bg: 'bg-[#2d0a1b] hover:brightness-110', iconBg: 'bg-pink-900/50 text-pink-300', text: 'text-pink-100' },
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

        if (newTheme === currentDbTheme && !saving) return

        setSaving(newTheme)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ theme: newTheme })
                .eq('id', userId)

            if (error) throw error
        } catch (error) {
            console.error(error)
            toast.error("Failed to save theme to your profile.")
        } finally {
            setSaving(null)
        }
    }

    if (!mounted) return <div className="animate-pulse h-[180px] bg-surface-container rounded-2xl w-full" />

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {themes.map((t) => {
                const isActive = theme === t.id
                return (
                    <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        disabled={saving === t.id}
                        className={cn(
                            "aspect-[4/3] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-colors duration-200 text-left cursor-pointer border active:scale-[0.98]",
                            isActive ? "border-primary ring-2 ring-primary" : "border-outline-variant/60",
                            t.bg
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            t.iconBg
                        )}>
                            {saving === t.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                            )}
                        </div>

                        <div className="mt-auto">
                            <h4 className={cn("font-headline font-bold text-[14px] tracking-wide", t.text)}>
                                {t.name}
                            </h4>
                        </div>

                        {isActive && (
                            <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
