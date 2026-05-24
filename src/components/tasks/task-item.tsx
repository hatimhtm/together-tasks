"use client"

import { Task } from "@/types/task"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, useEffect, forwardRef } from "react"
import { triggerHaptic, triggerHapticSuccess } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"

interface TaskItemProps {
    task: Task
    userId: string
    isExpanded: boolean
    isEditing: boolean
    index?: number
    onToggleExpand: () => void
    onStartEditing: (e?: React.MouseEvent) => void
    onCancelEditing: () => void
    onComplete: (isCompleted: boolean) => void
    onDelete: () => void
    onUpdate: (updates: Partial<Task>) => void
}

const getCheckboxBorder = (priority: string) => {
    switch (priority) {
        case "urgent": return "border-error hover:bg-error/10"
        case "high":   return "border-secondary hover:bg-secondary/10"
        case "low":    return "border-primary hover:bg-primary/10"
        default:       return "border-outline-variant hover:border-primary hover:bg-primary/10"
    }
}

const checkIconColor = (priority: string) => {
    switch (priority) {
        case "urgent": return "text-error"
        case "high":   return "text-secondary"
        default:       return "text-primary"
    }
}

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(({
    task,
    userId,
    isExpanded,
    isEditing,
    index = 0,
    onToggleExpand,
    onStartEditing,
    onCancelEditing,
    onComplete,
    onDelete,
    onUpdate
}, ref) => {
    const [editForm, setEditForm] = useState<Partial<Task>>({})

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
        const updatedSubtasks = task.subtasks.map((st: any) => {
            if (typeof st !== 'string' && st.id === subtaskId) return { ...st, is_completed: !st.is_completed }
            return st
        })
        onUpdate({ subtasks: updatedSubtasks })
    }

    const isOverdue = task.due_date && !task.is_completed && new Date(task.due_date) < new Date()
    const hasMetadata = task.due_date || task.duration_estimate || task.scope === 'shared'
        || (task.emergency_level === "high" || task.emergency_level === "critical")
        || (task.importance_level === "high" || task.importance_level === "critical")

    return (
        <div
            ref={ref}
            className="group relative animate-in fade-in slide-in-from-bottom-1 duration-200"
            style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
        >
            {/* Swipe underlay */}
            <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none rounded-2xl">
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
                        onComplete(task.is_completed)
                    } else if (info.offset.x < -80 || info.velocity.x < -500) {
                        triggerHaptic(ImpactStyle.Heavy)
                        onDelete()
                    }
                }}
                className="relative z-10"
            >
                <div className="bg-surface-container border border-outline-variant/60 rounded-2xl hover:border-outline-variant transition-colors overflow-hidden">
                    <div className="p-5">
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
                                        {editForm.subtasks.map((st: any, i: number) => (
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
                            <div className="flex items-start gap-4">

                                {/* Checkbox */}
                                <button
                                    onClick={() => { triggerHaptic(ImpactStyle.Medium); onComplete(task.is_completed) }}
                                    className={cn(
                                        "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 active:scale-90 group/check",
                                        getCheckboxBorder(task.priority),
                                        task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "bg-primary/20 border-primary"
                                    )}
                                    title={
                                        task.scope === 'shared'
                                            ? (task.completed_by?.includes(userId) ? "Waiting for partner…" : task.completed_by?.length === 1 ? "Partner finished! Your turn." : "Mark complete")
                                            : "Complete"
                                    }
                                >
                                    {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed ? (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                    ) : (
                                        <span className={cn(
                                            "material-symbols-outlined text-[16px] font-bold opacity-0 group-hover/check:opacity-100 transition-opacity",
                                            checkIconColor(task.priority)
                                        )}>check</span>
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">

                                    {/* Title row */}
                                    <div className="flex items-start gap-2">
                                        <h4
                                            className="flex-1 font-body font-semibold text-[15px] text-on-surface leading-snug cursor-pointer"
                                            onClick={onToggleExpand}
                                        >
                                            {task.title}
                                        </h4>

                                        {/* Priority badge (urgent/high only, collapsed) */}
                                        {!isExpanded && (task.priority === 'urgent' || task.priority === 'high') && (
                                            <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                                <span className={cn(
                                                    "text-[9px] font-bold font-label uppercase tracking-[0.12em] px-2 py-0.5 rounded-full pointer-events-none",
                                                    task.priority === 'urgent' ? "text-error bg-error/10" : "text-secondary bg-secondary/10"
                                                )}>
                                                    {task.priority}
                                                </span>
                                                <select
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    value={task.priority}
                                                    onChange={e => onUpdate({ priority: e.target.value as any })}
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Chevron */}
                                        <button
                                            onClick={onToggleExpand}
                                            className="text-on-surface-variant/60 hover:text-on-surface-variant transition-colors p-0.5 shrink-0 -mr-1"
                                        >
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                                        </button>
                                    </div>

                                    {/* Metadata row — compact, always shown if non-empty */}
                                    {hasMetadata && (
                                        <div className="flex items-center gap-2 mt-2.5 flex-wrap font-label uppercase tracking-[0.1em] text-[10px]">
                                            {task.due_date && (
                                                <span className={cn(
                                                    "flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                    isOverdue ? "text-error bg-error/10 font-bold" : "text-on-surface-variant bg-surface-container-high"
                                                )}>
                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                    {format(new Date(task.due_date), "MMM d, h:mm a")}
                                                </span>
                                            )}
                                            {task.duration_estimate && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-on-surface-variant bg-surface-container-high">
                                                    <span className="material-symbols-outlined text-[12px]">timer</span>
                                                    {task.duration_estimate}m
                                                </span>
                                            )}
                                            {(task.emergency_level === "high" || task.emergency_level === "critical") && (
                                                <span className="px-2 py-0.5 rounded-full text-error bg-error/10 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                                    {task.emergency_level}
                                                </span>
                                            )}
                                            {(task.importance_level === "high" || task.importance_level === "critical") && (
                                                <span className="px-2 py-0.5 rounded-full text-secondary bg-secondary/10 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">star</span>
                                                    {task.importance_level}
                                                </span>
                                            )}
                                            {task.scope === 'shared' && (
                                                <span className="px-2 py-0.5 rounded-full text-primary bg-primary/10 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_1</span>
                                                    Shared
                                                </span>
                                            )}
                                        </div>
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

                                            {/* Priority selector row (expanded) */}
                                            <div className="flex items-center justify-between">
                                                <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/60" onClick={e => e.stopPropagation()}>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        task.priority === 'urgent' ? "bg-error" :
                                                        task.priority === 'high' ? "bg-secondary" :
                                                        task.priority === 'low' ? "bg-primary" :
                                                        "bg-on-surface-variant"
                                                    )} />
                                                    <span className="text-[11px] font-label font-bold text-on-surface uppercase tracking-[0.08em]">{task.priority} prio</span>
                                                    <select
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                        value={task.priority}
                                                        onChange={e => onUpdate({ priority: e.target.value as any })}
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
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={onDelete}
                                                        className="text-on-surface-variant hover:text-error p-2 rounded-full bg-surface-container-high hover:bg-error/10 transition-colors active:scale-[0.98]"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Subtasks */}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="pt-3 border-t border-outline-variant/60 space-y-2">
                                                    <p className="text-[10px] font-label font-bold uppercase tracking-[0.12em] text-on-surface-variant">Checklist</p>
                                                    {task.subtasks.map((st: any, i: number) => {
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
                                                                    st.is_completed ? "text-on-surface-variant line-through" : "text-on-surface font-medium"
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
