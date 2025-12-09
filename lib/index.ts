/**
 * Library Index
 *
 * Main entry point for commonly used utilities.
 * For specific modules, import directly from their paths.
 */

// Most commonly used utilities
export { cn } from "./utils/cn";
export { normalizeText } from "./utils/text";
export { formatDuration, formatRelativeTime } from "./utils/date";

// Re-export time period utilities (commonly used in components)
export {
  type TimePeriod,
  TIME_PERIOD_OPTIONS,
  getTimePeriodDateFilter,
  getTimePeriodDateOnly,
} from "./utils/time-period";

// Decklist parser
export { parseDecklist, type ParsedCard } from "./parsers/decklist";

