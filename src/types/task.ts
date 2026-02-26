export type Subtask = { id: string; title: string; is_completed: boolean } | string

export interface Task {
    id: string
    title: string
    description: string | null
    due_date: string | null
    priority: "low" | "medium" | "high" | "urgent"
    is_completed: boolean
    creator_id: string
    assignee_id: string
    created_at: string
    completed_at: string | null
    emergency_level?: "low" | "medium" | "high" | "critical"
    importance_level?: "low" | "medium" | "high" | "critical"
    duration_estimate?: number
    scope?: string | null
    subtasks?: Subtask[] | null
    completed_by?: string[] | null
}
