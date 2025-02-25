# Tournament Entity Model

## Core Tournament Entity
```typescript
interface Tournament {
  id: string;                // Unique identifier
  name: string;              // Tournament name
  date: string;              // Tournament date (YYYY-MM-DD)
  size: number;              // Number of players
  rounds: number;            // Number of rounds played
  topCut: string;            // Top cut description (e.g., "Top 4", "Top 8")
}
```

## Tournament Statistics
```typescript
interface TournamentStats {
  playerCount: number;       // Number of players
  registeredPlayerCount: number; // Number of registered players
  commanderCount: number;    // Number of unique commanders/pairs
  totalGames: number;        // Total games played
  completedGames: number;    // Completed games (non-draws)
  draws: number;             // Number of draws
  
  // Derived statistics (computed on the client)
  drawRate?: number;         // Draws / totalGames
  averageGamesPerPlayer?: number; // totalGames / playerCount
}
```

## Tournament Standings
```typescript
interface TournamentStanding {
  id: string;                // Unique ID for this standing entry
  position: number;          // Standing position
  player: {                  // Player reference
    id?: string;             // Player ID (if registered)
    name: string;            // Player name
  };
  points: number;            // Total points
  wins: number;              // Number of wins
  draws: number;             // Number of draws
  losses: number;            // Number of losses
  gamesPlayed: number;       // Total games played
  
  // Deck reference using consistent pattern
  deck?: {                   
    id: string;              // Deck ID
    name: string;            // Deck name
  };
  
  // Commander reference using consistent pattern
  commander: CommanderReference;
  
  // Tiebreaker information
  opponentWinPercentage?: number; // Opponent match win percentage
}
```

## Tournament Rounds
```typescript
interface TournamentRound {
  roundNumber: number;       // Round number (1, 2, 3, etc.)
  roundLabel: string;        // Round label (e.g., "Round 1", "Top 4", "Finals")
  drawCount?: number;        // Number of draws in this round (Swiss only)
  tables: Array<{            // Tables in this round
    tableNumber: number;     // Table number
    players: Array<{         // Players at this table
      // Player reference
      player: {
        id?: string;         // Player ID (if registered)
        name: string;        // Player name
        rating?: number;     // Player's Glicko rating at time of tournament
      };
      
      // Deck reference
      deck?: {               
        id: string;          // Deck ID
        name: string;        // Deck name
      };
      
      // Commander reference
      commander: CommanderReference;
      
      result: 'win' | 'loss' | 'draw'; // Player's result
    }>;
  }>;
}
```

## Commander Breakdown
```typescript
interface TournamentCommanderBreakdown {
  commanders: Array<{        // Commanders used in the tournament
    commander: CommanderReference; // Commander reference
    count: number;           // Number of players using this commander
  }>;
}
```

## Color Breakdown
```typescript
interface TournamentColorBreakdown {
  colors: Array<{            // Individual colors in the tournament
    color: string;           // Color (e.g., "W", "U", "B", "R", "G")
    count: number;           // Number of decks containing this color
  }>;
}
```

## Complete Tournament Details Model
```typescript
interface TournamentDetails {
  // Core data
  id: string;
  name: string;
  date: string;
  size: number;
  rounds: number;
  topCut: string;
  
  // Statistics
  stats: TournamentStats;
  
  // Relationships
  standings: TournamentStanding[];
  rounds: TournamentRound[];
  
  // Analysis
  commanderBreakdown: TournamentCommanderBreakdown;
  colorBreakdown: TournamentColorBreakdown;
}
```

## Time-Series Data Access
```typescript
// Functions to access time-series data for tournaments
namespace TournamentTimeSeriesApi {
  // Get commander distribution over time for a tournament series
  export async function getCommanderDistribution(
    // Optional tournament filter parameters
    filter?: {
      fromDate?: string;
      toDate?: string;
      minSize?: number;
    },
    // Time series parameters
    timeSeriesParams?: {
      from: string;
      to: string;
      granularity: 'day' | 'week' | 'month' | 'year';
    }
  ): Promise<Record<string, TimeSeriesDataPoint[]>> {
    // Implementation would fetch commander distribution over time
    // Returns record of commanderId to time series data
    return fetchTimeSeriesData('tournament', 'all', 'commanderDistribution', 
      timeSeriesParams?.from || '2020-01-01',
      timeSeriesParams?.to || new Date().toISOString().split('T')[0],
      timeSeriesParams?.granularity || 'month',
      filter
    );
  }
  
  // Get color distribution over time
  export async function getColorDistribution(
    // Optional tournament filter parameters
    filter?: {
      fromDate?: string;
      toDate?: string;
      minSize?: number;
    },
    // Time series parameters
    timeSeriesParams?: {
      from: string;
      to: string;
      granularity: 'day' | 'week' | 'month' | 'year';
    }
  ): Promise<Record<string, TimeSeriesDataPoint[]>> {
    // Implementation would fetch color distribution over time
    // Returns record of color to time series data
    return fetchTimeSeriesData('tournament', 'all', 'colorDistribution',
      timeSeriesParams?.from || '2020-01-01',
      timeSeriesParams?.to || new Date().toISOString().split('T')[0],
      timeSeriesParams?.granularity || 'month',
      filter
    );
  }
}
```

## Tournament Results Service
```typescript
// Service to access tournament results
namespace TournamentResultsService {
  // Get standing by ID 
  export async function getStandingById(
    tournamentId: string,
    standingId: string
  ): Promise<TournamentStanding | null> {
    const tournament = await getTournamentById(tournamentId);
    return tournament.standings.find(s => s.id === standingId) || null;
  }
  
  // Get standings for player
  export async function getStandingsForPlayer(
    playerId: string,
    options?: {
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<Array<TournamentStandingWithTournament>> {
    // Implementation would fetch tournaments for a player
    // And return standings with tournament information
    const results: TournamentStandingWithTournament[] = [];
    
    // Find tournaments this player participated in
    const tournaments = await findTournamentsWithPlayer(playerId, options);
    
    // For each tournament, find this player's standing
    for (const tournament of tournaments) {
      const standing = tournament.standings.find(s => s.player.id === playerId);
      if (standing) {
        results.push({
          tournament: {
            id: tournament.id,
            name: tournament.name,
            date: tournament.date,
            size: tournament.size
          },
          standing
        });
      }
    }
    
    return results;
  }
  
  // Standing with tournament information
  interface TournamentStandingWithTournament {
    tournament: {
      id: string;
      name: string;
      date: string;
      size: number;
    };
    standing: TournamentStanding;
  }
}
```

## API Endpoints
1. `GET /tournaments` - List all tournaments with basic info
2. `GET /tournaments/{id}` - Get detailed tournament information
3. `GET /tournaments/{id}/standings` - Get tournament standings
4. `GET /tournaments/{id}/standings/{standingId}` - Get specific standing
5. `GET /tournaments/{id}/rounds` - Get tournament rounds and results
6. `GET /tournaments/{id}/commanders` - Get commander breakdown
7. `GET /tournaments/{id}/colors` - Get color breakdown
8. `GET /tournaments/timeseries/commanders` - Get commander distribution over time
9. `GET /tournaments/timeseries/colors` - Get color distribution over time
10. `GET /players/{id}/standings` - Get all tournament standings for a player

## Notes on Tournament Data
- Tournament data will be imported from Topdeck.gg
- Each tournament will have a unique ID for reference
- Tournament standings will include both registered and guest players
- Round data will include table assignments and results
- Commander and color breakdowns provide meta analysis for each tournament
- Tournament entity is the single source of truth for tournament results
- Other entities (like Deck) should reference tournament data rather than duplicate it
- Each standing has a unique ID that can be referenced by other entities
- Time-series data is stored in a specialized system separate from main database
- Consistent reference patterns are used for players, decks, and commanders

## Tournament Access Patterns
```typescript
// Common tournament data access patterns

// 1. Access tournament standings
const tournamentId = 'abc123';
const tournament = await getTournamentById(tournamentId);
const standings = tournament.standings;

// 2. Look up a specific standing
const standingId = 'standing456';
const standing = await TournamentResultsService.getStandingById(tournamentId, standingId);

// 3. Get tournament results for a deck
const deckId = 'deck789';
const deckTournaments = await DeckTournamentService.getDeckTournamentHistory(deckId);

// 4. Get tournament results for a player
const playerId = 'player101';
const playerStandings = await TournamentResultsService.getStandingsForPlayer(playerId);
```

## Future Enhancements (Post-MVP)
- Tournament series tracking
- Regional meta analysis
- Tournament performance predictions
- Advanced tournament statistics (average game length, etc.)
- Tournament replay/visualization
- Network Analysis: Player connections, commander matchup networks
- Statistical Significance Indicators: Confidence intervals, sample size indicators
- Table Position Analysis: Win rates by seating position at tables 