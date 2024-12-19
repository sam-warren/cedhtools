export interface ICommanderStats {
  commander_ids: string[];
  total_decks: number;
  avg_win_rate: number;
  avg_draw_rate: number;
  card_statistics: ICardStats[];
}

export interface ICardStats {
  unique_card_id: string;
  card_name: string;
  total_decks: number;
  avg_win_rate: number;
  avg_draw_rate: number;
  chi_squared: number;
  p_value: number;
  statistically_significant: boolean;
}
