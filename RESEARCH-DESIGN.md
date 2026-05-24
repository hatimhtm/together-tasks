# Together Tasks — V3 Visual System Research

Deep research into the visual + interaction design systems of premium productivity apps, mapped to a concrete V3 overhaul for Together Tasks (Next.js 15, Tailwind v4, framer-motion; warm-orange-on-near-black default + 6 more dark themes + 1 light; Material 3 tokens; Material Symbols icons; mobile + desktop).

**Studied:** Linear, Things 3, Todoist, Superlist, Amie, Vercel/Geist, Apple HIG, Material Design 3, Arc/Raycast.

**How to read this:** Each section gives benchmarked guidance with numbers, then a Together Tasks recommendation tagged **P0** (do now, biggest payoff), **P1** (next), **P2** (nice-to-have). The current app already gets a lot right (fluid clamp base, Material 3 token layer, reduced-motion guard, color-mix fallback for old WebViews). The V3 work is mostly *curation and discipline*, not a rebuild.

---

## 0. Current-state snapshot (baseline)

From `src/app/globals.css`:
- **Fonts:** Plus Jakarta Sans (headlines) + Inter (body/label), both via Google Fonts `@import` (render-blocking).
- **Themes:** 7 total — `obsidian` (default, orange-on-#0a0a0a), `daylight` (light), `midnight`, `burgundy`, `aurora`, `ocean`, `rose`. All but daylight are dark.
- **Radii:** 8 / 12 / 16 / 24px (sm/md/lg/xl).
- **Tokens:** shadcn primitives (`--primary`, `--card`, …) bridged into a full Material 3 surface/elevation set via `color-mix`. `--glass-white` / `--glass-border` exist (glassmorphism in use).
- **Type:** fluid root `clamp(15px, 14px + 0.32vw, 19px)`.
- **Motion:** blob/shimmer keyframes; global `* { transition: background-color/border-color .3s }`; reduced-motion collapses everything to ~0ms.

Key risks the research flags: (1) `* { transition }` on every element is wasteful and causes the "everything fades" feel; (2) two display-ish fonts (Jakarta + Inter) is one more than top-tier apps use; (3) 7 themes is past the curation sweet spot; (4) glass tokens need discipline rules so they don't read as 2021-era; (5) Google-Fonts `@import` blocks first paint.

---

## 1. Typography

### Benchmarks
- **Linear** uses **Inter Variable** as the *only* UI typeface (weights 300/400/510/590 — note the in-between 510/590, a variable-font trick for optical tuning), plus **Berkeley Mono** for code/data. Tight negative tracking: **-0.22px at display**, **~-0.11px at body**. Their type ramp: 10,11,12,13,14,15,16,17,20,24,32,48,64,72px; line-heights 1.0–~1.5 depending on size. In the 2024 redesign they introduced **Inter Display** for headings ("more expression") while keeping Inter for body — i.e. *one family, two optical cuts*. [Linear style ref], [Linear redesign]
- **Vercel/Geist** ships **Geist Sans** (UI, tighter than Inter, negative tracking by default) + **Geist Mono**. Token groups: `heading-72…14`, `button-16/14/12`, `label-20…12`, `copy-24…13`. Display sizes (48–64) use **-0.04em tracking** and **~1.15 line-height**; copy uses higher line-height than labels. Each token pre-bakes size+line-height+tracking+weight. [Geist typography]
- **Material 3** scale (Roboto, only Regular/Medium): Display 57/45/36, Headline 32/28/24, Title 22/16/14, Body 16/14/12, Label 14/12/11. Body Large = 16px / line-height 24px / 400. [M3 typography]
- **Things 3** — "typography is perfect," strong hierarchy, generous whitespace; SF-family Apple-native feel. [MacStories], [Cultured Code]
- **Line length:** 45–75 characters is the readability target; ~66 ideal for body columns.

### Together Tasks recommendation
- **P0 — Drop to ONE display family + body, like every top app.** Keep **Inter** for body/label (it's the industry default and already loaded). For headings, either (a) keep **Plus Jakarta Sans** as the deliberate brand voice — it's warmer/rounder than Inter and differentiates from the Linear/Vercel crowd, which suits a "Together" family app — or (b) switch headings to **Inter Display** for a tighter, more system-native look. Recommendation: **keep Jakarta for headings but treat it strictly as display (≥20px only)**; never use Jakarta below 18px. Rationale: two body-weight families fighting at small sizes is the #1 amateur tell; Linear/Geist both run a single body family.
- **P0 — Self-host fonts via `next/font`** instead of the Google `@import` (which render-blocks and costs ~2 round-trips). `next/font/google` for Inter + Jakarta gives zero layout shift, preload, and a `--font-*` variable that plugs straight into your `@theme`.
- **P0 — Define a named token scale** (mirrors Geist's "pre-baked" approach) instead of ad-hoc Tailwind sizes. Suggested ramp (rem on your fluid root):

  | Token | size | line-height | weight | tracking | font |
  |---|---|---|---|---|---|
  | display | 2.25rem (~36px) | 1.1 | 700 | -0.02em | Jakarta |
  | title-lg | 1.5rem (24px) | 1.2 | 600 | -0.015em | Jakarta |
  | title | 1.25rem (20px) | 1.25 | 600 | -0.01em | Jakarta |
  | body-lg | 1rem (16px) | 1.5 | 400 | -0.006em | Inter |
  | body | 0.9375rem (15px) | 1.5 | 400 | -0.006em | Inter |
  | label | 0.8125rem (13px) | 1.35 | 500 | 0 | Inter |
  | caption | 0.75rem (12px) | 1.35 | 500 | 0.005em | Inter |
- **P1 — Adopt subtle negative tracking on headings** (Linear/Geist both do this; it's the single cheapest "designed" upgrade). -0.01 to -0.02em on ≥20px text. Don't track-tighten body below 16px.
- **P1 — Use Inter's variable in-between weights** (510 instead of 500, 590 instead of 600) for buttons/labels — Linear's trick for crisper UI text.
- **P2 — Cap reading columns at ~60–66ch** for any long notes/description field.

---

## 2. Color & theming

### Benchmarks
- **Linear** rebuilt theming on **LCH** (perceptually uniform; "closest color space to the human eye") and reduced **98 per-theme variables to 3 inputs: base, accent, contrast** — everything else is derived. The `contrast` input auto-generates high-contrast accessible variants. They *darkened text in light / lightened text in dark* for better content contrast, and limited chroma in chrome for a "neutral, timeless" feel. Linear is fundamentally a **dark-first** product; light mode is derived. [Linear redesign], [Zapier LCH]
- **Accent discipline:** a saturated accent that pops on white reads washed-out on black, so each accent needs a dark-mode variant shifted lighter/more-saturated to preserve perceptual weight. Accent should mark *one* thing per view (the primary action / active state), not decorate.
- **Material 3** semantic roles (primary/secondary/tertiary/error + container + on- pairs) — your token bridge already implements this. M3's strength is the **`on-*` contract**: every surface token has a guaranteed-legible foreground.
- **WCAG / Apple HIG:** body text **4.5:1**, large text (≥24px or ≥18.7px bold) **3:1**, non-text/UI components **3:1**. Apple states the same thresholds. [Apple Accessibility HIG]
- **How many themes?** Top apps ship **2–4 deliberate themes** (light/dark/system + maybe 1 accent), then let power users pick an *accent hue* rather than full pre-baked palettes (Linear's model). Many full themes dilute QA and brand.

### Together Tasks recommendation
- **P0 — Curate 7 → a tight default set + accent picker.** Keep **3 hero themes**: `obsidian` (dark, the brand), `daylight` (light), and one cool dark (`midnight` *or* `ocean` — pick one, they overlap). Move the rest (`burgundy`, `aurora`, `rose`, and whichever of midnight/ocean you cut) behind an **"accent color" control** rather than full themes, OR keep them as an explicit "More themes" section clearly secondary. Rationale: every studied premium app ships fewer, more-considered themes; 6 dark variants is brand dilution and 7× the contrast-QA surface. This is the highest-leverage taste move.
- **P0 — Audit every theme against WCAG.** Your `--muted-foreground` is `rgba(245,240,232,0.55)` on `#0a0a0a` ≈ **3.0:1** — that *fails* 4.5:1 for body and is borderline even as secondary text. Bump muted-foreground to ~0.62–0.70 alpha (or a solid token) so secondary text clears 4.5:1; verify accents-on-surface clear 3:1 for the active/primary state. Borders at `rgba(...,0.12–0.15)` are fine for decoration but must not be the *only* signal for an interactive boundary.
- **P1 — Move toward Linear's "3 inputs, derive the rest" model.** You already derive surfaces via `color-mix`; formalize it: each theme declares `--base`, `--accent`, `--contrast`, and a single `@theme` layer derives surface-container-low/high/highest and on-* pairs. Cuts per-theme maintenance from ~30 lines to ~3 and guarantees consistency. (`color-mix` in OKLCH ≈ poor-man's LCH — switch your mixes from `in srgb` to `in oklch` for perceptually even elevation steps.)
- **P1 — Semantic priority/status colors, theme-independent.** Don't reuse accent for priority. Define a fixed semantic set that survives theme switches: priority — P1 `--destructive`/red, P2 amber, P3 blue, none neutral; status — overdue red, due-today amber, done green/muted, scheduled blue. Keep these *desaturated in dark* to avoid vibration on near-black. Use a colored *dot or left-border*, not a full fill, so lists stay calm (Todoist/Things pattern).
- **P2 — Add a true high-contrast theme** generated from the `contrast` input (Linear ships these for accessibility).

---

## 3. Spacing & layout

### Benchmarks
- **8pt grid** is near-universal: spacing in multiples of 8 (4 allowed as half-step), line-heights snapped to 4pt baseline. Material explicitly: 8pt component grid + 4pt type baseline. Scale: 4,8,12,16,24,32,48,64. [8pt grid refs], [designsystems.com]
- **Content width:** reading columns ~60–66ch; app shells use a max content width (~720–960px for single-column task lists; full-bleed for boards). Internal-padding ≤ external-margin rule keeps grouping legible.
- **Density:** Linear tested "condensed → spacious" and shipped a fairly *dense* list (≈32–36px row height) because power users scan volume; Things runs *roomier* rows (~44px) for a calm, tactile feel. The right answer depends on persona — a "Together" family/shared app leans **comfortable, not dense**.

### Together Tasks recommendation
- **P0 — Commit to a 4/8 spacing scale and purge odd values.** Tailwind's default spacing is already 4px-based; the discipline is to *only* use 1,2,3,4,6,8,12,16 (=4–64px) and stop hand-tuning. Document it.
- **P0 — Set list-row height to a 44px tap target on mobile, ~40px on desktop pointer.** Matches Apple's 44pt minimum (Section 7) and Things' comfortable feel; gives a calm shared-app rhythm.
- **P1 — Define content max-widths:** single-column list/detail ≤ **720px** centered; board/kanban full-width with **16–24px gutters**; sheet/modal body ≤ **560px**. Card internal padding **16px** (mobile) / **20px** (desktop), gap between cards **12px**.
- **P1 — List as default, cards for boards/highlights only.** Research consistently shows *list density beats card density* for task scanning; reserve cards for kanban columns and dashboard summary tiles. (Matches your project's own "kanban default, spreadsheet on demand" principle.)
- **P2 — Optional density toggle** (comfortable / compact) once layout is stable — Linear-style, low priority.

---

## 4. Components

### Benchmarks
- **Cards/rows:** premium look = **flat surface + 1px hairline border + very soft shadow** (or no shadow in dark, using surface elevation tint instead). Linear/Things avoid heavy drop shadows; elevation is communicated by a *lighter surface*, not a big blur. Radii 8–12px for rows/cards, 16–24px for sheets.
- **Buttons:** one **filled accent primary** per view, **subtle/tonal secondary** (low-chroma container), **ghost/text tertiary**. Heights 32 (sm) / 36 (md) / 44 (touch). Tight tracking, 500/medium weight.
- **Inputs:** 1px border, focus = accent ring (2px) + slight bg shift; 36–44px height; never rely on placeholder as label.
- **Sheets/modals:** mobile = bottom **sheet** with grabber, spring-in from bottom; desktop = centered dialog, scrim ~`rgba(0,0,0,0.4–0.6)`, radius 16–20px. Backdrop blur optional (see glass).
- **Toasts:** bottom-center or top-right, auto-dismiss ~4s, with action; never block; max 1–2 stacked.
- **Empty states:** treat as onboarding — short headline + one-line guidance + a primary CTA (Section 6). NN/g "teachable moment."
- **Command palette:** Raycast/Arc-grade pattern is now expected in premium productivity apps — trigger (⌘K), fuzzy filter, keyboard-only nav, grouped results, footer hints, ⌘1–9 quick actions. **cmdk** is the de-facto React primitive (unstyled, composable). [Raycast], [cmdk/UX patterns]
- **Context menus:** right-click on desktop, long-press on mobile; group destructive last + colored red; show shortcuts inline.
- **Glassmorphism in 2025:** **not dead — but matured.** The consensus: glass is a *material applied selectively*, not a global aesthetic. Apple's "Liquid Glass" adapts tint/opacity/contrast to what's behind it for legibility. Overuse = the thing that made people call it dead. Rule: glass only on **floating/transient** surfaces (command palette, nav bar over content, sheets), never on resting content cards, and always with a solid fallback + enough backdrop contrast to keep text ≥4.5:1. [glassmorphism 2025 refs], [everydayux liquid glass]

### Together Tasks recommendation
- **P0 — Replace heavy shadows with surface-tint elevation in dark themes.** You already derive `surface-container-high/highest`; use those (lighter surface) for raised cards instead of drop shadows. Reserve a *soft* shadow only for truly floating layers (popover/sheet/palette). This is the single biggest "looks premium" lever in dark UI.
- **P0 — Standardize the button trio** (filled / tonal / ghost) with heights 36 desktop / 44 touch, medium weight, 8–10px radius, accent ring focus. Enforce **one filled-accent button per view**.
- **P0 — Discipline the glass.** Keep your `--glass-*` tokens but restrict them to: command palette, mobile bottom nav/sheet, and the top app bar when content scrolls under it. Add a `@supports (backdrop-filter)` guard with a solid `--glass-white` fallback (you already have the color-mix fallback pattern — extend it). Blur ~12–20px, glass bg ≥60% opaque so text stays legible. Remove glass from any resting list/card surface.
- **P1 — Add a command palette (⌘K) with cmdk.** High ROI for a "premium productivity" positioning and your project's keyboard-nav goals: quick-add task, jump to list, switch theme, toggle views. Grouped results + footer shortcut hints + ⌘1–9. This is an *expected* feature at this tier (Linear/Raycast/Todoist all have it).
- **P1 — Mobile = bottom sheet with grabber** for create/edit; desktop = centered dialog. Spring-in (Section 5).
- **P1 — Empty states with personality + one CTA** per list/board (ties to onboarding).
- **P2 — Context menus** (right-click / long-press) with inline shortcut hints, destructive last + red.

---

## 5. Motion & micro-interactions

### Benchmarks
- **Durations:** micro-interactions **120–250ms**; modals/sheets **250–400ms**; framer-motion default is 300ms. Anything >400ms feels sluggish for UI. [Motion docs]
- **Easing:** **easeOut** for enter/exit (responsive feel); **easeInOut** for elements that begin and end on screen (modals). Use **spring physics for transforms** (x/scale — playful, natural), **duration+ease for opacity/color**. Stagger lists to spread cost + reduce cognitive load. Don't animate things that don't earn it. [Motion easing], [perf best practices]
- **The check-off moment is the app's signature.** Things 3 ("liquid smooth," dopamine hit), Superlist (sound + squiggle), Asana (unicorn), the "World's Most Satisfying Checkbox" — completing a task is *the* delight beat. Spring-scale the check + a brief fill/strike, optional subtle haptic on mobile. Reserve confetti for *milestones* (list cleared), not every task. [MacStories], [notbor.ing], [Superlist]
- **Reduced motion:** honor `prefers-reduced-motion` — you already do (good), but it should *reduce*, not *delete*, key affordances (crossfade instead of slide).

### Together Tasks recommendation
- **P0 — Kill the global `* { transition: background-color .3s }`.** It's the source of the "everything fades / glitchy" feel you removed animation for, and it taxes every paint. Replace with intentional transitions on interactive components only (buttons, inputs, theme-root). Theme switch can keep a *scoped* transition on `:root`/body, not `*`.
- **P0 — Codify a motion token set** so it's consistent and tasteful:
  - `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` (enter/exit)
  - `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` (modals)
  - durations: `--motion-fast: 150ms`, `--motion: 220ms`, `--motion-slow: 320ms`
  - framer spring for transforms: `{ type: "spring", stiffness: 400, damping: 32 }`
- **P0 — Make the checkbox the hero interaction.** Spring-scale (1 → 0.85 → 1) on check, accent fill + quick strikethrough, ~200ms; subtle Capacitor haptic on mobile native. This is the highest-delight-per-effort change in the whole V3.
- **P1 — Stagger list entrance** ~30–40ms per row, easeOut, only on first mount / view-change (not on every re-render).
- **P1 — Route/view transitions:** crossfade + 4–8px rise, 220ms; bottom sheets spring up. Keep it subtle.
- **P0 — Reduced-motion: crossfade, don't disable.** Adjust your media query so essential state changes still read (swap slides for opacity), rather than the current near-zero blanket kill.
- **P2 — Milestone confetti** when a list/day is fully cleared (not per-task).

---

## 6. Onboarding

### Benchmarks
- **No hard signup wall** before value — let users see/try first (Hotstar/Canva pattern); personalize to shorten time-to-value; always allow **skip**. [UX Team 2024], [Apxor]
- **Empty states ARE onboarding** — the first list/board a user sees should teach, suggest, and offer a primary action (NN/g "teachable moment"). [UserOnboard], [NN/g]
- **Progressive disclosure** — don't front-load every feature; reveal as needed. [Userpilot]
- Premium first-run = a *seeded example* (sample list/task you can edit or clear) beats an empty void.

### Together Tasks recommendation
- **P0 — Make first-run a seeded "Welcome" list**, not an empty screen — 2–3 example tasks (one already-done so the check delight is discovered immediately), editable/dismissible. Cheapest way to look finished and teach the model.
- **P1 — Rich empty states per surface** (list, board, today): friendly headline + one-line guidance + primary "Add your first task" CTA, using a Material Symbol illustration, not stock art.
- **P1 — Skippable 2–3 step intro** only if you add accounts/sharing; otherwise let the seeded list do the work. Personalize lightly (name, theme pick) — theme selection is a natural, low-friction first-run moment given your 3 hero themes.
- **P2 — Progressive feature hints** (one-time tooltips on first encounter of command palette, swipe actions), respecting reduced-motion and dismissible forever.

---

## 7. Accessibility

### Benchmarks
- **Hit targets:** Apple **44×44pt** minimum; Material **48×48dp**; WCAG 2.2 target-size (AA) 24px min, (AAA) 44px. Use 44px as the floor on touch. [Apple HIG]
- **Contrast:** body **4.5:1**, large text **3:1**, UI components/icons **3:1** (WCAG + Apple agree).
- **Focus:** always-visible focus ring (2px accent, 2px offset); never `outline:none` without replacement; logical focus order; command palette and dialogs must trap + restore focus.
- **Keyboard:** every action reachable by keyboard; ⌘K palette; arrow-key list nav; Esc closes layers.
- **Dynamic Type / zoom:** support text scaling (your fluid clamp helps; ensure layouts reflow at 200% zoom).

### Together Tasks recommendation
- **P0 — Fix the contrast failures from §2** (muted-foreground, accent-on-surface for active states) — this is both polish and compliance.
- **P0 — Visible focus rings everywhere**, keyed to `--ring` (you have the token): 2px ring + 2px offset, on buttons/inputs/rows/links. Verify nothing does `outline:none` bare.
- **P0 — 44px touch targets** on all interactive list controls (checkbox tap area, row, icon buttons) even if the visual glyph is smaller — pad the hit area.
- **P1 — Keyboard nav pass:** arrow-keys move through list rows, Enter opens, Space toggles done, Esc closes sheets; focus trap+restore in dialog/palette.
- **P1 — Screen-reader labels** on icon-only buttons (Material Symbols carry no text) and `aria-checked` on the custom checkbox.
- **P2 — 200% zoom reflow check** + a documented contrast matrix per shipped theme.

---

## Prioritized V3 rollout

**P0 (ship first — taste + correctness, low effort/high payoff)**
1. Self-host fonts (`next/font`); one display family (Jakarta ≥20px only) + Inter body.
2. Named type-scale tokens with negative heading tracking.
3. Curate 7 themes → 3 hero themes + accent picker / clearly-secondary "more".
4. Fix WCAG contrast fails (muted-foreground, active accents); visible focus rings; 44px hit targets.
5. Remove global `* { transition }`; add motion tokens; make the checkbox the hero spring interaction; reduced-motion = crossfade not kill.
6. Dark elevation via surface-tint (not heavy shadows); standardize button trio; discipline glass to floating surfaces only.
7. Seeded "Welcome" first-run list.

**P1 (next)**
- Linear-style "3 inputs derive the rest" theme engine (switch color-mix to OKLCH); semantic priority/status colors.
- Content max-widths + list-default / cards-for-boards; comfortable 44/40px rows.
- Command palette (cmdk, ⌘K); bottom sheets w/ grabber; staggered list entrance; route crossfades.
- Rich empty states; keyboard nav + focus trap; SR labels.

**P2 (polish)**
- Density toggle; high-contrast theme; context menus; milestone confetti; progressive feature hints; 200%-zoom reflow + per-theme contrast matrix.

---

## Sources
- Linear — [How we redesigned the Linear UI (Part II)](https://linear.app/now/how-we-redesigned-the-linear-ui), [Custom Themes changelog](https://linear.app/changelog/2020-12-04-themes), [style/token ref](https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1), [design tokens (FontOfWeb)](https://fontofweb.com/tokens/linear.app)
- Vercel/Geist — [Typography](https://vercel.com/geist/typography), [Geist intro](https://vercel.com/geist/introduction), [Vercel design system breakdown](https://seedflip.co/blog/vercel-design-system)
- Material Design 3 — [Applying type / type scale](https://m3.material.io/styles/typography/applying-type), [M3 You typography cheatsheet](https://medium.com/@vosarat1995/material-3-you-typography-cheatsheet-ffc58c540181)
- Things 3 — [MacStories: Beauty and Delight](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/), [Cultured Code: Things Big and Small](https://culturedcode.com/things/blog/2023/09/things-big-and-small/)
- Superlist / Todoist / Amie — [Superlist](https://www.superlist.com/), [Superlist vs Todoist](https://efficient.app/compare/superlist-vs-todoist), [Todoist features](https://www.todoist.com/features), [Amie](https://amie.so/)
- Apple HIG — [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [HIG home](https://developer.apple.com/design/human-interface-guidelines/), [touch target guidance](https://www.designmonks.co/blog/perfect-mobile-button-size)
- Raycast / Arc / command palette — [Designing a Command Palette](https://destiner.io/blog/post/designing-a-command-palette/), [Command Palette UX pattern](https://uxpatterns.dev/patterns/advanced/command-palette), [awesome-command-palette (cmdk)](https://github.com/stefanjudis/awesome-command-palette), [Raycast for engineers](https://www.pixelmatters.com/insights/raycast-for-software-engineers)
- Motion — [Motion transitions](https://www.framer.com/motion/transition/), [Easing functions](https://motion.dev/docs/easing-functions), [Performant animation best practices](https://app.studyraid.com/en/read/7850/206073/best-practices-for-performant-animations)
- Checkbox delight — [The World's Most Satisfying Checkbox](https://notbor.ing/words/the-most-satisfying-checkbox), [Buttons that Spark Joy](https://frontend.horse/articles/buttons-that-spark-joy/)
- Glassmorphism 2025 — [Glassmorphism & Apple Liquid Glass](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/), [Why Glassmorphism isn't dead (2025)](https://diversewebsitedesign.com.au/why-glassmorphism-isnt-dead-yet-2025-update/), [Passing trend or timeless?](https://www.cccreative.design/blogs/glassmorphism-temporary-design-trend-or-here-to-stay)
- Color/contrast/LCH — [Zapier: LCH for accessibility & prettier colors](https://zapier.com/blog/lch-easier-accessibility-prettier-colors/), [Dark Mode design systems guide (Muzli)](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/), [Why linear design breaks in dark mode](https://chyshkala.com/blog/why-linear-design-systems-break-in-dark-mode-and-how-to-fix-them)
- Spacing/grid — [8pt grid (designsystems.com)](https://www.designsystems.com/space-grids-and-layouts/), [8pt grid system](https://medium.com/design-bootcamp/designing-in-the-8pt-grid-system-f3c1183ea6e8), [spacing best practices (Cieden)](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)
- Onboarding/empty states — [UserOnboard: empty states](https://www.useronboard.com/onboarding-ux-patterns/empty-states/), [Pencil&Paper empty states](https://www.pencilandpaper.io/articles/empty-states), [Best onboarding flows 2024 (UX Team)](https://www.uxteam.com/the-5-best-onboarding-flows-weve-seen-so-far-in-2024/), [Mobile onboarding 2024 (Apxor)](https://www.apxor.com/blog/user-onboarding-examples-2024)
