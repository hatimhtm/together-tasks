"use client"

import { Task } from "@/types/task"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Trash2, ChevronDown, ChevronUp } from "lucide-react"
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

const getPriorityBadgeStyles = (priority: string) => {
    switch (priority) {
        case "urgent": return "text-error bg-error/10"
        case "high":   return "text-secondary bg-secondary/10"
        case "low":    return "text-primary bg-primary/10"
        default:       return "text-tertiary-fixed-dim bg-tertiary-fixed/10"
    }
}

const getCheckboxBorder = (priority: string) => {
    switch (priority) {
        case "urgent": return "border-error hover:border-error hover:bg-error/10"
        case "high":   return "border-secondary hover:border-secondary hover:bg-secondary/10"
        case "low":    return "border-primary hover:border-primary hover:bg-primary/10"
        default:       return "border-outline-variant hover:border-primary hover:bg-primary/10"
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
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.25), ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group relative"
        >
            {/* Swipe underlay */}
            <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none rounded-xl">
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
                    if (info.offset.x > 80 || info.velocity.x > 500) {
                        triggerHapticSuccess()
                        onComplete(task.is_completed)
                    } else if (info.offset.x < -80 || info.velocity.x < -500) {
                        triggerHaptic(ImpactStyle.Heavy)
                        onDelete()
                    }
                }}
                className="relative z-10"
            >
                <div className="bg-surface-container rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-200 shadow-sm overflow-hidden active:scale-[0.99]">
                    <div className="px-4 py-3.5">
                        {isEditing ? (
                            /* ── Edit mode ── */
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-body text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-body text-on-surface-variant focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none min-h-[60px] leading-relaxed"
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add a note..."
                                />
                                {editForm.subtasks && editForm.subtasks.length > 0 && (
                                    <div className="space-y-1.5 pl-1 border-l-2 border-primary/20">
                                        <p className="text-[10px] font-label font-bold text-primary/70 uppercase tracking-wider">Steps</p>
                                        {editForm.subtasks.map((st: any, i: number) => (
                                            <input
                                                key={typeof st === 'string' ? i : st.id}
                                                className="w-full bg-surface-container-high/50 border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
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
                                    <button onClick={onCancelEditing} className="text-xs px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors font-label font-medium">Cancel</button>
                                    <button onClick={saveEdit} className="text-xs px-4 py-1.5 bg-primary text-on-primary font-label font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all">Save</button>
                                </div>
                            </div>
                        ) : (
                            /* ── View mode ── */
                            <div className="flex items-start gap-4">

                                {/* Checkbox */}
                                <button
                                    onClick={() => { triggerHaptic(ImpactStyle.Medium); onComplete(task.is_completed) }}
                                    className={cn(
                                        "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-90 relative overflow-hidden group/check",
                                        getCheckboxBorder(task.priority),
                                        task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "bg-primary/20 border-primary shadow-[0_0_10px_rgba(255,183,125,0.3)]"
                                    )}
                                    title={
                                        task.scope === 'shared'
                                            ? (task.completed_by?.includes(userId) ? "Waiting for partner…" : task.completed_by?.length === 1 ? "Partner finished! Your turn." : "Mark complete")
                                            : "Complete"
                                    }
                                >
                                    {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed ? (
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    ) : (
                                        <span className={cn(
                                            "material-symbols-outlined text-[16px] transition-colors duration-200 font-bold",
                                            task.priority === 'urgent' ? "text-error opacity-0 group-hover/check:opacity-100" :
                                            task.priority === 'high' ? "text-secondary opacity-0 group-hover/check:opacity-100" :
                                            "text-primary opacity-0 group-hover/check:opacity-100"
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
                                                    "text-[9px] font-bold font-label uppercase tracking-widest px-2 py-0.5 rounded-full pointer-events-none",
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
                                            className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors p-0.5 shrink-0 -mr-1"
                                        >
                                            {isExpanded
                                                ? <ChevronUp className="h-4 w-4" />
                                                : <ChevronDown className="h-4 w-4" />
                                            }
                                        </button>
                                    </div>

                                    {/* Metadata row — compact, always shown if non-empty */}
                                    {hasMetadata && (
                                        <div className="flex items-center gap-2 mt-2 flex-wrap font-label uppercase tracking-widest text-[10px]">
                                            {task.due_date && (
                                                <span className={cn(
                                                    "flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                    isOverdue ? "text-error bg-error/10 font-bold" : "text-tertiary-fixed-dim bg-tertiary-fixed/10"
                                                )}>
                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                    {format(new Date(task.due_date), "MMM d, h:mm a")}
                                                </span>
                                            )}
                                            {task.duration_estimate && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-tertiary-fixed-dim bg-tertiary-fixed/10">
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
                                        <div className="mt-4 space-y-4">
                                            {/* Description */}
                                            {task.description && (
                                                <p className="text-[13px] font-body text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Priority selector row (expanded) */}
                                            <div className="flex items-center justify-between">
                                                <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/20" onClick={e => e.stopPropagation()}>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        task.priority === 'urgent' ? "bg-error" :
                                                        task.priority === 'high' ? "bg-secondary" :
                                                        task.priority === 'low' ? "bg-primary" :
                                                        "bg-tertiary-fixed-dim"
                                                    )} />
                                                    <span className="text-[11px] font-label font-bold text-on-surface uppercase tracking-wider">{task.priority} Prio</span>
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
                                                        className="text-on-surface-variant/80 hover:text-primary p-2 rounded-full bg-surface-container-high hover:bg-primary/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={onDelete}
                                                        className="text-on-surface-variant/80 hover:text-error p-2 rounded-full bg-surface-container-high hover:bg-error/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Subtasks */}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="pt-3 border-t border-outline-variant/10 space-y-2">
                                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant/70">Checklist</p>
                                                    {task.subtasks.map((st: any, i: number) => {
                                                        if (typeof st === 'string') return (
                                                            <div key={i} className="flex items-center gap-3 text-sm font-body text-on-surface-variant pl-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/40 shrink-0" />
                                                                {st}
                                                            </div>
                                                        )
                                                        return (
                                                            <label key={st.id} className="flex items-center gap-3 text-[13px] font-body cursor-pointer group/st bg-surface-container-low/50 hover:bg-surface-container-low px-2 py-1.5 rounded-lg transition-colors">
                                                                <div className="relative flex items-center justify-center shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={st.is_completed}
                                                                        onChange={() => handleSubtaskToggle(st.id)}
                                                                        className="peer h-4 w-4 appearance-none rounded-sm border-2 border-outline-variant/40 checked:border-primary checked:bg-primary transition-all cursor-pointer"
                                                                    />
                                                                    <span className="material-symbols-outlined text-[14px] absolute text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                                                </div>
                                                                <span className={cn(
                                                                    "transition-colors",
                                                                    st.is_completed ? "text-on-surface-variant/40 line-through" : "text-on-surface group-hover/st:text-on-surface font-medium"
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
        </motion.div>
    )
})

TaskItem.displayName = "TaskItem"
