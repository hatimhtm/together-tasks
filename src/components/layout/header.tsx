"use client"

import { motion } from "framer-motion"
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { PartnerNotificationCenter } from "@/components/partner/notification-center"
import { Logo } from "@/components/ui/logo"

interface HeaderProps {
    partnerId?: string | null
    userRole?: "king" | "queen" | null
    userId: string
    userName?: string | null
    avatarUrl?: string | null
}

export function Header({ partnerId, userRole, userId, userName, avatarUrl }: HeaderProps) {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
    const initial = (userName?.trim()?.[0] || (userRole === "queen" ? "Q" : "K")).toUpperCase()

    return (
        <header
            className="fixed top-0 left-0 right-0 lg:left-64 z-40 flex items-center justify-between px-5 sm:px-6 lg:px-10 pt-safe lg:pt-0 bg-background/70 backdrop-blur-md pointer-events-auto min-h-[72px] lg:min-h-[88px]"
            {...(isTauri ? { 'data-tauri-drag-region': 'true' } : {})}
        >
            <div
                className={`relative z-10 w-full flex items-center justify-between ${isTauri ? "pl-20 lg:pl-0" : ""}`}
            >
                {/* User Avatar + Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/15">
                        {avatarUrl ? (
                            <img
                                alt="Avatar"
                                src={avatarUrl}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="font-headline font-bold text-primary text-base">{initial}</span>
                        )}
                    </div>
                    <Logo size={24} className="shrink-0 lg:hidden" />
                    <span className="text-primary font-headline font-bold text-xl drop-shadow-[0_0_8px_rgba(255,183,125,0.4)] lg:hidden">
                        Together Tasks
                    </span>
                </div>

                {/* Notifications */}
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                aria-label="Notifications"
                                className="hover:opacity-80 transition-opacity duration-200 h-11 w-11 flex items-center justify-center -mr-2"
                            >
                                <span className="material-symbols-outlined text-primary text-[28px]">favorite</span>
                            </motion.button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border bg-surface-container-low/95 backdrop-blur-xl">
                            <SheetTitle className="sr-only">Notifications</SheetTitle>
                            <PartnerNotificationCenter />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
