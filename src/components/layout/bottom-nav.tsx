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
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
            <div className="flex items-center h-[68px] w-full max-w-md bg-card/95 backdrop-blur-2xl border-t border-border/50 shadow-[0_-1px_20px_rgba(0,0,0,0.12)] pointer-events-auto px-2">
                {/* Left tabs */}
                {tabs.slice(0, 2).map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-indicator"
                                    className="absolute top-0 left-4 right-4 h-[2px] bg-primary rounded-b-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1">
                                <tab.icon
                                    className={cn(
                                        "transition-all duration-200",
                                        isActive
                                            ? "w-[22px] h-[22px] text-primary"
                                            : "w-[22px] h-[22px] text-muted-foreground/70"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                                <span className={cn(
                                    "text-[10px] font-semibold transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground/60"
                                )}>
                                    {tab.name}
                                </span>
                            </motion.div>
                        </Link>
                    )
                })}

                {/* Center FAB */}
                <div className="flex-1 flex items-center justify-center">
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        className="h-[52px] w-[52px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.06)] -mt-4"
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
                        <Plus className="w-6 h-6" strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Right tab */}
                {tabs.slice(2).map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-indicator"
                                    className="absolute top-0 left-4 right-4 h-[2px] bg-primary rounded-b-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1">
                                <tab.icon
                                    className={cn(
                                        "transition-all duration-200",
                                        isActive
                                            ? "w-[22px] h-[22px] text-primary"
                                            : "w-[22px] h-[22px] text-muted-foreground/70"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                                <span className={cn(
                                    "text-[10px] font-semibold transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted-foreground/60"
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
