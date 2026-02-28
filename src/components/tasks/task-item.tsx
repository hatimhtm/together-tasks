"use client"

import { Task } from "@/types/task"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Check, Trash2, Calendar, Clock, Pencil, ChevronDown, ChevronUp } from "lucide-react"
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

const checkboxClass = (priority: string) => {
    switch (priority) {
        case "urgent": return "border-red-500/80 hover:bg-red-500/10"
        case "high":   return "border-orange-400/80 hover:bg-orange-500/10"
        case "low":    return "border-green-500/60 hover:bg-green-500/10"
        default:       return "border-muted-foreground/30 hover:border-primary/60"
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
            <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none rounded-2xl">
                <motion.div style={{ opacity: completeOpacity }} className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-destructive" strokeWidth={2.5} />
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
                <div className="bg-card border border-border/30 rounded-2xl overflow-hidden hover:border-border/60 transition-colors duration-200">
                    <div className="px-4 py-3.5">
                        {isEditing ? (
                            /* ── Edit mode ── */
                            <div className="space-y-3">
                                <input
                                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-sm text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none min-h-[60px] leading-relaxed"
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Add a note..."
                                />
                                {editForm.subtasks && editForm.subtasks.length > 0 && (
                                    <div className="space-y-1.5 pl-1 border-l-2 border-primary/20">
                                        <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">Steps</p>
                                        {editForm.subtasks.map((st: any, i: number) => (
                                            <input
                                                key={typeof st === 'string' ? i : st.id}
                                                className="w-full bg-muted/20 border border-border/30 rounded-lg px-2 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
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
                                    <button onClick={onCancelEditing} className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors font-medium">Cancel</button>
                                    <button onClick={saveEdit} className="text-xs px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">Save</button>
                                </div>
                            </div>
                        ) : (
                            /* ── View mode ── */
                            <div className="flex items-start gap-3">

                                {/* Checkbox */}
                                <button
                                    onClick={() => { triggerHaptic(ImpactStyle.Medium); onComplete(task.is_completed) }}
                                    className={cn(
                                        "mt-0.5 h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-90",
                                        checkboxClass(task.priority),
                                        task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "bg-primary/20 border-primary/50"
                                    )}
                                    title={
                                        task.scope === 'shared'
                                            ? (task.completed_by?.includes(userId) ? "Waiting for partner…" : task.completed_by?.length === 1 ? "Partner finished! Your turn." : "Mark complete")
                                            : "Complete"
                                    }
                                >
                                    {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && (
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">

                                    {/* Title row */}
                                    <div className="flex items-start gap-2">
                                        <h4
                                            className="flex-1 font-medium text-[14.5px] text-foreground leading-snug cursor-pointer"
                                            onClick={onToggleExpand}
                                        >
                                            {task.title}
                                        </h4>

                                        {/* Priority badge (urgent/high only, collapsed) */}
                                        {!isExpanded && (task.priority === 'urgent' || task.priority === 'high') && (
                                            <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full pointer-events-none",
                                                    task.priority === 'urgent' ? "text-red-500 bg-red-500/10" : "text-orange-400 bg-orange-500/10"
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
                                            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5 shrink-0 -mr-1"
                                        >
                                            {isExpanded
                                                ? <ChevronUp className="h-3.5 w-3.5" />
                                                : <ChevronDown className="h-3.5 w-3.5" />
                                            }
                                        </button>
                                    </div>

                                    {/* Metadata row — compact, always shown if non-empty */}
                                    {hasMetadata && (
                                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                                            {task.due_date && (
                                                <span className={cn(
                                                    "flex items-center gap-1 text-[11px]",
                                                    isOverdue ? "text-red-400 font-medium" : "text-muted-foreground/60"
                                                )}>
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {format(new Date(task.due_date), "MMM d")}
                                                </span>
                                            )}
                                            {task.duration_estimate && (
                                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {task.duration_estimate}m
                                                </span>
                                            )}
                                            {(task.emergency_level === "high" || task.emergency_level === "critical") && (
                                                <span className="text-[10px] text-red-400/80">🔥 {task.emergency_level}</span>
                                            )}
                                            {(task.importance_level === "high" || task.importance_level === "critical") && (
                                                <span className="text-[10px] text-amber-400/80">⭐ {task.importance_level}</span>
                                            )}
                                            {task.scope === 'shared' && (
                                                <span className="text-[10px] text-primary/60 font-medium">Shared</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="mt-3 space-y-3">
                                            {/* Description */}
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {task.description}
                                                </p>
                                            )}

                                            {/* Priority selector row (expanded) */}
                                            <div className="flex items-center justify-between">
                                                <div className="relative inline-flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        task.priority === 'urgent' ? "bg-red-500" :
                                                        task.priority === 'high' ? "bg-orange-400" :
                                                        task.priority === 'low' ? "bg-green-500" :
                                                        "bg-primary"
                                                    )} />
                                                    <span className="text-xs text-muted-foreground capitalize">{task.priority} priority</span>
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

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={onStartEditing}
                                                        className="text-muted-foreground/50 hover:text-primary p-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={onDelete}
                                                        className="text-muted-foreground/50 hover:text-destructive p-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Subtasks */}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="pt-1 border-t border-border/20 space-y-1.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Steps</p>
                                                    {task.subtasks.map((st: any, i: number) => {
                                                        if (typeof st === 'string') return (
                                                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/70 pl-0.5">
                                                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0" />
                                                                {st}
                                                            </div>
                                                        )
                                                        return (
                                                            <label key={st.id} className="flex items-center gap-2.5 text-xs cursor-pointer group/st">
                                                                <div className="relative flex items-center justify-center shrink-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={st.is_completed}
                                                                        onChange={() => handleSubtaskToggle(st.id)}
                                                                        className="peer h-3.5 w-3.5 appearance-none rounded-sm border border-muted-foreground/30 checked:border-primary checked:bg-primary transition-all"
                                                                    />
                                                                    <Check className="absolute h-2.5 w-2.5 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                                                                </div>
                                                                <span className={cn(
                                                                    "transition-colors",
                                                                    st.is_completed ? "text-muted-foreground/40 line-through" : "text-foreground/80 group-hover/st:text-foreground"
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
