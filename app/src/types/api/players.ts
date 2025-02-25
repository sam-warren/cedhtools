export type Player = {
    id: string;
    name: string;
    entries: number;
    wins: number;
    losses: number;
    draws: number;
    byes: number;
    topCuts: number;
    winRate: number;
    drawRate: number;
    mostPlayedCommander: string;
};

export interface PlayerStats {
    tournamentWins: number;
    top4s: number;
    top10s: number;
    top16s: number;
    totalGames: number;
    wins: number;
    draws: number;
    winRate: number;
    drawRate: number;
    entries: { total: number; uniquePlayers: number };
}

export interface PlayerDetails extends Player {
    stats: PlayerStats;
    recentTournaments: {
        id: string;
        name: string;
        date: string;
        standing: number;
        commander: string;
    }[];
    commanderStats: {
        name: string;
        games: number;
        winRate: number;
    }[];
    performanceHistory: {
        date: string;
        winRate: number;
    }[];
    matchups: {
        best: { name: string; winRate: number; games: number };
        worst: { name: string; winRate: number; games: number };
    };
}