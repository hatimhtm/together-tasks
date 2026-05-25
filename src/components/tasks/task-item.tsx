"use client"

import { Task, Subtask } from "@/types/task"
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion"
import { Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isToday, isTomorrow, isThisWeek, isThisYear } from "date-fns"
import { useState, useEffect, forwardRef } from "react"
import { triggerHaptic, triggerHapticSuccess } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

interface TaskItemProps {
    task: Task
    userId: string
    partnerId?: string | null
    isExpanded: boolean
    isEditing: boolean
    index?: number
    onToggleExpand: () => void
    onStartEditing: (e?: React.MouseEvent) => void
    onCancelEditing: () => void
    onComplete: (isCompleted: boolean) => void
    onDelete: () => void
    onRequestDelete?: () => void
    onUpdate: (updates: Partial<Task>) => void
    onClaim?: () => void
    showClaim?: boolean
}

const PRIORITY_DOT: Record<string, string> = {
    urgent: "bg-error",
    high: "bg-secondary",
    medium: "bg-on-surface-variant/50",
    low: "bg-primary",
}

const getCheckboxBorder = (priority: string) => {
    switch (priority) {
        case "urgent": return "border-error hover:bg-error/10"
        case "high": return "border-secondary hover:bg-secondary/10"
        case "low": return "border-primary hover:bg-primary/10"
        default: return "border-outline-variant hover:border-primary hover:bg-primary/10"
    }
}

const checkIconColor = (priority: string) => {
    switch (priority) {
        case "urgent": return "text-error"
        case "high": return "text-secondary"
        default: return "text-primary"
    }
}

// Humanize a due date: "Today 7pm", "Tomorrow", "Tue", "Mar 4".
function humanizeDue(iso: string): string {
    const d = new Date(iso)
    const hasTime = !(d.getHours() === 0 && d.getMinutes() === 0)
    const timePart = hasTime ? format(d, "h:mmaaa").replace(":00", "") : ""
    if (isToday(d)) return hasTime ? `Today ${timePart}` : "Today"
    if (isTomorrow(d)) return hasTime ? `Tomorrow ${timePart}` : "Tomorrow"
    if (isThisWeek(d, { weekStartsOn: 1 })) return hasTime ? `${format(d, "EEE")} ${timePart}` : format(d, "EEE")
    if (isThisYear(d)) return format(d, "MMM d")
    return format(d, "MMM d, yyyy")
}

type Owner = { label: string; initial: string; chip: string }
function ownerOf(task: Task, userId: string, partnerId?: string | null): Owner | null {
    if (task.scope === "shared" && task.assignee_id === task.creator_id) {
        // Unclaimed shared = pool
        return { label: "In the pool", initial: "⇄", chip: "bg-primary/15 text-primary border-primary/30" }
    }
    if (task.assignee_id === userId) {
        return { label: "Mine", initial: "M", chip: "bg-primary/15 text-primary border-primary/30" }
    }
    if (partnerId && task.assignee_id === partnerId) {
        return { label: "Partner", initial: "P", chip: "bg-secondary/15 text-secondary border-secondary/30" }
    }
    return null
}

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(({
    task,
    userId,
    partnerId,
    isExpanded,
    isEditing,
    index = 0,
    onToggleExpand,
    onStartEditing,
    onCancelEditing,
    onComplete,
    onDelete,
    onRequestDelete,
    onUpdate,
    onClaim,
    showClaim,
}, ref) => {
    const [editForm, setEditForm] = useState<Partial<Task>>({})
    const [justCompleted, setJustCompleted] = useState(false)
    const reduceMotion = useReducedMotion()

    const x = useMotionValue(0)
    const completeOpacity = useTransform(x, [0, 60], [0, 1])
    const deleteOpacity = useTransform(x, [0, -60], [0, 1])

    useEffect(() => {
        if (isEditing) {
            setEditForm({ title: task.title, description: task.description, subtasks: task.subtasks })
        }
    }, [isEditing, task])

    const saveEdit = () => onUpdate(editForm)

    const handleSubtaskToggle = (subtaskId: string) => {
        if (!task.subtasks) return
        const updatedSubtasks = task.subtasks.map((st) => {
            if (typeof st !== 'string' && st.id === subtaskId) return { ...st, is_completed: !st.is_completed }
            return st
        })
        onUpdate({ subtasks: updatedSubtasks })
    }

    const triggerComplete = () => {
        triggerHaptic(ImpactStyle.Medium)
        if (!task.is_completed) {
            setJustCompleted(true)
            setTimeout(() => setJustCompleted(false), 420)
        }
        onComplete(task.is_completed)
    }

    const isOverdue = task.due_date && !task.is_completed && new Date(task.due_date) < new Date()

    // Subtask progress
    const subtasks = (task.subtasks ?? []).filter(Boolean) as Subtask[]
    const structured = subtasks.filter((st): st is Exclude<Subtask, string> => typeof st !== "string")
    const subtaskTotal = subtasks.length
    const subtaskDone = structured.filter(st => st.is_completed).length
    const subtaskPct = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0

    // Inline preview: title of each not-yet-done subtask (structured "is_completed: false"
    // or plain strings, which we always treat as not-done). Show up to the first 2.
    const incompleteTitles = subtasks
        .filter(st => typeof st === "string" || !st.is_completed)
        .map(st => (typeof st === "string" ? st : st.title))
        .filter(Boolean)
    const previewSubtasks = incompleteTitles.slice(0, 2)
    const extraSubtasks = incompleteTitles.length - previewSubtasks.length

    const owner = ownerOf(task, userId, partnerId)
    const showClaimAction = !!showClaim && !!onClaim

    // Compact meta line below the title (due / duration / done-of-total).
    const hasMetaLine = task.due_date || task.duration_estimate || subtaskTotal > 0

    // Hero spring config for the checkbox tick (the one celebrated motion).
    const checkSpring = reduceMotion
        ? { duration: 0.001 }
        : { type: "spring" as const, stiffness: 600, damping: 18, mass: 0.6 }

    return (
        <div
            ref={ref}
            className={cn(
                "group relative",
                !reduceMotion && "animate-in fade-in slide-in-from-bottom-1 duration-200",
            )}
            style={!reduceMotion ? { animationDelay: `${Math.min(index * 30, 240)}ms` } : undefined}
        >
            {/* Swipe underlay */}
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                <motion.div style={{ opacity: completeOpacity }} className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="h-8 w-8 rounded-full bg-error/20 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-error" strokeWidth={2.5} />
                </motion.div>
            </div>

            {/* Draggable surface */}
            <motion.div
                style={{ x }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                    if ((info.offset.x > 80 || info.velocity.x > 500) && !task.is_completed) {
                        triggerHapticSuccess()
                        setJustCompleted(true)
                        setTimeout(() => setJustCompleted(false), 420)
                        onComplete(task.is_completed)
                    } else if (info.offset.x < -80 || info.velocity.x < -500) {
                        triggerHaptic(ImpactStyle.Heavy)
                        onDelete()
                    }
                }}
                className="relative z-10"
            >
                <div className={cn(
                    "rounded-xl transition-colors",
                    isExpanded || isEditing
                        ? "bg-surface-container-low my-1"
                        : "bg-surface hover:bg-surface-container-low/60",
                )}>
                    <div className={cn(isExpanded || isEditing ? "p-3 sm:p-4" : "py-2.5 px-1")}>
                        {isEditing ? (
                            /* ── Edit mode ── */
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-surface-container-high border border-outline-variant/60 rounded-xl px-3 py-2.5 text-[15px] font-body text-on-surface focus:border-primary outline-none transition-colors"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full bg-surface-container-high border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface-variant focus:border-primary outline-none resize-none min-h-[64px] leading-relaxed transition-colors"
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add a note…"
                                />
                                {editForm.subtasks && editForm.subtasks.length > 0 && (
                                    <div className="space-y-1.5 pl-3 border-l-2 border-outline-variant/60">
                                        <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-[0.12em]">Steps</p>
                                        {editForm.subtasks.map((st, i: number) => (
                                            <input
                                                key={typeof st === 'string' ? i : st.id}
                                                className="w-full bg-surface-container-high border border-outline-variant/60 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:border-primary outline-none transition-colors"
                                                value={typeof st === 'string' ? st : st.title}
                                                onChange={e => {
                                                    const next = [...(editForm.subtasks || [])]
                                                    next[i] = typeof st === 'string' ? e.target.value : { ...st, title: e.target.value }
                                                    setEditForm(p => ({ ...p, subtasks: next }))
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <button onClick={onCancelEditing} className="text-sm px-4 h-10 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors font-label font-medium active:scale-[0.98]">Cancel</button>
                                    <button onClick={saveEdit} className="text-sm px-5 h-10 bg-primary text-on-primary font-label font-semibold rounded-full transition-colors active:scale-[0.98]">Save</button>
                                </div>
                            </div>
                        ) : (
                            /* ── View mode ── */
                            <div className="flex items-start gap-2.5">

                                {/* Hero spring checkbox — 22px circle, 44px hit target */}
                                <button
                                    onClick={triggerComplete}
                                    aria-label={task.is_completed ? "Mark incomplete" : "Complete task"}
                                    className="mt-px shrink-0 h-[22px] w-[22px] -m-[11px] p-[11px] box-content flex items-center justify-center group/check"
                                    title={
                                        task.scope === 'shared'
                                            ? (task.completed_by?.includes(userId) ? "Waiting for partner…" : task.completed_by?.length === 1 ? "Partner finished! Your turn." : "Mark complete")
                                            : "Complete"
                                    }
                                >
                                    <span className={cn(
                                        "h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center transition-colors",
                                        getCheckboxBorder(task.priority),
                                        task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "bg-primary/20 border-primary",
                                    )}>
                                        {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed ? (
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        ) : (
                                            <motion.span
                                                animate={justCompleted ? { scale: [0, 1.35, 1] } : { scale: 1 }}
                                                transition={checkSpring}
                                                className={cn(
                                                    "material-symbols-outlined text-[15px] font-bold transition-opacity",
                                                    justCompleted ? "opacity-100" : "opacity-0 group-hover/check:opacity-100",
                                                    checkIconColor(task.priority),
                                                )}
                                            >check</motion.span>
                                        )}
                                    </span>
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">

                                    {/* Title row — circle + dot + title on one line */}
                                    <div className="flex items-center gap-2 min-h-[24px]">
                                        {/* Priority dot (urgent/high only) */}
                                        {(task.priority === 'urgent' || task.priority === 'high') && (
                                            <span
                                                className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])}
                                                title={`${task.priority} priority`}
                                            />
                                        )}

                                        <h4
                                            className={cn(
                                                "flex-1 font-body font-medium text-[15px] leading-snug cursor-pointer min-w-0 truncate",
                                                isExpanded ? "text-on-surface whitespace-normal" : "text-on-surface",
                                            )}
                                            onClick={onToggleExpand}
                                        >
                                            {task.title}
                                        </h4>

                                        {/* Row actions — hover-revealed on desktop, always tap-reachable */}
                                        <div className="flex items-center shrink-0 -mr-1">
                                            <button
                                                onClick={onToggleExpand}
                                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                                className="h-9 w-9 flex items-center justify-center rounded-full text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-container-high transition-all sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                                            >
                                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline subtask preview (up to 2 incomplete) + N more */}
                                    {!isExpanded && previewSubtasks.length > 0 && (
                                        <div className="mt-0.5 space-y-0.5">
                                            {previewSubtasks.map((title, i) => (
                                                <p key={i} className="text-[13px] text-on-surface-variant/90 truncate leading-snug">
                                                    <span className="text-on-surface-variant/50">– </span>{title}
                                                </p>
                                            ))}
                                            {extraSubtasks > 0 && (
                                                <p className="text-[12px] text-on-surface-variant/60 leading-snug">+{extraSubtasks} more</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Compact meta line — due / duration / done-of-total */}
                                    {!isExpanded && hasMetaLine && (
                                        <div className="flex items-center gap-2.5 mt-1 font-label text-[12px] text-on-surface-variant/80">
                                            {task.due_date && (
                                                <span className={cn("flex items-center gap-1", isOverdue && "text-error font-medium")}>
                                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                    {humanizeDue(task.due_date)}
                                                </span>
                                            )}
                                            {task.duration_estimate && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">timer</span>
                                                    {task.duration_estimate}m
                                                </span>
                                            )}
                                            {subtaskTotal > 0 && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[13px]">checklist</span>
                                                    {subtaskDone}/{subtaskTotal}
                                                    <span className="h-[3px] w-10 rounded-full bg-surface-container-highest overflow-hidden">
                                                        <span className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${subtaskPct}%` }} />
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Pool claim action */}
                                    {showClaimAction && !isExpanded && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); triggerHaptic(ImpactStyle.Light); onClaim?.() }}
                                            className="mt-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-on-primary text-[13px] font-label font-semibold transition-colors active:scale-[0.98]"
                                        >
                                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
                                            I&apos;ve got this
                                        </button>
                                    )}

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                                            {/* Description */}
                                            {task.description && (
                                                <p className="text-[13px] font-body text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-high p-3 rounded-xl border border-outline-variant/60">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Priority selector + actions row */}
                                            <div className="flex items-center justify-between">
                                                <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/60" onClick={e => e.stopPropagation()}>
                                                    <div className={cn("w-2 h-2 rounded-full", PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.medium)} />
                                                    <span className="text-[11px] font-label font-bold text-on-surface uppercase tracking-[0.08em]">{task.priority} prio</span>
                                                    <select
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                        value={task.priority}
                                                        onChange={e => onUpdate({ priority: e.target.value as Task["priority"] })}
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="urgent">Urgent</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={onStartEditing}
                                                        className="text-on-surface-variant hover:text-primary p-2 rounded-full bg-surface-container-high hover:bg-primary/10 transition-colors active:scale-[0.98]"
                                                        aria-label="Edit task"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={onRequestDelete}
                                                        className="text-on-surface-variant hover:text-error p-2 rounded-full bg-surface-container-high hover:bg-error/10 transition-colors active:scale-[0.98]"
                                                        aria-label="Delete task"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Secondary chips — owner + raw urgency / importance (only on expand) */}
                                            {(!!owner
                                                || (task.emergency_level === "high" || task.emergency_level === "critical")
                                                || (task.importance_level === "high" || task.importance_level === "critical")) && (
                                                <div className="flex items-center gap-2 flex-wrap font-label text-[11px]">
                                                    {owner && (
                                                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold", owner.chip)}>
                                                            <span className="inline-flex items-center justify-center h-[14px] min-w-[14px] rounded-full text-[9px] leading-none">{owner.initial}</span>
                                                            {owner.label}
                                                        </span>
                                                    )}
                                                    {(task.emergency_level === "high" || task.emergency_level === "critical") && (
                                                        <span className="px-2 py-0.5 rounded-full text-error bg-error/10 font-semibold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                                                            {task.emergency_level} urgency
                                                        </span>
                                                    )}
                                                    {(task.importance_level === "high" || task.importance_level === "critical") && (
                                                        <span className="px-2 py-0.5 rounded-full text-secondary bg-secondary/10 font-semibold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">star</span>
                                                            {task.importance_level} importance
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Pool claim (expanded) */}
                                            {showClaimAction && (
                                                <button
                                                    onClick={() => { triggerHaptic(ImpactStyle.Light); onClaim?.() }}
                                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary text-on-primary text-sm font-label font-semibold transition-colors active:scale-[0.98]"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
                                                    I&apos;ve got this
                                                </button>
                                            )}

                                            {/* Full subtask checklist */}
                                            {subtaskTotal > 0 && (
                                                <div className="pt-3 border-t border-outline-variant/60 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-label font-bold uppercase tracking-[0.12em] text-on-surface-variant">Checklist</p>
                                                        <p className="text-[10px] font-label font-bold uppercase tracking-[0.12em] text-on-surface-variant">{subtaskDone}/{subtaskTotal}</p>
                                                    </div>
                                                    {subtasks.map((st, i: number) => {
                                                        if (typeof st === 'string') return (
                                                            <div key={i} className="flex items-center gap-3 text-sm font-body text-on-surface-variant pl-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0" />
                                                                {st}
                                                            </div>
                                                        )
                                                        return (
                                                            <label key={st.id} className="flex items-center gap-3 text-[13px] font-body cursor-pointer group/st bg-surface-container-high hover:bg-surface-container-highest px-2.5 py-1.5 rounded-lg transition-colors">
                                                                <div className="relative flex items-center justify-center shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={st.is_completed}
                                                                        onChange={() => handleSubtaskToggle(st.id)}
                                                                        className="peer h-4 w-4 appearance-none rounded-sm border-2 border-outline-variant checked:border-primary checked:bg-primary transition-colors cursor-pointer"
                                                                    />
                                                                    <span className="material-symbols-outlined text-[14px] absolute text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                                                </div>
                                                                <span className={cn(
                                                                    "transition-colors",
                                                                    st.is_completed ? "text-on-surface-variant line-through" : "text-on-surface font-medium",
                                                                )}>
                                                                    {st.title}
                                                                </span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
})

TaskItem.displayName = "TaskItem"
