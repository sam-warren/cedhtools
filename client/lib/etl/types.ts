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
    mainboard: MoxfieldBoard;
    commanders: MoxfieldBoard;
}

export interface MoxfieldBoard {
    cards: MoxfieldCard[];
}

export interface MoxfieldCard {
    quantity: number;
    card: {
        name: string;
        uniqueCardId: string;
        scryfallId: string;
        type: number;
        type_line?: string;
    };
}

export interface MoxfieldCardData {
    quantity: number;
    card: {
        name: string;
        uniqueCardId?: string;
        id?: string;
        scryfall_id?: string;
        scryfallId?: string;
        type?: number;
        type_line?: string;
    };
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