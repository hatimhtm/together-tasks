"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"

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

    if (!mounted) return <div className="animate-pulse h-[180px] bg-surface-container-low rounded-xl w-full" />

    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 snap-x">
            {themes.map((t) => {
                const isActive = theme === t.id
                return (
                    <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        disabled={saving === t.id}
                        className={cn(
                            "snap-start shrink-0 w-[140px] aspect-[3/4] rounded-[1.25rem] p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 text-left cursor-pointer",
                            isActive ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background bg-surface-container shadow-[0_0_20px_rgba(255,183,125,0.15)]" : "border ring-0 ring-transparent shadow-sm",
                            isActive ? "bg-gradient-to-br from-primary/10 to-transparent border-transparent" : t.bg,
                            !isActive && !t.bg.includes('border') && "border-outline-variant/10"
                        )}
                    >
                        <div className={cn(
                            "z-10 w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0",
                            isActive ? "bg-surface-container-highest text-primary shadow-xl" : t.iconBg
                        )}>
                            {saving === t.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                            )}
                        </div>
                        
                        <div className="z-10 mt-auto">
                            {isActive && (
                                <motion.p 
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} 
                                    className="text-primary text-[10px] font-bold mb-1 tracking-widest uppercase"
                                >
                                    Selected
                                </motion.p>
                            )}
                            <h4 className={cn("font-headline font-bold text-[15px] tracking-wide", isActive ? "text-on-surface" : t.text)}>
                                {t.name}
                            </h4>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
