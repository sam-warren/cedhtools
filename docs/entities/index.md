# Entity Models Overview

This directory contains the data model documentation for all entities in the cEDH Tools application. Each entity has its own dedicated file with detailed information about its structure, relationships, and API endpoints.

## Core Entities

### [Commanders](commanders.md)
The Commander entity represents a commander or partner commander pair in the cEDH format. It includes statistics, matchups, time-series data, top players, top decklists, and card analysis.

### [Players](players.md)
The Player entity represents a registered or guest player. It includes statistics, recent tournaments, commander statistics, time-series data, color preferences, and matchup analysis.

### [Tournaments](tournaments.md)
The Tournament entity represents a cEDH tournament. It includes statistics, standings, rounds, commander breakdown, color breakdown, and chart data.

### [Cards](cards.md)
The Card entity represents a Magic: The Gathering card. It includes basic card information and performance metrics in the context of specific commanders. Commanders are a special type of card with additional properties and relationships.

### [Decks](decks.md)
The Deck entity represents a cEDH deck. It includes statistics, composition, card performance, and tournament history.

## Type Safety Improvements

The entity models have been enhanced with improved type safety:

### Use of `unknown` Instead of `any`

All utility functions and data structures now use `unknown` instead of `any` types:

```typescript
// Before
interface TimeSeriesDataPoint {
  metadata?: Record<string, any>;  // Less safe - allows any operation
}

// After
interface TimeSeriesDataPoint {
  metadata?: Record<string, unknown>;  // More type-safe
}
```

### Type-Safe Generic Constraints

All generic utility functions use proper type constraints:

```typescript
// Type-safe utility function signature
function withTransaction<Args extends unknown[], Return, DB>(
  handler: (tx: DB, ...args: Args) => Promise<Return>,
  db: { transaction: (fn: (tx: DB) => Promise<Return>) => Promise<Return> }
): Promise<(...args: Args) => Promise<Return>>;
```

### Explicit Type Assertions

Type assertions are used judiciously and only where necessary:

```typescript
// Proper type assertion for cache handling
const result = await fn(...args);
return result as ReturnType<T>;
```

### Function Parameter and Return Types

Generic type parameters ensure function signatures are preserved:

```typescript
// Type-safe error handling with proper parameter and return types
export async function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): Promise<T> {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args) as ReturnType<T>;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }) as T;
}
```

These type safety improvements ensure:
1. Better compile-time error detection
2. Improved IDE autocompletion and suggestions
3. More reliable refactoring
4. Fewer runtime type errors
5. Enhanced documentation through explicit type declarations

## Comprehensive Entity Relationships

### Direct Relationships

1. **Commander-Card Relationship**
   - **Direction**: Many-to-many
   - **Implementation**: Through `CardCommanderPerformance` and `CommanderCardAnalysis`
   - **Data Flow**: Commanders contain cards, and cards appear in decks with specific commanders
   - **Key Fields**: `commanderId` in `CardCommanderPerformance`, `cardId` in `CardAnalysis`

2. **Player-Commander Relationship**
   - **Direction**: Many-to-many
   - **Implementation**: Through `PlayerCommanderStats` and `TopPlayer`
   - **Data Flow**: Players use commanders, and commanders are used by players
   - **Key Fields**: `id` in `PlayerCommanderStats`, `id` in `TopPlayer`

3. **Tournament-Player Relationship**
   - **Direction**: Many-to-many
   - **Implementation**: Through `TournamentStanding` and `PlayerTournament`
   - **Data Flow**: Tournaments have players, and players participate in tournaments
   - **Key Fields**: `player.id` in `TournamentStanding`, `id` in `PlayerTournament`

4. **Deck-Commander Relationship**
   - **Direction**: Many-to-one (or many-to-two for partner commanders)
   - **Implementation**: Through `commander` and `partnerCommander` fields in `Deck`
   - **Data Flow**: Each deck has one or two commanders
   - **Key Fields**: `commander.id` and `partnerCommander?.id` in `Deck`

5. **Deck-Card Relationship**
   - **Direction**: Many-to-many
   - **Implementation**: Through `DeckComposition` and `DeckCardPerformance`
   - **Data Flow**: Decks contain cards, and cards appear in multiple decks
   - **Key Fields**: `cardId` in `DeckCardPerformance`, card arrays in `DeckComposition`

6. **Tournament-Deck Relationship**
   - **Direction**: Many-to-many
   - **Implementation**: Through `TournamentStanding`, `TournamentRound`, and `DeckTournament`
   - **Data Flow**: Tournaments have decks, and decks are played in tournaments
   - **Key Fields**: `deck?.id` in `TournamentStanding`, `id` in `DeckTournament`

### Indirect Relationships

1. **Card-Player Relationship**
   - **Mediated Through**: Decks and Commanders
   - **Implementation**: No direct relationship; connected via deck usage and commander preferences
   - **Potential Enhancement**: Could track player-specific card performance

2. **Tournament-Commander Relationship**
   - **Mediated Through**: Players and Decks
   - **Implementation**: Through `TournamentCommanderBreakdown`
   - **Data Flow**: Tournaments track which commanders were played

3. **Player-Card Relationship**
   - **Mediated Through**: Decks and Commanders
   - **Implementation**: No direct relationship
   - **Potential Enhancement**: Could track player-specific card preferences or performance

## Entity Relationship Diagram (Conceptual)

```
                    ┌─────────────┐
                    │             │
                    │  Commander  │
                    │             │
                    └─────┬───────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
        ┌───────────┐ ┌───────┐ ┌───────┐
        │           │ │       │ │       │
        │    Deck   │◄┤ Card  │ │Player │
        │           │ │       │ │       │
        └─────┬─────┘ └───┬───┘ └───┬───┘
              │           │         │
              │           │         │
              ▼           │         ▼
        ┌───────────┐     │    ┌───────────┐
        │           │     │    │           │
        │Tournament │◄────┴────┤ Statistics │
        │           │          │           │
        └───────────┘          └───────────┘
```

## Key Architectural Decisions and Solutions

### Partner Commander Handling
- **Approach**: Partner commanders are treated as a combined entity with a single unique ID
- **Example**: For Rograkh/Silas (or Silas/Rograkh), a unique ID is generated by sorting the individual IDs alphabetically
- **Navigation**: Client-side routing should use this combined ID for both navigation and data fetching
- **UI Display**: Partner details are provided separately in the `partnerCommander` field for UI presentation
- **Consistency**: The combined approach ensures data consistency regardless of order (Rograkh/Silas or Silas/Rograkh)

### Cards as Base Entity
- Commanders are implemented as a special type of card with additional properties and relationships
- A core card component should be used as the base for displaying cards, with commanders extending this functionality
- This approach provides consistency while allowing for commander-specific features

### Tournament Results as Single Source of Truth
- Tournaments entity should be the single source of truth for tournament results
- Other entities should only reference tournaments using IDs, not duplicate tournament results
- This prevents data inconsistency and reduces maintenance burden

### Time-Series Data with TimescaleDB
- **Approach**: Implement all time-series data using TimescaleDB
- **Benefits**:
  - Native support for time-based queries and aggregations
  - Efficient storage through automatic data chunking
  - High performance for real-time and historical data
- **Implementation**: 
  - Use the `TimeSeriesQuery` interface for all time-series data requests
  - Support varying granularity through the `interval` parameter
  - Allow different aggregation methods through the `aggregation` parameter

### Entity Response Wrapper
- **Implementation**: All entity API responses are wrapped in an `EntityResponse<T>` interface
- **Purpose**:
  - Provide consistent metadata for client-side caching
  - Include data versioning information for cache invalidation
  - Indicate when new data will be available based on ETL schedule
- **Type-Safe Implementation**:
  ```typescript
  // Type-safe entity response wrapper with generic parameter
  interface EntityResponse<T> {
    data: T;                   // The actual entity data
    meta: {
      lastUpdated: string;     // When the data was last updated on the server
      dataVersion: string;     // Version hash of the dataset (for cache invalidation)
      nextUpdateExpected?: string; // When to expect the next data update
    };
  }
  
  // Type-safe paginated response that extends the base entity response
  interface PaginatedResponse<T> extends EntityResponse<T[]> {
    meta: {
      // Standard entity response metadata
      lastUpdated: string;
      dataVersion: string;
      nextUpdateExpected?: string;

      // Pagination metadata
      pagination: {
        totalCount: number;     // Total number of items across all pages
        pageSize: number;       // Current page size
        currentPage: number;    // Current page number (1-indexed)
        totalPages: number;     // Total number of pages
        hasNextPage: boolean;   // Whether there are more pages
        hasPreviousPage: boolean; // Whether there are previous pages
        nextCursor?: string;    // Cursor for the next page (if applicable)
        prevCursor?: string;    // Cursor for the previous page (if applicable)
      }
    };
  }
  ```
  
- **Usage Examples**:
  ```typescript
  // Fetching a single entity with proper typing
  async function fetchCommander(id: string): Promise<EntityResponse<Commander>> {
    const response = await apiClient.get(`/commanders/${id}`);
    return response.data;
  }
  
  // Fetching a paginated list of entities
  async function fetchCommanderList(
    params: PaginationParams
  ): Promise<PaginatedResponse<Commander>> {
    const response = await apiClient.get('/commanders', { params });
    return response.data;
  }
  
  // Safely accessing data with type checking
  function displayCommanderData(response: EntityResponse<Commander>): void {
    const { data, meta } = response;
    console.log(`Commander: ${data.name} (Last updated: ${meta.lastUpdated})`);
    
    // TypeScript knows the shape of data.stats
    renderWinRate(data.stats.winRate);
  }
  ```

### ETL Pipeline and Data Tracking
- **Approach**: Implement a nightly/weekly ETL pipeline for data ingestion
- **Data Sources**:
  - Card data from Moxfield/Scryfall
  - Tournament data from Topdeck.gg
  - Deck data from various sources
- **Tracking**:
  ```typescript
  interface ETLTracking {
    dataSource: string;        // e.g., "moxfield", "topdeck", "manual"
    sourceId: string;          // ID in the source system
    importBatch: string;       // Batch identifier for tracking issues
    lastSyncedAt: string;      // When this record was last synced
  }
  ```
- **Versioning**: Each ETL run creates a new dataset version, captured in the `dataVersion` field
- **Scheduling**: Data is refreshed on a regular schedule, allowing clients to anticipate updates

### GraphQL BFF Approach
- **Implementation**: A GraphQL Backend-for-Frontend (BFF) layer on top of the REST API
- **Purpose**:
  - Optimize data fetching for specific frontend use cases
  - Reduce over-fetching and under-fetching of data
  - Provide a strongly typed API schema for frontend development
- **GraphQL Entity Design**:
  ```typescript
  // Global ID pattern for GraphQL entities
  interface GraphQLEntity {
    // Format: `${entityType}:${id}`
    // e.g., "commander:EgVRr_YdlZG"
    globalId: string;
  }
  ```
- **Schema First Development**:
  - Define GraphQL types based on frontend requirements
  - Map GraphQL resolvers to optimized REST API calls
  - Use DataLoader for batching and caching similar requests
- **Example Query**:
  ```graphql
  query CommanderWithTopCards($id: ID!) {
    commander(id: $id) {
      id
      name
      colorIdentity
      stats {
        winRate
        metaShare
      }
      topCards {
        card {
          id
          name
          inclusion
        }
      }
    }
  }
  ```
- **Benefits**:
  - Frontend code can request exactly the data it needs
  - Multiple REST endpoints can be combined into a single request
  - Type safety throughout the frontend codebase

## Potential Pitfalls and Improvements

### Data Duplication Issues

1. **Commander Names and References**
   - **Issue**: Commander names are duplicated across multiple entities
   - **Solution**: Use consistent reference objects: `CommanderReference`
   - **Benefit**: Standardizes how entities reference each other across the system

2. **Tournament Results**
   - **Issue**: Tournament results should only be stored in the Tournaments entity
   - **Solution**: Other entities should reference tournament IDs rather than duplicating result data

3. **Card Information**
   - **Issue**: Basic card information is duplicated in performance metrics
   - **Solution**: Use consistent card reference objects and separate core card data from performance data

### Normalization Concerns

1. **Nested Objects**
   - **Issue**: Extensive use of nested objects could complicate queries
   - **Solution**: Consider flattening some structures and using references instead
   - **Example**: Replace nested commander objects with commander IDs and optional name field

2. **Redundant Statistics**
   - **Issue**: Some statistics are stored directly but could be computed
   - **Solution**: Clearly mark derived fields with naming convention (e.g., suffix with `Rate`)
   - **Implementation**: Include computation instructions in documentation for client-side processing

3. **Time-Series Data**
   - **Issue**: Time-series data growth can impact performance
   - **Solution**: Use TimescaleDB with appropriate retention and downsampling policies
   - **Implementation**: Configure TimescaleDB to automatically downsample older data

## Steps to Complete the Entity Model

While the current entity model is approximately 90% complete, the following enhancements would bring it to 100% readiness for implementation:

### 1. Error Handling Framework

Implement a standardized error response structure for consistent client-side error handling:

```typescript
interface ApiError {
  code: string;          // Machine-readable error code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
  message: string;       // Human-readable message
  field?: string;        // Field that caused the error (for validation errors)
  details?: unknown;     // Additional context or troubleshooting information
}

interface ErrorResponse {
  errors: ApiError[];    // Array to support multiple errors in a single response
  meta: {
    requestId: string;   // For support/debugging correlation
    timestamp: string;   // When the error occurred
  };
}
```

**Common Error Codes:**
- `NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Invalid input data
- `AUTHORIZATION_ERROR`: Permissions issue
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unspecified server error

**Implementation Notes:**
- All API endpoints should return these error structures
- HTTP status codes should align with error codes (404 for NOT_FOUND, etc.)
- GraphQL errors should follow a similar structure
- Detailed error information should be provided in development but limited in production

### 2. Batch Operations

Define patterns for efficient batch data operations:

```typescript
// Batch get request
interface BatchGetRequest {
  ids: string[];              // Multiple IDs to fetch
  include?: string[];         // Optional related data to include
}

// Batch response example
type BatchCommanderResponse = EntityResponse<Record<string, Commander | null>>;

// REST API endpoint example:
// POST /commanders/batch
// Body: { "ids": ["cmd1", "cmd2", "cmd3"] }
```

**Implementation Notes:**
- Batch operations reduce network overhead for clients needing multiple resources
- Return values should preserve the requested order
- Missing items should return null rather than causing the entire request to fail
- Consider including a "maxBatchSize" limit (e.g., 50 items)
- GraphQL naturally supports batching through lists of IDs in queries

### 3. Data Validation

Document validation rules for input data:

```typescript
// Example validation rules for a filter parameter
interface ValidationRule {
  field: string;         // Field being validated
  rules: {
    type: string;        // Data type (string, number, etc.)
    required?: boolean;  // Whether the field is required
    min?: number;        // Minimum value or length
    max?: number;        // Maximum value or length
    pattern?: string;    // Regex pattern to match
    enum?: string[];     // Allowed values
  }
  message: string;       // Error message if validation fails
}
```

**Implementation Notes:**
- Define validation rules for query parameters, especially filters
- Document validation for each entity field
- Include length constraints, format patterns, and allowed values
- Frontend and backend should enforce consistent validation
- Consider using a schema validation library (Zod, Joi, etc.)

### 4. Calculated Fields Documentation

Better document client-side calculations for derived statistics:

```typescript
namespace ClientCalculations {
  // Win rate calculation with proper handling of edge cases
  export function calculateWinRate(wins: number, games: number): number {
    if (games === 0) return 0;
    return (wins / games) * 100;
  }
  
  // Calculate meta share percentage
  export function calculateMetaShare(
    commanderEntries: number, 
    totalEntries: number
  ): number {
    if (totalEntries === 0) return 0;
    return (commanderEntries / totalEntries) * 100;
  }
  
  // Format color identity for display
  export function formatColorIdentity(colors: string[]): string {
    if (colors.length === 0) return "Colorless";
    if (colors.length === 5) return "Five-Color";
    
    // Color pair and triplet names
    const colorPairs: Record<string, string> = {
      "WU": "Azorius",
      "WB": "Orzhov",
      // ... other color combinations
    };
    
    const key = colors.sort().join("");
    return colorPairs[key] || colors.join("");
  }
}
```

**Implementation Notes:**
- Client-side calculation ensures consistent derivation of statistics
- Document expected behaviors for edge cases (e.g., division by zero)
- Consider providing libraries in multiple languages (TypeScript, Python)
- Include example test cases for verification
- Clearly mark which fields require calculation vs. which come directly from the API

### 5. Caching Directives

Add more specific cache control guidance:

```typescript
interface CachePolicy {
  entity: string;        // Entity type
  endpoint: string;      // API endpoint pattern
  ttl: number;           // Time-to-live in seconds
  strategy: 'stale-while-revalidate' | 'cache-first' | 'network-first';
  revalidate?: {
    onInterval?: number; // Revalidation interval
    onEvent?: string[];  // Events that trigger revalidation
  }
}

// Example cache policies
const cachePolicies: CachePolicy[] = [
  {
    entity: 'commander',
    endpoint: '/commanders/{id}',
    ttl: 3600, // 1 hour
    strategy: 'stale-while-revalidate',
    revalidate: {
      onInterval: 7200, // 2 hours
      onEvent: ['etl_commanders_updated']
    }
  },
  {
    entity: 'tournament',
    endpoint: '/tournaments/recent',
    ttl: 300, // 5 minutes
    strategy: 'network-first'
  }
];
```

**Implementation Notes:**
- Both client and server should respect cache directives
- Use HTTP cache headers (Cache-Control, ETag) for REST endpoints
- Implement Apollo Cache policies for GraphQL
- Consider implementing a cache invalidation system using dataVersion
- Document different cache strategies for different entity types
- Static reference data can have longer TTLs than frequently changing data

## Implementation Notes

1. **Partner Commanders**
   - Partner commanders are treated as a single entity with a unique ID
   - This simplifies querying but requires special handling in the UI
   - Client-side routing should use combined IDs for navigation

2. **Derived Statistics**
   - All percentage-based statistics should be computed on the client side
   - This reduces database complexity and ensures consistent calculation

3. **Card References**
   - Use consistent reference patterns throughout the system
   - The card entity serves as the base for commanders

4. **Tournament as Source of Truth**
   - Tournament entity is the definitive source for tournament results
   - Other entities should reference rather than duplicate this data

## API Structure

### REST API

Each entity has its own set of API endpoints for retrieving data. The general pattern is:

- `GET /{entity}` - List all entities with basic info
- `GET /{entity}/{id}` - Get detailed entity information
- `GET /{entity}/{id}/{related-entity}` - Get related entities

For cross-entity relationships, endpoints follow the pattern:
- `GET /{entity1}/{id}/{entity2}` - Get entity2 items related to the specified entity1

### Pagination

All list endpoints support pagination to efficiently handle large datasets:

```typescript
// Query parameters for pagination
interface PaginationParams {
  page?: number;            // Page number (1-indexed, default: 1)
  pageSize?: number;        // Items per page (default: 20, max: 100)
  cursor?: string;          // Optional cursor-based pagination alternative
}

// Response wrapper for paginated results
interface PaginatedResponse<T> extends EntityResponse<T[]> {
  meta: {
    // Standard entity response metadata
    lastUpdated: string;
    dataVersion: string;
    nextUpdateExpected?: string;
    
    // Pagination metadata
    pagination: {
      totalCount: number;     // Total number of items across all pages
      pageSize: number;       // Current page size
      currentPage: number;    // Current page number (1-indexed)
      totalPages: number;     // Total number of pages
      hasNextPage: boolean;   // Whether there are more pages
      hasPreviousPage: boolean; // Whether there are previous pages
      nextCursor?: string;    // Cursor for the next page (if applicable)
      prevCursor?: string;    // Cursor for the previous page (if applicable)
    }
  };
}
```

**Implementation Notes:**
- Both offset-based (`page`/`pageSize`) and cursor-based pagination are supported
- Cursor-based pagination is recommended for frequently changing datasets
- The default page size is 20 items, with a maximum of 100 items per page
- The first page is page 1 (not page 0)
- When requesting a page beyond the available data, an empty array is returned with appropriate pagination metadata

**Example:**
```
GET /commanders?page=2&pageSize=50
```

### Filtering Options

All list endpoints support consistent filtering to narrow results:

```typescript
// Common filter parameters across entities
interface CommonFilterParams {
  // Date range filters
  dateFrom?: string;   // ISO date string (e.g., "2022-06-01")
  dateTo?: string;     // ISO date string (defaults to current date)
  
  // Tournament size filters
  tournamentSize?: '30+' | '60+' | '120+' | 'all'; // Minimum tournament size
  
  // Tournament cut filters
  tournamentCut?: 'top4' | 'top10' | 'top16' | 'all'; // Results from specified cut
  
  // Generic search
  search?: string;     // Search term for name/text fields
}

// Entity-specific filter parameters
interface CommanderFilterParams extends CommonFilterParams {
  colorIdentity?: string[];  // Array of colors (W, U, B, R, G)
  legality?: 'banned' | 'legal' | 'not_legal';
  // Commander-specific filters
}

interface TournamentFilterParams extends CommonFilterParams {
  format?: string[];   // Tournament formats
  region?: string[];   // Geographic regions
  // Tournament-specific filters
}

// Additional filter parameters for other entities...
```

**Standard Filter Options:**

1. **Date Range**
   - Filter data within a specific date range
   - Default range: June 1, 2022 to present
   - Format: ISO 8601 date strings (YYYY-MM-DD)
   - Example: `dateFrom=2023-01-01&dateTo=2023-06-30`

2. **Tournament Size**
   - Filter data by minimum tournament size (number of participants/entries)
   - Options: 
     - `30+`: Tournaments with 30 or more participants
     - `60+`: Tournaments with 60 or more participants
     - `120+`: Tournaments with 120 or more participants
     - `all`: All tournaments regardless of size (default)
   - Example: `tournamentSize=60+`

3. **Tournament Top Cut**
   - Filter data by tournament placement
   - Options:
     - `top4`: Only data from top 4 placements
     - `top10`: Only data from top 10 placements
     - `top16`: Only data from top 16 placements
     - `all`: All placements (default)
   - Example: `tournamentCut=top16`

**Implementation Notes:**
- Filters are applied as query parameters
- Multiple filters can be combined with logical AND
- Filtering is consistent across all entities where applicable
- Filters affect both the data returned and derived statistics
- Time-series endpoints also accept these filters to adjust the underlying data
- All filter parameters are optional with reasonable defaults

**Example:**
```
GET /commanders?colorIdentity=W,U,B&tournamentSize=60+&tournamentCut=top16
```

### Sorting Options

List endpoints support consistent sorting of results:

```typescript
interface SortParams {
  sortBy?: string;      // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction (default: desc)
}
```

The `sortBy` parameter accepts entity-specific field names. Common sortable fields include:
- `name`: Sort alphabetically by name
- `winRate`: Sort by win rate
- `popularity`: Sort by popularity/usage
- `date`: Sort by date (for tournaments)

**Example:**
```
GET /commanders?sortBy=winRate&sortOrder=desc
```

### GraphQL API

The GraphQL API provides a unified entry point for all entity data:

- `/graphql` - Single endpoint for all GraphQL queries

Common query patterns:
- Entity by ID: `query { commander(id: "abc123") { name, stats { winRate } } }`
- Entity lists: `query { commanders { id, name, colorIdentity } }`
- Nested relationships: `query { player(id: "xyz789") { commanderStats { commander { name }, winRate } } }`

**GraphQL Pagination:**

The GraphQL API uses the Relay Connection specification for pagination:

```graphql
type CommanderConnection {
  edges: [CommanderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type CommanderEdge {
  node: Commander!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**Example GraphQL pagination query:**
```graphql
query {
  commanders(first: 10, after: "cursor") {
    edges {
      node {
        id
        name
        winRate
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

**GraphQL Filtering:**

Filters are passed as arguments to list queries:

```graphql
query {
  commanders(
    filter: {
      dateFrom: "2023-01-01", 
      dateTo: "2023-12-31",
      tournamentSize: "60+",
      tournamentCut: "top16",
      colorIdentity: ["W", "U", "B"]
    }
  ) {
    edges {
      node {
        id
        name
        winRate
      }
    }
  }
}
```

## Future Considerations

1. **Versioning**
   - Consider how to handle changes to commanders, cards, and decks over time
   - ETL pipeline should track data versions for reproducibility

2. **Data Volume Management**
   - Time-series data will grow significantly over time
   - Implement TimescaleDB retention and compression policies

3. **Caching Strategy**
   - Derived statistics and frequently accessed data should be cached
   - Use the `dataVersion` field from EntityResponse for cache invalidation

4. **Real-time Updates**
   - For tournament tracking, consider how to handle real-time updates
   - WebSocket connections might be needed for live tournament data

5. **Card Synergies** (Post-MVP)
   - Implement card-to-card synergy tracking after the MVP release
   - Consider dedicated synergy score metrics and visualization tools 