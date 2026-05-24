"use client"

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

export function Header({ userRole, userName, avatarUrl }: HeaderProps) {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
    const initial = (userName?.trim()?.[0] || (userRole === "queen" ? "Q" : "K")).toUpperCase()

    return (
        <header
            className="fixed top-0 left-0 right-0 lg:left-64 z-40 flex items-center justify-between gap-3 px-5 sm:px-6 lg:px-10 pt-safe lg:pt-0 h-14 lg:h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant/40"
            style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}
            {...(isTauri ? { 'data-tauri-drag-region': 'true' } : {})}
        >
            {/* Mobile: Logo + wordmark. Desktop: sidebar owns the wordmark. */}
            <div className={`flex items-center gap-2.5 lg:opacity-0 lg:pointer-events-none ${isTauri ? "pl-20 lg:pl-0" : ""}`}>
                <Logo size={26} className="shrink-0" />
                <span className="text-on-surface font-headline font-extrabold text-base tracking-tight">
                    Together Tasks
                </span>
            </div>

            {/* Right cluster: notifications + avatar */}
            <div className="flex items-center gap-1.5">
                <Sheet>
                    <SheetTrigger asChild>
                        <button
                            aria-label="Notifications"
                            className="h-10 w-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200 active:scale-[0.96]"
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-outline-variant/60 bg-surface-container-low">
                        <SheetTitle className="sr-only">Notifications</SheetTitle>
                        <PartnerNotificationCenter />
                    </SheetContent>
                </Sheet>

                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/60 shrink-0">
                    {avatarUrl ? (
                        <img
                            alt="Avatar"
                            src={avatarUrl}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="font-headline font-bold text-primary text-sm">{initial}</span>
                    )}
                </div>
            </div>
        </header>
    )
}
