export type Tournament = {
    id: string;
    name: string;
    date: string;
    players: number;
    swissRounds: number;
    topCut: number;
    winner: string;
    winningCommander: string;
};

export interface TournamentDetails extends Tournament {
    standings: {
        rank: number;
        player: string;
        commander: string;
        wins: number;
        losses: number;
        draws: number;
        points: number;
    }[];
    commanderStats: {
        name: string;
        count: number;
        winRate: number;
    }[];
    roundStats: {
        round: number;
        avgGameLength: number;
        drawRate: number;
    }[];
}