// Pair-specific identifiers — env-gated so personal details never ship in source.
export const KING_EMAIL    = process.env.NEXT_PUBLIC_KING_EMAIL    || ""
export const QUEEN_EMAIL   = process.env.NEXT_PUBLIC_QUEEN_EMAIL   || ""

// Display labels for the two-seat couple. Defaults are generic;
// set NEXT_PUBLIC_KING_LABEL / NEXT_PUBLIC_QUEEN_LABEL to personalise.
export const KING_LABEL    = process.env.NEXT_PUBLIC_KING_LABEL    || "King"
export const QUEEN_LABEL   = process.env.NEXT_PUBLIC_QUEEN_LABEL   || "Queen"

// Optional usernames the legacy code-paths recognise as "the operator" so the
// app can fall back to "Love" instead of showing a raw handle.
export const KING_HANDLES  = (process.env.NEXT_PUBLIC_KING_HANDLES  || "")
    .split(",").map(s => s.trim()).filter(Boolean)
