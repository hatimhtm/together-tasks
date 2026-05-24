# Together Tasks — V3 implementation contract

Research-backed overhaul. Full reports: RESEARCH-UX.md, RESEARCH-COLLAB.md, RESEARCH-DESIGN.md.
Owner decisions: **ownership = assign + shared "I've got this" pool (pull AND push)**; **themes = 3 hero (Obsidian dark, Daylight light, one cool dark) led in the picker, the rest in a "More" group**.

## Global rules (all agents)
- Tokens only (see globals.css). Solid `bg-surface-container` cards; **glass ONLY on floating surfaces** (command palette, mobile sheet, scrolled app bar) — never resting cards.
- Motion: enter = opacity + ≤8px slide, easeOut; durations 150/220/320ms; the **checkbox complete is the one hero spring**. No global transitions, no infinite anims, no cross-route layout morphs. Honor reduced-motion (crossfade, not delete).
- Responsive + fluid (base clamp already set). Desktop content `max-w-2xl`–`3xl` for lists (readable line length); shell already `max-w-6xl`.
- A11y: visible focus rings, ≥44px hit targets, text contrast ≥ WCAG AA.
- Keep ALL logic/data/props; this is presentation + the specific data/perf fixes below.

## Shared token/class names (define once, use everywhere)
- Type scale (Tailwind): page title `text-2xl lg:text-3xl font-headline font-extrabold tracking-tight`; section `text-lg font-headline font-bold`; body `text-sm`/`text-base`; label `text-xs font-medium uppercase tracking-wide text-on-surface-variant`.
- Card: `rounded-2xl bg-surface-container border border-outline-variant/60 p-5`.
- Row (task): `rounded-xl bg-surface-container border border-outline-variant/50 px-4 py-3`.

---
## Agent A — Visual system + shell (owns globals.css + layout shell)
- globals.css: add a named type scale comment; **bump dark themes' `--muted-foreground` to ~0.72 alpha** (current 0.55 fails WCAG); add motion duration/easing CSS vars; switch container color-mix to OKLCH where easy (keep srgb fallback). Curate: leave all 7 theme classes, but the **theme picker** (`src/components/settings/theme-selector.tsx`) leads with Obsidian/Daylight/one cool dark and puts the rest under a "More" disclosure.
- Sidebar (`side-nav.tsx`): **resizable 240–360px via drag handle + collapsible to ~64px icon rail, toggle `⌘/Ctrl+B`, persist width+collapsed to localStorage**; icon-rail shows tooltips. Mobile bottom nav unchanged.
- **Command palette** (`⌘/Ctrl+K`): add `cmdk` (install), a `src/components/command-palette.tsx` mounted in dashboard layout — quick nav to the 5 routes + "New task" + theme switch. Glass surface.
- Header: slim, glass only when scrolled. Buttons: define filled/tonal/ghost trio in `src/components/ui/button.tsx` variants; one filled-accent per view.
- Onboarding (`src/app/onboarding/page.tsx`) + first-run: seed a "Welcome" list with one **pre-completed** task to show the check delight; no empty void.
- Self-hosted fonts already wired (layout.tsx next/font). Don't re-add @import.

## Agent B — Tasks, home, data writes, performance (owns tasks/* + dashboard home + use-realtime-tasks + providers)
- **Single-column task list** (drop `xl:grid-cols-2`), centered `max-w-2xl`. Group into **Today / Upcoming / Anytime** sections; humanize due dates ("Today 7pm", "Tue").
- Task row: checkbox (hero spring on complete) + title + compact meta chips (priority color dot, due, duration). **Subtasks: show `☑ done/total` chip + a thin progress bar; full checklist on expand; preview the first incomplete subtask as a muted line.**
- Quick-add: live parse preview (show parsed title/date/priority as chips before submit); keep auto-grow; never clip.
- **Ownership = assign + pool**: keep Mine/Partner/Shared assign; ADD a shared **pool** (unassigned shared tasks) with one-tap **"I've got this"** to claim (sets assignee = me). Passive ownership on rows: assignee **avatar + color**. Add a Mine/Theirs/Shared/Pool filter.
- Swipe-delete → **Undo toast** (sonner) instead of the destructive modal.
- **Data writes (CRITICAL stats fix)**: on task complete, rely on the new DB trigger for XP/streak (see migration) — but ensure `completed_at`/`completed_by` still set. Read nothing fabricated.
- **Performance**: move page data to **React Query** with `staleTime` + cache so revisits are instant; prefetch routes (`<Link prefetch>` + `queryClient.prefetchQuery` on hover/idle); optimistic task add/complete; skeletons only on true cold load. Wire a shared query layer in `providers.tsx` if needed.

## Agent C — Collaboration, motivation, stats (owns analytics, routines, nudge, weekly-review + their components)
- **Analytics**: read **real `profiles.xp` and `profiles.level`** (add to query) instead of client math; couple charts (donut/fairness/heatmap) **filter `scope='shared'`** for "together" metrics and offer a personal view; remove any fabricated numbers.
- **Gamification restraint**: XP is a quiet accent (small, not loud); **celebration only at milestones** (confetti gated to streak milestones / level-ups, not every task). Levels read from DB.
- **Shared streak**: present a **cooperative couple streak** (advances when both contribute) with **grace day** language; clean streak-chain visual (Streaks-style), not cartoonish.
- **Routines**: keep structurally separate from tasks; clean cadence picker; streak chain per routine. Completion XP/streak handled by migration triggers.
- **Nudge / "thinking of you"**: render the built-but-hidden pulse (pre-set affectionate intents); cap AI nudge ≤1/day, **gift-framed** ("Queen finished the taxes 🎉"), user-controllable in settings; de-gender generic copy.
- **Weekly review**: guided **3-step ritual** (week in numbers → what we did together → one-line shared reflection), AI-prefilled + skippable.

---
## Data layer migration (applied separately to Supabase)
Creates `increment_user_xp(uuid,int)` (so the routine trigger stops relying on a fallback), a task-completion XP trigger, and routine-completion streak handling; analytics then reads `profiles.xp`/`level`. SQL provided to the owner to run.

## Verify (every agent): `npx tsc --noEmit` (ignore *.test.ts), `npm test` (41/41), `CAPACITOR_BUILD=true npm run build`. Commit in your worktree.
