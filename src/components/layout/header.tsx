"use client"

import { motion } from "framer-motion"
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
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 bg-background/70 backdrop-blur-md pointer-events-auto"
            {...(isTauri ? { 'data-tauri-drag-region': 'true' } : {})}
        >
            <div
                className="relative z-10 w-full flex items-center justify-between"
                style={isTauri ? { paddingLeft: '80px' } : undefined}
            >
                {/* User Avatar + Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/15">
                        <img 
                            alt="Avatar" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg-lqUdq3AOZf3fBlfI9qo1vHGqGca5fePYirotlCL8i39sO95lj2OndnXo2LYeTYAO1qAIrD7mCZ7P3p-oh9a9Fjdwo_G0vq841Z2XPTbAf7bfsAlWkAgDNFWvmeIsx1jOdDS49GDJU49_axEX0ILdtxyUP4CDedRcaspQbZQsLqS65UsXIgtjysfcxZzvPwIzO0J1Bxx4Dft-lJBabtABiceO9uh1VtIeIzu31-9Kbb8WqONHLJtD-T304fCGQtMOlb3j6wgELRL" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-primary font-headline font-bold text-xl drop-shadow-[0_0_8px_rgba(255,183,125,0.4)]">
                        Together Tasks
                    </span>
                </div>

                {/* Notifications */}
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="hover:opacity-80 transition-opacity duration-200"
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
