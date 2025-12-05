# CEDHTools

A competitive EDH (cEDH) deck analysis tool that provides tournament statistics for commanders and cards. The application fetches tournament data from Topdeck.gg and provides insights on commander performance and card win rates.

## Features

- **Commander Statistics**: View win rates, entries, and performance data for any commander
- **Deck Analysis**: Upload your decklist to see how your cards perform in tournaments
- **Card Recommendations**: Discover popular cards for your commander that you might be missing
- **Tournament Data**: Real-time data from competitive EDH tournaments

## Architecture

### Data Flow

1. **ETL Pipeline**: Fetches tournament data from Topdeck API (including deck data via Scrollrack integration)
2. **Card Identification**: Cards are identified by Scryfall UUIDs
3. **Statistics Aggregation**: Win/loss/draw statistics are aggregated per commander-card pair
4. **Card Enrichment**: Card metadata (type_line) can be enriched from Scryfall API

### Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase CLI
- Docker (for local Supabase)

### Setting up local Supabase

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start local Supabase:
   ```bash
   supabase start
   ```

3. Apply migrations:
   ```bash
   supabase migration up
   ```

### Environment Variables

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ETL_API_KEY=<your-secret-api-key>
TOPDECK_API_KEY=<your-topdeck-api-key>
```

## Running the Application

### Development

```bash
cd client
npm install
npm run dev
```

### ETL Pipeline

The ETL pipeline uses an asynchronous job queue system:

```bash
# Run ETL worker (processes jobs from queue)
npm run etl:worker

# Run card enrichment (fetches type_line from Scryfall)
npx tsx lib/etl/enrich-cards.ts
```

#### Job Types

- **SEED**: Initial database seeding (6 months of historical data)
- **DAILY_UPDATE**: Daily incremental updates
- **BATCH_PROCESS**: Processing data in smaller chunks with cursor-based resumption

### API Endpoints

- `GET /api/commanders` - List commanders with statistics
- `GET /api/commanders/[id]` - Get commander details and top cards
- `POST /api/decks/analyze` - Analyze a deck against tournament statistics
- `GET /api/health` - Health check endpoint

## Database Schema

| Table | Description |
|-------|-------------|
| `commanders` | Commander statistics (wins, losses, draws, entries) |
| `cards` | Card metadata (unique_card_id is Scryfall UUID, type_line) |
| `statistics` | Per-commander, per-card performance statistics |
| `users` | User accounts and subscription information |
| `etl_jobs` | ETL job queue with status tracking |
| `processed_tournaments` | Tracks which tournaments have been processed |

## Deployment

### Vercel

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Set environment variables in the Vercel dashboard
4. Deploy!

### Scheduled ETL Runs

The `vercel.json` file configures daily ETL runs via Vercel Cron Jobs:

```json
{
  "crons": [
    {
      "path": "/api/etl-cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Data Sources

- **Tournament Data**: [Topdeck.gg](https://topdeck.gg) API with Scrollrack integration
- **Card Metadata**: [Scryfall](https://scryfall.com) API

## License

See [LICENSE](LICENSE) file.
