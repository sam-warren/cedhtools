# MVP Data Models

The MVP data models have been split into separate files for better organization and maintainability. Please refer to the entity-specific documentation files in the [entities](.docs/entities) directory:

- [Entity Models Overview](entities/index.md) - Overview of all entity models and their relationships
- [Commanders](entities/commanders.md) - Commander entity model documentation
- [Players](entities/players.md) - Player entity model documentation
- [Tournaments](entities/tournaments.md) - Tournament entity model documentation
- [Cards](entities/cards.md) - Card entity model documentation
- [Decks](entities/decks.md) - Deck entity model documentation

This modular approach makes it easier to maintain and update the documentation for each entity independently.

## Commanders

### Core Commander Entity
```typescript
interface Commander {
  id: string;                // Unique identifier (could be Moxfield ID in the future)
  name: string;              // Commander name(s) - can include both partner commanders
  colorIdentity: string;     // Combined color identity (e.g., "{W}{U}{B}{R}")
  image?: string;            // Optional image URL
  partnerCommander?: {       // Optional partner commander details
    id: string;              // Partner's unique identifier
    name: string;            // Partner's name
    image?: string;          // Partner's image URL
  };
}
```

### Commander Statistics
```typescript
interface CommanderStats {
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
  
  // Derived statistics (can be computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  metaShare?: number;        // Percentage of meta representation
}
```

### Commander Matchups
```typescript
interface CommanderMatchups {
  best: Array<{              // Commanders this commander performs well against
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display (can include partner)
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
  worst: Array<{             // Commanders this commander struggles against
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display (can include partner)
    winRate: number;         // Win rate against this commander
    games: number;           // Number of games in this matchup
  }>;
}
```

### Time-Series Data
```typescript
interface CommanderCharts {
  winRate: Array<{           // Win rate over time
    date: string;            // Date (YYYY-MM format)
    value: number;           // Win rate value
  }>;
  popularity: Array<{        // Meta share over time
    date: string;            // Date (YYYY-MM format)
    value: number;           // Meta share value
  }>;
}
```

### Top Players
```typescript
interface TopPlayer {
  id?: string;               // Player ID for linking (optional)
  name: string;              // Player name
  winRate: number;           // Win rate with this commander
  tournamentWins: number;    // Tournament wins with this commander
  top16s: number;            // Top 16 finishes with this commander
  games: number;             // Total games with this commander
}
```

### Top Decklists
```typescript
interface TopDecklist {
  id: string;                // Deck ID (changed from external ID)
  name: string;              // Deck name
  playerName: string;        // Player name (new field)
  playerId?: string;         // Optional player ID (new field)
  tournamentStanding: string; // Standing in format "X/Y"
  winRate: number;           // Win rate for this specific decklist
  tournamentId?: string;     // Optional link to the tournament
  tournamentName?: string;   // Name of the tournament
}
```

### Card Analysis
```typescript
interface CardAnalysis {
  staples: Array<{           // Cards that appear in >90% of decks
    id: string;              // Card ID (Moxfield ID)
    name: string;            // Card name
    inclusion: number;       // Percentage of decks including this card
  }>;
}
```

### Complete Commander Details Model
```typescript
interface CommanderDetails {
  // Core data
  id: string;
  name: string;
  colorIdentity: string;
  image?: string;
  partnerCommander?: {
    id: string;
    name: string;
    image?: string;
  };
  
  // Statistics
  stats: CommanderStats;
  
  // Relationships
  matchups: CommanderMatchups;
  
  // Time series
  charts: CommanderCharts;
  
  // Related entities
  topPlayers: TopPlayer[];
  topDecklists: TopDecklist[];
  
  // Card analysis
  cardAnalysis: CardAnalysis;
}
```

### API Endpoints
1. `GET /commanders` - List all commanders with basic stats
2. `GET /commanders/{id}` - Get detailed commander information
3. `GET /commanders/{id}/stats` - Get commander statistics
4. `GET /commanders/{id}/matchups` - Get commander matchups
5. `GET /commanders/{id}/charts` - Get time-series data
6. `GET /commanders/{id}/players` - Get top players
7. `GET /commanders/{id}/decklists` - Get top decklists
8. `GET /commanders/{id}/decks` - Get all decks using this commander (new endpoint)
9. `GET /commanders/{id}/cards` - Get card analysis

### Notes on Partner Commanders
For partner commanders, we'll use the Combined Entity Approach:
- Treat the partner pair as a single entity with a unique ID
- The `name` field contains both names (e.g., "Thrasios, Triton Hero / Tymna the Weaver")
- Include the `partnerCommander` object for UI display purposes
- This simplifies querying and statistics

### Future Enhancements (Post-MVP)
- Advanced Performance Metrics (expectedGameWin, performanceVsExpected, consistencyRating, powerScore)
- Expanded Card Analysis (differentiators, win rate impact)
- Tournament Context Analysis (performance by tournament size, format, region)
- Extended Time-Series Data (winRateBySeat, winRateByCut)
- Meta Evolution Metrics (volatility, longevity)

## Players

### Core Player Entity
```typescript
interface Player {
  id?: string;               // Optional unique identifier (from Topdeck.gg)
  name: string;              // Player name (always required)
  isRegistered: boolean;     // Whether the player has a Topdeck.gg account
}
```

### Player Statistics
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
  
  // Derived statistics (can be computed on the client)
  winRate?: number;          // Wins / totalGames
  drawRate?: number;         // Draws / totalGames
  consistencyRating?: number; // Measure of consistent performance
}
```

### Recent Tournaments
```typescript
interface PlayerTournament {
  id: string;                // Tournament ID
  name: string;              // Tournament name
  date: string;              // Tournament date (YYYY-MM-DD)
  standing: number;          // Player's standing
  size: number;              // Tournament size (number of players)
  commander: {               // Commander used
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display
  };
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
}
```

### Commander Statistics
```typescript
interface PlayerCommanderStats {
  id: string;                // Commander ID for linking
  name: string;              // Commander name for display
  games: number;             // Games played with this commander
  wins: number;              // Wins with this commander
  draws: number;             // Draws with this commander
  entries: number;           // Number of times entered in tournaments
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
  
  // Derived statistics (can be computed on the client)
  winRate?: number;          // Wins / games
  drawRate?: number;         // Draws / games
}
```

### Time-Series Data
```typescript
interface PlayerCharts {
  winRate: Array<{           // Win rate over time
    date: string;            // Date (YYYY-MM format)
    value: number;           // Win rate value
  }>;
  glickoRating: Array<{      // Glicko rating over time
    date: string;            // Date (YYYY-MM format)
    value: number;           // Rating value
  }>;
}
```

### Color Identity Preference
```typescript
interface ColorPreference {
  colorIdentity: string;     // Color identity (e.g., "{W}{U}{B}")
  percentage: number;        // Percentage of games played with this color identity
  winRate: number;           // Win rate with this color identity
  games: number;             // Games played with this color identity
}
```

### Matchup Analysis
```typescript
interface PlayerMatchups {
  withCommanders: Array<{    // Performance with specific commanders
    id: string;              // Commander ID
    name: string;            // Commander name
    games: number;           // Games played
    winRate: number;         // Win rate
    partnerCommander?: {     // Optional partner commander
      id: string;            // Partner commander ID
      name: string;          // Partner commander name
    };
  }>;
  
  againstCommanders: Array<{ // Performance against specific commanders
    id: string;              // Commander ID
    name: string;            // Commander name
    games: number;           // Games played against
    winRate: number;         // Win rate against
    partnerCommander?: {     // Optional partner commander
      id: string;            // Partner commander ID
      name: string;          // Partner commander name
    };
  }>;
}
```

### Complete Player Details Model
```typescript
interface PlayerDetails {
  // Core data
  id?: string;
  name: string;
  isRegistered: boolean;
  
  // Statistics
  stats: PlayerStats;
  
  // Relationships
  recentTournaments: PlayerTournament[];
  commanderStats: PlayerCommanderStats[];
  decks: Array<{            // Player's decks (new field)
    id: string;             // Deck ID
    name: string;           // Deck name
    commander: {            // Commander used
      id: string;           // Commander ID
      name: string;         // Commander name
    };
    partnerCommander?: {    // Optional partner commander
      id: string;           // Partner commander ID
      name: string;         // Partner commander name
    };
    winRate: number;        // Deck's win rate
    tournamentEntries: number; // Number of tournament entries
  }>;
  
  // Time series
  charts: PlayerCharts;
  
  // Preferences and analysis
  colorPreferences: ColorPreference[];
  matchups: PlayerMatchups;
}
```

### API Endpoints
1. `GET /players` - List all registered players with basic stats
2. `GET /players/{id}` - Get detailed player information
3. `GET /players/{id}/stats` - Get player statistics
4. `GET /players/{id}/tournaments` - Get player's recent tournaments
5. `GET /players/{id}/commanders` - Get player's commander statistics
6. `GET /players/{id}/decks` - Get player's decks (new endpoint)
7. `GET /players/{id}/charts` - Get time-series data
8. `GET /players/{id}/colors` - Get color identity preferences
9. `GET /players/{id}/matchups` - Get matchup analysis

### Notes on Glicko-2 Rating System
For multiplayer games, we'll implement the Glicko-2 rating system with adjustments for 4-player games:
- Rating is adjusted based on the average rating of the three opponents
- Rating adjustment varies by placement:
  - 1st place: Adjusted as if won three games against the calculated rating
  - 2nd place: Adjusted as if won two games and lost one game
  - 3rd place: Adjusted as if won one game and lost two games
  - 4th place: Adjusted as if lost three games
- Initial rating will be 1500
- Ratings will be updated after each tournament

### Notes on Guest Players
- Players without Topdeck.gg IDs will not be stored in the database
- They will appear only in tournament standings as string names
- The UI will indicate these players are guests without profiles
- Statistics will only be tracked for registered players

### Future Enhancements (Post-MVP)
- Head-to-head records against specific players
- Performance by tournament type/format
- Expanded historical data and trends
- Achievement system
- Regional/local rankings

## Tournaments

### Core Tournament Entity
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

### Tournament Statistics
```typescript
interface TournamentStats {
  playerCount: number;       // Number of players
  registeredPlayerCount: number; // Number of registered players
  commanderCount: number;    // Number of unique commanders/pairs
  totalGames: number;        // Total games played
  completedGames: number;    // Completed games (non-draws)
  draws: number;             // Number of draws
  
  // Derived statistics (can be computed on the client)
  drawRate?: number;         // Draws / totalGames
  averageGamesPerPlayer?: number; // totalGames / playerCount
}
```

### Tournament Standings
```typescript
interface TournamentStanding {
  position: number;          // Standing position
  player: {                  // Player information
    id?: string;             // Player ID (if registered)
    name: string;            // Player name
  };
  points: number;            // Total points
  wins: number;              // Number of wins
  draws: number;             // Number of draws
  losses: number;            // Number of losses
  gamesPlayed: number;       // Total games played
  deck?: {                   // Deck used (new field)
    id: string;              // Deck ID
    name: string;            // Deck name
  };
  commander: {               // Commander used
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display
  };
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
  
  // Tiebreaker information
  opponentWinPercentage?: number; // Opponent match win percentage
}
```

### Tournament Rounds
```typescript
interface TournamentRound {
  roundNumber: number;       // Round number (1, 2, 3, etc.)
  roundLabel: string;        // Round label (e.g., "Round 1", "Top 4", "Finals")
  drawCount?: number;        // Number of draws in this round (Swiss only)
  tables: Array<{            // Tables in this round
    tableNumber: number;     // Table number
    players: Array<{         // Players at this table
      id?: string;           // Player ID (if registered)
      name: string;          // Player name
      rating?: number;       // Player's Glicko rating at time of tournament
      deck?: {               // Deck used (new field)
        id: string;          // Deck ID
        name: string;        // Deck name
      };
      commander: {           // Commander used
        id: string;          // Commander ID for linking
        name: string;        // Commander name for display
      };
      partnerCommander?: {   // Optional partner commander
        id: string;          // Partner commander ID
        name: string;        // Partner commander name
      };
      result: 'win' | 'loss' | 'draw'; // Player's result
    }>;
  }>;
}
```

### Commander Breakdown
```typescript
interface TournamentCommanderBreakdown {
  commanders: Array<{        // Commanders used in the tournament
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display
    partnerCommander?: {     // Optional partner commander
      id: string;            // Partner commander ID
      name: string;          // Partner commander name
    };
    count: number;           // Number of players using this commander
  }>;
}
```

### Color Breakdown
```typescript
interface TournamentColorBreakdown {
  colors: Array<{            // Individual colors in the tournament
    color: string;           // Color (e.g., "W", "U", "B", "R", "G")
    count: number;           // Number of decks containing this color
  }>;
}
```

### Tournament Charts
```typescript
interface TournamentCharts {
  commanderDistribution: Array<{  // Data for commander distribution pie chart
    id: string;              // Commander ID
    name: string;            // Commander name
    count: number;           // Number of entries
  }>;
  colorDistribution: Array<{  // Data for color distribution chart
    color: string;           // Color (e.g., "W", "U", "B", "R", "G")
    count: number;           // Number of decks containing this color
  }>;
  drawsByRound?: Array<{     // Draws per round (Swiss only)
    roundNumber: number;     // Round number
    roundLabel: string;      // Round label
    drawCount: number;       // Number of draws
  }>;
}
```

### Complete Tournament Details Model
```typescript
interface TournamentDetails {
  // Core data
  id: string;
  name: string;
  date: string;
  size: number;
  rounds: number;
  topCut: string;
  
  // Relationships
  standings: TournamentStanding[];
  rounds: TournamentRound[];
  
  // Analysis
  commanderBreakdown: TournamentCommanderBreakdown;
  colorBreakdown: TournamentColorBreakdown;
  
  // Charts
  charts: TournamentCharts;
}
```

### API Endpoints
1. `GET /tournaments` - List all tournaments with basic info
2. `GET /tournaments/{id}` - Get detailed tournament information
3. `GET /tournaments/{id}/standings` - Get tournament standings
4. `GET /tournaments/{id}/rounds` - Get tournament rounds and results
5. `GET /tournaments/{id}/commanders` - Get commander breakdown
6. `GET /tournaments/{id}/colors` - Get color breakdown
7. `GET /tournaments/{id}/charts` - Get chart data

### Notes on Tournament Data
- Tournament data will be imported from Topdeck.gg
- Each tournament will have a unique ID for reference
- Tournament standings will include both registered and guest players
- Round data will include table assignments and results
- Commander and color breakdowns provide meta analysis for each tournament

### Future Enhancements (Post-MVP)
- Tournament series tracking
- Regional meta analysis
- Tournament performance predictions
- Advanced tournament statistics (average game length, etc.)
- Tournament replay/visualization
- **Network Analysis**: Player connections, commander matchup networks, rivalry tracking, and community clusters
- **Statistical Significance Indicators**: Confidence intervals, sample size indicators, and statistical anomalies
- **Table Position Analysis**: Win rates by seating position at tables
- **Breakthrough Players**: Players who performed significantly above their rating
- **Consistency Leaders**: Players who maintained consistent performance across rounds

## Cards

### Core Card Entity
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
}
```

### Card-Commander Performance
```typescript
interface CardCommanderPerformance {
  // Card reference
  cardId: string;            // Card ID
  cardName: string;          // Card name
  
  // Commander reference
  commanderId: string;       // Commander ID
  commanderName: string;     // Commander name
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
  
  // Usage statistics
  totalDecksWithCommander: number;  // Total decks with this commander
  decksWithCard: number;            // Decks with this commander that include the card
  
  // Performance statistics
  wins: number;              // Wins in decks with this commander and card
  draws: number;             // Draws in decks with this commander and card
  losses: number;            // Losses in decks with this commander and card
  gamesPlayed: number;       // Total games played with this commander and card
  
  // Derived statistics (can be computed on the client)
  inclusionRate?: number;    // decksWithCard / totalDecksWithCommander
  winRate?: number;          // wins / gamesPlayed
  drawRate?: number;         // draws / gamesPlayed
  
  // Time series data
  charts?: {
    usage: Array<{           // Usage over time with this commander
      date: string;          // Date (YYYY-MM format)
      value: number;         // Number of decks or percentage of inclusion
    }>;
    winRate: Array<{         // Win rate over time with this commander
      date: string;          // Date (YYYY-MM format)
      value: number;         // Win rate value
    }>;
  };
}
```

### Commander Card Analysis
```typescript
interface CommanderCardAnalysis {
  commanderId: string;       // Commander ID
  commanderName: string;     // Commander name
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
  
  // Card categories
  staples: Array<{           // Cards that appear in >90% of decks with this commander
    id: string;              // Card ID
    name: string;            // Card name
    inclusion: number;       // Percentage of decks including this card
    winRate?: number;        // Win rate when this card is included
  }>;
  
  highPerformers: Array<{    // Cards with above-average win rates
    id: string;              // Card ID
    name: string;            // Card name
    inclusion: number;       // Percentage of decks including this card
    winRate: number;         // Win rate when this card is included
    winRateDiff: number;     // Difference from commander's average win rate
  }>;
  
  uniqueCards: Array<{       // Cards that are uniquely popular with this commander
    id: string;              // Card ID
    name: string;            // Card name
    inclusion: number;       // Percentage of decks including this card
    globalInclusion: number; // Percentage across all eligible decks
    ratio: number;           // inclusion / globalInclusion
  }>;
}
```

### API Endpoints
1. `GET /commanders/{commanderId}/cards` - Get all cards used with a specific commander
2. `GET /commanders/{commanderId}/cards/analysis` - Get card analysis for a specific commander
3. `GET /commanders/{commanderId}/cards/{cardId}` - Get card performance with specific commander
4. `GET /cards/{cardId}/commanders` - Get commander performance with specific card
5. `GET /cards/{cardId}/decks` - Get decks using this card (new endpoint)
6. `GET /cards/search` - Search cards by name, type, color, etc. (basic card info only)

### Notes on Card Data
- Card data will be imported from Moxfield or Scryfall
- Each card will have a unique ID for reference
- Card statistics will be tracked exclusively in the context of commanders
- Card performance metrics will help identify which cards work best with specific commanders
- The inclusion rate helps identify staples vs. niche cards for each commander

### Future Enhancements (Post-MVP)
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

## Decks

### Core Deck Entity
```typescript
interface Deck {
  id: string;                // Unique identifier
  name: string;              // Deck name
  createdAt: string;         // Creation date (YYYY-MM-DD)
  updatedAt: string;         // Last update date (YYYY-MM-DD)
  
  // Commander information
  commander: {
    id: string;              // Commander ID for linking
    name: string;            // Commander name for display
  };
  partnerCommander?: {       // Optional partner commander
    id: string;              // Partner commander ID
    name: string;            // Partner commander name
  };
  
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

### Deck Statistics
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
  
  // Note: Derived statistics (win rate, draw rate) should be computed on the client
}
```

### Deck Composition
```typescript
interface DeckComposition {
  // Card boards
  commander: Array<{         // Commander zone cards
    id: string;              // Card ID
    name: string;            // Card name
    count: number;           // Number of copies (usually 1)
  }>;
  
  mainboard: Array<{         // Main deck cards
    id: string;              // Card ID
    name: string;            // Card name
    count: number;           // Number of copies
  }>;
  
  sideboard?: Array<{        // Optional sideboard cards
    id: string;              // Card ID
    name: string;            // Card name
    count: number;           // Number of copies
  }>;
  
  companion?: {              // Optional companion
    id: string;              // Card ID
    name: string;            // Card name
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

### Deck Card Performance
```typescript
interface DeckCardPerformance {
  // Card reference
  cardId: string;            // Card ID
  
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
  
  // Note: Inclusion rate and other percentage-based stats should be computed on the client
}
```

### Tournament History
```typescript
interface DeckTournament {
  id: string;                // Tournament ID
  name: string;              // Tournament name
  date: string;              // Tournament date (YYYY-MM-DD)
  standing: number;          // Deck's standing
  size: number;              // Tournament size
  playerId?: string;         // Optional player ID who played this deck
  playerName: string;        // Player name who played this deck
  wins: number;              // Wins in this tournament
  losses: number;            // Losses in this tournament
  draws: number;             // Draws in this tournament
}
```

### Complete Deck Details Model
```typescript
interface DeckDetails {
  // Core data
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Commander information
  commander: {
    id: string;
    name: string;
  };
  partnerCommander?: {
    id: string;
    name: string;
  };
  
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
  
  // Tournament history
  tournamentHistory: DeckTournament[];
}
```

### API Endpoints
1. `GET /decks` - List all decks with basic info
2. `GET /decks/{id}` - Get detailed deck information
3. `GET /decks/{id}/stats` - Get deck statistics
4. `GET /decks/{id}/composition` - Get deck composition
5. `GET /decks/{id}/cards` - Get card performance within this deck
6. `GET /decks/{id}/tournaments` - Get tournament history
7. `GET /players/{id}/decks` - Get decks for a specific player
8. `GET /commanders/{id}/decks` - Get decks for a specific commander

### Notes on Deck Data
- Decks can be imported from external sources or created manually
- The same deck can be played by multiple different players in tournaments
- Player information is tracked at the tournament level, not at the deck level
- Card performance metrics help identify which cards impact win rates
- Commander EDH decks always contain exactly 100 cards (including the commander)
- Percentage-based statistics should be computed on the client side

### Future Enhancements (Post-MVP)
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
- Time-series data for deck performance
