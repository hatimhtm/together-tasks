"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { Home, Plus, Settings, BarChart2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

export function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const tabs = [
        { name: "Home", href: "/", icon: Home },
        { name: "Stats", href: "/analytics", icon: BarChart2 },
        { name: "Add", href: "#add", icon: Plus, isAction: true },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
            <div className="flex items-center justify-around h-[62px] min-w-[280px] max-w-[360px] w-[85%] bg-card/90 backdrop-blur-2xl border border-border/60 rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.18)] pointer-events-auto px-3">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href

                    if (tab.isAction) {
                        return (
                            <motion.button
                                key={tab.name}
                                whileTap={{ scale: 0.82 }}
                                className="relative flex items-center justify-center w-[50px] h-[50px] rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 -mt-7 border-[3px] border-background"
                                onClick={() => {
                                    triggerHaptic(ImpactStyle.Medium)
                                    if (pathname !== "/") {
                                        router.push("/")
                                    } else {
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                        const input = document.querySelector('textarea[placeholder*="What needs to be done"]') as HTMLTextAreaElement
                                        if (input) { input.focus() }
                                    }
                                }}
                            >
                                <Plus className="w-6 h-6 relative z-10" strokeWidth={2.5} />
                            </motion.button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className="relative flex flex-col items-center justify-center w-14 h-full gap-1"
                        >
                            {/* Active background pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-pill"
                                    className="absolute inset-x-0.5 top-1.5 bottom-1.5 rounded-2xl bg-primary/12"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}

                            <motion.div
                                whileTap={{ scale: 0.82 }}
                                className="relative flex flex-col items-center gap-1 z-10"
                            >
                                <tab.icon
                                    className={cn(
                                        "transition-all duration-200",
                                        isActive
                                            ? "w-[22px] h-[22px] text-primary"
                                            : "w-[21px] h-[21px] text-muted-foreground"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                    style={isActive ? { filter: 'drop-shadow(0 0 5px color-mix(in srgb, var(--primary) 70%, transparent))' } : undefined}
                                />
                                <span className={cn(
                                    "text-[9px] font-semibold tracking-wide uppercase transition-all duration-200",
                                    isActive
                                        ? "text-primary opacity-100"
                                        : "text-muted-foreground opacity-0"
                                )}>
                                    {tab.name}
                                </span>
                            </motion.div>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
