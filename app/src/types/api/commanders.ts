export type CommanderStats = {
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
};

export type CommanderCard = {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  inclusion: number;
  winRate: number;
  drawRate: number;
};

export type TopPilot = {
  id: string;
  name: string;
  games: number;
  wins: number;
  winRate: number;
  top4s: number;
};

export type TopDecklist = {
  id: string;
  name: string;
  player: string;
  tournament: string;
  date: string;
  standing: number;
  winRate: number;
};

export type ChartDataPoint = {
  date: string;
  winRate: number;
};

export type PopularityDataPoint = {
  date: string;
  popularity: number;
};

export type WinRateBySeat = {
  position: string;
  winRate: number;
};

export type WinRateByCut = {
  cut: string;
  winRate: number;
};

export type CommanderDetails = {
  id: string;
  name: string;
  colorIdentity: string;
  stats: CommanderStats;
  cards: CommanderCard[];
  matchups: {
    best: { name: string; winRate: number };
    worst: { name: string; winRate: number };
  };
  charts: {
    winRate: ChartDataPoint[];
    popularity: PopularityDataPoint[];
    winRateBySeat: WinRateBySeat[];
    winRateByCut: WinRateByCut[];
  };
  topPilots: TopPilot[];
  topDecklists: TopDecklist[];
};

export type Commander = {
  id: string;
  name: string;
  colorIdentity: string;
  stats: CommanderStats;
};

export type CommanderMeta = {
  standing: number;
  name: string;
  colorIdentity: string;
  winRate: number;
  drawRate: number;
  entries: number;
  metaShare: number;
}; 