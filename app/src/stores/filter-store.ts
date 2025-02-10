import { create } from "zustand"
import type { FilterValues } from "@/components/filters/types"

interface FilterStore extends FilterValues {
  setFilters: (filters: Partial<FilterValues>) => void
  applyFilters: () => void
}

const DEFAULT_FILTERS: FilterValues = {
  dateRange: {
    from: new Date(2024, 8, 23), // September 23, 2024
    to: new Date()
  },
  tournamentSize: "30+",
  topCut: ["10", "16"]
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...DEFAULT_FILTERS,

  setFilters: (filters) => {
    set((state) => ({ ...state, ...filters }))
  },

  applyFilters: async () => {
    const { dateRange, tournamentSize, topCut } = get()
    // TODO: Implement your data fetching logic here
    console.log("Applying filters:", { dateRange, tournamentSize, topCut })
  }
}))

