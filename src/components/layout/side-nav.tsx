"use client"

import { cn } from "@/lib/utils"
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
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-outline-variant/60 bg-surface-container-low">
            {/* Wordmark */}
            <div
                className="flex items-center gap-3 px-6 h-24 shrink-0"
                {...(isTauri ? { "data-tauri-drag-region": "true", style: { paddingTop: "1.25rem" } } : {})}
            >
                <Logo size={30} className="shrink-0" />
                <span className="text-on-surface font-headline font-extrabold text-lg tracking-tight">
                    Together Tasks
                </span>
            </div>

            {/* Destinations */}
            <nav className="flex-1 flex flex-col gap-1 px-4 pt-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "group relative flex items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-200",
                                isActive
                                    ? "bg-primary/12 text-primary border border-primary/20"
                                    : "text-on-surface-variant border border-transparent hover:text-on-surface hover:bg-surface-container"
                            )}
                        >
                            <span
                                className="material-symbols-outlined text-[24px] shrink-0"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {tab.icon}
                            </span>
                            <span className="font-label text-[15px] font-semibold">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer accent */}
            <div className="px-6 pb-6 pt-2">
                <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant/50">
                    Made with love
                </p>
            </div>
        </aside>
    )
}
