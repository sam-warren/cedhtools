import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { create } from "zustand";

type FilterState = {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  setPreset: (value: string) => void;
  formattedDateRange: string;
};

export const FILTER_PRESETS = [
  { name: "1 month", value: 30 },
  { name: "3 months", value: 90 },
  { name: "6 months", value: 180 },
  { name: "All time", value: "all" },
  { name: "Post ban", value: "post-ban" }
];

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: { from: new Date(2022, 5, 1), to: new Date() },
  formattedDateRange: getFormattedRange({ from: new Date(2022, 5, 1), to: new Date() }),
  setDateRange: (range) =>
    set({
      dateRange: range,
      formattedDateRange: getFormattedRange(range)
    }),
  setPreset: (value) => {
    const today = new Date();
    let fromDate: Date;

    switch (value) {
      case "post-ban":
        fromDate = new Date(2024, 8, 23);
        break;
      case "all":
        fromDate = new Date(2022, 5, 1);
        break;
      default:
        fromDate = addDays(today, -parseInt(value));
    }

    const range = { from: fromDate, to: today };
    set({
      dateRange: range,
      formattedDateRange: getFormattedRange(range)
    });
  }
}));

function getFormattedRange(range?: DateRange): string {
  if (!range?.from) return "";

  const fromYear = range.from.getFullYear();
  const toYear = range.to?.getFullYear();

  if (!range.to) {
    return format(range.from, "MMM dd, yyyy");
  }

  if (fromYear === toYear) {
    return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`;
  }

  return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
}
