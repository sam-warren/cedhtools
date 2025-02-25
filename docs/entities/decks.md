# Deck Entity Model

## Core Deck Entity
```typescript
interface Deck {
  id: string;                // Unique identifier
  name: string;              // Deck name
  createdAt: string;         // Creation date (YYYY-MM-DD)
  updatedAt: string;         // Last update date (YYYY-MM-DD)
  
  // Commander information using consistent reference
  commander: CommanderReference;
  
  // Metadata
  colorIdentity: string;     // Combined color identity (e.g., "{W}{U}{B}{R}")
  description?: string;      // Optional deck description
  source?: {                 // Optional source information
    type: 'moxfield' | 'archidekt' | 'deckstats' | 'manual'; // Source type
    externalId?: string;     // External ID for linking
    url?: string;            // URL to original deck
  };
}
```

## Deck Statistics
```typescript
interface DeckStats {
  // Tournament performance
  tournamentEntries: number; // Number of tournament entries
  tournamentWins: number;    // Number of tournament wins
  
  // Game performance
  totalGames: number;        // Total games played
  wins: number;              // Total wins
  draws: number;             // Total draws
  losses: number;            // Total losses
  
  // Derived statistics (computed on the client)
  winRate?: number;          // wins / totalGames
  drawRate?: number;         // draws / totalGames
  lossRate?: number;         // losses / totalGames
}
```

## Deck Composition
```typescript
interface DeckComposition {
  // Card boards with consistent references
  commander: Array<{         // Commander zone cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies (usually 1)
  }>;
  
  mainboard: Array<{         // Main deck cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies
  }>;
  
  sideboard?: Array<{        // Optional sideboard cards
    card: CardReference;     // Consistent card reference
    count: number;           // Number of copies
  }>;
  
  companion?: {              // Optional companion
    card: CardReference;     // Consistent card reference
  };
  
  // Card type breakdown
  typeBreakdown: {
    creatures: number;       // Number of creature cards
    instants: number;        // Number of instant cards
    sorceries: number;       // Number of sorcery cards
    artifacts: number;       // Number of artifact cards
    enchantments: number;    // Number of enchantment cards
    planeswalkers: number;   // Number of planeswalker cards
    lands: number;           // Number of land cards
  };
}
```

## Deck Card Performance
```typescript
interface DeckCardPerformance {
  // Card reference using consistent pattern
  card: CardReference;
  
  // Performance metrics
  wins: number;              // Wins when this card is in the deck
  losses: number;            // Losses when this card is in the deck
  draws: number;             // Draws when this card is in the deck
  gamesPlayed: number;       // Total games played with this card
  
  // Commander context metrics
  commanderWinRate: number;  // Overall win rate of decks with this commander
  cardWinRate: number;       // Win rate of decks with this commander that include this card
  
  // Impact metric
  winRateDiff: number;       // Difference between card win rate and commander's average win rate
                             // (positive values indicate the card improves performance)
}
```

## Tournament References
```typescript
interface DeckTournamentReference {
  tournamentId: string;      // Reference to the tournament
  playerId?: string;         // Optional player ID who played this deck
  playerName: string;        // Player name who played this deck
  
  // The standing ID to look up detailed results in tournament entity
  standingId: string;        // ID to reference specific standing in tournament
}
```

## Complete Deck Details Model
```typescript
interface DeckDetails {
  // Core data
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Commander information (consistent reference)
  commander: CommanderReference;
  
  // Metadata
  colorIdentity: string;
  description?: string;
  source?: {
    type: 'moxfield' | 'archidekt' | 'deckstats' | 'manual';
    externalId?: string;
    url?: string;
  };
  
  // Statistics
  stats: DeckStats;
  
  // Composition
  composition: DeckComposition;
  
  // Card performance
  cardPerformance: DeckCardPerformance[];
  
  // Tournament references
  tournamentReferences: DeckTournamentReference[];
}
```

## Time-Series Data Access
```typescript
// Functions to access time-series data for decks
namespace DeckTimeSeriesApi {
  // Get win rate over time for a deck
  export async function getWinRateHistory(
    deckId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData('deck', deckId, 'winRate', from, to, granularity);
  }
  
  // Get popularity over time for a deck
  export async function getUsageHistory(
    deckId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TimeSeriesDataPoint[]> {
    // Implementation fetches from time-series database
    return fetchTimeSeriesData('deck', deckId, 'usage', from, to, granularity);
  }
}
```

## Deck Tournament History Service
```typescript
// Service to get deck tournament history with details
namespace DeckTournamentService {
  // Get complete tournament history for a deck, with details from Tournament entity
  export async function getDeckTournamentHistory(
    deckId: string
  ): Promise<DeckTournamentHistory[]> {
    // 1. Fetch basic tournament references for this deck
    const references = await fetchDeckTournamentReferences(deckId);
    
    // 2. For each reference, fetch details from Tournament entity
    return Promise.all(references.map(async (ref) => {
      // Fetch the tournament and the specific standing
      const [tournament, standing] = await Promise.all([
        getTournamentById(ref.tournamentId),
        getTournamentStandingById(ref.tournamentId, ref.standingId)
      ]);
      
      // 3. Return detailed tournament history entry without duplicating data
      return {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          date: tournament.date,
          size: tournament.size
        },
        player: {
          id: ref.playerId,
          name: ref.playerName
        },
        standing: standing.position,
        wins: standing.wins,
        losses: standing.losses,
        draws: standing.draws,
        matchPoints: standing.points
      };
    }));
  }
  
  // Result interface for tournament history with details
  interface DeckTournamentHistory {
    tournament: {
      id: string;
      name: string;
      date: string;
      size: number;
    };
    player: {
      id?: string;
      name: string;
    };
    standing: number;
    wins: number;
    losses: number;
    draws: number;
    matchPoints: number;
  }
}
```

## API Endpoints
1. `GET /decks` - List all decks with basic info
2. `GET /decks/{id}` - Get detailed deck information
3. `GET /decks/{id}/stats` - Get deck statistics
4. `GET /decks/{id}/composition` - Get deck composition
5. `GET /decks/{id}/cards` - Get card performance within this deck
6. `GET /decks/{id}/tournaments` - Get tournament history with details
7. `GET /decks/{id}/timeseries/{metric}` - Get time-series data for a specific metric
8. `GET /commanders/{id}/decks` - Get decks for a specific commander

## Notes on Deck Data
- Decks can be imported from external sources or created manually
- The same deck can be played by multiple different players in tournaments
- Player information is tracked at the tournament level, not at the deck level
- Card performance metrics help identify which cards impact win rates
- Commander EDH decks always contain exactly 100 cards (including the commander)
- Percentage-based statistics should be computed on the client side
- Deck tournament history references Tournament entity for detailed data
- Time-series data is stored in a specialized system separate from main database
- `CommanderReference` is used consistently for all commander references

## Partners and Deck Routing
When working with decks that use partner commanders:
- The deck's `commander` field uses the `CommanderReference` with combined ID
- Routing is based on this combined ID which is consistent regardless of partner order
- Deck details page should display both partners with their own card details
- Deck endpoints that use commander ID should use the combined ID

## Future Enhancements (Post-MVP)
- Deck version history tracking
- Deck similarity comparison
- Deck archetype classification
- Deck power level estimation
- Deck upgrade recommendations
- Playtest simulation
- Deck price tracking and budget alternatives
- Meta position analysis (how well positioned a deck is in the current meta)
- Deck consistency metrics (e.g., probability of drawing key cards)
- Deck matchups against specific commanders 