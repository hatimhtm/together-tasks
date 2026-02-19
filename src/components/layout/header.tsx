"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Bell, Trophy } from "lucide-react"
import Link from "next/link"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { LegacyBadge } from "@/components/gamification/legacy-badge"
import { PartnerNotificationCenter } from "@/components/partner/notification-center"

interface HeaderProps {
    partnerId?: string | null
    userRole?: "king" | "queen" | null
    userId: string
}

export function Header({ partnerId, userRole, userId }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-[60px] px-4 flex items-center justify-between pointer-events-none">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/40 pointer-events-auto transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10 w-full flex items-center justify-between pointer-events-auto">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
                        Together Tasks
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* Gamification Badge (XP/Level) */}
                    <LegacyBadge userId={userId} />

                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full hover:bg-muted/50 relative text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Bell className="w-5 h-5" strokeWidth={2.5} />
                                {/* We could fetch unread count here later */}
                                {/* <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" /> */}
                            </motion.button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 overflow-hidden shadow-xl border-border/40 bg-popover/80 backdrop-blur-xl" align="end">
                            <div className="p-4 bg-muted/20 border-b border-border/40">
                                <h4 className="font-semibold text-sm">Notifications</h4>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {partnerId ? (
                                    <PartnerNotificationCenter partnerId={partnerId} />
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-xs">
                                        Link with your partner to see notifications here!
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>
    )
}
