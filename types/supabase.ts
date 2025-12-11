export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      card_commander_weekly_stats: {
        Row: {
          card_id: number
          commander_id: number
          created_at: string
          draws: number
          entries: number
          expected_top_cuts: number | null
          id: number
          losses: number
          top_cuts: number
          updated_at: string
          week_start: string
          wins: number
        }
        Insert: {
          card_id: number
          commander_id: number
          created_at?: string
          draws?: number
          entries?: number
          expected_top_cuts?: number | null
          id?: number
          losses?: number
          top_cuts?: number
          updated_at?: string
          week_start: string
          wins?: number
        }
        Update: {
          card_id?: number
          commander_id?: number
          created_at?: string
          draws?: number
          entries?: number
          expected_top_cuts?: number | null
          id?: number
          losses?: number
          top_cuts?: number
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_commander_weekly_stats_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_commander_weekly_stats_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commanders"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          cmc: number | null
          created_at: string
          id: number
          mana_cost: string | null
          name: string
          oracle_id: string | null
          scryfall_data: Json | null
          type_line: string | null
          updated_at: string
        }
        Insert: {
          cmc?: number | null
          created_at?: string
          id?: number
          mana_cost?: string | null
          name: string
          oracle_id?: string | null
          scryfall_data?: Json | null
          type_line?: string | null
          updated_at?: string
        }
        Update: {
          cmc?: number | null
          created_at?: string
          id?: number
          mana_cost?: string | null
          name?: string
          oracle_id?: string | null
          scryfall_data?: Json | null
          type_line?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commander_weekly_stats: {
        Row: {
          commander_id: number
          created_at: string
          draws: number
          entries: number
          entries_with_decklists: number | null
          expected_top_cuts: number | null
          id: number
          losses: number
          top_cuts: number
          updated_at: string
          week_start: string
          wins: number
        }
        Insert: {
          commander_id: number
          created_at?: string
          draws?: number
          entries?: number
          entries_with_decklists?: number | null
          expected_top_cuts?: number | null
          id?: number
          losses?: number
          top_cuts?: number
          updated_at?: string
          week_start: string
          wins?: number
        }
        Update: {
          commander_id?: number
          created_at?: string
          draws?: number
          entries?: number
          entries_with_decklists?: number | null
          expected_top_cuts?: number | null
          id?: number
          losses?: number
          top_cuts?: number
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "commander_weekly_stats_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commanders"
            referencedColumns: ["id"]
          },
        ]
      }
      commanders: {
        Row: {
          color_id: string
          created_at: string
          id: number
          is_legal: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color_id?: string
          created_at?: string
          id?: number
          is_legal?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color_id?: string
          created_at?: string
          id?: number
          is_legal?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      decklist_items: {
        Row: {
          card_id: number
          entry_id: number
          id: number
          quantity: number
        }
        Insert: {
          card_id: number
          entry_id: number
          id?: number
          quantity?: number
        }
        Update: {
          card_id?: number
          entry_id?: number
          id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "decklist_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decklist_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          commander_id: number | null
          created_at: string
          decklist: string | null
          decklist_valid: boolean | null
          draws: number
          id: number
          losses_bracket: number
          losses_swiss: number
          player_id: number
          standing: number | null
          tournament_id: number
          wins_bracket: number
          wins_swiss: number
        }
        Insert: {
          commander_id?: number | null
          created_at?: string
          decklist?: string | null
          decklist_valid?: boolean | null
          draws?: number
          id?: number
          losses_bracket?: number
          losses_swiss?: number
          player_id: number
          standing?: number | null
          tournament_id: number
          wins_bracket?: number
          wins_swiss?: number
        }
        Update: {
          commander_id?: number | null
          created_at?: string
          decklist?: string | null
          decklist_valid?: boolean | null
          draws?: number
          id?: number
          losses_bracket?: number
          losses_swiss?: number
          player_id?: number
          standing?: number | null
          tournament_id?: number
          wins_bracket?: number
          wins_swiss?: number
        }
        Relationships: [
          {
            foreignKeyName: "entries_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commanders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          entry_id: number | null
          game_id: number
          id: number
          player_id: number
          seat_position: number
        }
        Insert: {
          entry_id?: number | null
          game_id: number
          id?: number
          player_id: number
          seat_position: number
        }
        Update: {
          entry_id?: number | null
          game_id?: number
          id?: number
          player_id?: number
          seat_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          id: number
          is_draw: boolean
          round: string
          table_number: number
          tournament_id: number
          winner_player_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_draw?: boolean
          round: string
          table_number: number
          tournament_id: number
          winner_player_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          is_draw?: boolean
          round?: string
          table_number?: number
          tournament_id?: number
          winner_player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error: string | null
          id: number
          job_type: string
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error?: string | null
          id?: number
          job_type: string
          priority?: number
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          error?: string | null
          id?: number
          job_type?: string
          priority?: number
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          id: number
          name: string
          topdeck_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          topdeck_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          topdeck_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seat_position_weekly_stats: {
        Row: {
          commander_id: number
          created_at: string
          games: number
          id: number
          seat_position: number
          updated_at: string
          week_start: string
          wins: number
        }
        Insert: {
          commander_id: number
          created_at?: string
          games?: number
          id?: number
          seat_position: number
          updated_at?: string
          week_start: string
          wins?: number
        }
        Update: {
          commander_id?: number
          created_at?: string
          games?: number
          id?: number
          seat_position?: number
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "seat_position_weekly_stats_commander_id_fkey"
            columns: ["commander_id"]
            isOneToOne: false
            referencedRelation: "commanders"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_url: string | null
          created_at: string
          id: number
          name: string
          size: number
          swiss_rounds: number
          tid: string
          top_cut: number
          tournament_date: string
          updated_at: string
        }
        Insert: {
          bracket_url?: string | null
          created_at?: string
          id?: number
          name: string
          size: number
          swiss_rounds?: number
          tid: string
          top_cut?: number
          tournament_date: string
          updated_at?: string
        }
        Update: {
          bracket_url?: string | null
          created_at?: string
          id?: number
          name?: string
          size?: number
          swiss_rounds?: number
          tid?: string
          top_cut?: number
          tournament_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_job: {
        Args: { p_job_types: string[]; p_worker_id: string }
        Returns: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error: string | null
          id: number
          job_type: string
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string | null
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cleanup_old_jobs: { Args: { p_days_to_keep?: number }; Returns: number }
      complete_job: {
        Args: { p_job_id: number; p_result?: Json }
        Returns: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error: string | null
          id: number
          job_type: string
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string | null
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enqueue_job: {
        Args: { p_config?: Json; p_job_type: string; p_priority?: number }
        Returns: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error: string | null
          id: number
          job_type: string
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string | null
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fail_job: {
        Args: { p_error: string; p_job_id: number }
        Returns: {
          completed_at: string | null
          config: Json | null
          created_at: string | null
          error: string | null
          id: number
          job_type: string
          priority: number
          result: Json | null
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string | null
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_card_commander_detail_stats: {
        Args: {
          card_id_param: number
          commander_id_param: number
          date_filter?: string
        }
        Returns: {
          commander_total_draws: number
          commander_total_entries: number
          commander_total_entries_with_decklists: number
          commander_total_losses: number
          commander_total_wins: number
          draws: number
          entries: number
          expected_top_cuts: number
          losses: number
          top_cuts: number
          week_commander_entries: number
          week_commander_entries_with_decklists: number
          week_start: string
          wins: number
        }[]
      }
      get_commander_card_stats: {
        Args: { commander_id_param: number; date_filter?: string }
        Returns: {
          card_id: number
          card_name: string
          cmc: number
          commander_draws: number
          commander_entries: number
          commander_entries_with_decklists: number
          commander_expected_top_cuts: number
          commander_losses: number
          commander_top_cuts: number
          commander_wins: number
          draws: number
          entries: number
          expected_top_cuts: number
          losses: number
          mana_cost: string
          oracle_id: string
          top_cuts: number
          type_line: string
          wins: number
        }[]
      }
      get_commander_detail_stats: {
        Args: { commander_id_param: number; date_filter?: string }
        Returns: {
          draws: number
          entries: number
          expected_top_cuts: number
          losses: number
          top_cuts: number
          week_start: string
          week_total_entries: number
          wins: number
        }[]
      }
      get_commander_list_stats: {
        Args: { date_filter?: string; search_pattern?: string }
        Returns: {
          color_id: string
          commander_id: number
          draws: number
          entries: number
          expected_top_cuts: number
          losses: number
          name: string
          top_cuts: number
          total_meta_entries: number
          wins: number
        }[]
      }
      get_commander_seat_stats: {
        Args: { commander_id_param: number; date_filter?: string }
        Returns: {
          games: number
          seat_position: number
          wins: number
        }[]
      }
      reset_stuck_jobs: {
        Args: { p_timeout_minutes?: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

