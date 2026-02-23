"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Menu, Home, User, LogOut, Settings, Heart, Sparkles } from "lucide-react"
import Link from "next/link"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { TasksTodayCounter } from "@/components/dashboard/tasks-today-counter"

interface HeaderProps {
    partnerId?: string | null
    userRole?: "king" | "queen" | null
    userId: string
}

export function Header({ partnerId, userRole, userId }: HeaderProps) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
    }

    const menuItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Profile", href: "/profile", icon: User },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-[80px] px-6 flex items-center justify-between pointer-events-none">
            {/* Background Blur */}
            <div className="absolute inset-0 bg-glass-white/80 backdrop-blur-xl border-b border-glass-border pointer-events-auto" />

            {/* Content */}
            <div className="relative z-10 w-full flex items-center justify-between pointer-events-auto">
                <Sheet>
                    <SheetTrigger asChild>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-full hover:bg-black/5"
                        >
                            <Menu className="w-6 h-6 text-foreground/80" />
                        </motion.button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                            <SheetTitle className="text-left text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Together Tasks
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col h-full py-8">
                            <div className="space-y-4 flex-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-4 px-4 py-3 text-lg font-medium rounded-xl hover:bg-primary/10 transition-colors"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="border-t border-border pt-4 mt-auto space-y-2">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-4 text-muted-foreground hover:text-foreground"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <TasksTodayCounter userId={userId} partnerId={partnerId} />

                {/* Safe Decorative Element */}
                <div className="relative p-2 rounded-full cursor-default text-primary overflow-hidden items-center justify-center flex hover:bg-primary/10 transition-colors">
                    <Heart className="w-6 h-6 fill-primary/20 text-primary" />
                </div>
            </div>
        </header>
    )
}
