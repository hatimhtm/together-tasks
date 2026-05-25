// Subtasks are a plain editable bullet list (no completion state, no count).
// Legacy rows may still carry object-shaped entries; we normalize those to
// their title string when reading, so the UI only ever deals with strings.
export type Subtask = string

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
    subtasks?: (Subtask | { id?: string; title?: string; is_completed?: boolean })[] | null
    completed_by?: string[] | null
}

export interface Profile {
    id: string
    email: string
    role: "king" | "queen" | null
    username: string
    partner_id?: string | null
    pairing_code?: string | null
    has_completed_onboarding: boolean
    theme?: string
    avatar_url?: string | null
    goals?: string | null
}
