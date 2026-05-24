"use client"

import { motion } from "framer-motion"

// IMPORTANT: animate opacity ONLY. Any transform/filter (scale, blur, y) leaves
// an inline transform on this wrapper, which makes it the containing block for
// every `position: fixed` descendant — that pins the header/bottom-nav to this
// div instead of the viewport (nav ends up buried at the bottom of the page).
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}
