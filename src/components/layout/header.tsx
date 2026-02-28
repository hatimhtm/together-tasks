"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { PartnerNotificationCenter } from "@/components/partner/notification-center"

interface HeaderProps {
    partnerId?: string | null
    userRole?: "king" | "queen" | null
    userId: string
}

export function Header({ partnerId, userRole, userId }: HeaderProps) {
    // On macOS Tauri, the traffic lights overlay the top-left, so we add padding to avoid collision
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-[64px] px-6 flex items-center justify-between pointer-events-none"
            {...(isTauri ? { 'data-tauri-drag-region': 'true' } : {})}
        >
            {/* Background Blur */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/30 pointer-events-auto" />

            {/* Content - extra left padding on macOS Tauri to clear traffic lights */}
            <div
                className="relative z-10 w-full flex items-center justify-between pointer-events-auto"
                style={isTauri ? { paddingLeft: '80px' } : undefined}
            >
                {/* Wordmark */}
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent select-none">
                    Together Tasks
                </span>

                {/* Notifications Element */}
                <Sheet>
                    <SheetTrigger asChild>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 rounded-full text-primary hover:bg-primary/10 transition-colors pointer-events-auto"
                        >
                            <Heart className="w-6 h-6 fill-primary/20 text-primary" />
                        </motion.button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border bg-card/95 backdrop-blur-xl">
                        <SheetTitle className="sr-only">Notifications</SheetTitle>
                        <PartnerNotificationCenter />
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
}
