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
} 