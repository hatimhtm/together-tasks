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
            <div className="flex items-center justify-around h-[64px] min-w-[280px] max-w-[360px] w-[85%] bg-card/90 backdrop-blur-2xl border border-border rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] pointer-events-auto px-4">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href

                    if (tab.isAction) {
                        return (
                            <motion.button
                                key={tab.name}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.85 }}
                                className="relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 -mt-8 border-[3px] border-background"
                                onClick={() => {
                                    triggerHaptic(ImpactStyle.Medium)
                                    if (pathname !== "/") {
                                        router.push("/")
                                    } else {
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                        const input = document.querySelector('textarea[placeholder*="What needs to be done"]') as HTMLTextAreaElement
                                        if (input) input.focus()
                                    }
                                }}
                            >
                                <Plus className="w-7 h-7 relative z-10" strokeWidth={3} />
                            </motion.button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className="relative flex flex-col items-center justify-center w-14 h-full gap-1 group"
                        >
                            <motion.div
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.85 }}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 transition-colors duration-300",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                            >
                                <tab.icon
                                    className="w-[22px] h-[22px]"
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={isActive ? { filter: 'drop-shadow(0 0 6px var(--primary))' } : undefined}
                                />
                                <span className={cn(
                                    "text-[9px] font-bold tracking-wider uppercase transition-opacity",
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    {tab.name}
                                </span>
                            </motion.div>

                            {/* Active Dot Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active-dot"
                                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
                                    style={{ boxShadow: "0 0 8px 1px var(--primary)" }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
