# ETL Pipeline Documentation

This directory contains the Extract, Transform, Load (ETL) pipeline for processing Commander (EDH) tournament data from Topdeck.

## Overview

The ETL pipeline extracts tournament results from Topdeck (including deck data via their Scrollrack integration), and aggregates statistics about commanders and cards used in competitive EDH tournaments. The processed data is stored in a Supabase database for use by the CEDH Tools application.

## Architecture

The ETL system consists of several key components:

### Core Components

1. **`processor.ts`** - Main ETL processor that orchestrates data extraction, transformation, and loading
2. **`worker.ts`** - Worker service that processes jobs from a queue
3. **`api-clients.ts`** - API client for Topdeck
4. **`types.ts`** - TypeScript type definitions for all data structures
5. **`enrich-cards.ts`** - Script to enrich card metadata from Scryfall

### Utility Scripts

- **`run-worker.ts`** - Entry point for running the worker service
- **`seed-db.ts`** - Script to seed the database with historical data
- **`reset-etl.ts`** - Script to clear all ETL data

## Data Flow

```
Topdeck API → Tournament Data (with deckObj) → Process & Aggregate → Supabase Database
                                                        ↓
                                              Scryfall API (card enrichment)
```

### Step-by-Step Process

1. **Extract**: Fetch tournaments from Topdeck API for a given date range
2. **Filter**: Identify standings that contain valid `deckObj` (deck data from Scrollrack)
3. **Transform**: Extract commanders, cards, and tournament results from deckObj
4. **Aggregate**: Calculate statistics (wins, losses, draws, entries) per commander and card
5. **Load**: Store aggregated data in Supabase database tables:
   - `commanders` - Commander statistics
   - `cards` - Card metadata (using Scryfall UUIDs)
   - `statistics` - Card usage statistics per commander
   - `processed_tournaments` - Tracking of processed tournaments
   - `etl_jobs` - Job queue and status tracking

## Data Source: Topdeck deckObj

Topdeck provides deck data directly via their Scrollrack integration. Each tournament standing includes a `deckObj` field with the following structure:

```json
{
  "Commanders": {
    "Thrasios, Triton Hero": { "id": "scryfall-uuid", "count": 1 },
    "Tymna the Weaver": { "id": "scryfall-uuid", "count": 1 }
  },
  "Mainboard": {
    "Sol Ring": { "id": "scryfall-uuid", "count": 1 },
    "Mana Crypt": { "id": "scryfall-uuid", "count": 1 }
  }
}
```

This provides consistent Scryfall UUIDs for card identification.

## Components in Detail

### EtlProcessor (`processor.ts`)

The main processor class that handles the ETL workflow.

#### Key Methods

- **`processData(startDate?, endDate?)`**: Processes all tournaments in a date range
  - Processes data in weekly batches to avoid overwhelming APIs
  - Automatically determines start date from last processed date if not provided

- **`processBatch(cursor?, batchSize?)`**: Processes data in smaller batches with cursor support
  - Designed for time-constrained environments (e.g., serverless functions)
  - Uses cursor format: `YYYY-MM-DD:tournamentId:standingIndex`
  - Returns next cursor and completion status
  - Processes one day's worth of data per batch

#### Commander Identification

Commanders are identified by Scryfall UUID:
- **Single Commander**: Uses the Scryfall UUID directly
- **Partner Pair**: Sorted concatenation of UUIDs (e.g., `uuid1_uuid2`)

This ensures consistent identification regardless of order.

### TopdeckClient (`api-clients.ts`)

Fetches tournament data from the Topdeck API including deckObj.

**Configuration:**
- `TOPDECK_API_BASE_URL`: API base URL (default: `https://topdeck.gg/api/v2`)
- `TOPDECK_API_KEY`: API authentication key

**Methods:**
- `fetchTournaments(startDate, endDate)`: Fetches tournaments for a date range
  - Converts ISO dates to Unix timestamps
  - Filters for EDH format tournaments
  - Returns tournament data with standings including deckObj

### Card Enrichment (`enrich-cards.ts`)

Fetches card metadata from Scryfall API to populate `type` and `type_line` columns.

```bash
npx tsx lib/etl/enrich-cards.ts
```

- Uses Scryfall's collection endpoint (75 cards/request)
- Respectful rate limiting (100ms between requests)
- Only processes cards missing `type_line`

## Database Schema

### Tables

#### `commanders`
Stores aggregated statistics per commander:
- `id`: Scryfall UUID (single) or sorted "uuid1_uuid2" (partners)
- `name`: Commander name(s)
- `wins`, `losses`, `draws`: Match results
- `entries`: Number of tournament entries
- `updated_at`: Last update timestamp

#### `cards`
Stores card metadata:
- `unique_card_id`: Scryfall UUID (primary key)
- `name`: Card name
- `type`: Numeric type (1-8)
- `type_line`: Full type line text (e.g., "Legendary Creature — Human Wizard")
- `updated_at`: Last update timestamp

#### `statistics`
Stores card usage statistics per commander:
- `commander_id`: Reference to commander
- `card_id`: Reference to card (Scryfall UUID)
- `wins`, `losses`, `draws`: Match results
- `entries`: Number of tournament entries
- `updated_at`: Last update timestamp

#### `processed_tournaments`
Tracks processed tournaments to avoid duplicates:
- `tournament_id`: Topdeck tournament ID
- `tournament_date`: Tournament date
- `name`: Tournament name
- `record_count`: Number of records processed
- `processed_at`: Processing timestamp

#### `etl_jobs`
Job queue for ETL processing:
- `id`: Job ID
- `job_type`: SEED, DAILY_UPDATE, or BATCH_PROCESS
- `status`: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
- `parameters`: Job parameters (JSON)
- `next_cursor`: For resumable jobs
- `records_processed`: Count of processed records
- `error`: Error message if failed
- `priority`: Job priority
- `max_runtime_seconds`: Timeout for job

## Usage

### Running the Worker

The worker service runs continuously, processing jobs from the queue:

```bash
npm run etl:worker        # Development
npm run etl:worker:prod   # Production
```

### Seeding the Database

To seed the database with historical data:

```bash
npm run etl:seed          # Local database
npm run etl:seed:prod     # Production database
```

This processes the last 6 months of tournament data.

### Card Enrichment

To populate card type information from Scryfall:

```bash
npx tsx lib/etl/enrich-cards.ts
```

### Resetting ETL Data

To clear all ETL data and start fresh:

```bash
npx tsx lib/etl/reset-etl.ts
```

**Warning**: This will delete all processed data. Use with caution.

## Configuration

### Environment Variables

Required:
- `TOPDECK_API_KEY`: Topdeck API authentication key
- Supabase credentials (via `supabaseServiceRole`)

Optional:
- `ETL_CONCURRENCY_LIMIT`: Number of concurrent operations (default: 5)
- `ENV_FILE`: Environment file to load (default: `.env.local`)

## Error Handling

### Failed Jobs

- Jobs that fail are marked as FAILED with error message
- Stuck jobs (running longer than `max_runtime_seconds`) are automatically reset
- Failed jobs can be manually retried by updating status to PENDING

### Data Consistency

- Uses database transactions where possible
- Batch upsert operations ensure atomicity
- Tournament tracking prevents duplicate processing
- Commander IDs ensure consistent aggregation

## User Deck Analysis

For user-submitted deck analysis, the application uses the Scryfall API to resolve card names from text-based deck lists to Scryfall UUIDs. This allows matching against the tournament statistics database.

See `/lib/scryfall/client.ts` for the Scryfall integration.

## Performance Considerations

### Batch Processing

The `processBatch()` method is designed for environments with time constraints:
- Processes one day at a time
- Configurable batch size (default: 50 records)
- Cursor-based resumption
- Natural chunking by date

### Database Operations

- Batch operations minimize database round trips
- Uses RPC function for atomic batch upserts
- Falls back to individual upserts if RPC fails
- Tracks performance metrics for optimization

## Monitoring

### Job Queue

Monitor the `etl_jobs` table:
- Pending jobs count
- Job priorities
- Failed jobs with error messages
- Processing times

Use the `etl_jobs_active` view to see currently running jobs with runtime.

## Troubleshooting

### Common Issues

1. **No deckObj data**: Some tournaments may not have Scrollrack data - these are skipped
2. **Stuck Jobs**: Check `max_runtime_seconds` and ensure worker is running
3. **Duplicate Processing**: Verify `processed_tournaments` table is being updated
4. **Memory Issues**: Reduce `batchSize` in batch processing jobs

### Debugging

Enable detailed logging by checking console output:
- `[PERF]` logs show performance metrics
- `[Worker]` logs show worker activity
