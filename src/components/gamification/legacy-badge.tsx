"use client"

import { motion } from "framer-motion"
import { Crown, Star, Sparkles, Shield } from "lucide-react"
import { useRealtimeProfile } from "@/hooks/use-realtime-profile"
import { cn } from "@/lib/utils"

interface LegacyBadgeProps {
    userId: string
    className?: string
}

const TIER_NAMES = [
    "Initiate",
    "Foundation",
    "Synergy",
    "Harmony",
    "Unity",
    "Legacy"
]

const TIER_COLORS = [
    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",     // 0
    "bg-blue-500/10 text-blue-400 border-blue-500/20",     // 1
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", // 2
    "bg-purple-500/10 text-purple-400 border-purple-500/20",   // 3
    "bg-rose-500/10 text-rose-400 border-rose-500/20",       // 4
    "bg-amber-500/10 text-amber-400 border-amber-500/20",    // 5
]

export function LegacyBadge({ userId, className }: LegacyBadgeProps) {
    const { profile, loading } = useRealtimeProfile(userId)

    if (loading || !profile) return (
        <div className="h-8 w-24 bg-white/5 animate-pulse rounded-full" />
    )

    // Calculate Tier Info
    // Level is stored as 1-based index usually, let's assume level 1 = index 1
    const tierIndex = Math.min(profile.level, 5)
    const tierName = TIER_NAMES[tierIndex] || "Unknown"
    const tierStyle = TIER_COLORS[tierIndex] || TIER_COLORS[0]

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={profile.level} // Re-animate on level up
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors duration-500",
                tierStyle,
                className
            )}
        >
            {/* Icon based on Level */}
            {profile.level >= 5 ? (
                <Crown className="w-3.5 h-3.5 fill-current" />
            ) : profile.level >= 3 ? (
                <Sparkles className="w-3.5 h-3.5" />
            ) : (
                <Shield className="w-3.5 h-3.5" />
            )}

            <div className="flex flex-col leading-none">
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                    Tier {profile.level}
                </span>
                <span className="text-xs font-semibold">
                    {profile.xp} XP
                </span>
            </div>

            {/* Progress Ring (Mini) */}
            {/* We could add a tiny circular progress here later */}
        </motion.div>
    )
}
