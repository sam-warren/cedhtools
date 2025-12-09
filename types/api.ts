// API Response Types for cedhtools

export type SortBy = "popularity" | "conversion" | "win_rate";
export type TimePeriod = "1_month" | "3_months" | "6_months" | "1_year" | "all_time";

// Commander types
export interface CommanderListItem {
  id: number;
  name: string;
  color_id: string;
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100 - accounts for tournament size
  win_rate: number;
  meta_share: number;
}

export interface CommandersResponse {
  commanders: CommanderListItem[];
  total: number;
  totalEntries: number;
}

export interface TournamentInfo {
  id: number;
  tid: string;
  name: string;
  tournament_date: string;
  size: number;
  top_cut: number;
}

export interface PlayerInfo {
  id: number;
  name: string;
  topdeck_id?: string | null;
}

export interface EntryInfo {
  id: number;
  standing: number | null;
  wins_swiss: number;
  wins_bracket: number;
  losses_swiss: number;
  losses_bracket: number;
  draws: number;
  decklist: string | null;
  player: PlayerInfo;
  tournament: TournamentInfo;
}

export interface TrendDataPoint {
  week_start: string;
  entries: number;
  top_cuts: number;
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100
  win_rate: number;
  meta_share: number;
}

export interface CommanderDetail {
  id: number;
  name: string;
  color_id: string;
  stats: {
    entries: number;
    top_cuts: number;
    wins: number;
    draws: number;
    losses: number;
    conversion_rate: number;
    conversion_score: number; // (top_cuts / expected_top_cuts) * 100
    win_rate: number;
  };
  entries: EntryInfo[];
  trend: TrendDataPoint[];
}

// Card types
export interface CardInfo {
  id: number;
  name: string;
  oracle_id: string | null;
  type_line: string | null;
  mana_cost: string | null;
  cmc: number | null;
}

export interface CardWithStats extends CardInfo {
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  play_rate: number;
  win_rate: number;
  win_rate_delta: number; // Difference from commander's overall win rate
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100
  conversion_score_delta: number; // Difference from commander's overall conversion score
}

export interface CommanderCardsResponse {
  commander_id: number;
  commander_name: string;
  total_entries: number;
  commander_win_rate: number;
  commander_conversion_score: number;
  cards: CardWithStats[];
}

// Seat position types
export interface SeatStats {
  seat: number;
  games: number;
  wins: number;
  winRate: number;
}

export interface SeatPositionResponse {
  commander_id: number;
  commander_name: string;
  total_games: number;
  expected_win_rate: number;
  seats: SeatStats[];
}

// Card/Commander stats types
export interface CardCommanderStats {
  card: CardInfo;
  commander: {
    id: number;
    name: string;
    color_id: string;
  };
  stats: {
    entries: number;
    top_cuts: number;
    wins: number;
    draws: number;
    losses: number;
    play_rate: number;
    win_rate: number;
    conversion_rate: number;
    conversion_score: number; // (top_cuts / expected_top_cuts) * 100
  };
  commander_win_rate: number; // Commander's overall win rate for comparison
  trend: TrendDataPoint[];
  play_rate_trend: { week_start: string; play_rate: number; entries: number; commander_entries: number }[];
}

// Card detail types
export interface CommanderWithCardStats {
  id: number;
  name: string;
  color_id: string;
  entries: number;
  top_cuts: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number;
  conversion_rate: number;
  conversion_score: number; // (top_cuts / expected_top_cuts) * 100
}

export interface CardDetail extends CardInfo {
  commanders: CommanderWithCardStats[];
}

