export interface Analysis {
    id: number;
    moxfield_url: string;
    created_at: string;
    deck_name: string | null;
    commanders: {
        name: string;
        wins: number;
        losses: number;
    };
    stats?: {
        entries: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
        inclusionRate: number;
        winRateDiff: number;
        confidence: number;
    } | null;
}

export interface CardStats {
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
    inclusionRate: number;
    winRateDiff: number;
    confidence: number;
} 