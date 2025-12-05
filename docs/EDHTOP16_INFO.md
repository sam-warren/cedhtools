# EDHTop16 Application: Complete Data Flow Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Data Sources](#2-data-sources)
3. [Database Schema](#3-database-schema)
4. [Data Ingestion Pipeline](#4-data-ingestion-pipeline)
5. [GraphQL API Layer](#5-graphql-api-layer)
6. [Frontend Data Consumption](#6-frontend-data-consumption)
7. [Card Win Rate Statistics](#7-card-win-rate-statistics)

---

## 1. Overview

EDHTop16 is a competitive EDH (Commander) tournament statistics application that:

- **Ingests** tournament data from TopDeck.gg API
- **Enriches** card data using Scryfall's bulk data API
- **Stores** normalized data in SQLite
- **Serves** statistics via GraphQL API
- **Renders** a React SSR frontend with Relay for data fetching

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW OVERVIEW                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐                                        │
│  │ TopDeck.gg  │     │  Scryfall   │                                        │
│  │    API      │     │  Bulk Data  │                                        │
│  └──────┬──────┘     └──────┬──────┘                                        │
│         │                   │                                                │
│         ▼                   ▼                                                │
│  ┌──────────────────────────────────────┐                                   │
│  │     scripts/pull-database.ts         │  ◀── Nightly GitHub Action        │
│  │  ┌──────────────────────────────┐    │                                   │
│  │  │  TopDeckClient               │    │                                   │
│  │  │  - listTournaments()         │    │                                   │
│  │  │  - tournaments.load(TID)     │    │                                   │
│  │  │  - players.loadMany(ids)     │    │                                   │
│  │  └──────────────────────────────┘    │                                   │
│  │  ┌──────────────────────────────┐    │                                   │
│  │  │  ScryfallDatabase            │    │                                   │
│  │  │  - cardByOracleId            │    │                                   │
│  │  │  - cardByName                │    │                                   │
│  │  │  - cardByScryfallId          │    │                                   │
│  │  └──────────────────────────────┘    │                                   │
│  └──────────────────┬───────────────────┘                                   │
│                     │                                                        │
│                     ▼                                                        │
│  ┌──────────────────────────────────────┐                                   │
│  │         SQLite (edhtop16.db)         │                                   │
│  │  ┌────────────┐  ┌────────────────┐  │                                   │
│  │  │ Tournament │  │    Player      │  │                                   │
│  │  │ Commander  │  │    Entry       │  │                                   │
│  │  │ Card       │  │  DecklistItem  │  │                                   │
│  │  └────────────┘  └────────────────┘  │                                   │
│  └──────────────────┬───────────────────┘                                   │
│                     │                                                        │
│                     ▼                                                        │
│  ┌──────────────────────────────────────┐                                   │
│  │     GraphQL API (Grats + Kysely)     │                                   │
│  │  src/lib/server/schema/*.ts          │                                   │
│  └──────────────────┬───────────────────┘                                   │
│                     │                                                        │
│                     ▼                                                        │
│  ┌──────────────────────────────────────┐                                   │
│  │   React Frontend (Relay + SSR)       │                                   │
│  │   src/pages/*.tsx                    │                                   │
│  └──────────────────────────────────────┘                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Sources

### 2.1 TopDeck.gg API

**Base URL:** `https://topdeck.gg/api/v2`

**Authentication:** API key passed via `Authorization` header (stored in `TOPDECK_GG_API_KEY` env var)

**Endpoints Used:**

| Endpoint               | Method | Purpose                                       | Request Body                                                                                  |
| ---------------------- | ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/tournaments`         | POST   | List tournaments with filters                 | `{game: "Magic: The Gathering", format: "EDH", last: 5, columns: [...]}` |
| `/tournaments/{TID}`   | GET    | Get detailed tournament data                  | —                                                                                             |
| `/player?id=...&id=...` | GET    | Batch fetch player profiles                   | —                                                                                             |

**Data Schemas (Zod validated):**

```typescript
// Tournament list item (from POST /tournaments)
{
  TID: string,              // Unique tournament ID
  tournamentName: string,
  swissNum: number,         // Number of swiss rounds
  startDate: number,        // Unix timestamp
  topCut: number,           // Top cut size (e.g., 16)
  standings: [{
    id: string,             // Player's TopDeck profile ID
    winsSwiss: number,
    winsBracket: number,
    draws: number,
    lossesSwiss: number,
    lossesBracket: number,
    byes: number
  }]
}

// Tournament detail (from GET /tournaments/{TID})
{
  data: { name, game, format, startDate },
  standings: [{
    name: string,           // Player name
    id: string,             // Profile ID
    decklist: string | null, // URL to decklist
    deckObj: {              // Parsed decklist object
      Commanders: Record<string, {id: string, count: number}>,
      Mainboard: Record<string, {id: string, count: number}>,
      metadata: { game, format, importedFrom? }
    } | null,
    standing: number,
    points: number,
    winRate?: number,
    opponentWinRate?: number
  }]
}

// Player profile (from GET /player)
{
  id: string,
  name?: string,
  username?: string,
  pronouns?: string,
  profileImage?: string,
  elo?: number,
  gamesPlayed?: number
}
```

### 2.2 Scryfall API

**Bulk Data URL:** `https://api.scryfall.com/bulk-data`

The application downloads the `oracle_cards` bulk data export (a JSON file ~150MB containing all unique Magic cards). This is cached locally as `oracle_cards.scryfall.json`.

**Card Schema Used:**

```typescript
{
  id: string,           // Scryfall ID
  oracle_id: string,    // Oracle ID (stable across printings)
  name: string,
  color_identity: string[],  // ['W', 'U', 'B', 'R', 'G']
  cmc: number,
  type_line: string,
  scryfall_uri: string,
  image_uris?: {
    art_crop: string,
    normal: string
  },
  card_faces?: [...]    // For double-faced cards
}
```

---

## 3. Database Schema

**Database:** SQLite (`edhtop16.db`) using Better-SQLite3 + Kysely

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   Tournament    │       │     Player      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ TID (unique)    │       │ name            │
│ name            │       │ topdeckProfile  │
│ tournamentDate  │       │   (unique)      │
│ size            │       └────────┬────────┘
│ swissRounds     │                │
│ topCut          │                │
│ bracketUrl      │                │
└────────┬────────┘                │
         │                         │
         │    ┌────────────────────┴─────────────────┐
         │    │                                      │
         ▼    ▼                                      │
┌─────────────────────────────────────┐             │
│              Entry                   │             │
├─────────────────────────────────────┤             │
│ id (PK)                             │             │
│ tournamentId (FK → Tournament)      │◀────────────┘
│ playerId (FK → Player)              │
│ commanderId (FK → Commander)        │
│ standing                            │
│ winsSwiss, winsBracket              │
│ lossesSwiss, lossesBracket          │
│ draws                               │
│ decklist (URL)                      │
├─────────────────────────────────────┤
│ UNIQUE(tournamentId, playerId)      │
└────────────────┬────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌─────────────────┐   ┌──────────────────────┐
│   Commander     │   │    DecklistItem      │
├─────────────────┤   ├──────────────────────┤
│ id (PK)         │   │ entryId (FK → Entry) │
│ name (unique)   │   │ cardId (FK → Card)   │
│ colorId         │   │ count                │
│ ("WUBRG" style) │   └──────────┬───────────┘
└─────────────────┘              │
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │        Card         │
                    ├─────────────────────┤
                    │ id (PK)             │
                    │ oracleId (unique)   │
                    │ name                │
                    │ data (JSON blob)    │  ◀── Full Scryfall card data
                    │ playRateLastYear    │  ◀── Calculated field
                    └─────────────────────┘
```

### Table Definitions

```sql
-- Tournament: Stores tournament metadata
CREATE TABLE Tournament (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  TID TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tournamentDate TEXT NOT NULL,  -- ISO 8601
  size INTEGER NOT NULL,
  swissRounds INTEGER NOT NULL,
  topCut INTEGER NOT NULL,
  bracketUrl TEXT
);

-- Player: Stores player information
CREATE TABLE Player (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  topdeckProfile TEXT UNIQUE
);

-- Commander: Normalized commander combinations
CREATE TABLE Commander (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,     -- "Tymna the Weaver / Thrasios, Triton Hero"
  colorId TEXT NOT NULL          -- "WUBG" (WUBRG order)
);

-- Entry: Individual tournament entries (one per player per tournament)
CREATE TABLE Entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournamentId INTEGER NOT NULL REFERENCES Tournament(id),
  playerId INTEGER NOT NULL REFERENCES Player(id),
  commanderId INTEGER NOT NULL REFERENCES Commander(id),
  standing INTEGER NOT NULL,
  winsSwiss INTEGER NOT NULL,
  winsBracket INTEGER NOT NULL,
  lossesSwiss INTEGER NOT NULL,
  lossesBracket INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  decklist TEXT,
  UNIQUE(tournamentId, playerId)
);

-- Card: Magic cards enriched with Scryfall data
CREATE TABLE Card (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oracleId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,              -- Full Scryfall JSON
  playRateLastYear REAL            -- Calculated: % of decks playing this card
);

-- DecklistItem: Many-to-many between Entry and Card
CREATE TABLE DecklistItem (
  entryId INTEGER NOT NULL REFERENCES Entry(id),
  cardId INTEGER NOT NULL REFERENCES Card(id),
  count INTEGER NOT NULL DEFAULT 1
);
```

---

## 4. Data Ingestion Pipeline

**Entry Point:** `scripts/pull-database.ts`

**Trigger:** GitHub Actions workflow runs nightly at 3:30 UTC, or manually via `pnpm run generate:db`

### Step-by-Step Flow

#### Step 1: Initialize Scryfall Database

```typescript
const oracleCards = await ScryfallDatabase.create('oracle_cards');
```

1. Check if `oracle_cards.scryfall.json` exists locally
2. If not, fetch bulk data URL from `https://api.scryfall.com/bulk-data`
3. Download the `oracle_cards` JSON file (~150MB)
4. Parse JSON and build lookup maps:
   - `cardByOracleId: Map<string, ScryfallCard>`
   - `cardByName: Map<string, ScryfallCard>`
   - `cardByScryfallId: Map<string, ScryfallCard>`

#### Step 2: Fetch Tournaments from TopDeck

```typescript
const tournaments = await topdeckClient.listTournaments({
  last: 5, // Last 5 days of tournaments
});
```

POST to `/tournaments` with:

```json
{
  "game": "Magic: The Gathering",
  "format": "EDH",
  "last": 5,
  "columns": [
    "id",
    "winsSwiss",
    "winsBracket",
    "draws",
    "lossesSwiss",
    "lossesBracket",
    "byes"
  ]
}
```

Returns array of tournament summaries with standings.

#### Step 3: Create/Update Tournament Records

```typescript
async function createTournaments(tournaments) {
  return db
    .insertInto('Tournament')
    .values(
      tournaments.map((t) => ({
        TID: t.TID,
        name: t.tournamentName,
        tournamentDate: new Date(t.startDate * 1000).toISOString(),
        size: t.standings.length,
        swissRounds: t.swissNum,
        topCut: t.topCut,
        bracketUrl: `https://topdeck.gg/bracket/${t.TID}`,
      })),
    )
    .onConflict((oc) =>
      oc.column('TID').doUpdateSet({TID: (eb) => eb.ref('excluded.TID')}),
    )
    .returning(['id', 'TID'])
    .execute();
}
```

**Upsert logic:** If tournament with same TID exists, update it; otherwise insert.

#### Step 4: Create/Update Player Records

```typescript
async function createPlayers(tournaments) {
  // 1. Collect all unique player IDs from standings
  const playerIds = new Set(
    tournaments.flatMap((t) => t.standings.map((s) => s.id)),
  );

  // 2. Batch fetch player profiles from TopDeck API (batched via Dataloader)
  const players = await topdeckClient.players.loadMany(Array.from(playerIds));

  // 3. Upsert into database
  return db
    .insertInto('Player')
    .values(
      players.map((p) => ({
        name: p.name ?? 'Unknown Player',
        topdeckProfile: p.id,
      })),
    )
    .onConflict((oc) =>
      oc.column('topdeckProfile').doUpdateSet((eb) => ({
        name: eb.ref('excluded.name'),
      })),
    )
    .returning(['id', 'topdeckProfile'])
    .execute();
}
```

#### Step 5: Create Commanders (with Scryfall Enrichment)

```typescript
async function createCommanders(tournaments, oracleCards) {
  // 1. Fetch detailed tournament data (includes decklists)
  const tournamentDetails = await topdeckClient.tournaments.loadMany(
    tournaments.map((t) => t.TID),
  );

  // 2. Extract commander info and calculate color identity
  const commanders = tournamentDetails.flatMap((t) =>
    t.standings.map((s) => ({
      // Sort commander names alphabetically and join with " / "
      name: Object.keys(s.deckObj?.Commanders ?? {})
        .sort()
        .join(' / '),
      // Calculate WUBRG color identity from Scryfall data
      colorId: wubrgify(
        Object.values(s.deckObj?.Commanders ?? {}).flatMap(
          (c) => oracleCards.cardByScryfallId.get(c.id)?.color_identity ?? [],
        ),
      ),
    })),
  );

  // 3. Upsert commanders
  return db
    .insertInto('Commander')
    .values(commanders)
    .onConflict((oc) =>
      oc.column('name').doUpdateSet({name: (eb) => eb.ref('excluded.name')}),
    )
    .returning(['name', 'id'])
    .execute();
}

// Helper: Convert color array to canonical WUBRG string
function wubrgify(colorIdentity: string[]): string {
  let buf = '';
  if (colorIdentity.includes('W')) buf += 'W';
  if (colorIdentity.includes('U')) buf += 'U';
  if (colorIdentity.includes('B')) buf += 'B';
  if (colorIdentity.includes('R')) buf += 'R';
  if (colorIdentity.includes('G')) buf += 'G';
  return buf.length === 0 ? 'C' : buf;
}
```

**Key insight:** Commander names are normalized by sorting alphabetically, so "Thrasios / Tymna" and "Tymna / Thrasios" become the same commander.

#### Step 6: Create Cards (with Scryfall Enrichment)

```typescript
async function createCards(tournaments, oracleCards) {
  // 1. Collect all Scryfall IDs from all decklists
  const mainDeckCardIds = new Set(
    tournamentDetails
      .flatMap((t) => t.standings)
      .flatMap((e) => [
        ...Object.values(e.deckObj?.Commanders ?? {}),
        ...Object.values(e.deckObj?.Mainboard ?? {}),
      ])
      .map((c) => c.id), // Scryfall ID
  );

  // 2. Look up each card in Scryfall database and insert
  return db
    .insertInto('Card')
    .values(
      Array.from(mainDeckCardIds)
        .map((id) => oracleCards.cardByOracleId.get(id)) // Get full Scryfall data
        .filter((c) => c != null)
        .map((c) => ({
          oracleId: c.oracle_id,
          name: c.name,
          data: JSON.stringify(c), // Store full Scryfall JSON
        })),
    )
    .onConflict((oc) =>
      oc.column('oracleId').doUpdateSet((eb) => ({
        name: eb.ref('excluded.name'),
        data: eb.ref('excluded.data'),
      })),
    )
    .returning(['id', 'oracleId'])
    .execute();
}
```

#### Step 7: Create Entry Records

```typescript
async function createEntries(
  tournaments,
  tournamentIdByTid,
  playerIdByProfile,
  commanderIdByName,
) {
  const entries = await Promise.all(
    tournaments.map(async (t) => {
      const tournamentDetails = await topdeckClient.tournaments.load(t.TID);

      return t.standings.map((s) => ({
        tournamentId: tournamentIdByTid.get(t.TID),
        playerId: playerIdByProfile.get(s.id),
        commanderId: commanderIdByName.get(
          commanderName(details?.deckObj?.Commanders),
        ),
        standing: details?.standing,
        decklist: `https://topdeck.gg/deck/${t.TID}/${s.id}`,
        draws: s.draws,
        winsBracket: s.winsBracket,
        winsSwiss: s.winsSwiss,
        lossesBracket: s.lossesBracket,
        lossesSwiss: s.lossesSwiss,
      }));
    }),
  );

  return db
    .insertInto('Entry')
    .values(entries.flat())
    .onConflict((oc) => oc.columns(['tournamentId', 'playerId']).doNothing())
    .returning(['id', 'playerId', 'tournamentId'])
    .execute();
}
```

#### Step 8: Create Decklist Items

```typescript
async function createDecklists(tournaments, cardIdByOracleId, entryIdLookup) {
  const decklistItems = await Promise.all(
    tournaments.map(async (t) => {
      const tournamentDetails = await topdeckClient.tournaments.load(t.TID);

      return t.standings.flatMap((s) => {
        const entryId = entryIdLookup(t.TID, s.id);
        if (!entryId) return [];

        // Map each mainboard card to a DecklistItem
        return Object.values(details?.deckObj?.Mainboard ?? {}).map(
          ({id: oracleId, count}) => ({
            cardId: cardIdByOracleId.get(oracleId),
            entryId,
            count,
          }),
        );
      });
    }),
  );

  // Batch insert (SQLite limit: 999 variables per query)
  await chunkedWorkerPool(
    decklistItems.flat(),
    async (chunk) => {
      await db
        .insertInto('DecklistItem')
        .values(chunk)
        .onConflict((oc) => oc.doNothing())
        .execute();
    },
    {chunkSize: 300, workers: 1},
  );
}
```

#### Step 9: Calculate Play Rates

```typescript
async function addCardPlayRates() {
  const oneYearAgo = subYears(new Date(), 1).toISOString();

  for (const {id: cardId} of await db
    .selectFrom('Card')
    .select('id')
    .execute()) {
    const card = await getCard(cardId);
    const colorId = parseColorIdentity(card.data);

    // Get total entries for this color identity in last year
    const totalPossibleEntries = await getEntriesForColorId(colorId, oneYearAgo);

    // Get entries that played this specific card
    const entriesWithCard = await getEntriesForCard(cardId, oneYearAgo);

    // Calculate and store play rate
    await setCardPlayRate(cardId, entriesWithCard / totalPossibleEntries);
  }
}
```

**Play rate formula:** `playRateLastYear = (entries containing card) / (total entries in matching color identity)`

---

## 5. GraphQL API Layer

**Technology:** Grats (annotation-based GraphQL) + Kysely (type-safe SQL)

**Schema location:** `src/lib/server/schema/*.ts`

### Key Query Types

#### Tournaments

```graphql
query {
  tournaments(
    first: 20
    after: "cursor"
    filters: {timePeriod: ONE_MONTH, minSize: 60, maxSize: 200}
    sortBy: DATE # or PLAYERS
  ) {
    edges {
      node {
        TID
        name
        size
        tournamentDate
        topCut
        bracketUrl
        entries {
          ...
        }
        breakdown {
          ...
        } # Commander statistics for this tournament
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Commanders

```graphql
query {
  commanders(
    first: 20
    timePeriod: THREE_MONTHS
    sortBy: CONVERSION # POPULARITY, TOP_CUTS
    minEntries: 10
    colorId: "UBR"
  ) {
    edges {
      node {
        name
        colorId
        breakdownUrl
        cards {
          ...
        } # Commander cards themselves
        staples {
          ...
        } # Most played cards in this commander
        entries {
          ...
        } # Tournament entries
        stats(filters: {timePeriod: THREE_MONTHS}) {
          count
          topCuts
          conversionRate
          metaShare
        }
      }
    }
  }
}
```

#### Cards

```graphql
query {
  card(name: "Mana Crypt") {
    name
    oracleId
    cmc
    colorId
    type
    imageUrls
    scryfallUrl
    playRateLastYear
    entries(filters: {commanderName: "Kinnan, Bonder Prodigy"}) {
      edges {
        node {
          ...
        }
      }
    }
  }
}
```

### Statistics Calculations (Server-Side)

#### Commander Conversion Rate

```sql
SELECT
  Commander.id,
  COUNT(Entry.id) as count,
  SUM(CASE WHEN Entry.standing <= Tournament.topCut THEN 1 ELSE 0 END) as topCuts,
  CAST(SUM(CASE WHEN Entry.standing <= Tournament.topCut THEN 1 ELSE 0 END) AS REAL)
    / COUNT(Entry.id) as conversionRate
FROM Commander
LEFT JOIN Entry ON Entry.commanderId = Commander.id
LEFT JOIN Tournament ON Tournament.id = Entry.tournamentId
WHERE Tournament.tournamentDate >= ?
  AND Tournament.size >= ?
GROUP BY Commander.id
```

---

## 6. Frontend Data Consumption

**Technology:** React 19 + Relay + SSR

**Flow:**

1. React components define GraphQL queries using Relay's `graphql` tagged template
2. Relay compiler generates query artifacts → `__generated__/queries/`
3. Persisted queries saved to `__generated__/router/persisted_queries.json`
4. Server renders initial HTML with data
5. Client hydrates and makes subsequent queries via Relay

---

## 7. Card Win Rate Statistics

The application includes functionality to compare conversion rates for commanders playing specific cards vs. not playing them.

**Implementation:** `src/lib/server/schema/commander.ts` - `cardWinrateStats` method

```typescript
/** @gqlField */
async cardWinrateStats(
  cardName?: string | null,
  timePeriod: TimePeriod = TimePeriod.THREE_MONTHS,
): Promise<CommanderCardWinrateStats> {
  const minDate = minDateFromTimePeriod(timePeriod);

  // Get card ID
  const card = await db
    .selectFrom('Card')
    .where('name', '=', cardName)
    .select('id')
    .executeTakeFirst();

  // Entries WITH the card
  const withCardStats = await db
    .selectFrom('Entry')
    .innerJoin('DecklistItem', 'DecklistItem.entryId', 'Entry.id')
    .innerJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
    .where('Entry.commanderId', '=', this.id)
    .where('DecklistItem.cardId', '=', card.id)
    .where('Tournament.tournamentDate', '>=', minDate.toISOString())
    .select((eb) => [
      eb.fn.count<number>('Entry.id').as('totalEntries'),
      eb.fn
        .sum<number>(
          eb
            .case()
            .when('Entry.standing', '<=', eb.ref('Tournament.topCut'))
            .then(1)
            .else(0)
            .end(),
        )
        .as('topCuts'),
    ])
    .executeTakeFirstOrThrow();

  // Entries WITHOUT the card (LEFT JOIN + WHERE cardId IS NULL)
  const withoutCardStats = await db
    .selectFrom('Entry')
    .leftJoin('DecklistItem', (join) =>
      join
        .onRef('DecklistItem.entryId', '=', 'Entry.id')
        .on('DecklistItem.cardId', '=', card.id),
    )
    .innerJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
    .where('Entry.commanderId', '=', this.id)
    .where('DecklistItem.cardId', 'is', null) // Card NOT in deck
    .where('Tournament.tournamentDate', '>=', minDate.toISOString())
    .select(/* same as above */)
    .executeTakeFirstOrThrow();

  return {
    withCard: {
      totalEntries: withCardStats.totalEntries,
      topCuts: withCardStats.topCuts || 0,
      conversionRate: withCardStats.topCuts / withCardStats.totalEntries,
    },
    withoutCard: {
      totalEntries: withoutCardStats.totalEntries,
      topCuts: withoutCardStats.topCuts || 0,
      conversionRate: withoutCardStats.topCuts / withoutCardStats.totalEntries,
    },
  };
}
```

### GraphQL Query Example

```graphql
query {
  commander(name: "Kinnan, Bonder Prodigy") {
    cardWinrateStats(cardName: "Mana Crypt", timePeriod: THREE_MONTHS) {
      withCard {
        totalEntries
        topCuts
        conversionRate
      }
      withoutCard {
        totalEntries
        topCuts
        conversionRate
      }
    }
  }
}
```

### Response Example

```json
{
  "data": {
    "commander": {
      "cardWinrateStats": {
        "withCard": {
          "totalEntries": 145,
          "topCuts": 42,
          "conversionRate": 0.289
        },
        "withoutCard": {
          "totalEntries": 23,
          "topCuts": 4,
          "conversionRate": 0.174
        }
      }
    }
  }
}
```

This tells you that Kinnan decks with Mana Crypt have a 28.9% top cut rate vs 17.4% without it.

### Note on "Win Rate" vs "Conversion Rate"

The existing implementation calculates **conversion rate** (made top cut / total entries), not actual game win rate. The data model _does_ store individual game wins/losses per entry (`winsSwiss`, `winsBracket`, etc.), so you could calculate actual win rates if needed by modifying the query to sum those fields instead of counting top cuts.

