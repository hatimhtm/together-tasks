export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    username: string | null
                    role: 'queen' | 'king' | null
                    theme: string | null
                    ai_personality: string | null
                    goals: string | null
                    schedule_habits: string | null
                    has_completed_onboarding: boolean
                    xp: number
                    level: number
                    avatar_url: string | null
                    partner_id: string | null
                    streak: number | null
                    last_active_date: string | null
                    briefing_time: string | null
                    briefing_enabled: boolean | null
                    weekly_review_enabled: boolean | null
                    notification_prefs_set: boolean | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    phone?: string | null
                    username?: string | null
                    role?: 'queen' | 'king' | null
                    theme?: string | null
                    ai_personality?: string | null
                    goals?: string | null
                    schedule_habits?: string | null
                    has_completed_onboarding?: boolean
                    xp?: number
                    level?: number
                    avatar_url?: string | null
                    partner_id?: string | null
                    streak?: number | null
                    last_active_date?: string | null
                    briefing_time?: string | null
                    briefing_enabled?: boolean | null
                    weekly_review_enabled?: boolean | null
                    notification_prefs_set?: boolean | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    username?: string | null
                    role?: 'queen' | 'king' | null
                    theme?: string | null
                    ai_personality?: string | null
                    goals?: string | null
                    schedule_habits?: string | null
                    has_completed_onboarding?: boolean
                    xp?: number
                    level?: number
                    avatar_url?: string | null
                    partner_id?: string | null
                    streak?: number | null
                    last_active_date?: string | null
                    briefing_time?: string | null
                    briefing_enabled?: boolean | null
                    weekly_review_enabled?: boolean | null
                    notification_prefs_set?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            tasks: {
                Row: {
                    id: string
                    creator_id: string | null
                    assignee_id: string | null
                    title: string
                    description: string | null
                    due_date: string | null
                    is_completed: boolean
                    completed_at: string | null
                    category_id: string | null
                    priority: 'low' | 'medium' | 'high' | null
                    recurrence_rule: string | null
                    is_private: boolean
                    scope: string | null
                    emergency_level: 'low' | 'medium' | 'high' | 'critical' | null
                    importance_level: 'low' | 'medium' | 'high' | 'critical' | null
                    duration_estimate: number | null
                    subtasks: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    creator_id?: string | null
                    assignee_id?: string | null
                    title: string
                    description?: string | null
                    due_date?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                    category_id?: string | null
                    priority?: 'low' | 'medium' | 'high' | null
                    recurrence_rule?: string | null
                    is_private?: boolean
                    scope?: string | null
                    emergency_level?: 'low' | 'medium' | 'high' | 'critical' | null
                    importance_level?: 'low' | 'medium' | 'high' | 'critical' | null
                    duration_estimate?: number | null
                    subtasks?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    creator_id?: string | null
                    assignee_id?: string | null
                    title?: string
                    description?: string | null
                    due_date?: string | null
                    is_completed?: boolean
                    completed_at?: string | null
                    category_id?: string | null
                    priority?: 'low' | 'medium' | 'high' | null
                    recurrence_rule?: string | null
                    is_private?: boolean
                    scope?: string | null
                    emergency_level?: 'low' | 'medium' | 'high' | 'critical' | null
                    importance_level?: 'low' | 'medium' | 'high' | 'critical' | null
                    duration_estimate?: number | null
                    subtasks?: Json | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_assignee_id_fkey"
                        columns: ["assignee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            rewards: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    point_cost: number
                    is_active: boolean
                    creator_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    point_cost: number
                    is_active?: boolean
                    creator_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    point_cost?: number
                    is_active?: boolean
                    creator_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "rewards_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            push_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    endpoint?: string
                    p256dh?: string
                    auth?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "push_subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            partner_notifications: {
                Row: {
                    id: string
                    task_id: string | null
                    task_owner_id: string
                    partner_id: string
                    notification_type: string | null
                    ai_reasoning: string | null
                    message: string | null
                    sent_at: string | null
                    read_at: string | null
                    action_taken: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id?: string | null
                    task_owner_id: string
                    partner_id: string
                    notification_type?: string | null
                    ai_reasoning?: string | null
                    message?: string | null
                    sent_at?: string | null
                    read_at?: string | null
                    action_taken?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string | null
                    task_owner_id?: string
                    partner_id?: string
                    notification_type?: string | null
                    ai_reasoning?: string | null
                    message?: string | null
                    sent_at?: string | null
                    read_at?: string | null
                    action_taken?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "partner_notifications_task_owner_id_fkey"
                        columns: ["task_owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "partner_notifications_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    color: string | null
                    icon: string | null
                    user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    color?: string | null
                    icon?: string | null
                    user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    color?: string | null
                    icon?: string | null
                    user_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
