"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Bell, Menu, Home, Calendar, Trophy, User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { PartnerNotificationCenter } from "@/components/partner/notification-center"

interface HeaderProps {
    partnerId?: string | null
    userRole?: "king" | "queen" | null
}

export function Header({ partnerId, userRole }: HeaderProps) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
    }

    const menuItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Goals", href: "/goals", icon: Trophy },
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

                <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                        Together Tasks
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                        Today's Plan
                    </span>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-full hover:bg-black/5 relative"
                        >
                            <Bell className="w-6 h-6 text-foreground/80" />
                            {/* We could fetch unread count here later */}
                            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" /> */}
                        </motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                        <div className="p-4 bg-muted/40 border-b">
                            <h4 className="font-medium">Notifications</h4>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto p-2">
                            {partnerId ? (
                                <PartnerNotificationCenter partnerId={partnerId} />
                            ) : (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Link with your partner to see notifications here!
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    )
}
