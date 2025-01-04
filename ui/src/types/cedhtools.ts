export interface IDatabaseMetrics {
  total_decks: number;
  total_tournaments: number;
  total_unique_cards: number;
}

export interface IPerformanceMetrics {
  card_win_rate: number;
  chi_squared: number;
  p_value: number;
 }
 
 export interface IImageUris {
  png: string;
  large: string;
  small: string;
  normal: string;
  art_crop: string;
  border_crop: string;
 }
 
 export interface ICardStatistics {
  unique_card_id: string;
  scryfall_id: string;
  name: string;
  type_line: string;
  cmc: number;
  image_uris: IImageUris;
  legality: string;
  mana_cost: string;
  scryfall_uri: string;
  decks_with_card?: number;
  performance?: IPerformanceMetrics;
 }
 
 export interface ICommander {
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
 
 export interface ICommanderStatisticsResponse {
  meta_statistics: IMetaStatistics;
  card_statistics: ICardStatistics[];
  commanders: ICommander[];
 }