# ETL Pipeline Documentation

This directory contains the Extract, Transform, Load (ETL) pipeline for processing Commander (EDH) tournament data from Topdeck and decklist data from Moxfield.

## Overview

The ETL pipeline extracts tournament results from Topdeck, fetches detailed deck information from Moxfield, and aggregates statistics about commanders and cards used in competitive EDH tournaments. The processed data is stored in a Supabase database for use by the CEDH Tools application.

## Architecture

The ETL system consists of several key components:

### Core Components

1. **`processor.ts`** - Main ETL processor that orchestrates data extraction, transformation, and loading
2. **`worker.ts`** - Worker service that processes jobs from a queue
3. **`api-clients.ts`** - API clients for Topdeck and Moxfield with rate limiting and retry logic
4. **`types.ts`** - TypeScript type definitions for all data structures

### Utility Scripts

- **`run-worker.ts`** - Entry point for running the worker service
- **`seed-db.ts`** - Script to seed the database with historical data
- **`reset-etl.ts`** - Script to clear all ETL data

## Data Flow

```
Topdeck API → Tournament Data → Filter Moxfield Decklists → Moxfield API → Deck Data → Process & Aggregate → Supabase Database
```

### Step-by-Step Process

1. **Extract**: Fetch tournaments from Topdeck API for a given date range
2. **Filter**: Identify standings that contain Moxfield decklist URLs
3. **Extract**: Fetch detailed deck data from Moxfield API for each decklist
4. **Transform**: Extract commanders, cards, and tournament results
5. **Aggregate**: Calculate statistics (wins, losses, draws, entries) per commander and card
6. **Load**: Store aggregated data in Supabase database tables:
   - `commanders` - Commander statistics
   - `cards` - Card metadata
   - `statistics` - Card usage statistics per commander
   - `processed_tournaments` - Tracking of processed tournaments
   - `etl_status` - ETL run status tracking

## Components in Detail

### EtlProcessor (`processor.ts`)

The main processor class that handles the ETL workflow.

#### Key Methods

- **`processData(startDate?, endDate?)`**: Processes all tournaments in a date range
  - Processes data in weekly batches to avoid overwhelming APIs
  - Automatically determines start date from last processed date if not provided
  - Updates ETL status throughout the process

- **`processBatch(cursor?, batchSize?)`**: Processes data in smaller batches with cursor support
  - Designed for time-constrained environments (e.g., serverless functions)
  - Uses cursor format: `YYYY-MM-DD:tournamentId:standingIndex`
  - Returns next cursor and completion status
  - Processes one day's worth of data per batch

- **`processTournaments(tournaments)`**: Processes a list of tournaments
  - Skips already processed tournaments
  - Filters standings to only those with Moxfield decklists
  - Processes standings in batches based on concurrency limit
  - Marks tournaments as processed when complete

- **`processStanding(standing)`**: Processes a single tournament standing
  - Extracts Moxfield deck ID from URL
  - Fetches deck data from Moxfield
  - Delegates to `processDeck()` for data processing

- **`processDeck(deck, standing)`**: Processes deck data and updates database
  - Extracts commander(s) and generates consistent commander ID
  - Processes all mainboard cards
  - Batch fetches existing statistics
  - Calculates aggregated statistics
  - Uses batch upsert operations for efficiency
  - Falls back to individual upserts if batch RPC fails

#### Commander Identification

Commanders are identified by:
- **ID**: Sorted concatenation of unique card IDs (e.g., `card1_card2`)
- **Name**: Concatenated card names (e.g., `Thrasios, Triton Hero + Tymna the Weaver`)

This ensures consistent identification of partner commanders regardless of order.

#### Performance Optimizations

- Batch database operations to minimize round trips
- Uses RPC function `batch_upsert_deck_data` for atomic updates
- Processes cards in parallel where possible
- Tracks performance metrics for monitoring

### Worker Service (`worker.ts`)

A queue-based worker that processes ETL jobs independently of the web application.

#### Job Types

1. **`SEED`**: Initial data load with optional date range
2. **`DAILY_UPDATE`**: Processes new data since last run
3. **`BATCH_PROCESS`**: Processes data in small batches with cursor support

#### Job Processing Flow

1. Worker polls for pending jobs (ordered by priority, then creation date)
2. Resets any stuck jobs (jobs running longer than `max_runtime_seconds`)
3. Marks job as RUNNING
4. Executes appropriate processor method based on job type
5. For BATCH_PROCESS jobs, creates follow-up job if more data exists
6. Updates job status (COMPLETED or FAILED)

#### Job Queue Schema

Jobs are stored in the `etl_jobs` table with:
- `id`: Unique job identifier
- `job_type`: Type of job (SEED, DAILY_UPDATE, BATCH_PROCESS)
- `status`: Current status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- `parameters`: JSON object with job-specific parameters
  - `startDate`, `endDate`: Date range for processing
  - `batchSize`: Number of records per batch
  - `cursor`: Cursor for resuming batch processing
  - `priority`: Job priority (higher = processed first)
- `next_cursor`: Cursor for next batch (for BATCH_PROCESS jobs)
- `records_processed`: Number of records processed
- `max_runtime_seconds`: Maximum runtime before job is considered stuck

### API Clients (`api-clients.ts`)

#### TopdeckClient

Fetches tournament data from the Topdeck API.

**Configuration:**
- `TOPDECK_API_BASE_URL`: API base URL (default: `https://topdeck.gg/api/v2`)
- `TOPDECK_API_KEY`: API authentication key

**Methods:**
- `fetchTournaments(startDate, endDate)`: Fetches tournaments for a date range
  - Converts ISO dates to Unix timestamps
  - Filters for EDH format tournaments
  - Returns tournament data with standings

#### MoxfieldClient

Fetches deck data from the Moxfield API with sophisticated rate limiting.

**Configuration:**
- `MOXFIELD_API_BASE_URL`: API base URL
- `MOXFIELD_USER_AGENT`: User agent string for API requests
- `ETL_REQUESTS_PER_SECOND`: Rate limit (default: 0.2 requests/second = 5 second delay)

**Rate Limiting:**
- Enforces minimum delay between requests (configurable)
- Tracks consecutive rate limit errors
- Implements exponential backoff with jitter:
  - Base delay: 5 seconds
  - Multiplier: 2^(consecutive errors - 1)
  - Maximum backoff: 2 minutes
  - Random jitter: 0-1000ms

**Retry Logic:**
- Automatically retries on 429 (Too Many Requests) errors
- Up to 5 retry attempts
- Exponential backoff between retries
- Logs detailed retry information

**Methods:**
- `fetchDeck(deckId)`: Fetches deck data by ID
  - Uses retry logic for rate limiting
  - Returns null for 404 (deck not found)
  - Throws errors for other failures

## Database Schema

### Tables

#### `commanders`
Stores aggregated statistics per commander:
- `id`: Unique commander ID (concatenated card IDs)
- `name`: Commander name(s)
- `wins`, `losses`, `draws`: Match results
- `entries`: Number of tournament entries
- `updated_at`: Last update timestamp

#### `cards`
Stores card metadata:
- `unique_card_id`: Unique card identifier
- `name`: Card name
- `scryfall_id`: Scryfall card ID
- `type`: Card type code
- `type_line`: Card type line text
- `updated_at`: Last update timestamp

#### `statistics`
Stores card usage statistics per commander:
- `commander_id`: Reference to commander
- `card_id`: Reference to card
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

#### `etl_status`
Tracks ETL run status:
- `id`: Unique status ID
- `start_date`: Run start time
- `end_date`: Run end time
- `status`: RUNNING, COMPLETED, or FAILED
- `records_processed`: Number of records processed
- `last_processed_date`: Last processed date

#### `etl_jobs`
Queue for ETL jobs:
- `id`: Unique job ID
- `job_type`: SEED, DAILY_UPDATE, or BATCH_PROCESS
- `status`: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
- `parameters`: JSON object with job parameters
- `created_at`, `started_at`, `completed_at`: Timestamps
- `next_cursor`: Cursor for batch processing
- `records_processed`: Number of records processed
- `error`: Error message if failed
- `max_runtime_seconds`: Maximum runtime before reset

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

### Creating Jobs

Jobs can be created programmatically or via database inserts:

```typescript
// Daily update job
await supabaseServiceRole.from('etl_jobs').insert({
  job_type: 'DAILY_UPDATE',
  status: 'PENDING',
  parameters: {},
  priority: 0
});

// Batch process job
await supabaseServiceRole.from('etl_jobs').insert({
  job_type: 'BATCH_PROCESS',
  status: 'PENDING',
  parameters: {
    batchSize: 50,
    cursor: null  // Start from beginning
  },
  priority: 0,
  max_runtime_seconds: 300  // 5 minutes
});
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
- `MOXFIELD_API_BASE_URL`: Moxfield API base URL
- `MOXFIELD_USER_AGENT`: User agent for Moxfield requests
- Supabase credentials (via `supabaseServiceRole`)

Optional:
- `ETL_CONCURRENCY_LIMIT`: Number of concurrent requests (default: 5)
- `ETL_REQUESTS_PER_SECOND`: Moxfield rate limit (default: 0.2)
- `ENV_FILE`: Environment file to load (default: `.env.local`)

## Error Handling

### Rate Limiting

The pipeline handles rate limiting gracefully:
- Moxfield client automatically retries with exponential backoff
- Batch processing pauses and sets cursor on rate limit errors
- Worker can resume from cursor on next run

### Failed Jobs

- Jobs that fail are marked as FAILED with error message
- Stuck jobs (running longer than `max_runtime_seconds`) are automatically reset
- Failed jobs can be manually retried by updating status to PENDING

### Data Consistency

- Uses database transactions where possible
- Batch upsert operations ensure atomicity
- Tournament tracking prevents duplicate processing
- Commander IDs ensure consistent aggregation

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

### API Rate Limiting

- Conservative default rate limit (0.2 req/sec)
- Exponential backoff on rate limit errors
- Configurable via environment variables
- Detailed logging for monitoring

## Monitoring

### ETL Status

Check the `etl_status` table for recent runs:
- Status (RUNNING, COMPLETED, FAILED)
- Records processed
- Last processed date
- Start/end times

### Job Queue

Monitor the `etl_jobs` table:
- Pending jobs count
- Job priorities
- Failed jobs with error messages
- Processing times

### Performance Metrics

The processor logs detailed performance metrics:
- Fetch times for API calls
- Database operation times
- Total processing time per deck
- Cards processed per second

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Increase `ETL_REQUESTS_PER_SECOND` delay or reduce concurrency
2. **Stuck Jobs**: Check `max_runtime_seconds` and ensure worker is running
3. **Duplicate Processing**: Verify `processed_tournaments` table is being updated
4. **Memory Issues**: Reduce `batchSize` in batch processing jobs

### Debugging

Enable detailed logging by checking console output:
- `[PERF]` logs show performance metrics
- `[RETRY]` logs show retry attempts
- `[RATE-LIMIT]` logs show rate limiting behavior
- `[Worker]` logs show worker activity

## Future Improvements

Potential enhancements:
- Parallel processing of multiple tournaments
- Incremental updates instead of full reprocessing
- Webhook support for real-time updates
- Dashboard for monitoring ETL status
- Automatic retry of failed jobs
- Data validation and quality checks


