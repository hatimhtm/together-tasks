"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Calendar, CheckSquare, Home, Plus, Trophy, User } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const tabs = [
        { name: "Home", href: "/", icon: Home },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Add", href: "#add", icon: Plus, isAction: true },
        { name: "Rewards", href: "/rewards", icon: Trophy },
        { name: "Me", href: "/profile", icon: User },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 pb-safe">
            <div className="flex items-center justify-around h-[60px] max-w-md mx-auto px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href

                    if (tab.isAction) {
                        return (
                            <motion.button
                                key={tab.name}
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 -mt-6 border-4 border-background"
                                onClick={() => {
                                    if (pathname !== "/") {
                                        router.push("/")
                                    } else {
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                        const input = document.querySelector('input[placeholder*="What needs to be done"]') as HTMLInputElement
                                        if (input) input.focus()
                                    }
                                }}
                            >
                                <Plus className="w-6 h-6" strokeWidth={3} />
                            </motion.button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors duration-200",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <tab.icon
                                className="w-6 h-6"
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-medium tracking-wide">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
