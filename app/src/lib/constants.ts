import type { DateRange } from "react-day-picker";
import { subMonths, subYears } from "date-fns";
import { DatePreset, TournamentSize, TopCut } from "@/types/filters";

export const TOURNAMENT_SIZE_OPTIONS: TournamentSize[] = ["30+", "60+", "120+", "All"];

export const TOP_CUT_OPTIONS: TopCut[] = ["Top 4", "Top 8", "Top 16", "Top 32", "All"];

export const DATE_PRESETS: Record<Exclude<DatePreset, "Custom">, DateRange> = {
    "3 months": {
        from: subMonths(new Date(), 3),
        to: new Date()
    },
    "6 months": {
        from: subMonths(new Date(), 6),
        to: new Date()
    },
    "1 year": {
        from: subYears(new Date(), 1),
        to: new Date()
    },
    "Post-ban": {
        from: new Date("2024-01-22"),
        to: new Date()
    },
    "Pre-Ban": {
        from: new Date("2023-01-01"),
        to: new Date("2024-01-21")
    },
    "All Time": {
        from: new Date("2023-01-01"),
        to: new Date()
    }
} as const; 