export interface Analysis {
    id: number;
    moxfield_url: string;
    created_at: string;
    commanders: {
        name: string;
        wins: number;
        losses: number;
    };
} 