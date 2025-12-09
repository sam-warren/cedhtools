/**
 * Shared utilities
 *
 * Re-exports all utility functions for convenient imports.
 */

// Class name utilities (Tailwind)
export { cn } from "./cn";

// Text normalization
export { normalizeText, getFrontFaceName, isDFCName } from "./text";

// Date utilities
export {
  getWeekStart,
  getWeekStartDate,
  formatDate,
  formatDuration,
  formatBytes,
  formatRelativeTime,
} from "./date";

// Time period utilities
export {
  type TimePeriod,
  DATA_START_DATE,
  DATA_START_MONTH_KEY,
  TIME_PERIOD_DAYS,
  TIME_PERIOD_OPTIONS,
  getTimePeriodDays,
  getTimePeriodDateFilter,
  getTimePeriodDateOnly,
  getMonthsToShow,
  getCurrentMonthKey,
  isValidDataMonth,
  formatMonthLabel,
} from "./time-period";

