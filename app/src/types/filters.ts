import { DateRange } from "react-day-picker";

export type DatePreset = "3 months" | "6 months" | "1 year" | "Post-ban" | "Pre-Ban" | "All Time" | "Custom";

export type TournamentSize = "30+" | "60+" | "120+" | "All";

export type TopCut = "Top 4" | "Top 8" | "Top 16" | "Top 32" | "All";

export interface FilterState {
    dateRange: DateRange;
    datePreset: DatePreset;
    tournamentSize: TournamentSize;
    topCut: TopCut[];
} 