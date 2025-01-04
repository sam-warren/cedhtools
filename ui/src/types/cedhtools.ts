/**
 * The entire response shape from CommanderStatisticsView
 * (corresponding to your JSON example).
 */
export interface ICommanderStatisticsResponse {
  meta_statistics: IMetaStatistics;
  card_statistics: ICardStatistics;
  commanders: ICommanderDetail[];
}

/**
 * Meta-level statistics about all decks using the submitted commander(s).
 */
export interface IMetaStatistics {
  sample_size: {
    total_decks: number;
  };
  baseline_performance: {
    win_rate: number;
    draw_rate: number;
    loss_rate: number;
  };
}

/**
 * Split of card stats between:
 * - "main": an object whose keys (e.g. "1", "2", "3", ...) each hold an array of cards
 * - "other": an array of cards not in the submitted decklist
 */
export interface ICardStatistics {
  main: Record<string, ICardStat[]>;
  other: ICardStat[];
}

/**
 * Statistics for an individual card, including performance metrics,
 * possibly its board and type_code if it's part of the submitted deck.
 */
export interface ICardStat {
  unique_card_id: string;
  scryfall_id: string;
  name: string;
  type_line: string;
  cmc: number;
  image_uris: IImageUris;
  legality: string;
  mana_cost: string;
  scryfall_uri: string;
  decks_with_card: number;

  // Performance metrics for the meta analysis
  performance: {
    deck_win_rate: number;
    card_win_rate: number;
    chi_squared: number;
    p_value: number;
  };
}

/**
 * Information about one of the deck's commanders.
 */
export interface ICommanderDetail {
  unique_card_id: string;
  scryfall_id: string;
  name: string;
  type_line: string;
  cmc: number;
  image_uris: IImageUris;
  legality: string;
  mana_cost: string;
  scryfall_uri: string;
}

/**
 * Structure for Scryfall's image URIs (png, large, etc.).
 */
export interface IImageUris {
  png: string;
  large: string;
  small: string;
  normal: string;
  art_crop: string;
  border_crop: string;
}
