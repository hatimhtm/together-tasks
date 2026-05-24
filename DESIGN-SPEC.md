# Together Tasks — Design System (v3 rebuild)

The whole UI is being rebuilt against this contract. Calm, premium, Apple/Linear-inspired.
Warm orange primary on near-black. Works flawlessly on a 2560px desktop window AND a 390px phone.

## Non-negotiables (the complaints we're fixing)
1. **Responsive, not narrow-only.** Every screen adapts: desktop uses a sidebar + wide centered content; mobile uses a top bar + bottom tab bar + single column.
2. **Background never crops.** One fixed, full-viewport ambient layer behind everything. No positioned blurred orbs, no `animate-blob`. Use the `.app-bg` layer (see globals.css) — a fixed radial gradient that covers any screen size.
3. **No glitchy motion.** No `scale`/`blur` page transitions, no infinite background animations, no framer-motion `layout`/`layoutId` shared-element morphs across routes. Allowed: opacity fades and ≤8px slides, 150–250ms, `ease-out`. Honor `prefers-reduced-motion`.
4. **No heavy backdrop-blur on large surfaces** (it janks). Cards use solid `bg-surface-container`. Blur only on small floating elements (nav pill, toasts) if at all.

## Tokens (use these ONLY — never hardcode hex)
Surfaces: `bg-background`, `bg-surface`, `bg-surface-container`, `bg-surface-container-low`, `bg-surface-container-high`.
Text: `text-on-surface` (primary), `text-on-surface-variant` (secondary/muted), `text-primary` (accent).
Lines: `border-outline-variant`. Accent: `primary` (orange), `secondary`, `accent`. Status: `error`.
Radius: cards `rounded-2xl` (16px), pills/controls `rounded-full`, inputs `rounded-xl`.

## Layout shell
- **Desktop `lg+`**: fixed left **sidebar** `w-64` (Logo + wordmark, 5 nav rows with icon+label+active state). Content wrapper `lg:pl-64`. Inside: a slim top bar (avatar + notifications, right-aligned) and `<main>` centered `max-w-5xl mx-auto`, padding `lg:px-10 lg:pt-10 lg:pb-16`. No bottom bar.
- **Mobile `<lg`**: fixed top app bar (Logo+wordmark left, avatar/notifications right, `h-14` + safe-area). Fixed bottom **tab bar** (5 tabs). `<main>` single column, `px-5`, top padding clears the app bar, bottom padding clears the tab bar.
- Content vertical rhythm: `space-y-6 lg:space-y-8`. Page title: `text-2xl lg:text-3xl font-headline font-extrabold`.

## Components
- **Card**: `rounded-2xl bg-surface-container border border-outline-variant/60 p-5` (solid, no blur). One shared look everywhere.
- **Primary button**: `rounded-full bg-primary text-on-primary font-semibold px-5 h-11 active:scale-[0.98]`.
- **Inputs**: `rounded-xl bg-surface-container-high border border-outline-variant/60 text-on-surface`, never clip text (comfortable line-height + padding; auto-grow textareas reset height then grow).
- **Empty states**: centered icon + title + one-line hint + a single CTA.
- **Grids**: cards/lists flow `grid gap-4 grid-cols-1` and add `xl:grid-cols-2` where it reads well; never a lonely narrow ribbon on desktop.

## Motion rules
- Page mount: opacity 0→1, 200ms. Nothing else global.
- List items: optional fade/slide-up ≤8px, stagger ≤30ms, capped.
- Interactive: `active:scale-[0.98]`, `transition-colors`. No `layout`/`layoutId` across routes.
