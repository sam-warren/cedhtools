// Supabase Database Types for cedhtools
// These types define our database schema for use with the Supabase client

export interface Database {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: number;
          tid: string;
          name: string;
          tournament_date: string;
          size: number;
          swiss_rounds: number;
          top_cut: number;
          bracket_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tid: string;
          name: string;
          tournament_date: string;
          size: number;
          swiss_rounds?: number;
          top_cut?: number;
          bracket_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tid?: string;
          name?: string;
          tournament_date?: string;
          size?: number;
          swiss_rounds?: number;
          top_cut?: number;
          bracket_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: number;
          name: string;
          topdeck_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          topdeck_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          topdeck_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commanders: {
        Row: {
          id: number;
          name: string;
          color_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          color_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          color_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: number;
          name: string;
          oracle_id: string | null;
          type_line: string | null;
          mana_cost: string | null;
          cmc: number | null;
          scryfall_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          oracle_id?: string | null;
          type_line?: string | null;
          mana_cost?: string | null;
          cmc?: number | null;
          scryfall_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          oracle_id?: string | null;
          type_line?: string | null;
          mana_cost?: string | null;
          cmc?: number | null;
          scryfall_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: number;
          tournament_id: number;
          player_id: number;
          commander_id: number | null;
          standing: number | null;
          wins_swiss: number;
          wins_bracket: number;
          losses_swiss: number;
          losses_bracket: number;
          draws: number;
          decklist: string | null;
          decklist_valid: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          player_id: number;
          commander_id?: number | null;
          standing?: number | null;
          wins_swiss?: number;
          wins_bracket?: number;
          losses_swiss?: number;
          losses_bracket?: number;
          draws?: number;
          decklist_url?: string | null;
          decklist_valid?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          player_id?: number;
          commander_id?: number | null;
          standing?: number | null;
          wins_swiss?: number;
          wins_bracket?: number;
          losses_swiss?: number;
          losses_bracket?: number;
          draws?: number;
          decklist_url?: string | null;
          decklist_valid?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      decklist_items: {
        Row: {
          id: number;
          entry_id: number;
          card_id: number;
          quantity: number;
        };
        Insert: {
          id?: number;
          entry_id: number;
          card_id: number;
          quantity?: number;
        };
        Update: {
          id?: number;
          entry_id?: number;
          card_id?: number;
          quantity?: number;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: number;
          tournament_id: number;
          round: string;
          table_number: number;
          winner_player_id: number | null;
          is_draw: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          tournament_id: number;
          round: string;
          table_number: number;
          winner_player_id?: number | null;
          is_draw?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          tournament_id?: number;
          round?: string;
          table_number?: number;
          winner_player_id?: number | null;
          is_draw?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      game_players: {
        Row: {
          id: number;
          game_id: number;
          player_id: number;
          entry_id: number | null;
          seat_position: number;
        };
        Insert: {
          id?: number;
          game_id: number;
          player_id: number;
          entry_id?: number | null;
          seat_position: number;
        };
        Update: {
          id?: number;
          game_id?: number;
          player_id?: number;
          entry_id?: number | null;
          seat_position?: number;
        };
        Relationships: [];
      };
      commander_weekly_stats: {
        Row: {
          id: number;
          commander_id: number;
          week_start: string;
          entries: number;
          entries_with_decklists: number;
          top_cuts: number;
          expected_top_cuts: number; // Sum of (topCut/tournamentSize) for each entry
          wins: number;
          draws: number;
          losses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          commander_id: number;
          week_start: string;
          entries?: number;
          entries_with_decklists?: number;
          top_cuts?: number;
          expected_top_cuts?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          commander_id?: number;
          week_start?: string;
          entries?: number;
          entries_with_decklists?: number;
          top_cuts?: number;
          expected_top_cuts?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      card_commander_weekly_stats: {
        Row: {
          id: number;
          card_id: number;
          commander_id: number;
          week_start: string;
          entries: number;
          top_cuts: number;
          expected_top_cuts: number; // Sum of (topCut/tournamentSize) for each entry
          wins: number;
          draws: number;
          losses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          card_id: number;
          commander_id: number;
          week_start: string;
          entries?: number;
          top_cuts?: number;
          expected_top_cuts?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          card_id?: number;
          commander_id?: number;
          week_start?: string;
          entries?: number;
          top_cuts?: number;
          expected_top_cuts?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seat_position_weekly_stats: {
        Row: {
          id: number;
          commander_id: number;
          seat_position: number;
          week_start: string;
          games: number;
          wins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          commander_id: number;
          seat_position: number;
          week_start: string;
          games?: number;
          wins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          commander_id?: number;
          seat_position?: number;
          week_start?: string;
          games?: number;
          wins?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Type aliases for convenience
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentInsert = Database["public"]["Tables"]["tournaments"]["Insert"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type Commander = Database["public"]["Tables"]["commanders"]["Row"];
export type CommanderInsert = Database["public"]["Tables"]["commanders"]["Insert"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardInsert = Database["public"]["Tables"]["cards"]["Insert"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];
export type DecklistItem = Database["public"]["Tables"]["decklist_items"]["Row"];
export type DecklistItemInsert = Database["public"]["Tables"]["decklist_items"]["Insert"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GamePlayer = Database["public"]["Tables"]["game_players"]["Row"];
export type GamePlayerInsert = Database["public"]["Tables"]["game_players"]["Insert"];
export type CommanderWeeklyStats = Database["public"]["Tables"]["commander_weekly_stats"]["Row"];
export type CommanderWeeklyStatsInsert = Database["public"]["Tables"]["commander_weekly_stats"]["Insert"];
export type CardCommanderWeeklyStats = Database["public"]["Tables"]["card_commander_weekly_stats"]["Row"];
export type CardCommanderWeeklyStatsInsert = Database["public"]["Tables"]["card_commander_weekly_stats"]["Insert"];
export type SeatPositionWeeklyStats = Database["public"]["Tables"]["seat_position_weekly_stats"]["Row"];
export type SeatPositionWeeklyStatsInsert = Database["public"]["Tables"]["seat_position_weekly_stats"]["Insert"];

// Extended types for API responses
export interface CommanderWithStats extends Commander {
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100
  win_rate: number;
  meta_share: number;
}

export interface CardWithCommanderStats extends Card {
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  play_rate: number;
  win_rate: number;
}

export interface SeatPositionStats {
  seat_position: number;
  games: number;
  wins: number;
  win_rate: number;
}

export interface WeeklyDataPoint {
  week_start: string;
  entries: number;
  top_cuts: number;
  expected_top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100
  win_rate: number;
}
