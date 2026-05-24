"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

const tabs = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Routines", href: "/routines", icon: "repeat" },
    { name: "Nudge", href: "/nudge", icon: "favorite" },
    { name: "Stats", href: "/analytics", icon: "insights" },
    { name: "Settings", href: "/settings", icon: "settings" },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pointer-events-none"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
            <div className="mx-auto max-w-md rounded-full bg-surface-container/90 backdrop-blur-xl border border-outline-variant/60 shadow-lg flex justify-around items-center py-2 pointer-events-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors duration-200 active:scale-[0.96]",
                                isActive
                                    ? "text-primary"
                                    : "text-on-surface-variant hover:text-on-surface"
                            )}
                        >
                            <span
                                className="material-symbols-outlined text-[26px]"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {tab.icon}
                            </span>
                            <span className="font-label text-[10px] font-semibold">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
