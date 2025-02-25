# Player Entity Model

## Core Player Entity
```typescript
interface Player {
  id?: string;               // Optional unique identifier (from Topdeck.gg)
  name: string;              // Player name (always required)
  isRegistered: boolean;     // Whether the player has a Topdeck.gg account
}
```

## Player Statistics
```typescript
interface PlayerStats {
  // Tournament performance
  tournamentWins: number;    // Number of tournament wins
  top4s: number;             // Number of top 4 finishes
  top10s: number;            // Number of top 10 finishes
  top16s: number;            // Number of top 16 finishes
  
  // Game performance
  totalGames: number;        // Total games played
  wins: number;              // Total wins
  draws: number;             // Total draws
  entries: number;           // Total tournament entries
  
  // Rating
  glickoRating: number;      // Glicko-2 rating
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  consistencyRating?: number; // Measure of consistent performance
}
```

## Recent Tournaments
```typescript
interface PlayerTournamentReference {
  tournamentId: string;      // Tournament ID for reference
  standingId: string;        // Standing ID within that tournament
  
  // Optional cached data for quick display (not authoritative)
  // For detailed data, the client should fetch from Tournament entity
  date?: string;             // Tournament date (YYYY-MM-DD)
  standing?: number;         // Player's standing
  commanderId?: string;      // ID of the commander used
}
```

## Player Tournament History Service
```typescript
// Service to get player tournament history with details
namespace PlayerTournamentService {
  // Get tournament history for a player with full details
  export async function getPlayerTournamentHistory(
    playerId: string,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PlayerTournamentDetail[]> {
    // Get tournament references for this player
    const references = await fetchPlayerTournamentReferences(playerId, options);
    
    // For each reference, fetch complete details from Tournament entity
    return Promise.all(references.map(async (ref) => {
      // Fetch the tournament and standing
      const [tournament, standing] = await Promise.all([
        getTournamentById(ref.tournamentId),
        getTournamentStandingById(ref.tournamentId, ref.standingId)
      ]);
      
      // Return complete tournament details 
      return {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          date: tournament.date,
          size: tournament.size
        },
        standing: standing.position,
        commander: standing.commander,
        // Include detailed performance
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        points: standing.points
      };
    }));
  }
  
  // Result interface for tournament history with details
  interface PlayerTournamentDetail {
    tournament: {
      id: string;
      name: string;
      date: string;
      size: number;
    };
    standing: number;
    commander: CommanderReference;
    wins: number;
    draws: number;
    losses: number;
    points: number;
  }
}
```

## Commander Statistics
```typescript
interface PlayerCommanderStats {
  commander: CommanderReference; // Use consistent commander reference
  
  // Statistics
  games: number;             // Games played with this commander
  wins: number;              // Wins with this commander
  draws: number;             // Draws with this commander
  entries: number;           // Number of times entered in tournaments
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / games
  drawRate?: number;         // Draws / games
}
```

## Color Identity Preference
```typescript
interface ColorPreference {
  colorIdentity: string;     // Color identity (e.g., "{W}{U}{B}")
  percentage: number;        // Percentage of games played with this color identity
  winRate: number;           // Win rate with this color identity
  games: number;             // Games played with this color identity
}
```

## Matchup Analysis
```typescript
interface PlayerMatchups {
  withCommanders: Array<{    // Performance with specific commanders
    commander: CommanderReference; // Use consistent commander reference
    games: number;           // Games played
    winRate: number;         // Win rate
  }>;
  
  againstCommanders: Array<{ // Performance against specific commanders
    commander: CommanderReference; // Use consistent commander reference
    games: number;           // Games played against
    winRate: number;         // Win rate against
  }>;
}
```

## Complete Player Details Model
```typescript
interface PlayerDetails {
  // Core data
  id?: string;
  name: string;
  isRegistered: boolean;
  
  // Statistics
  stats: PlayerStats;
  
  // Relationships (references only)
  tournamentReferences: PlayerTournamentReference[];
  commanderStats: PlayerCommanderStats[];
  
  // Preferences and analysis
  colorPreferences: ColorPreference[];
  matchups: PlayerMatchups;
}
```

## Time-Series Data Access
```typescript
// Functions to access time-series data for players
namespace PlayerTimeSeriesApi {
  // Get win rate over time for a player
  export async function getWinRateHistory(
    playerId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData('player', playerId, 'winRate', from, to, granularity);
  }
  
  // Get Glicko rating over time for a player
  export async function getGlickoRatingHistory(
    playerId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData('player', playerId, 'glickoRating', from, to, granularity);
  }
  
  // Get commander usage over time for a player
  export async function getCommanderUsageHistory(
    playerId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Record<string, TimeSeriesDataPoint[]>> {
    // Implementation fetches from time-series database
    // Returns mapping of commanderId to time series data
    return fetchTimeSeriesData('player', playerId, 'commanderUsage', from, to, granularity);
  }
}
```

## API Endpoints
1. `GET /players` - List all registered players with basic stats
2. `GET /players/{id}` - Get detailed player information
3. `GET /players/{id}/stats` - Get player statistics
4. `GET /players/{id}/tournaments` - Get player's recent tournaments with details
5. `GET /players/{id}/commanders` - Get player's commander statistics
6. `GET /players/{id}/timeseries/{metric}` - Get time-series data for a specific metric
7. `GET /players/{id}/colors` - Get color identity preferences
8. `GET /players/{id}/matchups` - Get matchup analysis

## Notes on Glicko-2 Rating System
For multiplayer games, we'll implement the Glicko-2 rating system with adjustments for 4-player games:
- Rating is adjusted based on the average rating of the three opponents
- Rating adjustment varies by placement:
  - 1st place: Adjusted as if won three games against the calculated rating
  - 2nd place: Adjusted as if won two games and lost one game
  - 3rd place: Adjusted as if won one game and lost two games
  - 4th place: Adjusted as if lost three games
- Initial rating will be 1500
- Ratings will be updated after each tournament

## Notes on Guest Players
- Players without Topdeck.gg IDs will not be stored in the database
- They will appear only in tournament standings as string names
- The UI will indicate these players are guests without profiles
- Statistics will only be tracked for registered players

## Notes on Entity References
- Player entity uses consistent reference patterns when referencing other entities
- Tournament details are fetched from the Tournament entity when needed
- The Player entity stores only references to tournaments with minimal cached data
- Commander references use the CommanderReference type for consistency
- Time-series data is stored in a specialized system separate from main database

## Common Patterns
```typescript
// Common player data access patterns

// 1. Get player details
const playerId = 'player123';
const player = await getPlayerById(playerId);

// 2. Get player's tournament history with full details
const tournamentHistory = await PlayerTournamentService.getPlayerTournamentHistory(playerId);

// 3. Get player's performance with a specific commander
const commanderId = 'commander456';
const commanderStats = player.commanderStats.find(
  stats => stats.commander.id === commanderId
);

// 4. Get player's win rate over time (last 6 months)
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const winRateHistory = await PlayerTimeSeriesApi.getWinRateHistory(
  playerId,
  sixMonthsAgo.toISOString().split('T')[0],
  new Date().toISOString().split('T')[0],
  'week'
);
```

## Future Enhancements (Post-MVP)
- Head-to-head records against specific players
- Performance by tournament type/format
- Expanded historical data and trends
- Achievement system
- Regional/local rankings 