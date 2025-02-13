import { DateRange } from "react-day-picker";
import { DATE_PRESET, TOURNAMENT_SIZE, TOP_CUT } from "@/lib/constants/filters";

export type DatePreset = typeof DATE_PRESET[keyof typeof DATE_PRESET];
export type TournamentSize = typeof TOURNAMENT_SIZE[keyof typeof TOURNAMENT_SIZE];
export type TopCut = typeof TOP_CUT[keyof typeof TOP_CUT];

export interface FilterState {
    dateRange: DateRange;
    datePreset: DatePreset;
    tournamentSize: TournamentSize;
    topCut: TopCut[];
} 