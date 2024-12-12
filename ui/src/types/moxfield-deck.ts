import { MoxfieldCard } from './moxfield-card';

export interface MoxfieldDeck {
  id: string;
  name: string;
  description: string;
  publicUrl: string;
  publicId: string;
  boards: {
    mainboard: MoxfieldDeckBoard;
    sideboard: MoxfieldDeckBoard;
    maybeboard: MoxfieldDeckBoard;
    commanders: MoxfieldDeckBoard;
    companions: MoxfieldDeckBoard;
    attractions: MoxfieldDeckBoard;
    stickers: MoxfieldDeckBoard;
  };
  colors: string[];
  colorPercentages: {
    white: number;
    blue: number;
    black: number;
    red: number;
    green: number;
  };
  colorIdentity: string[];
  colorIdentityPercentages: {
    white: number;
    blue: number;
    black: number;
    red: number;
    green: number;
  };
}

interface MoxfieldDeckBoard {
  count: number;
  cards: {
    [cardId: string]: MoxfieldDeckCard;
  };
}

interface MoxfieldDeckCard {
  quantity: number;
  boardType: string;
  finish: string;
  isFoil: boolean;
  isAlter: boolean;
  isProxy: boolean;
  card: MoxfieldCard;
  useCmcOverride?: boolean;
  useManaCostOverride?: boolean;
  useColorIdentityOverride?: boolean;
  excludedFromColor?: boolean;
}
