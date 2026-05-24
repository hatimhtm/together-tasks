# Together Tasks — UX/UI Research & Prioritized Recommendations

**Date:** 2026-05-25
**Scope:** Couple's task manager. Tasks have title, priority, urgency/importance, due date, duration estimate, and **subtasks**. Desktop sidebar layout + mobile bottom nav. Next.js + Tailwind + framer-motion.
**Method:** Web research across Things 3, Todoist, TickTick, Linear, Superlist, Amie, Sunsama, Microsoft To Do, Notion, Apple Reminders, Height, Akiflow — plus typography/readability and swipe-gesture UX literature. All claims sourced inline.

---

## Current state of Together Tasks (from the codebase)

Grounding the recommendations in what's actually built today (`src/components/tasks/task-list.tsx`, `task-item.tsx`, `src/components/layout/side-nav.tsx`):

- **List layout:** `grid gap-4 grid-cols-1 xl:grid-cols-2` — i.e. a **2-per-row grid on wide (xl ≥ 1280px) screens**. There is no max content width on the list.
- **Subtasks:** completely **hidden until a task row is expanded**. No count, no progress, no preview on the collapsed row. (The "Checklist" block only renders inside `isExpanded`.)
- **Sidebar:** fixed `w-64` (256px), `hidden lg:flex`, not resizable, not collapsible. Mobile uses a bottom nav (`bottom-nav.tsx`).
- **Row design:** card style (rounded-2xl, border, padding `p-5`), circular checkbox color-coded by priority, metadata as small uppercase pill chips (due/duration/emergency/importance/shared), chevron to expand, priority badge for urgent/high only.
- **Already good:** swipe-to-complete / swipe-to-delete on mobile via framer-motion drag with haptics + confetti; optimistic updates; collapsible "completed" section.

The biggest divergences from best-in-class apps are the **2-column grid**, the **no-subtask-preview**, and the **non-adjustable sidebar**. Those are the three highest-leverage changes.

---

## Q1. Task list layout — single column vs multi-column grid?

**Verdict: switch to a single column. Constrain its width. Reserve multi-column for board/Kanban only — and only as an opt-in view, not the default list.**

Every leading *list-first* task app renders its primary task list as a **single vertical column**, not a grid of cards:

- **Things 3** — single-column list; the sidebar is a separate organizational rail that can be collapsed ("Slim Mode"). Task details (incl. checklists) are "neatly tucked away" and only shown when you open a to-do. ([Cultured Code — Things features](https://culturedcode.com/things/features/))
- **Todoist** — its **List layout** "presents tasks and sections of a project in a list, with the first task displayed at the top and every succeeding task placed below it." A grid only appears in the **Board layout**, where "tasks are displayed as cards and each section is displayed as a column" — i.e. a Kanban board, not a multi-column list. ([Use the list layout](https://www.todoist.com/help/articles/use-the-list-layout-in-todoist-AMAhHMVRH), [Use the board layout](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI))
- **TickTick, Microsoft To Do, Apple Reminders, Sunsama, Akiflow, Amie** — all default to a single vertical list/agenda. Amie specifically is praised for "generous white space that prevents visual overload." ([AI Tech Story — Amie review](https://www.aitechstory.com/2025/05/30/amie-so-review-a-fresh-take-on-productivity-and-time-management/))

**When multi-column is used:** only as a **board / Kanban** view, where each column = a *status or section* (To Do / Doing / Done), and a card holds a whole task. Todoist, Linear, Height, and Notion all offer board views as an *alternative* to the list, switchable per project. ([Todoist Boards](https://www.todoist.com/inspiration/kanban-board)) A 2-per-row grid of unrelated task cards (what Together Tasks does now) is neither a list nor a board — it loses the vertical scannability of a list without gaining the semantic columns of a board.

**Ideal max content width / line length:** the reading-research consensus is **50–75 characters per line, with ~66 the sweet spot**; WCAG 1.4.8 caps at 80. ([Baymard — line length readability](https://baymard.com/blog/line-length-readability), [UXPin — optimal line length 2026](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/)) For a task list (title + chips, not body prose) that maps to roughly **`max-w-2xl` (672px) to `max-w-3xl` (768px)** for the list column, centered, with the sidebar handling the rest of the viewport. This keeps titles scannable and stops chips from drifting far from the checkbox on ultra-wide monitors.

> **Recommendation:** Single-column list, `max-w-2xl`–`max-w-3xl`, centered in the content area. If you ever want density on ultra-wide, add an explicit **Board** view toggle (status columns), not a 2-per-row card grid.

---

## Q2. Subtask display in the list

**Verdict: surface a lightweight subtask signal on the collapsed row — a progress chip like `▣ 1/3` (and optionally a 1–2px progress bar) — but keep the full checklist behind expand. Optionally preview the *first incomplete* subtask as one muted line.**

What the leading apps actually do:

- **Things 3** — checklists live *inside* a to-do; the list row does **not** show individual checklist items. You "open a to-do" to see them. So Things hides the items — but Things' checklists are deliberately lightweight sub-steps, not first-class tasks. ([Cultured Code — features](https://culturedcode.com/things/features/), [Break Down Multistep Tasks](https://apps.apple.com/us/story/id1437833617))
- **Todoist** — in **Board** view, subtasks are **not** on the card; you "click or tap on the task card to pull up the full task view, including sub-tasks and comments." In **List** view, subtasks are real tasks that nest as indented rows under their parent. ([Use the board layout](https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI))
- **TickTick** — subtasks are first-class (5 levels deep), each with its own due/priority, and **completion of check-items drives a task progress indicator** you can mark/see. ([Multilevel Tasks](https://help.ticktick.com/articles/7055782219767349248), [Task progress](https://support.ticktick.com/hc/en-us/articles/360016494251-Task-progress))
- **Notion** — the canonical pattern is a **"Percent Checked" rollup rendered as a progress Bar** on the parent task row (sub-items relation → percent complete → display as bar). This is the most explicit "subtask progress on the row" pattern in the set. ([Notion — sub-tasks & dependencies](https://www.notion.com/help/guides/tasks-manageable-steps-sub-tasks-dependencies), [Red Gregory — progress bar for nested tasks](https://www.redgregory.com/notion/2020/11/13/notion-timeline-build-a-progress-bar-for-nested-tasks))
- **Apple Reminders** — subtasks display "right below your task," nested inline, so the parent context and steps are visible together. ([MakeUseOf — Reminders vs To Do](https://www.makeuseof.com/apple-reminders-vs-microsoft-to-do-mac/))
- **Superlist** — unlimited nesting; when sorted by list, subtasks now correctly appear under their parent. Praised for "clean and organized layout" that "resists feature bloat." ([The Organized Notebook — Superlist review 2025](https://theorganizednotebook.com/blogs/blog/superlist-best-task-management-app-review-tutorial-2025))

**Synthesis — best pattern for surfacing subtasks without clutter:**
1. On the **collapsed row**, show a single small chip: a checklist glyph + `done/total` (e.g. `☑ 1/3`). This is the Notion/TickTick "progress at a glance" idea distilled to one chip — zero added height.
2. Optionally render a **thin (1–2px) progress bar** under the title (Notion's "Percent Checked → Bar" pattern) for an instant visual of how far along a task is.
3. Optionally preview the **first incomplete subtask** as one muted, truncated line under the title (Apple Reminders' "show the next step" feel) — gives a hint of *what's next* without dumping the whole list.
4. Keep the **full interactive checklist behind expand** (where Together Tasks already has a polished checklist UI). Things, Todoist-board, and Superlist all gate the full list behind opening the task — that's the right default.

> **Recommendation:** Add `☑ done/total` chip to the metadata row (only when `subtasks.length > 0`) + a 2px progress bar. Keep the existing expand-to-edit checklist. The first-incomplete-subtask preview line is a nice P2 polish.

---

## Q3. Sidebar behavior

**Verdict: make the sidebar both collapsible (icon-only rail) and resizable, with the width persisted. This is now the de-facto standard set by Linear and the shadcn sidebar primitive.**

- **Linear** — the sidebar is **collapsible**: "press the `[` keyboard shortcut, click on the sidebar border, or search 'Collapse' in the command menu." Clicking the *border* to collapse implies the border doubles as the affordance. ([Linear changelog — collapsible sidebar](https://linear.app/changelog/unpublished-collapsible-sidebar))
- **shadcn/ui sidebar** (directly relevant — Together Tasks uses shadcn-style primitives) ships the exact pattern to copy: **`SidebarRail` is a drag handle to resize**, **`SidebarTrigger` toggles collapsed/expanded**, the **`cmd/ctrl+B`** shortcut toggles it, collapsed mode is **icon-only with tooltips**, and **state persists via cookie**. ([shadcn/ui — Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar))
- **Resizable sidebar implementations** in this ecosystem standardize on: drag-to-resize, smooth collapse transition, **persisted width (cookie/localStorage)**, keyboard shortcut, and tooltips when collapsed. ([Shadcn Resizable Sidebar](https://github.com/lumpinif/shadcn-resizable-sidebar))
- **Things 3** — "Slim Mode" collapses the sidebar; on iPad you can swipe it away entirely — same idea, native flavor. ([Cultured Code — features](https://culturedcode.com/things/features/))

**Widths:** Together Tasks currently uses `w-64` = **256px**, which is squarely in the normal range. shadcn's default expanded sidebar is **16rem (256px)** with an icon rail around **3rem (48px)** collapsed. A sensible **resize range is ~240–360px**, persisted.

> **Recommendation (desktop):** Keep 256px default. Add (a) a drag handle on the right border to resize within **240–360px**, persisted to `localStorage` (e.g. `togethertasks.sidebar.width`); (b) a collapse toggle to an **icon-only ~64px rail** with tooltips, also persisted; (c) `cmd/ctrl+B` to toggle.
> **Responsive:** below `lg`, the sidebar is already replaced by the **bottom nav** — keep that. Between collapsed-rail and bottom-nav there's no tablet gap to worry about given current breakpoints. Auto-collapse to the rail under ~1100px is a nice-to-have.

---

## Q4. Density & row design

**Comfortable-but-tight rows beat both extremes.** TickTick is explicitly praised for "high information density … view a large number of events and details without scrolling" ([TidBITS — TickTick](https://tidbits.com/2025/08/14/ticktick-provides-a-focused-daily-task-list-and-more/)), while Amie/Sunsama win on calm whitespace ([AI Tech Story — Amie](https://www.aitechstory.com/2025/05/30/amie-so-review-a-fresh-take-on-productivity-and-time-management/), [Sunsama — daily planning](https://help.sunsama.com/docs/daily-planning)). For a *couple's* app leaning warm/elegant, lean comfortable but trim the current `p-5` card padding so more tasks fit above the fold.

**What belongs on the row vs hidden:**
- **On the row:** title, checkbox, due date, duration, a priority signal, the shared/partner indicator, and (new) the subtask progress chip. Together Tasks already shows due/duration/emergency/importance/shared as chips — that's the right set; it's just slightly chip-heavy (up to 5 pills). Consider collapsing emergency+importance into the single derived `priority` most of the time and only showing the raw urgency/importance chips on expand.
- **Hidden until expand:** description/notes, the full subtask checklist, the priority/urgency/importance editors, edit/delete actions. This matches Things ("tucked away until you need them") and Todoist board (open card for details).

**How priority/due/duration are shown:**
- **Priority** — best practice is a **single restrained color cue**, not a loud badge. Linear/Todoist use a small colored dot/flag; Things uses subtle styling. Together Tasks already color-codes the **checkbox border by priority** (great, low-clutter) — keep that and drop the redundant uppercase `URGENT/HIGH` text badge to a small dot on the collapsed row.
- **Due date** — chip with an icon; **turn red when overdue** (Together Tasks already does `isOverdue → text-error`). Good. Consider humanizing ("Today 3pm", "Tomorrow", "Fri") rather than always `MMM d, h:mm a`.
- **Duration** — small `timer` chip with `Nm` is fine and matches calendar-planners' time-estimate convention (Sunsama/Akiflow center planning on time estimates). ([Sunsama daily planning](https://help.sunsama.com/docs/daily-planning))

**Checkbox placement:** **leading (left of title)**, circular, is the universal convention (Things, Todoist, Reminders, TickTick) — Together Tasks already does this. Keep.

**Hover affordances:** reveal secondary actions (delete, edit, drag handle) on hover only, like the completed-section trash icon already does (`opacity-0 group-hover:opacity-100`). Extend that to the active row so the chevron/actions aren't always-on visual noise on desktop, while staying tap-reachable on mobile.

---

## Q5. Quick capture, grouping, gestures, keyboard

**Quick capture.** The gold standard is **Todoist's natural-language quick-add**: one input parses date, time, priority, and project in real time with a live preview, opened with **`Q`** in-app and a **global `cmd/ctrl+shift+A`**. ([Use Task Quick Add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz), [Calmevo — NLP guide](https://calmevo.com/todoist-natural-language-input-guide/)) Together Tasks already has a `quick-add.tsx` + AI `task-parser` + voice button — so the capability exists; the win is **a global keyboard shortcut to focus it** and a **live parse preview** of what was detected (due/priority/duration). Things-style "paste a bulleted list → each line becomes a checklist item" is a delightful, cheap subtask-capture trick. ([Break Down Multistep Tasks](https://apps.apple.com/us/story/id1437833617))

**Grouping.** Two dominant philosophies:
- **Things' time-buckets** — **Today / Upcoming / Anytime / Someday**, mutually exclusive, with inactive items visually receding and a **Logbook** archive for completed. This is excellent for reducing overwhelm — ideal for a couple's app. ([Cultured Code — Today/Upcoming/Anytime/Someday](https://culturedcode.com/things/support/articles/4001304/))
- **Todoist's sections** — user-defined sections within a project, sortable/groupable by date, priority, etc. ([Sort or group tasks](https://www.todoist.com/help/articles/sort-or-group-tasks-in-todoist-WFWD0hrb))

For Together Tasks, the **Today / Upcoming / Anytime** grouping (plus the existing collapsed "Completed") is the simpler, calmer fit and pairs naturally with the due-date data you already store.

**Swipe gestures (mobile).** Together Tasks already implements swipe-right-complete / swipe-left-delete with haptics — matching **Microsoft To Do** (swipe to delete, swipe to add to My Day) and the established pattern. ([Microsoft To Do iOS tips](https://techcommunity.microsoft.com/blog/to-doblog/six-tips-to-get-the-most-out-of-microsoft-to-do-in-ios/2256864)) Best-practice guardrails to verify against your impl: **limit to 1–2 actions, show an icon + colored background that grows with the swipe, give clear feedback, and offer Undo for destructive actions** (NN/g + LogRocket). ([NN/g — contextual swipe](https://www.nngroup.com/articles/contextual-swipe/), [LogRocket — swipe-to-delete](https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/)) **Action:** the current swipe-left immediately fires `onDelete()` (which opens the confirm dialog) — that's acceptable, but a **swipe → Undo toast** is the smoother modern pattern than a modal confirm. Reserve the modal for the explicit trash button.

**Keyboard shortcuts (desktop) worth adopting** (Linear/Todoist conventions):
- `Q` or `C` / `cmd+N` — new task / quick add ([Todoist quick add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz))
- `[` and/or `cmd/ctrl+B` — toggle sidebar ([Linear](https://linear.app/changelog/unpublished-collapsible-sidebar), [shadcn](https://ui.shadcn.com/docs/components/radix/sidebar))
- `Enter` to open/expand the focused task, `↑/↓` to move focus, `Space`/`E` to complete, `#`/`1–4` to set priority — Linear-style single-key actions on the focused row.
- `cmd/ctrl+K` command palette (Linear/Superlist standard) — optional P2.

---

## Prioritized implementation list

Each item: change · one-line rationale · source.

### P0 — make it feel best-in-class (highest leverage, low risk)

1. **Replace the `xl:grid-cols-2` grid with a single column, centered, `max-w-2xl` (≈672px).**
   Single-column lists are the universal standard for scannability; a 2-per-row card grid is neither a list nor a board. ([Todoist list layout](https://www.todoist.com/help/articles/use-the-list-layout-in-todoist-AMAhHMVRH), [Cultured Code](https://culturedcode.com/things/features/), [Baymard line length](https://baymard.com/blog/line-length-readability))

2. **Add a subtask progress chip `☑ done/total` to the collapsed metadata row** (only when `subtasks.length > 0`).
   Surfaces progress at a glance without expanding — TickTick/Notion progress pattern distilled to one chip. ([TickTick task progress](https://support.ticktick.com/hc/en-us/articles/360016494251-Task-progress), [Notion progress bar](https://www.notion.com/help/guides/tasks-manageable-steps-sub-tasks-dependencies))

3. **Add a thin (1–2px) subtask progress bar under the title.**
   Notion's canonical "Percent Checked → Bar" on the parent row; instant visual completeness cue. ([Red Gregory — progress bar](https://www.redgregory.com/notion/2020/11/13/notion-timeline-build-a-progress-bar-for-nested-tasks))

4. **Make the sidebar collapsible to a ~64px icon rail (tooltips) AND resizable 240–360px, both persisted to localStorage; bind `cmd/ctrl+B` (and `[`).**
   The Linear / shadcn de-facto standard; users expect to adjust and remember sidebar width. ([Linear](https://linear.app/changelog/unpublished-collapsible-sidebar), [shadcn sidebar](https://ui.shadcn.com/docs/components/radix/sidebar))

### P1 — usability gains

5. **Trim row padding `p-5 → ~p-4`/`py-3.5` and reduce chip count on collapsed rows** (priority as a dot, not an uppercase badge; show raw urgency/importance only on expand).
   Comfortable-but-tight density fits more above the fold without clutter; single color cue for priority is best practice. ([TidBITS — TickTick density](https://tidbits.com/2025/08/14/ticktick-provides-a-focused-daily-task-list-and-more/), [Cultured Code](https://culturedcode.com/things/features/))

6. **Group the list into Today / Upcoming / Anytime sections** (keep the existing collapsed "Completed").
   Things' time-bucket model reduces overwhelm and matches your due-date data — calm, couple-friendly. ([Cultured Code — Today/Upcoming/Anytime/Someday](https://culturedcode.com/things/support/articles/4001304/))

7. **Humanize due dates** ("Today 3pm" / "Tomorrow" / weekday) instead of always `MMM d, h:mm a`.
   Matches agenda/planner apps; faster to parse. ([Sunsama daily planning](https://help.sunsama.com/docs/daily-planning))

8. **Global quick-add shortcut + live parse preview** (focus existing `quick-add` with `Q`/`cmd+N`; show detected due/priority/duration chips as you type).
   Todoist's NLP quick-add is the capture gold standard; the preview builds trust in the parse. ([Todoist quick add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz), [Calmevo NLP guide](https://calmevo.com/todoist-natural-language-input-guide/))

9. **Swap the swipe-left delete confirm modal for a swipe → Undo toast** (keep the modal only for the explicit trash button).
   Modern destructive-action UX favors instant action + Undo over a confirm dialog. ([NN/g contextual swipe](https://www.nngroup.com/articles/contextual-swipe/), [LogRocket swipe-to-delete](https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/))

### P2 — polish & power-user

10. **Preview the first incomplete subtask as one muted, truncated line under the title.**
    Apple Reminders' "show the next step" feel — hints at *what's next* without expanding. ([MakeUseOf — Reminders](https://www.makeuseof.com/apple-reminders-vs-microsoft-to-do-mac/))

11. **Keyboard navigation on the list:** `↑/↓` focus, `Enter` expand, `Space`/`E` complete, `1–4` set priority.
    Linear-style single-key row actions for desktop speed. ([Linear shortcuts](https://linear.app/changelog/unpublished-collapsible-sidebar))

12. **Paste-a-bulleted-list → auto-create subtasks** in the editor.
    Things' delightful checklist-capture trick; near-free to implement. ([Break Down Multistep Tasks](https://apps.apple.com/us/story/id1437833617))

13. **Reveal secondary row actions (edit/delete/drag) on hover only** on desktop (extend the existing `group-hover` pattern from the completed section).
    Cuts always-on visual noise; standard hover affordance. ([Cultured Code](https://culturedcode.com/things/features/))

14. **Optional `cmd/ctrl+K` command palette** and an opt-in **Board view** (status columns) for users who want it.
    Linear/Superlist command-palette norm; board is the *only* legitimate multi-column layout. ([Todoist Boards](https://www.todoist.com/inspiration/kanban-board))

---

## Sources

- Cultured Code — Things features: https://culturedcode.com/things/features/
- Cultured Code — Today/Upcoming/Anytime/Someday: https://culturedcode.com/things/support/articles/4001304/
- Apple App Store — Break Down Multistep Tasks With Things 3: https://apps.apple.com/us/story/id1437833617
- Todoist — Use the list layout: https://www.todoist.com/help/articles/use-the-list-layout-in-todoist-AMAhHMVRH
- Todoist — Use the board layout: https://www.todoist.com/help/articles/use-the-board-layout-in-todoist-AiAVsyEI
- Todoist — Boards / Kanban: https://www.todoist.com/inspiration/kanban-board
- Todoist — Sort or group tasks: https://www.todoist.com/help/articles/sort-or-group-tasks-in-todoist-WFWD0hrb
- Todoist — Use Task Quick Add: https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz
- Calmevo — Todoist natural language input guide: https://calmevo.com/todoist-natural-language-input-guide/
- TickTick — Multilevel Tasks: https://help.ticktick.com/articles/7055782219767349248
- TickTick — Task progress: https://support.ticktick.com/hc/en-us/articles/360016494251-Task-progress
- TidBITS — TickTick focused daily list: https://tidbits.com/2025/08/14/ticktick-provides-a-focused-daily-task-list-and-more/
- Linear — Collapsible sidebar changelog: https://linear.app/changelog/unpublished-collapsible-sidebar
- shadcn/ui — Sidebar: https://ui.shadcn.com/docs/components/radix/sidebar
- shadcn Resizable Sidebar (lumpinif): https://github.com/lumpinif/shadcn-resizable-sidebar
- Superlist review 2025 — The Organized Notebook: https://theorganizednotebook.com/blogs/blog/superlist-best-task-management-app-review-tutorial-2025
- Amie review — AI Tech Story: https://www.aitechstory.com/2025/05/30/amie-so-review-a-fresh-take-on-productivity-and-time-management/
- Sunsama — Daily planning: https://help.sunsama.com/docs/daily-planning
- Microsoft To Do — iOS tips (swipe gestures): https://techcommunity.microsoft.com/blog/to-doblog/six-tips-to-get-the-most-out-of-microsoft-to-do-in-ios/2256864
- MakeUseOf — Apple Reminders vs Microsoft To Do: https://www.makeuseof.com/apple-reminders-vs-microsoft-to-do-mac/
- Notion — Sub-tasks & dependencies: https://www.notion.com/help/guides/tasks-manageable-steps-sub-tasks-dependencies
- Red Gregory — Notion progress bar for nested tasks: https://www.redgregory.com/notion/2020/11/13/notion-timeline-build-a-progress-bar-for-nested-tasks
- Baymard — Line length readability: https://baymard.com/blog/line-length-readability
- UXPin — Optimal line length for readability (2026): https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
- NN/g — Using swipe to trigger contextual actions: https://www.nngroup.com/articles/contextual-swipe/
- LogRocket — Designing swipe-to-delete / swipe-to-reveal: https://blog.logrocket.com/ux-design/accessible-swipe-contextual-action-triggers/
</content>
</invoke>
