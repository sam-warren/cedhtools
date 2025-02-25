# Commander Entity Model

## Commander Entity (extends Card)
```typescript
// Commander extends the base Card entity
interface Commander extends Card {
  // The id field is either a solo commander ID or a combined ID for partner pairs
  id: string;                // Unique identifier (either single ID or combined ID for partners)
  
  // Commander inherits commanderLegality from Card
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Always exists for commanders
  
  // If this is a partner pair, store the partner information
  partnerCommander?: {
    id: string;              // Partner's unique identifier
    name: string;            // Partner's name
    image?: string;          // Partner's image URL
    commanderLegality: 'banned' | 'legal' | 'not_legal'; // Partner's legality
  };
  
  // Helper computed property (implementation detail)
  // Returns the combined ID for both solo and partner commanders
  get combinedId(): string { 
    return this.partnerCommander ? 
      CommanderUtils.generateCombinedId(this.id, this.partnerCommander.id) : 
      this.id;
  }
  
  // Helper computed property (implementation detail)
  // Returns whether this commander (or pair) is legal
  get isLegal(): boolean {
    return this.commanderLegality === 'legal' && 
      (!this.partnerCommander || this.partnerCommander.commanderLegality === 'legal');
  }
}
```

## Entity Response Wrapper
```typescript
// All API responses use this wrapper for consistent metadata
interface EntityResponse<T> {
  data: T;                   // The actual entity data
  meta: {
    lastUpdated: string;     // When the data was last updated on the server
    dataVersion: string;     // Version hash of the dataset (for cache invalidation)
    nextUpdateExpected?: string; // When to expect the next data update
  };
}

// Example: Commander response
type CommanderResponse = EntityResponse<Commander>;
type CommanderListResponse = EntityResponse<Commander[]>;
type CommanderDetailsResponse = EntityResponse<CommanderDetails>;
```

## Commander Statistics
```typescript
interface CommanderStats {
  // Tournament performance
  totalGames: number;        // Total games played
  wins: number;              // Total wins
  draws: number;             // Total draws
  entries: {
    total: number,           // Total entries
    uniquePlayers: number    // Number of unique players
  }
  tournamentWins: number;    // Number of tournament wins
  top4s: number;             // Number of top 4 finishes
  top10s: number;            // Number of top 10 finishes
  top16s: number;            // Number of top 16 finishes
  
  // Derived statistics (computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  metaShare?: number;        // Percentage of meta representation
}
```

## Commander Matchups
```typescript
interface CommanderMatchups {
  best: Array<{
    commander: CommanderReference; // Use consistent commander reference
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
  worst: Array<{
    commander: CommanderReference; // Use consistent commander reference
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
}
```

## Top Players
```typescript
interface TopPlayer {
  player: {                  // Use consistent player reference
    id?: string;             // Player ID for linking (optional)
    name: string;            // Player name
  };
  winRate: number;           // Win rate with this commander
  tournamentWins: number;    // Tournament wins with this commander
  top16s: number;            // Top 16 finishes with this commander
  games: number;             // Total games with this commander
}
```

## Top Decklists
```typescript
interface TopDecklist {
  deck: {                    // Use consistent deck reference
    id: string;              // Deck ID 
    name: string;            // Deck name
  };
  player: {                  // Use consistent player reference
    id?: string;             // Optional player ID
    name: string;            // Player name
  };
  tournamentStanding: string; // Standing in format "X/Y"
  winRate: number;           // Win rate for this specific decklist
  tournament?: {             // Optional tournament reference
    id: string;              // Tournament ID
    name: string;            // Tournament name
  };
}
```

## Card Analysis
```typescript
interface CardAnalysis {
  staples: Array<{           // Cards that appear in >90% of decks
    card: CardReference;     // Use consistent card reference
    inclusion: number;       // Percentage of decks including this card
  }>;
}
```

## Complete Commander Details Model
```typescript
interface CommanderDetails {
  // Core data (inherited from Card)
  id: string;                // Combined ID for commander/partner pair
  name: string;
  colorIdentity: string;
  image?: string;
  typeLine: string;
  manaCost?: string;
  cmc: number;
  oracleText?: string;
  isCommander: true;         // Always true for commanders
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Commander format legality
  
  // Partner information (if applicable)
  partnerCommander?: {
    id: string;
    name: string;
    image?: string;
    commanderLegality: 'banned' | 'legal' | 'not_legal';
  };
  
  // Statistics
  stats: CommanderStats;
  
  // Relationships
  matchups: CommanderMatchups;
  
  // Related entities
  topPlayers: TopPlayer[];
  topDecklists: TopDecklist[];
  
  // Card analysis
  cardAnalysis: CardAnalysis;
}
```

## Time-Series Data Access
```typescript
// Functions to access time-series data for commanders
namespace CommanderTimeSeriesApi {
  // Get win rate over time for a commander
  export async function getWinRateHistory(
    commanderId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData({
      entityType: 'commander',
      entityId: commanderId,
      metric: 'winRate',
      interval: granularity,
      startTime: from,
      endTime: to
    });
  }
  
  // Get popularity over time for a commander
  export async function getPopularityHistory(
    commanderId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData({
      entityType: 'commander',
      entityId: commanderId,
      metric: 'popularity',
      interval: granularity,
      startTime: from,
      endTime: to
    });
  }
  
  // Convenience function to get multiple metrics at once
  export async function getMultipleMetrics(
    commanderId: string,
    metrics: string[],
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Record<string, TimeSeriesDataPoint[]>> {
    const results: Record<string, TimeSeriesDataPoint[]> = {};
    
    // Fetch all metrics in parallel
    await Promise.all(metrics.map(async (metric) => {
      const response = await fetchTimeSeriesData({
        entityType: 'commander',
        entityId: commanderId,
        metric: metric,
        interval: granularity,
        startTime: from,
        endTime: to
      });
      
      results[metric] = response.dataPoints;
    }));
    
    return results;
  }
}
```

## Commander ID Management
```typescript
namespace CommanderIdManager {
  // Get commander details by combined ID (handles both solo and partner commanders)
  export async function getCommanderByCombinedId(
    combinedId: string
  ): Promise<Commander> {
    if (CommanderUtils.isPartnerPair(combinedId)) {
      const { primaryId, partnerId } = CommanderUtils.parseCommanderId(combinedId);
      
      // We need both commanders to construct the combined commander
      if (!partnerId) throw new Error('Expected partner ID but none found');
      
      // Fetch both commanders in parallel
      const [primary, partner] = await Promise.all([
        fetchCommander(primaryId),
        fetchCommander(partnerId)
      ]);
      
      // Combine them into a single commander entity
      return {
        ...primary,
        id: combinedId, // Use the combined ID
        partnerCommander: {
          id: partner.id,
          name: partner.name,
          image: partner.image,
          commanderLegality: partner.commanderLegality
        }
      };
    } else {
      // It's just a solo commander
      return fetchCommander(combinedId);
    }
  }
  
  // Function to generate URL for commander page
  export function getCommanderUrl(commander: Commander | CommanderReference): string {
    const id = 'combinedId' in commander ? commander.combinedId : commander.id;
    return `/commanders/${id}`;
  }
}
```

## API Endpoints
1. `GET /commanders` - List all commanders with basic stats
2. `GET /commanders/{id}` - Get detailed commander information (works with both solo and partner IDs)
3. `GET /commanders/{id}/stats` - Get commander statistics
4. `GET /commanders/{id}/matchups` - Get commander matchups
5. `GET /commanders/{id}/players` - Get top players
6. `GET /commanders/{id}/decklists` - Get top decklists
7. `GET /commanders/{id}/decks` - Get all decks using this commander
8. `GET /commanders/{id}/cards` - Get card analysis
9. `GET /commanders/{id}/timeseries/{metric}` - Get time-series data for a specific metric

## Notes on Partner Commanders
For partner commanders, we use a Combined Entity approach:
- A partner pair has a unique combined ID (generated by sorting and joining the individual IDs)
- This combined ID is used for routing, data fetching, and references
- The `CommanderUtils` and `CommanderIdManager` utilities handle the complexities
- Partner information is included for UI display purposes
- This approach ensures data consistency, simplifies querying, and provides flexibility
- The combined ID system works regardless of whether Rograkh/Silas or Silas/Rograkh is entered

## Example Partner Commander ID Workflow
```typescript
// Working with partner commanders
const rograkhId = 'YdlZG';
const silasId = 'EgVRr';

// Generate consistent combined ID (same result regardless of argument order)
const combinedId = CommanderUtils.generateCombinedId(rograkhId, silasId); // 'EgVRr_YdlZG' (alphabetical sort)
const sameId = CommanderUtils.generateCombinedId(silasId, rograkhId);     // 'EgVRr_YdlZG' (same result)

// Navigate to commander page
router.navigate(`/commanders/${combinedId}`);

// Parse combined ID back to components if needed
const { primaryId, partnerId } = CommanderUtils.parseCommanderId(combinedId);
// primaryId = 'EgVRr', partnerId = 'YdlZG'
```

## Notes on Banned Commanders
- Commander legality is tracked through the `commanderLegality` field
- For partner pairs, both commanders must be legal for the pair to be legal
- The UI should display banned commanders with a clear visual indicator
- Tournament data will still include banned commanders for historical accuracy
- Filtering by legality should be available in search and listing views

## Future Enhancements (Post-MVP)
- Advanced Performance Metrics (expectedGameWin, performanceVsExpected, consistencyRating, powerScore)
- Expanded Card Analysis (differentiators, win rate impact)
- Tournament Context Analysis (performance by tournament size, format, region)
- Meta Evolution Metrics (volatility, longevity) 