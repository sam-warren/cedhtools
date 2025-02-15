# cedhtools Application Architecture

cedhtools is an analytics tool that provides insights on cEDH stats and trends. It is designed to empower players to make data-driven decisions in their deckbuilding process and analyze performance trends of decks and cards in the meta.

## Domain Model

### Entities

#### Deck
```typescript
interface Deck {
  id: string;              // Moxfield publicDeckId
  name: string;            // Given name of the deck
  description: string;     // Description of the deck
  commanders: Card[];      // Commander card(s), 1-2 cards
  cards: Card[];          // Rest of the deck
  colorIdentity: Color[]; // Derived from commander(s)
}

// Constraints:
// - Exactly 100 cards total (commanders + cards)
// - All cards must have color identity subset of deck's color identity
// - Commander(s) determine color identity
```

Implementation Notes:
- A deck is a collection of 100 Magic: The Gathering cards played in a tournament
- Each deck has either one or two commanders
- Rest of the deck is made up of unique cards with some exceptions (basic lands, Relentless Rats, etc.)
- Color identity is dictated by the commander(s). For example, Tymna + Kraum is {W}{U}{B}{R}, meaning any card that is colorless or has one or more of white, blue, black, or red is legal
- Decks are uniquely identified by their Moxfield publicId
- Same exact deck (same publicId) can be played in multiple tournaments
- We often identify decks by commander name(s) colloquially. For example, "Kinnan deck" refers to any deck with Kinnan as commander, even though there may be hundreds of unique decklists

#### Card
```typescript
interface Card {
  id: string;              // Moxfield uniqueCardId
  uri: string;             // Scryfall URI
  type: CardType;          // Main card type
  typeLine: string;        // Full type line
  name: string | string[]; // For multi-face cards
  colorIdentity: Color[];
  manaCost: string | string[]; // For multi-face cards
  imageUri: string;        // Scryfall CDN URI
  legality: "legal" | "not_legal" | "banned";
  oracleText: string;
}

type CardType = "Battle" | "Planeswalker" | "Creature" | "Instant" | 
                "Sorcery" | "Enchantment" | "Artifact" | "Land";
type Color = "W" | "U" | "B" | "R" | "G";
```

Implementation Notes:
- Cards are uniquely defined by Moxfield uniqueCardId
- Same card can have multiple printings (different Scryfall IDs)
- Data layout can vary between printings (e.g., Jinnie Fay, Jetmir's Second has different data structure for reversible vs normal printing)
- We don't track specific card properties like power/toughness/loyalty
- Some Moxfield data isn't perfectly synced with Scryfall (e.g., "digital only" versions of Strixhaven: Mystical Archive cards have dead Scryfall IDs)

#### Tournament
```typescript
interface Tournament {
  id: string;           // Topdeck.gg tournament ID
  name: string;
  swissNum: number;     // Number of swiss rounds
  startDate: Date;
  rounds: Round[];
  topCut: number;       // Number advancing past swiss
  standings: Standing[];
}
```

#### Round
```typescript
interface Round {
  round: number | string; // Number for swiss, string for top cut
  tables: Table[];
}
```

#### Table
```typescript
interface Table {
  table: number;
  players: {
    id: string;
    name: string;
    decklist: string; // Moxfield URL
  }[];
  winner: string;     // Player name or "Draw"
  winner_id: string;  // Player ID or "Draw"
}
```

#### Standing
```typescript
interface Standing {
  name: string;
  id: string;          // Topdeck.gg player ID
  decklist: string;    // Moxfield URL
  wins: number;
  losses: number;
  draws: number;
  byes: number;
  winsSwiss: number;
  lossesSwiss: number;
  winsBracket: number;
  lossesBracket: number;
}
```

#### Player
```typescript
interface Player {
  id?: string;         // Optional Topdeck.gg ID
  name: string;
}
```

## System Architecture

### Frontend
- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS + Shadcn UI
- Charts: Recharts
- Icons: Lucide Icons

### API
- Language: Rust (TBD, considering FastAPI)
- Requirements:
  - Fast response times
  - Reliable
  - Maintainable

### Databases
1. User DB (PostgreSQL)
   - User information
   - Authentication data

2. Data DB (TimescaleDB)
   - cEDH data
   - Tournament results
   - Temporal analytics

### Data Ingestion Pipeline
1. Topdeck.gg Ingestion (TBD)
2. Moxfield Ingestion (TBD)
3. Scryfall Ingestion (TBD)

## Frontend Routes

### Home Page (/)
**v1** Features:
- Commander leaderboard by win rate
- Color identity meta breakdown (pie chart)
- Color identity win rates (pie chart)
- Recent tournament results table
- Win rate by seat position (bar chart)
- User-customizable dashboard (future)

### Commanders Page (/commanders)
- Paginated table of commanders
- Statistics: win rate, popularity, draw rate

### Commander Page (/commanders/[commanderId])
Displays:
- Win/draw rates
- Tournament performance
- Time-series analytics
- Player statistics
- Matchup data

### Commander Cards Page (/commanders/[commanderId]/cards)
Shows:
- Card tables by type
- Search/filter functionality
- Card performance metrics
- Staple/synergy analysis

### Players Page (/players)
- Player statistics table
- Tournament history

### Player Page (/players/[playerId])
Shows:
- Player profile
- Deck history
- Tournament results
- Performance trends

### Tournaments Page (/tournaments)
- Tournament listing
- Results and statistics

### Tournament Page (/tournaments/[tournamentId])
Displays:
- Tournament details
- Round information
- Final standings

## Implementation Details & Notes

### Tournament Structure
- Tournaments can have variable number of rounds
- Tables ideally have 4 players but can vary from 1-5 players
- Need to handle this variance in data processing
- All tournaments are from Topdeck.gg cEDH events

### Data Sources & Edge Cases
1. Decklist Sources:
   - Primary: Moxfield URLs
   - Need to handle: Archidekt, other sources
   - Some players don't provide parseable decklist URLs

2. Player Identity:
   - Not all players have Topdeck.gg IDs
   - Anonymous players only have string names
   - Need to handle player identity across tournaments

3. Card Data Syncing:
   - Moxfield/Scryfall sync issues
   - Multiple printings of same card
   - Special card layouts (split cards, transforming, etc.)

## Frontend Implementation Details

### Home Page (/)
**v1** Features:
- Commander leaderboard by win rate
- Color identity meta breakdown (pie chart)
- Color identity win rates (pie chart)
- Recent tournament results table
- Win rate by seat position (bar chart)
- User-customizable dashboard (future)

### Commander Pages
**v1** Features for /commanders/[commanderId]:
- Comprehensive stats:
  - Win rate, draw rate
  - Tournament performance (wins, top 4/8/16)
  - Sample size (decks, players)
- Time series:
  - Win rate over time
  - Popularity trends
- Analysis:
  - Seat position performance
  - Matchup data
  - Top pilots

**v1** Features for /commanders/[commanderId]/cards:
- Card type tables with pagination
- Global search affecting all tables
- Advanced filtering/sorting
- Staple vs synergy analysis
- Performance metrics by popularity

### Player Pages
**v1** Features:
- Complete tournament history
- Deck performance tracking
- Time-based analytics
- First/last seen dates

Note: Anonymous players won't have dedicated pages

### Tournament Pages
**v1** Features:
- Full round/table information
- Deck registration details
- Complete standings
- Need to handle non-standard table sizes

## Known Gaps and TODOs

1. Data Ingestion
- [ ] Define ETL pipeline architecture
- [ ] Specify data validation rules
- [ ] Document rate limiting
- [ ] Error handling procedures

2. API Design
- [ ] Finalize technology choice
- [ ] Define endpoints
- [ ] Authentication/authorization
- [ ] Rate limiting strategy
- [ ] Caching implementation

3. Database Schema
- [ ] Complete schema design
- [ ] Define indexes
- [ ] Optimize for TimescaleDB
- [ ] Document relationships

4. ETL Process
- [ ] Data normalization rules
- [ ] Edge case handling
- [ ] Conflict resolution
- [ ] Update procedures

## Open Questions
- Do we need separate /deck and /deck/[deckId] routes? How do these differ from commander pages?
- How do we handle data aggregation for anonymous players?
- What's the best way to normalize card data across different printings?