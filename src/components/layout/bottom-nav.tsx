"use client"

import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, CheckSquare, Home, Plus, Trophy, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
    const pathname = usePathname()

    const tabs = [
        { name: "Home", href: "/", icon: Home },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Add", href: "#add", icon: Plus, isFab: true },
        { name: "Goals", href: "/goals", icon: Trophy },
        { name: "Me", href: "/profile", icon: User },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe pt-2 px-6 h-[88px] flex items-start justify-center pointer-events-none">
            {/* Background */}
            <div className="absolute inset-0 bg-glass-white/90 backdrop-blur-2xl border-t border-glass-border pointer-events-auto" />

            <div className="relative z-10 w-full max-w-md flex items-center justify-between pointer-events-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href

                    if (tab.isFab) {
                        return (
                            <motion.button
                                key={tab.name}
                                whileTap={{ scale: 0.95 }}
                                className="relative -top-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background/50 backdrop-blur-sm"
                            >
                                <Plus className="w-8 h-8" strokeWidth={2.5} />
                            </motion.button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="relative flex flex-col items-center justify-center w-12 h-12"
                        >
                            <div className="relative p-2">
                                <tab.icon
                                    className={cn(
                                        "w-6 h-6 transition-colors duration-300",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />

                                {/* Active Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                                    />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
