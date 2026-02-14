"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Moon, Sun, User, Shield, LogOut, ChevronRight } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
                <p className="text-white/60">
                    Customize your experience and manage your profile.
                </p>
            </div>

            {/* Profile Section */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 border-2 border-white/20">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-primary/20 text-xl">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">John Doe</h3>
                        <p className="text-sm text-white/60">Premium Member</p>
                    </div>
                    <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                        Edit Profile
                    </Button>
                </div>

                <div className="space-y-4">
                    <SettingRow
                        icon={<User className="h-5 w-5" />}
                        title="Account Information"
                        description="Update your email and phone number"
                    />
                    <SettingRow
                        icon={<Shield className="h-5 w-5" />}
                        title="Privacy & Security"
                        description="Manage your password and active sessions"
                    />
                </div>
            </GlassCard>

            {/* Appearance */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white/90 px-1">Appearance</h2>
                <GlassCard className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Moon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Dark Mode</h3>
                                <p className="text-sm text-white/60">Easier on the eyes at night</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-medium text-white mb-3">Theme Accent</h3>
                        <div className="flex gap-3">
                            {['bg-rose-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'].map((color) => (
                                <button
                                    key={color}
                                    className={`h-8 w-8 rounded-full ${color} ring-2 ring-offset-2 ring-offset-transparent ring-white/20 hover:scale-110 transition-transform`}
                                />
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white/90 px-1">Notifications</h2>
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Push Notifications</h3>
                                <p className="text-sm text-white/60">Receive updates about new tasks</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </GlassCard>
            </div>

            <Button variant="destructive" className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/20">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
        </div>
    )
}

function SettingRow({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="text-white/60 group-hover:text-white transition-colors">
                    {icon}
                </div>
                <div className="text-left">
                    <p className="font-medium text-white">{title}</p>
                    <p className="text-xs text-white/50">{description}</p>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/70" />
        </button>
    )
}
