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
                    "relative overflow-hidden rounded-2xl border transition-all duration-300",
                    // Default variant: Standard Glass
                    variant === "default" && "bg-background/60 backdrop-blur-xl border-border/40 shadow-sm hover:bg-background/70",
                    // Clear variant: More transparent, good for overlays
                    variant === "clear" && "bg-background/30 backdrop-blur-md border-border/20 shadow-none",
                    // Solid variant: Less transparent, good for content that needs contrast
                    variant === "solid" && "bg-background/90 backdrop-blur-3xl border-border/60 shadow-md",

                    gradient && "bg-gradient-to-br from-white/10 to-transparent",
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
