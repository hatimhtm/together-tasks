"use client"

import { cn } from "@/lib/utils"
import { HTMLMotionProps, motion } from "framer-motion"
import { forwardRef } from "react"

interface GlassCardProps extends HTMLMotionProps<"div"> {
    gradient?: boolean
    variant?: "default" | "clear" | "solid"
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, gradient = false, variant = "default", ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden rounded-[24px] border transition-all duration-500",
                    // Default variant: Deep Frost Spatial Glass
                    variant === "default" && "bg-white/40 dark:bg-black/40 backdrop-blur-[32px] border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-[0_16px_48px_0_rgba(31,38,135,0.1)] hover:-translate-y-1",
                    // Clear variant: Super subtle overlay
                    variant === "clear" && "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-none",
                    // Solid variant: Heavy frosted
                    variant === "solid" && "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-[64px] border-white/60 dark:border-white/20 shadow-lg",

                    gradient && "bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent",
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        )
    }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
