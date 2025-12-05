/**
 * Supabase Database Types
 * 
 * Auto-generated types for the Supabase database schema.
 * Do not edit directly - regenerate using Supabase CLI.
 */

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
            commanders: {
                Row: {
                    id: string
                    name: string
                    wins: number
                    losses: number
                    draws: number
                    entries: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    wins?: number
                    losses?: number
                    draws?: number
                    entries?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    wins?: number
                    losses?: number
                    draws?: number
                    entries?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            cards: {
                Row: {
                    unique_card_id: string
                    name: string
                    type: number | null
                    type_line: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    unique_card_id: string
                    name: string
                    type?: number | null
                    type_line?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    unique_card_id?: string
                    name?: string
                    type?: number | null
                    type_line?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            statistics: {
                Row: {
                    id: number
                    commander_id: string
                    card_id: string
                    wins: number
                    losses: number
                    draws: number
                    entries: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    commander_id: string
                    card_id: string
                    wins?: number
                    losses?: number
                    draws?: number
                    entries?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    commander_id?: string
                    card_id?: string
                    wins?: number
                    losses?: number
                    draws?: number
                    entries?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    email: string
                    subscription_tier: string
                    subscription_start_date: string | null
                    subscription_end_date: string | null
                    analyses_limit: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    subscription_tier?: string
                    subscription_start_date?: string | null
                    subscription_end_date?: string | null
                    analyses_limit?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    subscription_tier?: string
                    subscription_start_date?: string | null
                    subscription_end_date?: string | null
                    analyses_limit?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            etl_jobs: {
                Row: {
                    id: number
                    job_type: string
                    status: string
                    parameters: Json
                    created_at: string
                    started_at: string | null
                    completed_at: string | null
                    next_cursor: string | null
                    records_processed: number
                    error: string | null
                    priority: number
                    max_runtime_seconds: number
                }
                Insert: {
                    id?: number
                    job_type: string
                    status: string
                    parameters?: Json
                    created_at?: string
                    started_at?: string | null
                    completed_at?: string | null
                    next_cursor?: string | null
                    records_processed?: number
                    error?: string | null
                    priority?: number
                    max_runtime_seconds?: number
                }
                Update: {
                    id?: number
                    job_type?: string
                    status?: string
                    parameters?: Json
                    created_at?: string
                    started_at?: string | null
                    completed_at?: string | null
                    next_cursor?: string | null
                    records_processed?: number
                    error?: string | null
                    priority?: number
                    max_runtime_seconds?: number
                }
            }
            processed_tournaments: {
                Row: {
                    tournament_id: string
                    name: string
                    processed_at: string
                }
                Insert: {
                    tournament_id: string
                    name: string
                    processed_at?: string
                }
                Update: {
                    tournament_id?: string
                    name?: string
                    processed_at?: string
                }
            }
        }
        Views: {
            etl_jobs_active: {
                Row: {
                    id: number
                    job_type: string
                    status: string
                    created_at: string
                    started_at: string | null
                    runtime_seconds: number | null
                    max_runtime_seconds: number
                    records_processed: number
                }
            }
        }
        Functions: {
            reset_stuck_jobs: {
                Args: Record<string, never>
                Returns: number
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

