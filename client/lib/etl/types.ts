export interface Tournament {
    TID: string;
    tournamentName: string;
    startDate: string;
    standings: TournamentStanding[];
}

export interface TournamentStanding {
    decklist: string;
    wins: number;
    losses: number;
    draws: number;
}

export interface MoxfieldDeck {
    name: string;
    boards: {
        mainboard: MoxfieldBoard;
        commanders: MoxfieldBoard;
    };
}

export interface MoxfieldBoard {
    count: number;
    cards: Record<string, MoxfieldCardEntry>;
}

export interface MoxfieldCardEntry {
    quantity: number;
    card: MoxfieldCardData;
}

export interface MoxfieldCardData {
    name: string;
    uniqueCardId: string;
    scryfall_id?: string;
    type?: number;
    type_line?: string;
}

export interface Commander {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    entries: number;
}

export interface Card {
    uniqueCardId: string;
    name: string;
    scryfallId: string;
    type?: number;
    type_line?: string;
}

export interface Statistic {
    commanderId: string;
    cardId: string;
    wins: number;
    losses: number;
    draws: number;
    entries: number;
}

export interface EtlStatus {
    id?: number;
    startDate: string;
    endDate?: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    recordsProcessed: number;
    lastProcessedDate?: string;
} 