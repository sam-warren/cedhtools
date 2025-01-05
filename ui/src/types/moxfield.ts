interface ICardFace {
  id: string;
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
  colors: string[];
  color_indicator: string[];
  flavor_text?: string;
  power?: string;
  toughness?: string;
  image_seq: number;
}

interface ICardPrices {
  usd?: number;
  usd_foil?: number;
  eur?: number;
  eur_foil?: number;
  tix?: number;
  ck?: number;
  ck_foil?: number;
  lastUpdatedAtUtc: string;
  ck_buy?: number;
  ck_buy_foil?: number;
  csi?: number;
  csi_foil?: number;
  csi_buy?: number;
  csi_buy_foil?: number;
  ct?: number;
  ct_foil?: number;
  scg?: number;
  scg_foil?: number;
  scg_buy?: number;
  scg_foil_buy?: number;
}

interface ILegalities {
  standard: string;
  future: string;
  historic: string;
  timeless: string;
  gladiator: string;
  pioneer: string;
  explorer: string;
  modern: string;
  legacy: string;
  pauper: string;
  vintage: string;
  penny: string;
  commander: string;
  oathbreaker: string;
  standardbrawl: string;
  brawl: string;
  alchemy: string;
  paupercommander: string;
  duel: string;
  oldschool: string;
  premodern: string;
  predh: string;
}

interface ICard {
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
  oracle_text?: string;
  mana_cost: string;
  colors: string[];
  color_indicator: string[];
  color_identity: string[];
  legalities: ILegalities;
  frame: string;
  frame_effects?: string[];
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
  prices: ICardPrices;
  card_faces: ICardFace[];
  artist: string;
  promo_types: string[];
  isArenaLegal: boolean;
  released_at: string;
  edhrec_rank?: number;
  multiverse_ids: number[];
  cardmarket_id?: number;
  mtgo_id?: number;
  arena_id?: number;
  tcgplayer_id?: number;
  cardkingdom_id?: number;
  cardkingdom_foil_id?: number;
  reprint: boolean;
  set_type: string;
  acorn: boolean;
  image_seq: number;
  content_warning: boolean;
  isPauperCommander: boolean;
  isToken: boolean;
  defaultFinish: string;
}

interface ICardboardEntry {
  quantity: number;
  boardType: string;
  finish: string;
  isFoil: boolean;
  isAlter: boolean;
  isProxy: boolean;
  card: ICard;
  useCmcOverride: boolean;
  useManaCostOverride: boolean;
  useColorIdentityOverride: boolean;
  excludedFromColor: boolean;
}

interface IBoards {
  mainboard: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  sideboard: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  maybeboard: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  commanders: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  companions: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  signatureSpells: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  attractions: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  stickers: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  contraptions: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  planes: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  schemes: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
  tokens: {
    count: number;
    cards: { [key: string]: ICardboardEntry };
  };
}

interface IColorPercentages {
  white: number;
  blue: number;
  black: number;
  red: number;
  green: number;
}

interface IAffiliates {
  ck: string;
  tcg: string;
  csi: string;
  ch: string;
  cm: string;
  scg: string;
  ct: string;
}

interface IMoxfieldDeck {
  id: string;
  name: string;
  description: string;
  format: string;
  visibility: string;
  publicUrl: string;
  publicId: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  sfwCommentCount: number;
  areCommentsEnabled: boolean;
  isShared: boolean;
  authorsCanEdit: boolean;
  createdByUser: {
    userName: string;
    displayName: string;
    profileImageUrl: string;
    badges: any[];
  };
  authors: Array<{
    userName: string;
    displayName: string;
    profileImageUrl: string;
    badges: any[];
  }>;
  requestedAuthors: any[];
  boards: IBoards;
  version: number;
  tokens: ICard[];
  tokensToCards: { [key: string]: string[] };
  cardsToTokens: { [key: string]: string[] };
  tokenMappings: { [key: string]: ICard };
  hubs: any[];
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  exportId: string;
  authorTags: { [key: string]: string[] };
  isTooBeaucoup: boolean;
  affiliates: IAffiliates;
  mainCardIdIsBackFace: boolean;
  allowPrimerClone: boolean;
  enableMultiplePrintings: boolean;
  includeBasicLandsInPrice: boolean;
  includeCommandersInPrice: boolean;
  includeSignatureSpellsInPrice: boolean;
  colors: string[];
  colorPercentages: IColorPercentages;
  colorIdentity: string[];
  colorIdentityPercentages: IColorPercentages;
  media: any[];
  ownerUserId: string;
  deckTier: number;
  commanderTier: number;
  deckTier1Count: number;
  deckTier2Count: number;
  deckTier3Count: number;
  deckTier4Count: number;
}

export type { 
  IMoxfieldDeck, 
  ICard, 
  ICardboardEntry, 
  IBoards, 
  ICardFace, 
  ICardPrices, 
  ILegalities,
  IColorPercentages,
  IAffiliates 
};