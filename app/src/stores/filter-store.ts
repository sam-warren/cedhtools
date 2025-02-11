import { create } from "zustand"
import type { DatePreset, TournamentSize, TopCut, FilterState } from "@/types/filters"
import type { DateRange } from "react-day-picker"
import { isSameDay } from "date-fns"
import { DATE_PRESETS } from "@/lib/constants"

interface FilterStore extends FilterState {
  appliedState: {
    dateRange: DateRange;
    datePreset: DatePreset;
    tournamentSize: TournamentSize;
    topCut: TopCut[];
  };
  isDateRangeModified: () => boolean;
  isTournamentSizeModified: () => boolean;
  isTopCutModified: () => boolean;
  hasModifiedFilters: () => boolean;
  setDateRange: (dateRange: DateRange | undefined) => void
  setDatePreset: (preset: DatePreset) => void
  setTournamentSize: (size: TournamentSize) => void
  setTopCut: (topCut: TopCut[]) => void
  applyFilters: () => Promise<void>
}

const isDateRangeEqual = (a?: DateRange, b?: DateRange) => {
  if (!a || !b) return a === b;
  if (!a.from || !b.from || !a.to || !b.to) return false;
  return isSameDay(a.from, b.from) && isSameDay(a.to, b.to);
}

const isArrayEqual = (a: any[], b: any[]) => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  dateRange: DATE_PRESETS["3 months"],
  datePreset: "3 months",
  tournamentSize: "30+",
  topCut: ["Top 4", "Top 10", "Top 16"],
  appliedState: {
    dateRange: DATE_PRESETS["3 months"],
    datePreset: "3 months",
    tournamentSize: "30+",
    topCut: ["Top 4", "Top 10", "Top 16"]
  },

  isDateRangeModified: () => {
    const state = get();
    return !isDateRangeEqual(state.dateRange, state.appliedState.dateRange) ||
      state.datePreset !== state.appliedState.datePreset;
  },

  isTournamentSizeModified: () => {
    const state = get();
    return state.tournamentSize !== state.appliedState.tournamentSize;
  },

  isTopCutModified: () => {
    const state = get();
    return !isArrayEqual(state.topCut, state.appliedState.topCut);
  },

  hasModifiedFilters: () => {
    const state = get();
    return state.isDateRangeModified() ||
      state.isTournamentSizeModified() ||
      state.isTopCutModified();
  },

  setDateRange: (dateRange) => {
    set({ dateRange });
  },

  setDatePreset: (datePreset) => {
    set({ datePreset });
  },

  setTournamentSize: (tournamentSize) => {
    set({ tournamentSize });
  },

  setTopCut: (topCut) => {
    set({ topCut });
  },

  applyFilters: async () => {
    const state = get();
    console.log("Applying filters:", state);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    set({
      appliedState: {
        dateRange: state.dateRange,
        datePreset: state.datePreset,
        tournamentSize: state.tournamentSize,
        topCut: state.topCut
      }
    });
  }
}))

