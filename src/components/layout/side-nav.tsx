"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { Logo } from "@/components/ui/logo"

const tabs = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Routines", href: "/routines", icon: "repeat" },
    { name: "Nudge", href: "/nudge", icon: "favorite" },
    { name: "Stats", href: "/analytics", icon: "insights" },
    { name: "Settings", href: "/settings", icon: "settings" },
]

export function SideNav() {
    const pathname = usePathname()
    const isTauri = typeof window !== "undefined" && "__TAURI__" in window

    return (
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-outline-variant/10 bg-surface-container-low/60 backdrop-blur-2xl">
            {/* Wordmark */}
            <div
                className="flex items-center gap-3 px-6 h-[88px] shrink-0"
                {...(isTauri ? { "data-tauri-drag-region": "true", style: { paddingTop: "1.25rem" } } : {})}
            >
                <Logo size={30} className="shrink-0" />
                <span className="text-primary font-headline font-bold text-xl drop-shadow-[0_0_8px_rgba(255,183,125,0.4)]">
                    Together Tasks
                </span>
            </div>

            {/* Destinations */}
            <nav className="flex-1 flex flex-col gap-1.5 px-4 pt-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className={cn(
                                "group relative flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="side-nav-indicator"
                                    className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/15"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span
                                className="material-symbols-outlined text-[26px] relative z-10 shrink-0"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {tab.icon}
                            </span>
                            <span className="font-label text-[15px] font-semibold relative z-10">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer accent */}
            <div className="px-6 pb-6 pt-2">
                <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant/40">
                    Made with love
                </p>
            </div>
        </aside>
    )
}
