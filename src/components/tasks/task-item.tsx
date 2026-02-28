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

const getAccentColor = (priority: string) => {
    switch (priority) {
        case "urgent": return "bg-red-500"
        case "high": return "bg-orange-500"
        case "medium": return "bg-primary"
        default: return "bg-green-500"
    }
}

const getDotColor = (priority: string) => {
    switch (priority) {
        case "urgent": return "bg-red-500"
        case "high": return "bg-orange-500"
        case "medium": return "bg-primary"
        default: return "bg-green-500"
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

    // Swipe to complete / delete values
    const x = useMotionValue(0)
    const completeOpacity = useTransform(x, [0, 60], [0, 1])
    const deleteOpacity = useTransform(x, [0, -60], [0, 1])

    useEffect(() => {
        if (isEditing) {
            setEditForm({ title: task.title, description: task.description, subtasks: task.subtasks })
        }
    }, [isEditing, task])

    const saveEdit = () => {
        onUpdate(editForm)
    }

    const handleSubtaskToggle = (subtaskId: string) => {
        if (!task.subtasks) return

        const updatedSubtasks = task.subtasks.map((st: any) => {
            if (typeof st !== 'string' && st.id === subtaskId) {
                return { ...st, is_completed: !st.is_completed }
            }
            return st
        })

        onUpdate({ subtasks: updatedSubtasks })
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
    const showEmergencyChip = task.emergency_level === "high" || task.emergency_level === "critical"
    const showImportanceChip = task.importance_level === "high" || task.importance_level === "critical"

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.22, delay: Math.min(index * 0.05, 0.3), ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group relative"
        >
            {/* Background Action Underlay */}
            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none rounded-2xl">
                <motion.div style={{ opacity: completeOpacity }} className="flex items-center gap-2 text-primary font-bold tracking-wide">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-5 h-5" strokeWidth={3} />
                    </div>
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-2 text-destructive font-bold tracking-wide">
                    <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5" strokeWidth={3} />
                    </div>
                </motion.div>
            </div>

            {/* Draggable Task Surface */}
            <motion.div
                style={{ x }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(e, info) => {
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
                <div className={cn(
                    "bg-card rounded-2xl p-4 border transition-colors",
                    task.priority === 'urgent'
                        ? "border-red-500/35 hover:border-red-500/55"
                        : task.priority === 'high'
                            ? "border-orange-500/30 hover:border-orange-500/50"
                            : "border-border/40 hover:border-primary/30"
                )}>
                    <div className="flex items-start gap-3">
                        {/* Left Accent Bar */}
                        <div className={cn(
                            "w-[3px] rounded-full self-stretch mr-0 shrink-0",
                            getAccentColor(task.priority)
                        )} />

                        {/* Checkbox Button */}
                        <button
                            onClick={() => {
                                triggerHaptic(ImpactStyle.Medium)
                                onComplete(task.is_completed)
                            }}
                            className={cn(
                                "mt-0.5 h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-all shrink-0 active:scale-90",
                                task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && "border-primary/50 bg-primary/20",
                                task.scope === 'shared' && task.completed_by && task.completed_by.length === 1 && !task.completed_by.includes(userId) && "border-primary/50 bg-transparent ring-2 ring-primary/20 ring-offset-1"
                            )}
                            title={task.scope === 'shared' ? (task.completed_by?.includes(userId) ? "Waiting for partner..." : task.completed_by && task.completed_by.length === 1 ? "Partner finished! Your turn." : "Mark complete") : "Complete task"}
                        >
                            {task.scope === 'shared' && task.completed_by?.includes(userId) && !task.is_completed && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary/70 animate-pulse" />
                            )}
                        </button>

                        {/* Task Content */}
                        {isEditing ? (
                            <div className="flex-1 min-w-0 space-y-3">
                                <input
                                    className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                                    value={editForm.title || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none min-h-[60px] shadow-sm leading-relaxed"
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description..."
                                />
                                {editForm.subtasks && editForm.subtasks.length > 0 && (
                                    <div className="space-y-2 mt-2 pl-1 border-l-2 border-primary/20">
                                        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Edit Subtasks</p>
                                        {editForm.subtasks.map((st: any, i: number) => (
                                            <div key={typeof st === 'string' ? i : st.id} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                                <input
                                                    className="flex-1 bg-background/60 border border-border/50 rounded-md px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                                    value={typeof st === 'string' ? st : st.title}
                                                    onChange={e => {
                                                        const newSubtasks = [...(editForm.subtasks || [])];
                                                        if (typeof st === 'string') newSubtasks[i] = e.target.value;
                                                        else newSubtasks[i] = { ...st, title: e.target.value };
                                                        setEditForm(prev => ({ ...prev, subtasks: newSubtasks }));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end pt-1">
                                    <button onClick={onCancelEditing} className="text-xs px-3 py-1.5 hover:bg-muted font-medium rounded-md text-muted-foreground transition-colors">Cancel</button>
                                    <button onClick={saveEdit} className="text-xs px-4 py-1.5 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:opacity-90 transition-opacity">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-w-0 space-y-1">
                                {/* Title Row */}
                                <div className="flex items-start justify-between gap-2">
                                    <h4
                                        className="font-semibold text-foreground text-[15px] leading-tight flex-1 cursor-pointer"
                                        onClick={onToggleExpand}
                                    >
                                        {task.title}
                                    </h4>

                                    {/* Priority Badge (always shown) */}
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        <div
                                            className="relative flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/30 bg-muted/40 cursor-pointer"
                                            title="Click to change Priority"
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 pointer-events-none", getDotColor(task.priority))} />
                                            <span className="text-[10px] font-medium text-muted-foreground capitalize pointer-events-none">
                                                {task.priority}
                                            </span>
                                            <select
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px]"
                                                value={task.priority}
                                                onChange={(e) => onUpdate({ priority: e.target.value as any })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>

                                        {/* Delete button — small, always visible on mobile, hover on desktop */}
                                        <button
                                            onClick={onDelete}
                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 -mr-1 text-muted-foreground hover:text-destructive"
                                            aria-label="Delete task"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description — only when expanded */}
                                {isExpanded && task.description && (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {task.description}
                                    </p>
                                )}

                                {/* Metadata Row — always visible */}
                                <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-muted-foreground/70">
                                    {task.due_date && (
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            isOverdue && "text-red-500 font-medium"
                                        )}>
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(task.due_date), "MMM d")}
                                        </div>
                                    )}

                                    {task.duration_estimate && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {task.duration_estimate} min
                                        </div>
                                    )}

                                    {showEmergencyChip && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 capitalize">
                                            🔥 {task.emergency_level}
                                        </span>
                                    )}

                                    {showImportanceChip && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                                            ⭐ {task.importance_level}
                                        </span>
                                    )}

                                    {task.scope === 'shared' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            Shared
                                        </span>
                                    )}

                                    {/* Edit + Chevron at far right */}
                                    <div className="ml-auto flex items-center gap-1">
                                        {isExpanded && (
                                            <button
                                                onClick={onStartEditing}
                                                className="text-muted-foreground hover:text-primary p-1.5 rounded-md transition-colors"
                                                title="Edit task"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={onToggleExpand}
                                            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* AI Breakdown — expanded only, if subtasks exist */}
                                {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mt-3 pl-3 border-l-2 border-primary/30 space-y-1.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                            AI Breakdown
                                        </p>
                                        {task.subtasks.map((st: any, i: number) => {
                                            if (typeof st === 'string') {
                                                return (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/80">
                                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                                        <span className="truncate">{st}</span>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <label key={st.id} className="flex items-center gap-2 text-xs cursor-pointer group/st py-0.5">
                                                    <div className="relative flex items-center justify-center shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={st.is_completed}
                                                            onChange={() => handleSubtaskToggle(st.id)}
                                                            className="peer h-3.5 w-3.5 appearance-none rounded-sm border border-muted-foreground/40 checked:border-primary checked:bg-primary hover:border-primary transition-all"
                                                        />
                                                        <Check className="absolute h-2.5 w-2.5 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                                                    </div>
                                                    <span className={cn(
                                                        "truncate transition-colors user-select-none",
                                                        st.is_completed ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground group-hover/st:text-primary/90"
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
            </motion.div>
        </motion.div>
    )
})

TaskItem.displayName = "TaskItem"
