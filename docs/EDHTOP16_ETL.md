# TopDeck.gg Data Pipeline: Complete Technical Specification

## Purpose

This document provides a complete, self-contained specification for rebuilding the EDHTop16 data ingestion pipeline from scratch. It covers all aspects of fetching data from the TopDeck.gg API, storing it, and calculating statistics including the critical **conversion rate** metric.

---

## Table of Contents

1. [Overview](#1-overview)
2. [TopDeck.gg API Specification](#2-topdeckgg-api-specification)
3. [Scryfall Integration](#3-scryfall-integration)
4. [Database Schema](#4-database-schema)
5. [Data Ingestion Pipeline](#5-data-ingestion-pipeline)
6. [Conversion Rate Calculation](#6-conversion-rate-calculation)
7. [Other Calculated Statistics](#7-other-calculated-statistics)
8. [Operational Details](#8-operational-details)

---

## 1. Overview

### What This System Does

The pipeline:

1. **Fetches** EDH (Commander) tournament data from TopDeck.gg's API
2. **Enriches** card data with Scryfall's bulk card database
3. **Normalizes** the data into a relational SQLite database
4. **Calculates** statistics like conversion rate, win rate, meta share, and card play rates
5. **Serves** the data via a GraphQL API for the frontend

### Core Concept: "Conversion Rate"

**Conversion rate** is the primary metric used to rank commander performance. It measures how often a commander "converts" from being played in a tournament to making the top cut.

```
Conversion Rate = (Number of top cut appearances) / (Total tournament entries)
```

For example, if a commander was played 100 times across all tournaments and made top cut 25 times, its conversion rate is 0.25 (25%).

---

## 2. TopDeck.gg API Specification

### Base URL

```
https://topdeck.gg/api/v2
```

### Authentication

All requests require an API key passed via the `Authorization` header:

```http
Authorization: <TOPDECK_GG_API_KEY>
Accept: */*
User-Agent: edhtop16/2.0
```

The API key is stored in the `TOPDECK_GG_API_KEY` environment variable.

---

### Endpoint 1: List Tournaments (POST `/tournaments`)

Fetches a list of tournaments matching specified criteria.

#### Request

```http
POST /tournaments
Content-Type: application/json
Authorization: <API_KEY>

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

#### Request Parameters

| Field     | Type       | Description                                                |
| --------- | ---------- | ---------------------------------------------------------- |
| `game`    | `string`   | Always `"Magic: The Gathering"`                            |
| `format`  | `string`   | Always `"EDH"` for Commander                               |
| `last`    | `number`   | Number of days to look back (e.g., `5` for last 5 days)    |
| `tids`    | `string[]` | Optional: specific tournament IDs to fetch                 |
| `columns` | `string[]` | Which standings columns to include in response             |

**Note:** Either `last` or `tids` should be provided, not both. If importing specific tournaments, use `tids`. For incremental updates, use `last`.

#### Response Schema (Zod)

```typescript
const tournament = z.object({
  TID: z.string(),                    // Unique tournament identifier
  tournamentName: z.string(),         // Human-readable tournament name
  swissNum: z.number(),               // Number of swiss rounds played
  startDate: z.number(),              // Unix timestamp (seconds since epoch)
  game: z.string(),                   // "Magic: The Gathering"
  format: z.string(),                 // "EDH"
  averageElo: z.number().optional(),  // Average player ELO
  modeElo: z.number().optional(),     // Mode of player ELOs
  medianElo: z.number().optional(),   // Median player ELO
  topElo: z.number().optional(),      // Highest player ELO
  eventData: z.object({
    lat: z.number().optional(),       // Venue latitude
    lng: z.number().optional(),       // Venue longitude
    city: z.string().optional(),
    state: z.string().optional(),
    location: z.string().optional(),
    headerImage: z.string().optional(),
  }),
  topCut: z.number(),                 // Number of players who made top cut
  standings: z.array(
    z.object({
      id: z.string(),                 // Player's TopDeck profile ID
      winsSwiss: z.number().int(),    // Wins during swiss rounds
      winsBracket: z.number().int(),  // Wins during bracket/top cut
      draws: z.number().int(),        // Draw count
      lossesSwiss: z.number().int(),  // Losses during swiss
      lossesBracket: z.number().int(),// Losses during bracket
      byes: z.number().int(),         // Bye count
    }),
  ),
});
```

#### Response Example

```json
[
  {
    "TID": "abc123xyz",
    "tournamentName": "The Command Zone 2024",
    "swissNum": 5,
    "startDate": 1701388800,
    "game": "Magic: The Gathering",
    "format": "EDH",
    "topCut": 16,
    "eventData": {
      "city": "Las Vegas",
      "state": "NV"
    },
    "standings": [
      {
        "id": "player-profile-id-1",
        "winsSwiss": 4,
        "winsBracket": 3,
        "draws": 0,
        "lossesSwiss": 1,
        "lossesBracket": 1,
        "byes": 0
      }
    ]
  }
]
```

---

### Endpoint 2: Get Tournament Details (GET `/tournaments/{TID}`)

Fetches detailed tournament data including decklists and final standings.

#### Request

```http
GET /tournaments/abc123xyz
Authorization: <API_KEY>
```

#### Response Schema (Zod)

```typescript
const tournamentDetail = z.object({
  data: z.object({
    name: z.string(),
    game: z.string(),
    format: z.string(),
    startDate: z.number(),
  }),
  standings: z.array(
    z.object({
      name: z.string(),                 // Player display name
      id: z.string(),                   // Player profile ID
      decklist: z.string().nullable(),  // URL to decklist (may be null)
      deckObj: z.object({
        Commanders: z.record(
          z.string(),                   // Card name as key
          z.object({
            id: z.string(),             // Scryfall ID of the card
            count: z.number()           // Always 1 for commanders
          })
        ),
        Mainboard: z.record(
          z.string(),                   // Card name as key
          z.object({
            id: z.string(),             // Scryfall ID
            count: z.number()           // Card count (usually 1 in EDH)
          })
        ),
        metadata: z.object({
          game: z.string(),
          format: z.string(),
          importedFrom: z.string().optional(),
        }),
      }).nullable(),
      standing: z.number(),             // Final placement (1 = winner)
      points: z.number(),               // Total points earned
      winRate: z.number().nullish(),    // Win rate (may not be present)
      opponentWinRate: z.number().nullish(),
    }),
  ),
});
```

#### Response Example

```json
{
  "data": {
    "name": "The Command Zone 2024",
    "game": "Magic: The Gathering",
    "format": "EDH",
    "startDate": 1701388800
  },
  "standings": [
    {
      "name": "PlayerOne",
      "id": "player-profile-id-1",
      "decklist": "https://moxfield.com/decks/xxxxx",
      "deckObj": {
        "Commanders": {
          "Tymna the Weaver": {
            "id": "bc7cbe9b-324e-42b8-94a8-fa2e0e5aad3f",
            "count": 1
          },
          "Thrasios, Triton Hero": {
            "id": "21e27b91-c7f1-4709-aa0d-8b5d81b22a0a",
            "count": 1
          }
        },
        "Mainboard": {
          "Mana Crypt": {
            "id": "4d960186-4559-4af0-bd22-63baa15f8939",
            "count": 1
          },
          "Sol Ring": {
            "id": "e672d408-997c-4a19-810a-3da8411eecf2",
            "count": 1
          }
        },
        "metadata": {
          "game": "Magic: The Gathering",
          "format": "EDH"
        }
      },
      "standing": 1,
      "points": 15,
      "winRate": 0.875
    }
  ]
}
```

#### Key Insight: Card IDs

The `id` field in `Commanders` and `Mainboard` is the **Scryfall ID** of the card, not the Oracle ID. This is important for lookups in the Scryfall database.

---

### Endpoint 3: Get Player Profiles (GET `/player`)

Batch fetches player profile information.

#### Request

```http
GET /player?id=profile-1&id=profile-2&id=profile-3
Authorization: <API_KEY>
```

**Note:** Multiple player IDs are passed as repeated `id` query parameters. The API has a batch limit; the pipeline uses a maximum batch size of 15.

#### Response Schema (Zod)

```typescript
const player = z.object({
  id: z.string(),                    // Profile ID
  name: z.string().nullish(),        // Display name
  username: z.string().nullish(),    // Username
  pronouns: z.string().nullish(),
  profileImage: z.string().nullish(),
  headerImage: z.string().nullish(),
  elo: z.number().nullish(),         // Player ELO rating
  gamesPlayed: z.number().nullish(),
  about: z.string().nullish(),
  twitter: z.string().nullish(),
  youtube: z.string().nullish(),
});
```

---

## 3. Scryfall Integration

### Purpose

The Scryfall bulk data is used to:

1. **Map Scryfall IDs to Oracle IDs** - Cards are stored by Oracle ID (stable across printings)
2. **Get card metadata** - Color identity, CMC, type line, images
3. **Calculate commander color identity** - Union of all commander cards' color identities
4. **Provide image URLs** - Scryfall CDN URLs are stored and served directly (no image hosting)

---

### Fetching Scryfall Bulk Data (Ingestion Time)

During the data pipeline run, Scryfall's bulk data is downloaded:

```http
GET https://api.scryfall.com/bulk-data
Accept: */*
User-Agent: edhtop16/2.0
```

#### Response Structure

```json
{
  "object": "list",
  "data": [
    {
      "object": "bulk_data",
      "type": "oracle_cards",
      "download_uri": "https://data.scryfall.io/oracle-cards/oracle-cards-20241205.json",
      "content_type": "application/json",
      "content_encoding": "gzip"
    }
  ]
}
```

The application uses the `oracle_cards` type which contains one entry per unique card (deduplicated across printings).

#### Download and Caching

```typescript
// From scripts/pull-database.ts
static async create(kind: 'default_cards' | 'oracle_cards') {
  const databaseFileName = `./${kind}.scryfall.json`;

  // Check if cached file exists
  try {
    await fs.access(databaseFileName, fs.constants.F_OK);
    // Use cached file
  } catch (e) {
    // Fetch bulk data URL
    const scryfallBulkDataResponse = await undici.request(
      'https://api.scryfall.com/bulk-data',
      { headers: { Accept: '*/*', 'User-Agent': 'edhtop16/2.0' } }
    );
    
    // Find download URL for oracle_cards
    const databaseUrl = scryfallBulkData.find(d => d.type === kind)?.download_uri;
    
    // Download and save to local file (~150MB)
    await undici.stream(databaseUrl, { method: 'GET' }, () =>
      createWriteStream(databaseFileName)
    );
  }

  // Parse JSON and return database instance
  const scryfallDatabaseJson = (await fs.readFile(databaseFileName)).toString();
  return new ScryfallDatabase(JSON.parse(scryfallDatabaseJson));
}
```

**Important:** The Scryfall bulk data file is cached locally as `oracle_cards.scryfall.json`. If this file exists, it won't be re-downloaded. Delete it to force a refresh.

---

### Scryfall Card Schema

The application uses Zod to validate Scryfall card data. Here's the complete schema:

```typescript
// From src/lib/server/scryfall.ts
const scryfallCardFaceSchema = z.object({
  image_uris: z.object({
    small: z.string(),      // ~146x204 JPG
    normal: z.string(),     // ~488x680 JPG  
    large: z.string(),      // ~672x936 JPG
    png: z.string(),        // ~745x1040 PNG with transparency
    art_crop: z.string(),   // Just the art, cropped
    border_crop: z.string() // Full card without border
  }).optional(),
});

const scryfallCardSchema = scryfallCardFaceSchema.extend({
  object: z.literal('card'),
  id: z.string().uuid(),              // Scryfall ID (printing-specific)
  oracle_id: z.string().uuid(),       // Oracle ID (stable across printings)
  name: z.string(),
  scryfall_uri: z.string().url(),     // Link to card on Scryfall
  card_faces: z.array(scryfallCardFaceSchema).optional(), // For DFCs/MDFCs
  cmc: z.number(),
  color_identity: z.array(z.string()), // ['W', 'U', 'B', 'R', 'G']
  type_line: z.string(),
});
```

---

### Building Lookup Maps (Ingestion Time)

The Scryfall database is loaded into memory with three lookup maps for fast access:

```typescript
// From scripts/pull-database.ts
private constructor(cards: ScryfallCard[]) {
  const cardByScryfallId = new Map<string, ScryfallCard>();
  const cardByOracleId = new Map<string, ScryfallCard>();
  const cardByName = new Map<string, ScryfallCard>();

  for (const card of cards) {
    cardByScryfallId.set(card.id, card);        // For TopDeck lookups
    cardByOracleId.set(card.oracle_id, card);   // For deduplication
    cardByName.set(card.name, card);            // For text searches
  }

  this.cardByScryfallId = cardByScryfallId;
  this.cardByOracleId = cardByOracleId;
  this.cardByName = cardByName;
}
```

---

### How Card Data is Stored

When cards are inserted into the database, the **entire Scryfall JSON** is stored in the `Card.data` column:

```typescript
// From scripts/pull-database.ts
await db.insertInto('Card')
  .values(
    Array.from(mainDeckCardIds)
      .map(id => oracleCards.cardByScryfallId.get(id))
      .filter(c => c != null)
      .map(c => ({
        oracleId: c.oracle_id,
        name: c.name,
        data: JSON.stringify(c),  // ← Full Scryfall JSON stored here
      }))
  )
```

This means:
- **No separate image hosting** - Image URLs point directly to Scryfall's CDN
- **All metadata preserved** - Type line, CMC, color identity, etc. are all in the JSON
- **Query-time parsing** - Metadata is extracted when cards are loaded

---

### How Card Metadata is Accessed (Runtime)

When a Card is instantiated at runtime, the JSON is parsed and validated:

```typescript
// From src/lib/server/schema/card.ts
export class Card implements GraphQLNode {
  private readonly scryfallData: ScryfallCard;

  constructor(private readonly row: Selectable<DB['Card']>) {
    this.id = row.id;
    this.name = row.name;
    this.oracleId = row.oracleId;
    // Parse the stored JSON blob on construction
    this.scryfallData = scryfallCardSchema.parse(JSON.parse(row.data));
  }

  /** @gqlField */
  cmc(): Int {
    return this.scryfallData.cmc;
  }

  /** @gqlField */
  colorId(): string {
    const colorIdentity = new Set(this.scryfallData.color_identity);
    let colorId: string = '';
    for (const c of ['W', 'U', 'B', 'R', 'G', 'C']) {
      if (colorIdentity.has(c)) colorId += c;
    }
    return colorId || 'C';
  }

  /** @gqlField */
  type(): string {
    return this.scryfallData.type_line;
  }
}
```

---

### How Images are Served

**Key insight:** The application does NOT host images. It stores Scryfall CDN URLs and serves them directly.

```typescript
// From src/lib/server/schema/card.ts

/**
 * URL's of art crops for each card face.
 * Returns Scryfall CDN URLs directly.
 * @gqlField
 */
imageUrls(): string[] {
  const card = this.scryfallData;
  // Handle double-faced cards (DFCs) - they have card_faces array
  const cardFaces = card.card_faces ? card.card_faces : [card];
  return cardFaces
    .map(c => c.image_uris?.art_crop)
    .filter((c): c is string => c != null);
}

/**
 * Image of the full front card face (normal size).
 * @gqlField
 */
cardPreviewImageUrl(): string | undefined {
  const card = this.scryfallData;
  const cardFaces = card.card_faces ? card.card_faces : [card];
  return cardFaces
    .map(c => c.image_uris?.normal)
    .filter((c): c is string => c != null)
    ?.at(0);
}

/**
 * Link to the card on Scryfall.
 * @gqlField
 */
scryfallUrl(): string {
  return this.scryfallData.scryfall_uri;
}
```

#### Image URL Examples

The stored URLs look like:

```
art_crop:    https://cards.scryfall.io/art_crop/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg
normal:      https://cards.scryfall.io/normal/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg
large:       https://cards.scryfall.io/large/front/4/d/4d960186-4559-4af0-bd22-63baa15f8939.jpg
```

#### Handling Double-Faced Cards

For modal double-faced cards (MDFCs) and transform cards, Scryfall stores images in a `card_faces` array:

```json
{
  "name": "Bala Ged Recovery // Bala Ged Sanctuary",
  "card_faces": [
    {
      "image_uris": {
        "art_crop": "https://cards.scryfall.io/.../front.jpg",
        "normal": "https://cards.scryfall.io/.../front.jpg"
      }
    },
    {
      "image_uris": {
        "art_crop": "https://cards.scryfall.io/.../back.jpg",
        "normal": "https://cards.scryfall.io/.../back.jpg"
      }
    }
  ]
}
```

The `imageUrls()` method handles this by checking for `card_faces` and returning all face images.

---

### GraphQL Schema for Card

The Card type exposes all Scryfall-derived fields via GraphQL:

```graphql
type Card {
  id: ID!
  name: String!
  oracleId: String!
  
  # Derived from stored Scryfall JSON:
  cmc: Int!
  colorId: String!
  type: String!
  imageUrls: [String!]!           # art_crop URLs for all faces
  cardPreviewImageUrl: String     # normal size front face
  scryfallUrl: String!            # Link to Scryfall page
  playRateLastYear: Float!        # Calculated field
  
  # Relationships:
  entries(first: Int, after: String, filters: CardEntriesFilters): EntryConnection!
}
```

### Frontend Usage Example

```tsx
// From src/staples.tsx
function StapleCard(props: { card: staples_StaplesCard$key }) {
  const card = useFragment(
    graphql`
      fragment staples_StaplesCard on Card {
        name
        type
        cmc
        colorId
        imageUrls      # ← Scryfall CDN URLs
        scryfallUrl
        playRateLastYear
      }
    `,
    props.card
  );

  return (
    <Card
      images={card.imageUrls.map((img: string) => ({
        src: img,  // ← Direct Scryfall CDN URL
        alt: `${card.name} card art`,
      }))}
    >
      <a href={card.scryfallUrl}>  {/* ← Link to Scryfall */}
        {card.name}
      </a>
    </Card>
  );
}
```

---

### Summary: Scryfall Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INGESTION TIME (nightly)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Check for cached oracle_cards.scryfall.json                        │
│     └── If missing: Download from Scryfall bulk-data API (~150MB)       │
│                                                                         │
│  2. Parse JSON into memory, build lookup maps                           │
│     ├── cardByScryfallId (for TopDeck ID lookups)                      │
│     ├── cardByOracleId (for deduplication)                             │
│     └── cardByName (for text lookups)                                  │
│                                                                         │
│  3. For each card in tournament decklists:                             │
│     └── Store full Scryfall JSON in Card.data column                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RUNTIME (per request)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Load Card row from SQLite                                          │
│                                                                         │
│  2. Parse Card.data JSON, validate against Zod schema                  │
│                                                                         │
│  3. Expose metadata via GraphQL fields:                                │
│     ├── cmc, colorId, type (from parsed JSON)                          │
│     ├── imageUrls (Scryfall CDN URLs from JSON)                        │
│     └── scryfallUrl (link to Scryfall page)                            │
│                                                                         │
│  4. Frontend renders images directly from Scryfall CDN                 │
│     (no proxying or hosting required)                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### Technology

- **Database:** SQLite (file: `edhtop16.db`)
- **ORM:** Kysely (type-safe SQL builder)
- **Driver:** Better-SQLite3

### Tables

#### Tournament

```sql
CREATE TABLE Tournament (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  TID TEXT UNIQUE NOT NULL,           -- TopDeck tournament ID
  name TEXT NOT NULL,                 -- Tournament name
  tournamentDate TEXT NOT NULL,       -- ISO 8601 timestamp
  size INTEGER NOT NULL,              -- Number of players
  swissRounds INTEGER NOT NULL,       -- Number of swiss rounds
  topCut INTEGER NOT NULL,            -- Size of top cut (e.g., 16)
  bracketUrl TEXT                     -- URL to bracket page
);
```

#### Player

```sql
CREATE TABLE Player (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                 -- Player display name
  topdeckProfile TEXT UNIQUE          -- TopDeck profile ID
);
```

#### Commander

```sql
CREATE TABLE Commander (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,          -- "Card1 / Card2" format, sorted alphabetically
  colorId TEXT NOT NULL               -- "WUBRG" subset, in WUBRG order
);
```

**Commander Name Format:** Multiple commanders are joined with ` / ` (space-slash-space), sorted alphabetically. Example: `"Tymna the Weaver / Thrasios, Triton Hero"` becomes `"Thrasios, Triton Hero / Tymna the Weaver"` after sorting.

#### Entry

```sql
CREATE TABLE Entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournamentId INTEGER NOT NULL REFERENCES Tournament(id),
  playerId INTEGER NOT NULL REFERENCES Player(id),
  commanderId INTEGER NOT NULL REFERENCES Commander(id),
  standing INTEGER NOT NULL,          -- Final placement (1-indexed)
  winsSwiss INTEGER NOT NULL,
  winsBracket INTEGER NOT NULL,
  lossesSwiss INTEGER NOT NULL,
  lossesBracket INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  decklist TEXT,                      -- URL to decklist
  UNIQUE(tournamentId, playerId)      -- One entry per player per tournament
);

CREATE UNIQUE INDEX Entry_tournamentId_playerId_key 
  ON Entry(tournamentId, playerId);
```

#### Card

```sql
CREATE TABLE Card (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oracleId TEXT UNIQUE NOT NULL,      -- Scryfall Oracle ID
  name TEXT NOT NULL,                 -- Card name
  data TEXT NOT NULL,                 -- Full Scryfall JSON blob
  playRateLastYear REAL               -- Calculated: % of eligible decks playing this card
);
```

#### DecklistItem

```sql
CREATE TABLE DecklistItem (
  entryId INTEGER NOT NULL REFERENCES Entry(id),
  cardId INTEGER NOT NULL REFERENCES Card(id),
  count INTEGER NOT NULL DEFAULT 1    -- Usually 1 in EDH
);
```

### Entity Relationships

```
Tournament 1──────────┐
                      │
                      ▼
Player 1──────────> Entry <────────── Commander 1
                      │
                      ▼
                DecklistItem
                      │
                      ▼
                    Card
```

---

## 5. Data Ingestion Pipeline

### Entry Point

```bash
pnpm run generate:db
# Executes: node --experimental-strip-types scripts/pull-database.ts
```

### Environment Variables

```
TOPDECK_GG_API_KEY=<your-api-key>
```

### Pipeline Steps

#### Step 1: Load Scryfall Database

```typescript
const oracleCards = await ScryfallDatabase.create('oracle_cards');
```

1. Check if `oracle_cards.scryfall.json` exists
2. If not, fetch bulk data URL from Scryfall API
3. Download and cache the JSON file (~150MB)
4. Parse and build lookup maps

#### Step 2: Fetch Recent Tournaments

```typescript
const tournaments = await topdeckClient.listTournaments({
  last: 5,  // Last 5 days
});
```

Or for specific tournaments:

```typescript
const tournaments = await topdeckClient.listTournaments({
  tids: ['tid1', 'tid2', 'tid3'],
});
```

#### Step 3: Create Tournament Records

```typescript
async function createTournaments(tournaments) {
  return db.insertInto('Tournament')
    .values(tournaments.map(t => ({
      TID: t.TID,
      name: t.tournamentName,
      tournamentDate: new Date(t.startDate * 1000).toISOString(),
      size: t.standings.length,
      swissRounds: t.swissNum,
      topCut: t.topCut,
      bracketUrl: `https://topdeck.gg/bracket/${t.TID}`,
    })))
    .onConflict(oc => oc.column('TID').doUpdateSet({
      TID: eb => eb.ref('excluded.TID'),
    }))
    .returning(['id', 'TID'])
    .execute();
}
```

**Upsert Behavior:** If a tournament with the same TID exists, it's updated.

#### Step 4: Create Player Records

```typescript
async function createPlayers(tournaments) {
  // 1. Collect unique player IDs from all standings
  const playerIds = new Set(
    tournaments.flatMap(t => t.standings.map(s => s.id))
  );

  // 2. Batch fetch profiles from TopDeck API
  const players = await topdeckClient.players.loadMany(Array.from(playerIds));

  // 3. Upsert into database
  return db.insertInto('Player')
    .values(players.map(p => ({
      name: p.name ?? 'Unknown Player',
      topdeckProfile: p.id,
    })))
    .onConflict(oc => oc.column('topdeckProfile').doUpdateSet(eb => ({
      name: eb.ref('excluded.name'),
    })))
    .returning(['id', 'topdeckProfile'])
    .execute();
}
```

#### Step 5: Create Commander Records

```typescript
async function createCommanders(tournaments, oracleCards) {
  // Fetch detailed tournament data (includes decklists)
  const tournamentDetails = await topdeckClient.tournaments.loadMany(
    tournaments.map(t => t.TID)
  );

  const commanders = tournamentDetails
    .flatMap(t => t.standings.map(s => ({
      // Sort commander names alphabetically and join
      name: commanderName(s.deckObj?.Commanders),
      // Calculate color identity from Scryfall data
      colorId: wubrgify(
        Object.values(s.deckObj?.Commanders ?? {}).flatMap(c =>
          oracleCards.cardByScryfallId.get(c.id)?.color_identity ?? []
        )
      ),
    })));

  return db.insertInto('Commander')
    .values(commanders)
    .onConflict(oc => oc.column('name').doUpdateSet({
      name: eb => eb.ref('excluded.name'),
    }))
    .returning(['name', 'id'])
    .execute();
}

// Helper: Create canonical commander name
function commanderName(commanders: Record<string, unknown> = {}) {
  return Object.keys(commanders).sort().join(' / ');
}

// Helper: Convert color array to WUBRG string
function wubrgify(colorIdentity: string[]): string {
  let buf = '';
  if (colorIdentity.includes('W')) buf += 'W';
  if (colorIdentity.includes('U')) buf += 'U';
  if (colorIdentity.includes('B')) buf += 'B';
  if (colorIdentity.includes('R')) buf += 'R';
  if (colorIdentity.includes('G')) buf += 'G';
  return buf.length === 0 ? 'C' : buf;  // 'C' for colorless
}
```

**Key Insight:** Commander color identity is the union of all commander cards' color identities. For partner commanders, this means combining both cards' colors.

#### Step 6: Create Card Records

```typescript
async function createCards(tournaments, oracleCards) {
  const tournamentDetails = await topdeckClient.tournaments.loadMany(
    tournaments.map(t => t.TID)
  );

  // Collect all Scryfall IDs from all decklists
  const mainDeckCardIds = new Set(
    tournamentDetails
      .flatMap(t => t.standings)
      .flatMap(e => [
        ...Object.values(e.deckObj?.Commanders ?? {}),
        ...Object.values(e.deckObj?.Mainboard ?? {}),
      ])
      .map(c => c.id)  // Scryfall ID
  );

  // Look up each card in Scryfall database and insert
  return db.insertInto('Card')
    .values(
      Array.from(mainDeckCardIds)
        .map(id => oracleCards.cardByScryfallId.get(id))
        .filter(c => c != null)
        .map(c => ({
          oracleId: c.oracle_id,  // Use Oracle ID for storage
          name: c.name,
          data: JSON.stringify(c),  // Store full Scryfall JSON
        }))
    )
    .onConflict(oc => oc.column('oracleId').doUpdateSet(eb => ({
      name: eb.ref('excluded.name'),
      data: eb.ref('excluded.data'),
    })))
    .returning(['id', 'oracleId'])
    .execute();
}
```

**Key Insight:** TopDeck uses Scryfall IDs in decklists, but we store cards by Oracle ID for deduplication across printings.

#### Step 7: Create Entry Records

```typescript
async function createEntries(tournaments, tournamentIdByTid, playerIdByProfile, commanderIdByName) {
  const entries = await Promise.all(
    tournaments.map(async t => {
      const tournamentDetails = await topdeckClient.tournaments.load(t.TID);
      const standingDetailById = new Map(
        tournamentDetails.standings.map(s => [s.id, s])
      );

      return t.standings.map(s => {
        const details = standingDetailById.get(s.id);
        
        return {
          tournamentId: tournamentIdByTid.get(t.TID),
          playerId: playerIdByProfile.get(s.id),
          commanderId: commanderIdByName.get(
            commanderName(details?.deckObj?.Commanders)
          ),
          standing: details?.standing,
          decklist: `https://topdeck.gg/deck/${t.TID}/${s.id}`,
          draws: s.draws,
          winsBracket: s.winsBracket,
          winsSwiss: s.winsSwiss,
          lossesBracket: s.lossesBracket,
          lossesSwiss: s.lossesSwiss,
        };
      });
    })
  );

  return db.insertInto('Entry')
    .values(entries.flat())
    .onConflict(oc => oc.columns(['tournamentId', 'playerId']).doNothing())
    .returning(['id', 'playerId', 'tournamentId'])
    .execute();
}
```

**Key Data:** The Entry table stores `standing` which is used to determine if a player made top cut.

#### Step 8: Create Decklist Items

```typescript
async function createDecklists(tournaments, cardIdByOracleId, entryIdByTidAndProfile) {
  const decklistItems = await Promise.all(
    tournaments.map(async t => {
      const tournamentDetails = await topdeckClient.tournaments.load(t.TID);
      const standingDetailById = new Map(
        tournamentDetails.standings.map(s => [s.id, s])
      );

      return t.standings.flatMap(s => {
        const details = standingDetailById.get(s.id);
        const entryId = entryIdByTidAndProfile(t.TID, s.id);
        if (!entryId) return [];

        // Map each mainboard card to a DecklistItem
        return Object.values(details?.deckObj?.Mainboard ?? {}).map(
          ({ id: oracleId, count }) => ({
            cardId: cardIdByOracleId.get(oracleId),
            entryId,
            count,
          })
        );
      });
    })
  );

  // Batch insert with SQLite variable limit handling
  await chunkedWorkerPool(
    decklistItems.flat(),
    async chunk => {
      await db.insertInto('DecklistItem')
        .values(chunk)
        .onConflict(oc => oc.doNothing())
        .execute();
    },
    { chunkSize: 300, workers: 1 }  // SQLite limit: 999 vars per query
  );
}
```

#### Step 9: Calculate Play Rates

```typescript
async function addCardPlayRates() {
  const oneYearAgo = subYears(new Date(), 1).toISOString();
  const memoEntriesForColorId = new Map<string, number>();

  for (const { id: cardId } of await db.selectFrom('Card').select('id').execute()) {
    const card = await getCard(cardId);
    const cardColorId = parseColorIdentity(card.data);

    // Calculate color match pattern (WUBRG with wildcards)
    let colorIdMatch = '';
    if (cardColorId && cardColorId !== 'C') {
      for (const color of ['W', 'U', 'B', 'R', 'G']) {
        colorIdMatch += cardColorId.includes(color) ? color : '%';
      }
    } else {
      colorIdMatch = '%';  // Colorless cards can go in any deck
    }

    // Get total entries for matching color identity
    if (!memoEntriesForColorId.has(cardColorId)) {
      const total = await db.selectFrom('Entry as e')
        .leftJoin('Commander as c', 'c.id', 'e.commanderId')
        .leftJoin('Tournament as t', 't.id', 'e.tournamentId')
        .where('c.colorId', 'like', colorIdMatch)
        .where('c.colorId', '!=', 'N/A')
        .where('t.tournamentDate', '>=', oneYearAgo)
        .select(eb => eb.fn.countAll<number>().as('total'))
        .executeTakeFirst();
      
      memoEntriesForColorId.set(cardColorId, total?.total ?? 0);
    }

    // Get entries that actually played this card
    const entriesWithCard = await db.selectFrom('DecklistItem as di')
      .leftJoin('Entry as e', 'e.id', 'di.entryId')
      .leftJoin('Tournament as t', 't.id', 'e.tournamentId')
      .where('cardId', '=', cardId)
      .where('t.tournamentDate', '>=', oneYearAgo)
      .select(eb => eb.fn.countAll<number>().as('total'))
      .executeTakeFirst();

    // Calculate and store play rate
    const totalPossible = memoEntriesForColorId.get(cardColorId) ?? 0;
    const playRate = totalPossible > 0 
      ? (entriesWithCard?.total ?? 0) / totalPossible 
      : 0;

    await db.updateTable('Card')
      .set({ playRateLastYear: playRate })
      .where('id', '=', cardId)
      .execute();
  }
}
```

**Play Rate Formula:**

```
Play Rate = (Entries containing card in last year) / (Total entries with matching color identity in last year)
```

---

## 6. Conversion Rate Calculation

### Definition

**Conversion rate** measures how often entries with a specific commander (or by a specific player) make the top cut of a tournament.

```
Conversion Rate = (Entries that made top cut) / (Total entries)
```

**"Making top cut"** means the entry's `standing` is less than or equal to the tournament's `topCut` value.

### Implementation: Commander Conversion Rate

The calculation is done at query time in the GraphQL resolvers:

```typescript
// From src/lib/server/schema/commander.ts
const statsQuery = await db
  .selectFrom('Commander')
  .leftJoin('Entry', 'Entry.commanderId', 'Commander.id')
  .leftJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
  .select([
    'Commander.id',
    (eb) => eb.fn.count<number>('Commander.id').as('count'),
    (eb) => eb.fn.sum<number>(
      eb.case()
        .when('Entry.standing', '<=', eb.ref('Tournament.topCut'))
        .then(1)
        .else(0)
        .end()
    ).as('topCuts'),
    (eb) => eb(
      eb.cast<number>(
        eb.fn.sum<number>(
          eb.case()
            .when('Entry.standing', '<=', eb.ref('Tournament.topCut'))
            .then(1)
            .else(0)
            .end()
        ),
        'real'
      ),
      '/',
      eb.fn.count<number>('Entry.id')
    ).as('conversionRate'),
  ])
  .where('Tournament.size', '>=', minSize)
  .where('Tournament.size', '<=', maxSize)
  .where('Tournament.tournamentDate', '>=', minDate.toISOString())
  .where('Tournament.tournamentDate', '<=', maxDate.toISOString())
  .where('Commander.id', 'in', commanderIds)
  .groupBy('Commander.id')
  .execute();
```

### SQL Equivalent

```sql
SELECT
  Commander.id,
  COUNT(Commander.id) AS count,
  SUM(CASE WHEN Entry.standing <= Tournament.topCut THEN 1 ELSE 0 END) AS topCuts,
  CAST(
    SUM(CASE WHEN Entry.standing <= Tournament.topCut THEN 1 ELSE 0 END) AS REAL
  ) / COUNT(Entry.id) AS conversionRate
FROM Commander
LEFT JOIN Entry ON Entry.commanderId = Commander.id
LEFT JOIN Tournament ON Tournament.id = Entry.tournamentId
WHERE Tournament.size >= :minSize
  AND Tournament.size <= :maxSize
  AND Tournament.tournamentDate >= :minDate
  AND Tournament.tournamentDate <= :maxDate
  AND Commander.id IN (:commanderIds)
GROUP BY Commander.id
```

### Implementation: Player Conversion Rate

```typescript
// From src/lib/server/schema/player.ts
async conversionRate(): Promise<Float> {
  const { conversionRate } = await db
    .selectFrom('Entry')
    .leftJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
    .select((eb) =>
      eb(
        eb.cast<number>(
          eb.fn.sum<number>(
            eb.case()
              .when('Entry.standing', '<=', eb.ref('Tournament.topCut'))
              .then(1)
              .else(0)
              .end()
          ),
          'real'
        ),
        '/',
        eb.fn.count<number>('Entry.id')
      ).as('conversionRate')
    )
    .where('Entry.playerId', '=', this.id)
    .executeTakeFirstOrThrow();

  return conversionRate;
}
```

### Implementation: Tournament Breakdown (Per-Commander Stats)

```typescript
// From src/lib/server/schema/tournament.ts
async breakdown(): Promise<TournamentBreakdownGroup[]> {
  const groups = await sql<{
    commanderId: number;
    topCuts: number;
    entries: number;
    conversionRate: number;
  }>`
    SELECT
      e."commanderId",
      COUNT(e."commanderId") AS entries,
      SUM(CASE WHEN e.standing <= t."topCut" THEN 1 ELSE 0 END) AS "topCuts",
      SUM(CASE WHEN e.standing <= t."topCut" THEN 1.0 ELSE 0.0 END) / COUNT(e.id) AS "conversionRate"
    FROM "Entry" AS e
    LEFT JOIN "Tournament" t ON t.id = e."tournamentId"
    LEFT JOIN "Commander" c ON c.id = e."commanderId"
    WHERE t."id" = ${this.id}
    AND c.name != 'Unknown Commander'
    GROUP BY e."commanderId"
    ORDER BY "topCuts" DESC, entries DESC
  `.execute(db);

  return groups.rows.map(r => new TournamentBreakdownGroup(
    r.commanderId,
    r.topCuts,
    r.entries,
    r.conversionRate,
  ));
}
```

### Implementation: Card Win Rate Comparison

Compares conversion rate when a card is played vs. when it's not:

```typescript
// From src/lib/server/schema/commander.ts
async cardWinrateStats(
  cardName?: string | null,
  timePeriod: TimePeriod = TimePeriod.THREE_MONTHS,
): Promise<CommanderCardWinrateStats> {
  const minDate = minDateFromTimePeriod(timePeriod);
  const card = await db.selectFrom('Card')
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
      eb.fn.sum<number>(
        eb.case()
          .when('Entry.standing', '<=', eb.ref('Tournament.topCut'))
          .then(1)
          .else(0)
          .end()
      ).as('topCuts'),
    ])
    .executeTakeFirstOrThrow();

  // Entries WITHOUT the card
  const withoutCardStats = await db
    .selectFrom('Entry')
    .leftJoin('DecklistItem', join =>
      join
        .onRef('DecklistItem.entryId', '=', 'Entry.id')
        .on('DecklistItem.cardId', '=', card.id)
    )
    .innerJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
    .where('Entry.commanderId', '=', this.id)
    .where('DecklistItem.cardId', 'is', null)  // LEFT JOIN + IS NULL = NOT EXISTS
    .where('Tournament.tournamentDate', '>=', minDate.toISOString())
    .select(/* same as above */)
    .executeTakeFirstOrThrow();

  return {
    withCard: {
      totalEntries: withCardStats.totalEntries,
      topCuts: withCardStats.topCuts || 0,
      conversionRate: withCardStats.totalEntries > 0
        ? (withCardStats.topCuts || 0) / withCardStats.totalEntries
        : 0,
    },
    withoutCard: {
      totalEntries: withoutCardStats.totalEntries,
      topCuts: withoutCardStats.topCuts || 0,
      conversionRate: withoutCardStats.totalEntries > 0
        ? (withoutCardStats.topCuts || 0) / withoutCardStats.totalEntries
        : 0,
    },
  };
}
```

---

## 7. Other Calculated Statistics

### Meta Share

```
Meta Share = (Entries for commander) / (Total entries in time period)
```

```typescript
const totalEntries = entriesQuery.totalEntries ?? 1;
const metaShare = stats.count / totalEntries;
```

### Win Rate (for individual entries)

```
Win Rate = (winsSwiss + winsBracket) / (winsSwiss + winsBracket + lossesSwiss + lossesBracket + draws)
```

```typescript
// Entry.winRate()
winRate(): Float | null {
  const wins = this.winsBracket + this.winsSwiss;
  const games = wins + this.lossesBracket + this.lossesSwiss + this.draws;
  if (games === 0) return null;
  return wins / games;
}
```

### Player Win Rate (aggregate)

```typescript
// Player.winRate()
async winRate(): Promise<Float> {
  const { winRate } = await db
    .selectFrom('Entry')
    .select((eb) =>
      eb(
        eb(eb.fn.sum<number>('winsBracket'), '+', eb.fn.sum<number>('winsSwiss')),
        '/',
        eb(
          eb.fn.sum<number>('winsBracket'),
          '+',
          eb(
            eb.fn.sum<number>('winsSwiss'),
            '+',
            eb(
              eb.fn.sum<number>('lossesBracket'),
              '+',
              eb(eb.fn.sum<number>('lossesSwiss'), '+', eb.fn.sum<number>('draws'))
            )
          )
        )
      ).as('winRate')
    )
    .where('Entry.playerId', '=', this.id)
    .executeTakeFirstOrThrow();

  return winRate;
}
```

### Staples Calculation

Finds cards with higher-than-average play rate for a specific commander:

```typescript
async staples(): Promise<Card[]> {
  const oneYearAgo = subYears(new Date(), 1).toISOString();
  
  // Get total entries for this commander
  const { totalEntries } = await db.selectFrom('Entry')
    .select([(eb) => eb.fn.countAll<number>().as('totalEntries')])
    .leftJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
    .where('Entry.commanderId', '=', this.id)
    .where('Tournament.tournamentDate', '>=', oneYearAgo)
    .executeTakeFirstOrThrow();

  // Calculate per-card play rate for this commander
  // Then compare to global play rate
  // Order by difference (commander-specific rate - global rate)
  const query = db.with('entries', eb => 
    eb.selectFrom('DecklistItem')
      .leftJoin('Card', 'Card.id', 'DecklistItem.cardId')
      .leftJoin('Entry', 'Entry.id', 'DecklistItem.entryId')
      .leftJoin('Tournament', 'Tournament.id', 'Entry.tournamentId')
      .where('Entry.commanderId', '=', this.id)
      .where('Tournament.tournamentDate', '>=', oneYearAgo)
      .groupBy('Card.id')
      .select(eb => [
        eb.ref('Card.id').as('cardId'),
        eb(
          eb.cast(eb.fn.count<number>('Card.id'), 'real'),
          '/',
          totalEntries
        ).as('playRateLastYear'),
      ])
  )
  .selectFrom('Card')
  .leftJoin('entries', 'entries.cardId', 'Card.id')
  .where(eb => eb(
    eb.fn('json_extract', ['Card.data', sql`'$.type_line'`]),
    'not like',
    '%Land%'
  ))
  .orderBy(eb => 
    eb('entries.playRateLastYear', '-', eb.ref('Card.playRateLastYear')), 
    'desc'
  )
  .selectAll('Card')
  .limit(100);

  return (await query.execute()).map(r => new Card(r));
}
```

---

## 8. Operational Details

### GitHub Actions Workflow

The pipeline runs nightly via GitHub Actions (`.github/workflows/update_db.yaml`):

```yaml
name: Update Database

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: "30 3 * * *"  # Daily at 3:30 UTC

jobs:
  pull_db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Pull existing database from DigitalOcean Spaces
      - run: s3cmd get s3://edhtop16/edhtop16.db
      
      # Run migrations
      - run: pnpm run migrate
        env:
          NODE_OPTIONS: --max-old-space-size=4096
      
      # Run the ingestion script
      - run: pnpm run generate:db
        env:
          NODE_OPTIONS: --max-old-space-size=4096
          TOPDECK_GG_API_KEY: ${{ secrets.TOPDECK_GG_API_KEY }}
      
      # Push updated database back
      - run: s3cmd put edhtop16.db s3://edhtop16
      
      # Create timestamped backup
      - run: |
          TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
          s3cmd put edhtop16.db s3://edhtop16/backups/edhtop16_v2_${TIMESTAMP}.db
```

### Database Migrations

Migrations are managed via Kysely's Migrator:

```bash
# Create a new migration
pnpm run migrate --create=add_new_column

# Run pending migrations
pnpm run migrate
```

Migrations are stored in `scripts/migrations/` with timestamp-prefixed filenames.

### Error Handling

The pipeline uses Zod schemas to validate all API responses. Invalid data fails loudly with schema validation errors.

```typescript
const response = await undici.request(`${this.baseUrl}${endpoint}`, {...});
const json = await response.body.json();
return schema.parse(json);  // Throws ZodError if invalid
```

### Rate Limiting and Batching

- **Player API:** Uses Dataloader with `maxBatchSize: 15`
- **Tournament Details:** Fetched individually per TID
- **DecklistItem Inserts:** Batched in chunks of 300 (SQLite variable limit)

### Time Periods for Filtering

```typescript
enum TimePeriod {
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
  ALL_TIME = 'ALL_TIME',
  POST_BAN = 'POST_BAN',  // After September 23, 2024 ban
}

function minDateFromTimePeriod(timePeriod) {
  return timePeriod === 'ONE_YEAR' ? subMonths(new Date(), 12)
    : timePeriod === 'SIX_MONTHS' ? subMonths(new Date(), 6)
    : timePeriod === 'THREE_MONTHS' ? subMonths(new Date(), 3)
    : timePeriod === 'ONE_MONTH' ? subMonths(new Date(), 1)
    : timePeriod === 'POST_BAN' ? new Date('2024-09-23')
    : new Date(0);  // ALL_TIME
}
```

---

## Summary

### Critical Concepts

1. **Conversion Rate** = Top cuts / Total entries (per commander, player, or card inclusion)
2. **Top Cut** = Entry's `standing` <= Tournament's `topCut`
3. **Commander Name** = Alphabetically sorted card names joined with ` / `
4. **Color Identity** = WUBRG subset in canonical order, or 'C' for colorless
5. **Oracle ID** = Stable card identifier across printings (used for storage)
6. **Scryfall ID** = Printing-specific identifier (used by TopDeck API)

### Key Files

| File | Purpose |
|------|---------|
| `scripts/pull-database.ts` | Main data ingestion script |
| `src/lib/server/schema/commander.ts` | Commander stats calculations |
| `src/lib/server/schema/player.ts` | Player stats calculations |
| `src/lib/server/schema/tournament.ts` | Tournament stats calculations |
| `src/lib/server/schema/entry.ts` | Entry model and calculations |
| `__generated__/db/types.d.ts` | Database type definitions |
| `.github/workflows/update_db.yaml` | Automation workflow |

