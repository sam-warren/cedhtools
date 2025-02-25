# Card Entity Model

## Core Card Entity
```typescript
interface Card {
  id: string;                // Unique identifier (Moxfield ID)
  name: string;              // Card name
  colorIdentity: string;     // Color identity (e.g., "{W}{U}{B}")
  typeLine: string;          // Type line (e.g., "Legendary Creature — Human Wizard")
  manaCost?: string;         // Mana cost (e.g., "{2}{U}{U}")
  cmc: number;               // Converted mana cost / mana value
  image?: string;            // Card image URL
  oracleText?: string;       // Oracle text
  isCommander: boolean;      // Flag indicating if card can be a commander
  commanderLegality: 'banned' | 'legal' | 'not_legal'; // Commander format legality
  legalityUpdatedAt?: string; // When legality was last updated
}
```

## Standard Reference Types
```typescript
// Base reference type for consistent entity references
interface EntityReference {
  id: string;                // Unique identifier
  name: string;              // Display name
}

// Card reference for consistent use across entities
interface CardReference extends EntityReference {
  // Card-specific reference properties can be added here
}

// Commander reference with optional partner information
interface CommanderReference extends EntityReference {
  partnerCommanderId?: string;  // Optional ID of partner (if applicable)
  partnerCommanderName?: string; // Optional name of partner
}
```

## Card-Commander Performance
```typescript
interface CardCommanderPerformance {
  // Card reference using consistent pattern
  card: CardReference;
  
  // Commander reference using consistent pattern
  commander: CommanderReference;
  
  // Usage statistics
  totalDecksWithCommander: number;  // Total decks with this commander
  decksWithCard: number;            // Decks with this commander that include the card
  
  // Performance statistics
  wins: number;              // Wins in decks with this commander and card
  draws: number;             // Draws in decks with this commander and card
  losses: number;            // Losses in decks with this commander and card
  gamesPlayed: number;       // Total games played with this commander and card
  
  // Derived statistics (computed on the client)
  inclusionRate?: number;    // decksWithCard / totalDecksWithCommander
  winRate?: number;          // wins / gamesPlayed
  drawRate?: number;         // draws / gamesPlayed
}
```

## Commander Card Analysis
```typescript
interface CommanderCardAnalysis {
  // Use consistent commander reference
  commander: CommanderReference;
  
  // Card categories with consistent references
  staples: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    winRate?: number;        // Win rate when this card is included
  }>;
  
  highPerformers: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    winRate: number;         // Win rate when this card is included
    winRateDiff: number;     // Difference from commander's average win rate
  }>;
  
  uniqueCards: Array<{
    card: CardReference;     // Consistent card reference
    inclusion: number;       // Percentage of decks including this card
    globalInclusion: number; // Percentage across all eligible decks
    ratio: number;           // inclusion / globalInclusion
  }>;
}
```

## TimescaleDB-Optimized Time-Series Interface
```typescript
// Time series data point for consistent use across entities
interface TimeSeriesDataPoint {
  timestamp: string;         // ISO 8601 timestamp (YYYY-MM-DD)
  value: number;             // The measured value
  metadata?: Record<string, any>; // Optional additional context
}

// Query interface optimized for TimescaleDB
interface TimeSeriesQuery {
  entityType: 'commander' | 'player' | 'deck' | 'card' | 'tournament';
  entityId: string;          // The entity's unique identifier
  metric: string;            // 'usage', 'winRate', 'popularity', etc.
  interval?: 'hour' | 'day' | 'week' | 'month' | 'year'; // TimescaleDB time_bucket
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'; // Aggregation function
  startTime: string;         // ISO timestamp for range start
  endTime: string;           // ISO timestamp for range end
}

// Response wrapper for time series data
interface TimeSeriesResponse {
  query: TimeSeriesQuery;    // The original query parameters
  dataPoints: TimeSeriesDataPoint[];
  meta: {
    totalPoints: number;     // Total number of data points
    interval: string;        // Actual interval used for the query
    aggregation: string;     // Actual aggregation function used
  };
}

// Function for fetching time series data
async function fetchTimeSeriesData(
  query: TimeSeriesQuery
): Promise<TimeSeriesResponse> {
  // Implementation would query TimescaleDB with appropriate parameters
  // This is handled by the backend API
  return apiClient.get('/timeseries', { params: query });
}
```

## Commander ID Utilities
```typescript
// Utility functions for working with commander IDs
namespace CommanderUtils {
  // Generate a consistent combined ID for commander pairs
  export function generateCombinedId(commander1Id: string, commander2Id?: string): string {
    if (!commander2Id) return commander1Id;
    
    // Sort IDs to ensure consistent ordering regardless of input order
    const [first, second] = [commander1Id, commander2Id].sort();
    return `${first}_${second}`;
  }
  
  // Parse a combined ID back into individual commander IDs
  export function parseCommanderId(combinedId: string): { 
    primaryId: string; 
    partnerId?: string 
  } {
    if (combinedId.includes('_')) {
      const [primary, partner] = combinedId.split('_');
      return { primaryId: primary, partnerId: partner };
    }
    return { primaryId: combinedId };
  }
  
  // Check if a combined ID represents a partner pair
  export function isPartnerPair(combinedId: string): boolean {
    return combinedId.includes('_');
  }
}
```

## Entity Response Wrapper
```typescript
// Standard wrapper for all entity responses
// Provides metadata for client-side caching and versioning
interface EntityResponse<T> {
  data: T;                   // The actual entity data
  meta: {
    lastUpdated: string;     // When the data was last updated on the server
    dataVersion: string;     // Version hash of the dataset (for cache invalidation)
    nextUpdateExpected?: string; // When to expect the next data update (based on ETL schedule)
  };
}
```

## API Endpoints
1. `GET /cards` - List all cards with basic info
2. `GET /cards/{id}` - Get detailed card information
3. `GET /commanders/{commanderId}/cards` - Get all cards used with a specific commander
4. `GET /commanders/{commanderId}/cards/analysis` - Get card analysis for a specific commander
5. `GET /commanders/{commanderId}/cards/{cardId}` - Get card performance with specific commander
6. `GET /cards/{cardId}/commanders` - Get commander performance with specific card
7. `GET /cards/{cardId}/decks` - Get decks using this card
8. `GET /cards/search` - Search cards by name, type, color, etc. (basic card info only)
9. `GET /cards/{cardId}/timeseries/{metric}` - Get time-series data for a specific card and metric

## Notes on Card Data
- Card data will be imported from Moxfield or Scryfall
- Each card will have a unique ID for reference
- Card statistics will be tracked exclusively in the context of commanders
- Card performance metrics will help identify which cards work best with specific commanders
- The inclusion rate helps identify staples vs. niche cards for each commander
- The `isCommander` flag identifies cards that can be used as commanders
- Commanders are a special type of card with additional properties and relationships
- Time-series data is stored separately using TimescaleDB for efficient time-based queries
- Commander legality is tracked to filter out banned cards from analysis and display
- All API responses use the EntityResponse wrapper for consistent metadata handling

## Future Enhancements (Post-MVP)
- Generic card statistics (independent of commanders)
- Card price tracking and correlation with performance
- Card power level estimation based on tournament results
- Archetype analysis (which archetypes use this card)
- Card replacement suggestions (similar cards with better/worse performance)
- Metagame impact analysis (how a card's presence affects the meta)
- Card synergies (cards that frequently appear together)
- Parsing type line into structured type data
- Win rate comparison (how a card affects a commander's baseline win rate)
- Statistical significance indicators for card performance 