import type { DateRange } from "react-day-picker";
import { subMonths, subYears } from "date-fns";
import { DatePreset, TournamentSize, TopCut } from "@/lib/types/filters";

export const TOURNAMENT_SIZE = {
  THIRTY_PLUS: "30+",
  SIXTY_PLUS: "60+",
  ONE_TWENTY_PLUS: "120+",
  ALL: "All"
} as const;

export const TOP_CUT = {
  TOP_4: "Top 4",
  TOP_10: "Top 10",
  TOP_16: "Top 16",
  TOP_40: "Top 40",
  ALL: "All"
} as const;

export const DATE_PRESET = {
  THREE_MONTHS: "3 months",
  SIX_MONTHS: "6 months",
  ONE_YEAR: "1 year",
  POST_BAN: "Post-ban",
  PRE_BAN: "Pre-Ban",
  ALL_TIME: "All Time",
  CUSTOM: "Custom"
} as const;

export const TOURNAMENT_SIZE_OPTIONS = Object.values(TOURNAMENT_SIZE);
export const TOP_CUT_OPTIONS = Object.values(TOP_CUT);

export const DATE_PRESETS: Record<Exclude<typeof DATE_PRESET[keyof typeof DATE_PRESET], "Custom">, DateRange> = {
  [DATE_PRESET.THREE_MONTHS]: {
    from: subMonths(new Date(), 3),
    to: new Date()
  },
  [DATE_PRESET.SIX_MONTHS]: {
    from: subMonths(new Date(), 6),
    to: new Date()
  },
  [DATE_PRESET.ONE_YEAR]: {
    from: subYears(new Date(), 1),
    to: new Date()
  },
  [DATE_PRESET.POST_BAN]: {
    from: new Date("2024-09-24"),
    to: new Date()
  },
  [DATE_PRESET.PRE_BAN]: {
    from: new Date("2022-06-02"),
    to: new Date("2024-09-24")
  },
  [DATE_PRESET.ALL_TIME]: {
    from: new Date("2022-06-02"),
    to: new Date()
  }
} as const; 