import { create } from "zustand"
import type { DatePreset, TournamentSize, TopCut, FilterState } from "@/types/filters"
import type { DateRange } from "react-day-picker"
interface FilterStore extends FilterState {
  setDateRange: (dateRange: DateRange | undefined) => void
  setDatePreset: (preset: DatePreset) => void
  setTournamentSize: (size: TournamentSize) => void
  setTopCut: (topCut: TopCut[]) => void
}

const DEFAULT_DATE_RANGE = {
  from: new Date(2024, 8, 23), // September 23, 2024
  to: new Date()
}

export const useFilterStore = create<FilterStore>((set) => ({
  dateRange: DEFAULT_DATE_RANGE,
  datePreset: "3 months",
  tournamentSize: "All",
  topCut: ["All"],

  setDateRange: (dateRange) => set({ dateRange }),
  setDatePreset: (datePreset) => set({ datePreset }),
  setTournamentSize: (tournamentSize) => set({ tournamentSize }),
  setTopCut: (topCut) => set({ topCut })
}))

