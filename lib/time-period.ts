import type { TimePeriod } from "@/types/api";

// Re-export the canonical type
export type { TimePeriod } from "@/types/api";

/**
 * The earliest date with complete/valid data.
 * Data before this date should be excluded from charts and statistics.
 */
export const DATA_START_DATE = new Date("2025-06-01");

/**
 * The earliest month key (YYYY-MM) with complete/valid data.
 */
export const DATA_START_MONTH_KEY = "2025-06";

/**
 * Mapping of time periods to their corresponding number of days.
 * null represents "all time" (no date filtering).
 */
export const TIME_PERIOD_DAYS: Record<TimePeriod, number | null> = {
  "1_month": 30,
  "3_months": 90,
  "6_months": 180,
  "1_year": 365,
  "all_time": null,
};

/**
 * Get the number of days for a given time period.
 * Returns null for "all_time" indicating no date filtering should be applied.
 */
export function getTimePeriodDays(period: TimePeriod): number | null {
  return TIME_PERIOD_DAYS[period];
}

/**
 * Get a full ISO date string for filtering based on the time period.
 * Returns null for "all_time".
 */
export function getTimePeriodDateFilter(period: TimePeriod): string | null {
  const days = TIME_PERIOD_DAYS[period];
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Get a date-only string (YYYY-MM-DD) for filtering based on the time period.
 * Returns null for "all_time".
 */
export function getTimePeriodDateOnly(period: TimePeriod): string | null {
  const dateFilter = getTimePeriodDateFilter(period);
  if (dateFilter === null) return null;
  return dateFilter.split("T")[0];
}

/**
 * Get the number of complete months to show in charts for a given time period.
 * Returns null for "all_time" indicating all available data should be shown.
 */
export function getMonthsToShow(period: TimePeriod): number | null {
  switch (period) {
    case "1_month": return 1;
    case "3_months": return 3;
    case "6_months": return 6;
    case "1_year": return 12;
    case "all_time": return null;
  }
}

/**
 * Get the current month key in YYYY-MM format.
 * Used to filter out incomplete current month data from charts.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if a month key (YYYY-MM) falls within the valid data range.
 * Excludes current month and any month before DATA_START_MONTH_KEY.
 */
export function isValidDataMonth(monthKey: string): boolean {
  const currentMonthKey = getCurrentMonthKey();
  return monthKey >= DATA_START_MONTH_KEY && monthKey < currentMonthKey;
}

/**
 * Format a date as a month label for charts (e.g., "Aug 2025").
 * Uses full year to avoid ambiguity with day-of-month.
 */
export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * UI options for time period selection dropdowns.
 */
export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "1_month", label: "Past Month" },
  { value: "3_months", label: "Past 3 Months" },
  { value: "6_months", label: "Past 6 Months" },
  { value: "1_year", label: "Past Year" },
  { value: "all_time", label: "All Time" },
];

