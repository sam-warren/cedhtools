export interface MoxfieldLegalities {
  [key: string]: string;
}

export interface MoxfieldPrices {
  usd?: string;
  usd_foil?: string;
  eur?: string;
  eur_foil?: string;
  tix?: string;
  [key: string]: string | undefined;
}

export interface MoxfieldCard {
  id: string;
  uniqueCardId: string;
  scryfall_id: string;
  set: string;
  set_name: string;
  name: string;
  cn: string;
  layout: string;
  cmc: number;
  type: string;
  type_line: string;
  oracle_text: string;
  mana_cost: string;
  power?: string;
  toughness?: string;
  colors: string[];
  color_indicator?: string[];
  color_identity: string[];
  legalities: MoxfieldLegalities;
  frame: string;
  reserved: boolean;
  digital: boolean;
  foil: boolean;
  nonfoil: boolean;
  etched: boolean;
  glossy: boolean;
  rarity: string;
  border_color: string;
  colorshifted: boolean;
  flavor_text?: string;
  lang: string;
  latest: boolean;
  has_multiple_editions: boolean;
  has_arena_legal: boolean;
  prices: MoxfieldPrices;
  card_faces?: MoxfieldCard[];
  artist: string;
  promo_types?: string[];
  cardHoarderUrl?: string;
  cardKingdomUrl?: string;
  cardKingdomFoilUrl?: string;
  cardMarketUrl?: string;
  tcgPlayerUrl?: string;
  isArenaLegal: boolean;
  released_at: string;
  edhrec_rank?: number;
  multiverse_ids?: number[];
  cardmarket_id?: number;
  mtgo_id?: number;
  tcgplayer_id?: number;
  cardkingdom_id?: number;
  cardkingdom_foil_id?: number;
  reprint: boolean;
  set_type: string;
  coolStuffIncUrl?: string;
  coolStuffIncFoilUrl?: string;
  acorn: boolean;
  image_seq?: number;
  cardTraderUrl?: string;
  cardTraderFoilUrl?: string;
  content_warning?: boolean;
  starcitygames_sku?: string;
  starcitygames_url?: string;
  starcitygames_foil_sku?: string;
  starcitygames_foil_url?: string;
  isPauperCommander: boolean;
  isToken: boolean;
  defaultFinish: string;
}

export interface MoxfieldBoardCard {
  quantity: number;
  boardType: string;
  finish: string;
  isFoil: boolean;
  isAlter: boolean;
  isProxy: boolean;
  card: MoxfieldCard;
  useCmcOverride: boolean;
  useManaCostOverride: boolean;
  useColorIdentityOverride: boolean;
  excludedFromColor: boolean;
}

export interface MoxfieldMainCard extends MoxfieldCard {

}