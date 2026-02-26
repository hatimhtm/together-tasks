export interface Task {
    id: string
    title: string
    description: string | null
    due_date: string | null
    is_completed: boolean
    priority: "low" | "medium" | "high" | "urgent"
    creator_id: string
    assignee_id: string
    created_at: string
    completed_at: string | null
    emergency_level?: "low" | "medium" | "high" | "critical"
    importance_level?: "low" | "medium" | "high" | "critical"
    duration_estimate?: number
    scope?: string | null
    subtasks?: ({ id: string, title: string, is_completed: boolean } | string)[] | null
    completed_by?: string[] | null
}
