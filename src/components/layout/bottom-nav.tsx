"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

export function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const tabs = [
        { name: "Home", href: "/", icon: "home" },
        { name: "Routines", href: "/routines", icon: "repeat" },
        { name: "Nudge", href: "/nudge", icon: "favorite" },
        { name: "Stats", href: "/analytics", icon: "insights" },
        { name: "Settings", href: "/settings", icon: "settings" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pointer-events-none">
            <div className="fixed left-1/2 -translate-x-1/2 w-[90%] rounded-full bg-surface-container/70 backdrop-blur-3xl shadow-[0_20px_50px_rgba(255,183,125,0.1)] flex justify-around items-center py-3 pointer-events-auto border border-outline-variant/10" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className={cn(
                                "flex flex-col items-center justify-center transition-colors scale-90 active:scale-95 duration-200 relative",
                                isActive 
                                    ? "text-primary drop-shadow-[0_0_8px_rgba(255,183,125,0.5)]" 
                                    : "text-tertiary-fixed-dim/60 hover:text-secondary"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-indicator"
                                    className="absolute inset-0 bg-primary/10 rounded-full -z-10 scale-125"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span 
                                className="material-symbols-outlined text-[28px]" 
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {tab.icon}
                            </span>
                            <span className="font-label text-[10px] font-medium mt-1">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
