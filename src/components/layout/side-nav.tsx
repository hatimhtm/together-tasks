"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { Logo } from "@/components/ui/logo"

const tabs = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Routines", href: "/routines", icon: "repeat" },
    { name: "Nudge", href: "/nudge", icon: "favorite" },
    { name: "Stats", href: "/analytics", icon: "insights" },
    { name: "Settings", href: "/settings", icon: "settings" },
]

const MIN_WIDTH = 240
const MAX_WIDTH = 360
const RAIL_WIDTH = 64
const DEFAULT_WIDTH = 256
const WIDTH_KEY = "tt.sidenav.width"
const COLLAPSED_KEY = "tt.sidenav.collapsed"

// Keep the layout shell + header in sync with the live sidebar width via a CSS var.
function applyShellWidth(px: number) {
    if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--sidenav-w", `${px}px`)
    }
}

export function SideNav() {
    const pathname = usePathname()
    const isTauri = typeof window !== "undefined" && "__TAURI__" in window

    const [width, setWidth] = useState(DEFAULT_WIDTH)
    const [collapsed, setCollapsed] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [dragging, setDragging] = useState(false)
    const widthRef = useRef(DEFAULT_WIDTH)

    // Hydrate persisted prefs and prime the shell width once on mount.
    useEffect(() => {
        let w = DEFAULT_WIDTH
        let c = false
        try {
            const sw = localStorage.getItem(WIDTH_KEY)
            if (sw) w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(sw, 10) || DEFAULT_WIDTH))
            c = localStorage.getItem(COLLAPSED_KEY) === "1"
        } catch { /* private mode / SSR */ }
        widthRef.current = w
        setWidth(w)
        setCollapsed(c)
        setHydrated(true)
        applyShellWidth(c ? RAIL_WIDTH : w)
    }, [])

    const effectiveWidth = collapsed ? RAIL_WIDTH : width

    // Keep shell var current as width/collapsed change.
    useEffect(() => {
        if (hydrated) applyShellWidth(effectiveWidth)
    }, [effectiveWidth, hydrated])

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev
            try { localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0") } catch { /* noop */ }
            return next
        })
    }, [])

    // ⌘/Ctrl+B toggles the icon rail.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                e.preventDefault()
                toggleCollapsed()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [toggleCollapsed])

    // Drag-to-resize the expanded sidebar (no-op when collapsed).
    const startDrag = useCallback((e: React.PointerEvent) => {
        if (collapsed) return
        e.preventDefault()
        setDragging(true)
        const startX = e.clientX
        const startW = widthRef.current

        const onMove = (ev: PointerEvent) => {
            const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + (ev.clientX - startX)))
            widthRef.current = next
            setWidth(next)
            applyShellWidth(next)
        }
        const onUp = () => {
            setDragging(false)
            try { localStorage.setItem(WIDTH_KEY, String(widthRef.current)) } catch { /* noop */ }
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            document.body.style.userSelect = ""
            document.body.style.cursor = ""
        }
        document.body.style.userSelect = "none"
        document.body.style.cursor = "col-resize"
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
    }, [collapsed])

    // Keyboard-resize on the handle (arrows nudge width 16px).
    const onHandleKey = useCallback((e: React.KeyboardEvent) => {
        if (collapsed) return
        let next = widthRef.current
        if (e.key === "ArrowLeft") next = Math.max(MIN_WIDTH, next - 16)
        else if (e.key === "ArrowRight") next = Math.min(MAX_WIDTH, next + 16)
        else return
        e.preventDefault()
        widthRef.current = next
        setWidth(next)
        applyShellWidth(next)
        try { localStorage.setItem(WIDTH_KEY, String(next)) } catch { /* noop */ }
    }, [collapsed])

    return (
        <aside
            className={cn(
                "hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col border-r border-outline-variant/60 bg-surface-container-low",
                !dragging && "transition-[width] duration-200 ease-out"
            )}
            style={{ width: effectiveWidth }}
        >
            {/* Wordmark */}
            <div
                className={cn("flex items-center h-24 shrink-0", collapsed ? "justify-center px-0" : "gap-3 px-6")}
                {...(isTauri ? { "data-tauri-drag-region": "true", style: { paddingTop: "1.25rem" } } : {})}
            >
                <Logo size={30} className="shrink-0" />
                {!collapsed && (
                    <span className="text-on-surface font-headline font-extrabold text-lg tracking-tight whitespace-nowrap overflow-hidden">
                        Together Tasks
                    </span>
                )}
            </div>

            {/* Destinations */}
            <nav className={cn("flex-1 flex flex-col gap-1 pt-2", collapsed ? "px-2 items-center" : "px-4")}>
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            prefetch
                            onClick={() => triggerHaptic(ImpactStyle.Light)}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={collapsed ? tab.name : undefined}
                            title={collapsed ? tab.name : undefined}
                            className={cn(
                                "group relative flex items-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low",
                                collapsed ? "justify-center h-11 w-11" : "gap-4 px-4 py-3",
                                isActive
                                    ? "bg-primary/12 text-primary border border-primary/20"
                                    : "text-on-surface-variant border border-transparent hover:text-on-surface hover:bg-surface-container"
                            )}
                        >
                            <span
                                className="material-symbols-outlined text-[24px] shrink-0"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {tab.icon}
                            </span>
                            {!collapsed && (
                                <span className="font-label text-[15px] font-semibold whitespace-nowrap">
                                    {tab.name}
                                </span>
                            )}

                            {/* Rail tooltip */}
                            {collapsed && (
                                <span
                                    role="tooltip"
                                    className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-surface-container-highest text-on-surface text-xs font-semibold px-2.5 py-1.5 border border-outline-variant/60 shadow-lg opacity-0 -translate-x-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                                >
                                    {tab.name}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <div className={cn("pb-4 pt-2", collapsed ? "px-2" : "px-4")}>
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={`${collapsed ? "Expand" : "Collapse"} sidebar (⌘B)`}
                    className={cn(
                        "group relative flex items-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low",
                        collapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-4 py-2.5 w-full"
                    )}
                >
                    <span
                        className="material-symbols-outlined text-[22px] shrink-0"
                        style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
                    >
                        left_panel_close
                    </span>
                    {!collapsed && (
                        <span className="font-label text-[13px] font-semibold whitespace-nowrap">Collapse</span>
                    )}
                </button>
            </div>

            {/* Footer accent (expanded only) */}
            {!collapsed && (
                <div className="px-6 pb-6">
                    <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant/50 whitespace-nowrap overflow-hidden">
                        Made with love
                    </p>
                </div>
            )}

            {/* Resize handle (expanded only) */}
            {!collapsed && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize sidebar"
                    aria-valuemin={MIN_WIDTH}
                    aria-valuemax={MAX_WIDTH}
                    aria-valuenow={width}
                    tabIndex={0}
                    onPointerDown={startDrag}
                    onKeyDown={onHandleKey}
                    className="absolute inset-y-0 right-0 w-2 translate-x-1/2 cursor-col-resize group focus-visible:outline-none"
                >
                    <span
                        className={cn(
                            "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent transition-colors duration-150",
                            "group-hover:bg-primary/60 group-focus-visible:bg-primary",
                            dragging && "bg-primary"
                        )}
                    />
                </div>
            )}
        </aside>
    )
}
