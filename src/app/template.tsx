"use client"

import { motion } from "framer-motion"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  )
}
