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
                    "relative overflow-hidden rounded-[24px] border transition-all duration-300",
                    variant === "default" && "bg-card/80 backdrop-blur-[40px] border-border/50 shadow-sm hover:shadow-md hover:border-border/70",
                    variant === "clear" && "bg-card/30 backdrop-blur-xl border-border/20 shadow-none",
                    variant === "solid" && "bg-card border-border shadow-lg",
                    gradient && "bg-gradient-to-br from-primary/5 via-transparent to-secondary/5",
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
