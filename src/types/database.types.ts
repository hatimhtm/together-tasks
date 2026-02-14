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
