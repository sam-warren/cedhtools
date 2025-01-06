export const TIME_PERIOD_OPTIONS = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: 'ban', label: 'post ban' },
  { value: 'all', label: 'all time' },
] as const;

export const TOURNAMENT_SIZE_OPTIONS = [
  { value: 30, label: '30+ players' },
  { value: 60, label: '60+ players' },
  { value: 100, label: '100+ players' },
  { value: 0, label: 'all tournaments' },
] as const;
