"use client"

import { Command } from "cmdk"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type Item = {
    id: string
    label: string
    icon: string
    keywords?: string
    run: () => void
}

// Mirror of the theme-selector hero ordering; the rest live under "More themes".
const HERO_THEMES = [
    { id: "obsidian", name: "Obsidian", icon: "dark_mode" },
    { id: "daylight", name: "Daylight", icon: "light_mode" },
    { id: "midnight", name: "Midnight", icon: "nights_stay" },
]
const MORE_THEMES = [
    { id: "ocean", name: "Ocean", icon: "waves" },
    { id: "aurora", name: "Aurora", icon: "eco" },
    { id: "burgundy", name: "Burgundy", icon: "palette" },
    { id: "rose", name: "Rose", icon: "favorite" },
]

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()

    // ⌘/Ctrl+K toggles the palette.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen((o) => !o)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    const go = useCallback(
        (href: string) => {
            setOpen(false)
            router.push(href)
        },
        [router]
    )

    const newTask = useCallback(() => {
        setOpen(false)
        router.push("/")
        // Focus the quick-add field once home has rendered.
        setTimeout(() => {
            const el = document.querySelector<HTMLTextAreaElement>(
                'textarea[placeholder="What needs to be done?"]'
            )
            el?.focus()
        }, 250)
    }, [router])

    const pickTheme = useCallback(
        (id: string) => {
            setOpen(false)
            setTheme(id)
        },
        [setTheme]
    )

    const navItems: Item[] = [
        { id: "nav-home", label: "Home", icon: "home", keywords: "tasks today", run: () => go("/") },
        { id: "nav-routines", label: "Routines", icon: "repeat", keywords: "habits", run: () => go("/routines") },
        { id: "nav-nudge", label: "Nudge", icon: "favorite", keywords: "thinking of you partner", run: () => go("/nudge") },
        { id: "nav-stats", label: "Stats", icon: "insights", keywords: "analytics progress", run: () => go("/analytics") },
        { id: "nav-settings", label: "Settings", icon: "settings", keywords: "theme account", run: () => go("/settings") },
    ]

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Command palette"
            shouldFilter
            loop
            overlayClassName="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
            contentClassName="fixed left-1/2 top-[18vh] z-[121] w-[min(92vw,560px)] -translate-x-1/2 outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"
        >
            {/* Glass surface (floating → glass is allowed) */}
            <div>
                <div
                    className="overflow-hidden rounded-2xl border border-glass-border shadow-2xl supports-[backdrop-filter]:backdrop-blur-xl"
                    style={{ backgroundColor: "var(--glass-white)" }}
                >
                    <div className="flex items-center gap-2.5 border-b border-outline-variant/50 px-4">
                        <span className="material-symbols-outlined text-[22px] text-on-surface-variant">search</span>
                        <Command.Input
                            autoFocus
                            placeholder="Search or jump to…"
                            className="flex-1 bg-transparent py-4 text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/60 font-body"
                        />
                        <kbd className="hidden sm:inline-flex items-center rounded-md border border-outline-variant/60 px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                            ESC
                        </kbd>
                    </div>

                    <Command.List className="max-h-[min(56vh,420px)] overflow-y-auto p-2 no-scrollbar">
                        <Command.Empty className="px-3 py-8 text-center text-sm text-on-surface-variant">
                            No results.
                        </Command.Empty>

                        <Command.Group
                            heading="Go to"
                            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-on-surface-variant"
                        >
                            {navItems.map((item) => (
                                <Row key={item.id} value={`${item.label} ${item.keywords ?? ""}`} icon={item.icon} onSelect={item.run}>
                                    {item.label}
                                </Row>
                            ))}
                        </Command.Group>

                        <Command.Group
                            heading="Actions"
                            className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-on-surface-variant"
                        >
                            <Row value="New task create add" icon="add_circle" onSelect={newTask}>
                                New task
                            </Row>
                        </Command.Group>

                        <Command.Group
                            heading="Theme"
                            className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-on-surface-variant"
                        >
                            {[...HERO_THEMES, ...MORE_THEMES].map((t) => (
                                <Row key={t.id} value={`Theme ${t.name}`} icon={t.icon} onSelect={() => pickTheme(t.id)}>
                                    {t.name}
                                </Row>
                            ))}
                        </Command.Group>
                    </Command.List>

                    <div className="flex items-center justify-between border-t border-outline-variant/50 px-4 py-2 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                            <kbd className="rounded border border-outline-variant/60 px-1.5 py-0.5 font-semibold">↑↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="rounded border border-outline-variant/60 px-1.5 py-0.5 font-semibold">↵</kbd>
                            select
                        </span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    )
}

function Row({
    value,
    icon,
    onSelect,
    children,
}: {
    value: string
    icon: string
    onSelect: () => void
    children: React.ReactNode
}) {
    return (
        <Command.Item
            value={value}
            onSelect={onSelect}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-on-surface aria-selected:bg-primary/12 aria-selected:text-primary"
        >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            <span className="font-medium">{children}</span>
        </Command.Item>
    )
}
