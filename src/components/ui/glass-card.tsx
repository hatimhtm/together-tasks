"use client"

import { cn } from "@/lib/utils"
import { HTMLMotionProps, motion } from "framer-motion"
import { forwardRef } from "react"

interface GlassCardProps extends HTMLMotionProps<"div"> {
    gradient?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, gradient = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden rounded-2xl border border-glass-border bg-glass-white/70 backdrop-blur-xl shadow-lg transition-all",
                    gradient && "bg-gradient-to-br from-white/40 to-white/10",
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
