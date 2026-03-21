# Design System Document

## 1. Overview & Creative North Star: "The Intimate Atelier"

This design system is crafted to transcend the utility of a standard task manager, evolving into a private, digital sanctuary for couples. Our Creative North Star is **"The Intimate Atelier"**—a space that feels bespoke, curated, and deeply personal. 

Unlike the rigid, industrial grids of generic productivity tools, this system embraces **intentional asymmetry** and **tonal depth**. We break the "template" look by layering frosted surfaces over a rich, obsidian void. Elements do not just sit on a screen; they float in a shared atmosphere. The visual language balances professional precision with romantic warmth, ensuring that "King" and "Queen" feel like honored residents of a premium experience rather than mere users of an app.

---

## 2. Colors: Obsidian & Tonal Vibrancy

Our palette is anchored by the `surface` (#161311), a rich, warm "Obsidian" that provides more depth than pure black. 

### The Palette
*   **Primary (King/Gold):** `primary` (#ffb77d) transitions into `primary_container` (#ff8c00). Use this for masculine-coded accents or general leadership actions.
*   **Secondary (Queen/Rose):** `secondary` (#ffb1c7) to `secondary_container` (#b5015e). Use this for feminine-coded accents or celebratory "heart" actions.
*   **Tertiary (Support/Aurora):** `tertiary` (#bac7e2). A calming blue for shared tasks and analytical data.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To define boundaries, designers must use background color shifts. 
*   Place a `surface_container_low` card on a `surface` background.
*   The transition between sections is defined by the contrast of the obsidian tiers, not a 1px stroke.

### The "Glass & Gradient" Rule
Floating navigation bars and high-priority action cards must utilize **Glassmorphism**. Apply a backdrop-blur (minimum 20px) to semi-transparent surface tokens.
*   **Signature Textures:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` to `primary_container` at a 135-degree angle to provide "visual soul."

---

## 3. Typography: Editorial Authority

We use a high-contrast pairing to balance playfulness with class.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Editorial" voices. They should be bold, tracking slightly tighter (-2%), to feel punchy and modern. 
    *   *Example:* `display-lg` for morning greetings or "King/Queen" status updates.
*   **Body & Labels (Inter):** Chosen for its exceptional legibility at small scales. Use `body-md` for task descriptions and `label-sm` for metadata like timestamps.
*   **Hierarchy Note:** Use generous vertical rhythm. A `headline-lg` should have ample "breathing room" (at least `spacing-8`) above and below to maintain its premium, uncluttered feel.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through **physical stacking** rather than traditional drop shadows.

### The Layering Principle
Think of the UI as layers of fine paper. 
1.  **Level 0 (Base):** `surface` (#161311)
2.  **Level 1 (Sections):** `surface_container_low` (#1f1b19)
3.  **Level 2 (Cards):** `surface_container` (#231f1d)
4.  **Level 3 (Pop-ups/Active):** `surface_bright` (#3d3836) with backdrop-blur.

### Ambient Shadows
For floating elements (like the Floating Action Button), use an **Ambient Shadow**:
*   **Blur:** 40px - 60px.
*   **Opacity:** 6% - 10%.
*   **Color:** Tinted with `primary` (Gold) or `secondary` (Rose) depending on the context, creating a soft glow rather than a dark shadow.

### The "Ghost Border" Fallback
If contrast is legally required for accessibility, use a **Ghost Border**: The `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components: Bespoke Elements

### Buttons
*   **Primary:** High-pill shape (`roundedness-full`). Gradient fill (`primary` to `primary_container`). White text for maximum "pop."
*   **Secondary/Ghost:** No fill. `Ghost Border` (15% opacity) with `on_surface` text.

### Cards & Task Lists
*   **Forbid dividers.** To separate tasks, use a `spacing-2` vertical gap.
*   **Interactive State:** On tap, a card should shift from `surface_container` to `surface_container_high`.
*   **Corner Radius:** All cards must use `lg` (2rem/32px) or `xl` (3rem/48px) to feel soft and inviting.

### Navigation (The Glass Bar)
The bottom navigation must be a floating "Island." 
*   **Background:** `surface_container_highest` at 70% opacity.
*   **Effect:** `backdrop-filter: blur(24px)`.
*   **Icons:** Stroke-based (1.5px weight). Active icons receive a subtle outer glow in the theme’s accent color.

### Progress Gauges (Gamification)
Use "Liquid Fill" animations for task completion. As a couple finishes tasks, the `tertiary_container` fills with a gold/rose gradient, mimicking a vessel being filled with shared effort.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a structural element. If in doubt, add more padding.
*   **DO** use emojis sparingly but intentionally to reinforce the "Professional but Romantic" personality.
*   **DO** ensure that the "King" (Gold) and "Queen" (Rose) colors are balanced. Neither should overpower the dark Obsidian base.

### Don't
*   **DON'T** use pure #000000. It kills the depth of the glass effects.
*   **DON'T** use sharp corners. Anything less than `roundedness-md` (24px) is too aggressive for this brand.
*   **DON'T** use standard Material Design "Ripple" effects. Use soft scale-downs (98%) or tonal shifts for touch feedback to maintain a premium feel.
*   **DON'T** use 1px solid dividers. If you feel the need for a line, use a background color change instead.