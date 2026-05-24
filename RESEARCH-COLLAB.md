# Together Tasks V3 — Collaboration / Shared / Motivation Research

Deep research for the V3 overhaul of the four "soft" surfaces — **Shared & assignment**, **Gamification**, **Routines**, **Nudges**, and the **Weekly Review** — benchmarking the best couple/household/habit apps and translating findings into prioritized, *tasteful* upgrades for a premium two-person ("King"/"Queen") app.

Scope note: Together Tasks today already ships shared/personal/partner-assigned tasks, AI parse, an AI nudge + "thinking of you" pulse, Routines (streaks + XP), a couple-completion donut, a weekly fairness bar, and a 12-week heatmap. This document assumes that base and recommends what to change for V3. Current-state references are drawn from the repo's own `UX-AUDIT.md`.

---

## 1. Shared / household & couple apps — who-owns-what, boundaries, partner activity, assign-to-partner

### What the field does

- **Todoist** shows assignment with an **assignee avatar/chip next to the task name**; assigning opens a menu of project members; the assignee gets a notification. Sharing is an explicit per-project action (private → shared via a Share button), and a **group icon vs add-person icon** on the project signals shared state at a glance. Activity is surfaced through a **per-task comment thread** with @mentions — collaboration lives *in the task*, not in a separate feed. ([Todoist — collaborate with friends/family](https://www.todoist.com/help/articles/collaborate-with-friends-or-family-in-todoist-tzkGUy))
- **Cozi** gives **each family member a distinct color**; the color is the identity primitive across calendar + lists, so "whose is this" is read instantly without avatars or labels. Its weakness, per reviewers, is being a jack-of-all-trades — broad but nothing feels crafted. ([Cozi to-do lists](https://www.cozi.com/to-do-lists/), [Cozi review 2025](https://ourcal.com/blog/cozi-app-review-2025))
- **Honeydue** (couples) keeps collaboration light: a shared space plus **emoji reactions / one-tap 👍** and chat *attached to the item in question* ("ask about that transaction") rather than a nagging task feed. ([Honeydue — how it works](https://www.honeydue.com/how-it-works))
- **The mental-load research is the most important finding here.** 2025 research links unequal *cognitive* labor (planning, remembering, managing) — not the physical chore — to resentment and lower intimacy. The failure mode for any couple app: *"If only one person enters and manages the tasks, you've just digitized the mental load instead of distributing it."* Best-in-class apps (Relia, Evenus) counter this with a **"pull" model** — partners proactively *claim* tasks from a shared pile rather than one partner *assigning* (the toxic manager/helper dynamic). ([Tidied — best chore apps for couples 2025](https://www.tidied.app/blog/best-chore-apps-couples), [Tendtask — mental load](https://tendtask.com/journal/relationship-app-for-couples-mental-load-solution/), [evenus](https://evenus.app/blog/best-chore-tracking-apps/))

### What feels good vs naggy

- **Good:** color/avatar as a passive ownership signal; comments/reactions scoped to the item; a "claim" affordance on unassigned shared tasks; assignment that *notifies* rather than *escalates*.
- **Naggy:** one partner assigning tasks *to* the other repeatedly (reads as management); a separate activity feed that becomes a surveillance log; "X hasn't done Y" framing.

### Translation for Together Tasks (King/Queen)

- The "King/Queen" frame is charming but carries a **manager/helper risk** if assignment is one-directional. V3 should add a **shared pool with a one-tap "I've got this" / claim** so balance emerges from *pulling*, not from one royal *delegating*.
- Make ownership a **passive color + avatar** read on every task row (Cozi/Todoist pattern), and add a **mine / theirs / shared / ours** segmented filter (the audit notes filters aren't first-class today).
- Keep partner activity **in-item** (a small "Queen completed this · 2h" line, reactions on the task) — never a standalone surveillance feed.

---

## 2. Gamification done tastefully — XP / streaks / levels without feeling childish

### What the field teaches

- **Finch** (D30 retention ~18%, RPD ~$0.86 — near the un-gamified Daylio's $0.94) wins on **metaphor alignment**: caring for the pet *is* caring for yourself, so the game layer reinforces the goal instead of obscuring it. **No punishment loop** — crucial for anxious/ADHD users. ([Habi — Finch alternatives](https://habi.app/insights/finch-alternatives/), [Naavik — gamification deep-dive](https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/))
- **Habitica** appeals narrowly to gamers; **8-bit RPG art reads dated/childish** to the mainstream, and its **HP-loss punishment** stresses rather than motivates. The RPG metaphor "doesn't fit the goal of habit-building." ([TMS — apps like Habitica](https://tms-outsource.com/blog/posts/apps-like-habitica/), [Naavik](https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/))
- **Me+** is the cautionary tale: a **"Perfect Day" system that penalizes ambition** (set 5 tasks, miss one, get punished) incentivizes sandbagging — catastrophic 3.2% D30. ([Naavik](https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/))
- **Duolingo / Streaks** show the *premium* path: **streaks tap loss aversion + identity**, but the celebration is **gated to rare milestones** so each lands (re-skinning one milestone animation moved D7 retention +1.7%). **Streak Freeze = forgiveness**, removing the all-or-nothing brittleness. **Streaks app** itself proves a streak can look *adult*: clean color-coded chains, no characters, no XP theatrics. ([Duolingo streak psychology](https://eventxgames.com/blog/why-streaks-work-duolingo-380m-users/), [Duolingo streak freeze](https://duolingoguides.com/how-to-use-a-streak-freeze-in-duolingo/), [Streaks](https://streaksapp.com/))

### Design principles for premium gamification

1. **Metaphor must match the goal.** A couple app's metaphor is *the relationship*, not an RPG. Gamify **"us," not "me vs you."**
2. **No punishment.** Never lose XP / take damage / break a streak silently. Add **forgiveness (streak freeze / grace day)**.
3. **Reward effort, gate celebration.** Quiet daily acknowledgment; **big moments only at rare milestones** so they stay special.
4. **Numbers should whisper.** XP/levels work when *transparent and earned*; they feel childish when loud, ever-present, and confetti-on-everything.
5. **Avoid leaderboards / competition between partners** — corrosive in a wellness/relationship context.

### Should a couple gamify *together*? Yes — but cooperatively

- Use **Duolingo's "Friend Streak" idea** reframed as a **shared couple streak**: the streak advances only when *both* contribute, so it's a *we* goal, not a contest. This is the single highest-leverage gamification idea for this app.
- **Fairness should be framed as balance, not score.** Show a 50/50 leaning chip ("balanced this week 🤝") — never "King is winning."

### Flag — likely childish/naggy today (per repo audit)

- **Confetti fires on every completion** (and re-fires on a swipe bug). Reserve confetti for **milestones only**; use a quiet check + haptic for routine completions.
- **Fabricated stats** ("Nudges Sent 312", "Memories Saved 84") and **mock nudge history** — remove; fake numbers destroy the premium daily-driver trust.
- **XP on every routine completion shown loudly** risks the Habitica feel. Demote XP to a subtle accent; let **streaks** (clean chains) carry the motivation.

---

## 3. Routines / habits surfaces — recurring habits vs one-off tasks

### What the field does

- **Streaks app:** up to 24 habits, **clean color-coded chains**, 600+ icons / 78 themes, long-term analytics — proof that a streak visual can feel premium and adult, no mascots. ([Streaks](https://streaksapp.com/), [Sweet Setup](https://thesweetsetup.com/how-to-track-your-habits-using-streaks/))
- **TickTick:** habits live in a **dedicated Habit tab, fully separate from the task list**, with a **"Review Mode" weekly snapshot** across tasks + habits. The separation is the lesson: *today's routines ≠ today's tasks.* ([TickTick blog](https://blog.ticktick.com/2020/11/06/stuck-to-habits-by-going-digital/))
- **Routinery:** a **sequence of habits run by a timer**, guiding you step-by-step through a morning/evening flow — the routine is a *flow*, not a checklist. ([Recurrr — routine apps 2025](https://recurrr.com/articles/best-daily-routine-apps/))

### Translation for Together Tasks

- Keep Routines **structurally distinct** from tasks (already true — good). On Home, surface a small **"Today's routines"** strip *above/separate from* the task queue (TickTick separation).
- The **7-day strip + partner trail** is the right primitive; lean into it as **the** streak visual and keep XP subordinate.
- Cadence picker: support daily / weekdays / weekends / custom-days clearly (already planned). Consider an optional **Routinery-style sequenced "evening together" flow** (do these 3 as a flow) as a P2 delight.
- Add **streak forgiveness** (a "grace day" / freeze) per routine so a single missed day doesn't nuke a long shared streak — directly from Duolingo.

---

## 4. Affectionate nudges / partner pings — tasteful, not spammy

### What the field does

- **Lovestruck:** **one-tap "pings"** — *thinking of you*, *call when free*, *I'm home* — that land as a **note on the partner's home screen**. Pre-set intents, zero typing. ([Lovestruck](https://lovestruck.kunolu.com/))
- **Thinking of You:** a single **"Send Your Heart"** — minimal, private, effortless. ([Thinking of You](https://thinkingofyou.app/))
- **Honeydue:** one-tap 👍 / emoji on the relevant item. ([Honeydue](https://www.honeydue.com/how-it-works))

### Notification cadence + tone (the hard data)

- Sweet spot is **2–5 notifications/week for most apps**; **>5/week makes 64% of users consider quitting**, and 2–5/week already risks ~46% disabling notifications if they're not relevant. **Frequency-cap and personalize.** ([Pushwoosh best practices](https://www.pushwoosh.com/blog/push-notification-best-practices/), [MoEngage](https://www.moengage.com/learn/push-notification-best-practices/))
- Trigger on **user/contextual actions**, not a clock; give the user **frequency control**.

### Translation for Together Tasks

- The **AI nudge is the spam risk.** Cap it: **at most one AI affectionate nudge per day, and only when contextually warranted** (e.g., partner cleared a hard task, a shared streak is about to lapse). Make cadence a setting.
- Ship the **one-tap "thinking of you" pulse** properly (audit: the `ThinkingOfYouButton` is imported but never rendered — dead today). Add 3–4 **pre-set intents** (Lovestruck pattern: *thinking of you · proud of you · I've got dinner · call when free*) so it's expressive without typing.
- **Tone + de-gender copy now.** Audit found gendered copy ("She'll appreciate the call") that breaks when a King receives a nudge — use the partner's name / neutral warmth.
- **Never nudge as nagging.** A nudge should be a gift ("Queen just finished the taxes 🎉 — maybe say thanks?"), never "King hasn't done the dishes."

---

## 5. Weekly review / reflection

### What Sunsama does (the gold standard)

A **guided 3-step ritual**, not a dashboard:
1. **Objectives review** — progress vs weekly objectives + a time-spent-on-objectives-vs-other chart (auto-skips if no objectives).
2. **Body of work** — everything completed, broken down by day.
3. **Reflection journaling** — free-text prompts: *biggest wins, what pulled you off track, what you learned.* Optional **"Automate"** pre-fills the list of completed aligned work; the journaling step can be **permanently skipped**; review can **merge with next-week planning**; reflections can be **shared** (Slack/Teams). The calm comes from anchoring on **a few objectives, not the whole task list.** ([Sunsama weekly review](https://help.sunsama.com/docs/weekly-review), [Weekly Review 2.0](https://roadmap.sunsama.com/changelog/weekly-review-20))

### Translation for Together Tasks

- Make the Sunday recap a **guided couple ritual**, not a stats page: (1) **the week in numbers** (donut + fairness, framed as balance), (2) **what we got done together**, (3) a **shared reflection** — one prompt each ("a win this week", "one thing to hand off next week"), AI-prefilled from completed tasks.
- **Auto-skip empty steps** and let it be skippable — never a chore. Tie it to **next-week intent-setting** (Sunsama's combine pattern) so it feels forward-looking and romantic, not like a performance review.

---

## Prioritized recommendations (P0 / P1 / P2)

### P0 — premium-trust + anti-naggy (do first; cheap, high impact)

1. **Reserve confetti for milestones only**; quiet check + haptic on normal completion. Fix the swipe-re-fire bug. *Rationale: confetti-on-everything is the #1 "childish" tell.* (Naavik; repo audit)
2. **Remove all fabricated stats + mock nudge history.** *Fake data in a daily driver kills the premium feel.* (repo audit)
3. **Cap the AI nudge to ≤1/day, context-triggered, user-controllable cadence.** *2–5/wk is the safe band; >5 drives churn.* (Pushwoosh, MoEngage)
4. **De-gender all nudge/notification copy**; use partner name + neutral warmth. (repo audit)
5. **Actually render the one-tap "thinking of you" pulse** + 3–4 pre-set intents. *It's built but dead.* (Lovestruck; repo audit)

### P1 — collaboration + cooperative motivation (the heart of V3)

6. **Shared pool with one-tap "I've got this" (pull, not push).** *Counters the King/Queen manager-helper / mental-load trap.* (Relia/Evenus mental-load research)
7. **Mine / theirs / shared / ours segmented filter** + **passive color+avatar ownership** on every row. (Todoist, Cozi)
8. **Shared couple streak** (advances only when both contribute) as the flagship motivation mechanic; frame fairness as **balance, not score**. (Duolingo Friend Streak; couple-fairness framing)
9. **Streak forgiveness / grace day** per routine and for the couple streak. *Removes brittle all-or-nothing.* (Duolingo streak freeze)
10. **In-item partner activity + reactions** (no separate surveillance feed). (Honeydue, Todoist comments)
11. **Demote XP to a subtle accent; let clean streak chains carry motivation.** (Streaks app, Naavik)

### P2 — delight + depth

12. **Guided 3-step couple Weekly Review ritual** with AI-prefilled reflection, skippable/auto-skip-empty, merged with next-week intent. (Sunsama)
13. **"Today's routines" strip on Home, visually separate from tasks.** (TickTick)
14. **Milestone celebration tiers** (rare, special — 7/30/100-day shared streak), each with a distinct premium animation. (Duolingo milestones)
15. **Optional Routinery-style sequenced "together flow"** (run 2–3 evening routines as a timed sequence). (Routinery)

---

## Toned-down "childish / naggy" flags (summary)

| Current behavior | Why it reads childish/naggy | Fix |
|---|---|---|
| Confetti on every completion | All-or-nothing carnival; cheapens milestones | Milestones only |
| Loud XP on every routine | Habitica-style game theater | Subordinate to streaks |
| Fabricated "312 nudges" etc. | Breaks trust in a daily driver | Remove / wire real data |
| Mock nudges shown as real | Same | True empty state |
| Uncapped AI nudges | Spam → notification disable/churn | ≤1/day, contextual, capped |
| Gendered "She'll appreciate it" | Breaks + feels canned | Partner name, neutral |
| One-directional King→Queen assignment | Manager/helper dynamic, digitizes mental load | Add pull/claim model |

---

### Sources

- Todoist — https://www.todoist.com/help/articles/collaborate-with-friends-or-family-in-todoist-tzkGUy
- Cozi — https://www.cozi.com/to-do-lists/ · https://ourcal.com/blog/cozi-app-review-2025
- Honeydue — https://www.honeydue.com/how-it-works
- Mental load / chore apps — https://www.tidied.app/blog/best-chore-apps-couples · https://tendtask.com/journal/relationship-app-for-couples-mental-load-solution/ · https://evenus.app/blog/best-chore-tracking-apps/
- Finch / Habitica / gamification — https://habi.app/insights/finch-alternatives/ · https://tms-outsource.com/blog/posts/apps-like-habitica/ · https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/
- Duolingo streaks — https://eventxgames.com/blog/why-streaks-work-duolingo-380m-users/ · https://duolingoguides.com/how-to-use-a-streak-freeze-in-duolingo/
- Streaks / TickTick / Routinery — https://streaksapp.com/ · https://thesweetsetup.com/how-to-track-your-habits-using-streaks/ · https://blog.ticktick.com/2020/11/06/stuck-to-habits-by-going-digital/ · https://recurrr.com/articles/best-daily-routine-apps/
- Partner pings — https://lovestruck.kunolu.com/ · https://thinkingofyou.app/
- Notification cadence — https://www.pushwoosh.com/blog/push-notification-best-practices/ · https://www.moengage.com/learn/push-notification-best-practices/
- Weekly review — https://help.sunsama.com/docs/weekly-review · https://roadmap.sunsama.com/changelog/weekly-review-20
