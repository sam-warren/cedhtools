# Business Logic Reference

This document clarifies the business logic used throughout cedhtools. Please review and confirm these assumptions are correct.

---

## Data Flow

```
TopDeck.gg API → sync-tournaments.ts → Supabase Raw Tables
                                              ↓
                               aggregate-stats.ts
                                              ↓
                               Weekly Stats Tables → API → Frontend
```

---

## 1. Tournament Data Ingestion

### Source
- **TopDeck.gg API** (`/v2/tournaments`)
- **Date Range**: January 1, 2025 to present
- **Filter**: cEDH tournaments only (game: "Magic: The Gathering", format: "EDH")

### Tournament Date
- TopDeck returns `startDate` as Unix timestamp (seconds)
- Converted to ISO string: `new Date(startDate * 1000).toISOString()`
- Stored in `tournaments.tournament_date` column

### Key Assumptions
- [x] Tournament date is the start date, not end date
- [ ] Should we use `endDate` instead?
- [ ] Should we filter by tournament size (min players)?

---

## 2. Commander Identification

### Current Logic
- Commanders are identified by the `Commanders` array in deck objects
- Commander names are sorted alphabetically and joined with " / " (e.g., "Kraum / Tymna")
- This creates a single `commander` record for partner pairs

### Questions
- [x] Partners are treated as a single commander unit
- [ ] Should "Tymna / Kraum" and "Kraum / Tymna" be the same? (Currently: YES, we sort alphabetically)

---

## 3. Standing/Top Cut Logic

### Current Definition
- **Top Cut**: A player "made top cut" if `standing <= tournament.top_cut`
- `top_cut` is extracted from `tournament.cutTo` field

### Conversion Rate
```
conversion_rate = top_cuts / entries
```

### Questions
- [ ] What if `top_cut` is 0 or null? (Currently: no one makes top cut)
- [ ] Should we have a minimum tournament size for stats?

---

## 4. Win Rate Calculation

### Current Formula
```
total_games = wins_swiss + wins_bracket + draws + losses_swiss + losses_bracket
win_rate = (wins_swiss + wins_bracket) / total_games
```

### Source of Win Data
- From `standings[].wins`, `standings[].winsBracket`, etc.
- These are the player's personal match records

### Questions
- [x] Swiss wins and bracket wins are combined
- [x] Draws count toward total games but not wins
- [ ] Should byes be excluded from total games?

---

## 5. Weekly Aggregation

### Week Definition
- Week starts on **Monday**
- Uses `getWeekStart()` function to normalize dates

```typescript
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // Returns "YYYY-MM-DD"
}
```

### Stats Grouped By
- `commander_weekly_stats`: commander_id + week_start
- `card_commander_weekly_stats`: card_id + commander_id + week_start
- `seat_position_weekly_stats`: commander_id + seat_position (no weekly breakdown)

---

## 6. Time Period Filters

### Frontend Options
| Option | Days Back | Date Filter |
|--------|-----------|-------------|
| Past Month | 30 | `week_start >= (now - 30 days)` |
| Past 3 Months | 90 | `week_start >= (now - 90 days)` |
| Past 6 Months | 180 | `week_start >= (now - 180 days)` |
| Past Year | 365 | `week_start >= (now - 365 days)` |
| All Time | null | No filter |

### Date Calculation
```typescript
const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0]; // "YYYY-MM-DD" format
```

---

## 7. Minimum Entries Filter

### Current Default: 5 entries
- Commanders with fewer than 5 entries in the time period are excluded
- This prevents statistically insignificant data from appearing

### Question
- [ ] Is 5 the right threshold?
- [ ] Should this be configurable by the user?

---

## 8. Seat Position Win Rate

### Current Logic
- Seat position is determined by player order in `round.tables[].players[]`
- Position 1 = first player, Position 2 = second player, etc.
- Win is determined by `game.winner_player_id === player_id`

### Calculation
```
seat_win_rate = wins_at_seat / games_at_seat
expected_win_rate = 0.25 (for 4-player pods)
```

### Questions
- [x] Seat position is NOT temporal (aggregated across all time)
- [x] Expected win rate assumes 4-player pods
- [ ] Should we handle 3-player pods differently?

---

## 9. Card Statistics

### Play Rate
```
play_rate = entries_with_card / total_entries_for_commander
```

### Card Win Rate
```
card_win_rate = (wins of entries with card) / (total games of entries with card)
```

---

## Bug Found & Fixed

### Issue: Commander Stats Empty for Recent Time Periods

**Root Cause**: The aggregate script was not paginating through entries, hitting Supabase's 1000-row default limit.

**Result**: Only the first 1000 entries (early 2025) were aggregated. "Past 3 Months" found no data because September-December 2025 entries were never processed.

**Fix**: Added pagination to all aggregation functions.

---

## Action Required

Please review the above and confirm:
1. All calculations are correct
2. Edge cases are handled appropriately
3. Business rules match your expectations

Reply with any corrections or clarifications needed.

