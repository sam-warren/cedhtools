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
                    scryfall_id: string | null
                    type: number | null
                    type_line: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    unique_card_id: string
                    name: string
                    scryfall_id?: string | null
                    type?: number | null
                    type_line?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    unique_card_id?: string
                    name?: string
                    scryfall_id?: string | null
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
                    analyses_used: number
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
                    analyses_used?: number
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
                    analyses_used?: number
                    analyses_limit?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            deck_analyses: {
                Row: {
                    id: number
                    user_id: string
                    moxfield_url: string
                    commander_id: string
                    deck_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    moxfield_url: string
                    commander_id: string
                    deck_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    moxfield_url?: string
                    commander_id?: string
                    deck_name?: string | null
                    created_at?: string
                }
            }
            etl_status: {
                Row: {
                    id: number
                    start_date: string | null
                    end_date: string | null
                    status: string | null
                    records_processed: number
                    last_processed_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    start_date?: string | null
                    end_date?: string | null
                    status?: string | null
                    records_processed?: number
                    last_processed_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    start_date?: string | null
                    end_date?: string | null
                    status?: string | null
                    records_processed?: number
                    last_processed_date?: string | null
                    created_at?: string
                }
            }
            etl_jobs: {
                Row: {
                    id: number
                    job_type: string
                    status: string
                    parameters: Json
                    created_at: string
                    updated_at: string
                    priority: number
                    max_runtime_seconds: number
                }
                Insert: {
                    id?: number
                    job_type: string
                    status: string
                    parameters: Json
                    created_at?: string
                    updated_at?: string
                    priority: number
                    max_runtime_seconds: number
                }
                Update: {
                    id?: number
                    job_type?: string
                    status?: string
                    parameters?: Json
                    created_at?: string
                    updated_at?: string
                    priority?: number
                    max_runtime_seconds?: number
                }
            }
            etl_jobs_active: {
                Row: {
                    id: number
                    job_type: string
                    status: string
                    created_at: string
                    runtime_seconds: number
                }
                Insert: {
                    id: number
                    job_type: string
                    status: string
                    created_at: string
                    runtime_seconds: number
                }
                Update: {
                    id?: number
                    job_type?: string
                    status?: string
                    created_at?: string
                    runtime_seconds?: number
                }
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
    }
} 