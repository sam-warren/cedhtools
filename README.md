# cedhtools

A comprehensive tournament statistics platform for competitive Elder Dragon Highlander (cEDH). Aggregates and analyzes tournament data from TopDeck.gg to provide insights on commander performance, card play rates, and meta trends.

## Features

- **Commander Statistics**: Browse commanders ranked by conversion score, win rate, and meta share
- **Card Analysis**: View staple cards for each commander with play rates and performance deltas
- **Tournament Browser**: Explore recent cEDH tournaments with filtering and search
- **Deck Analysis**: Paste a decklist URL to compare against meta statistics
- **Performance Trends**: Monthly charts showing win rate and meta share over time
- **Seat Position Stats**: Win rate analysis by seat position for each commander

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Data Visualization**: Recharts
- **State Management**: TanStack Query
- **Background Jobs**: Custom worker with PM2

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (local or cloud)
- TopDeck.gg API key

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TOPDECK_API_KEY=your_topdeck_api_key
```

### Installation

```bash
npm install
```

### Database Setup

Run the Supabase migrations to set up the schema:

```bash
supabase db push
```

### Seeding Data

The data pipeline has three stages:

1. **Sync**: Fetch tournament data from TopDeck.gg API
2. **Enrich**: Add Scryfall card metadata and validate decklists  
3. **Aggregate**: Calculate weekly statistics for commanders and cards

Run all stages:

```bash
npm run db:seed
```

Or run individually:

```bash
npm run db:sync        # Sync tournaments
npm run db:enrich      # Enrich with Scryfall data
npm run db:aggregate   # Aggregate statistics
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Background Worker

For production, use the PM2-managed background worker to process jobs:

```bash
# Start the worker
pm2 start ecosystem.config.js

# View logs
pm2 logs cedhtools-worker

# Stop the worker
pm2 stop cedhtools-worker
```

### Job Management

```bash
# Enqueue a daily update job
npm run job:daily

# Enqueue a full seed job
npm run job:seed -- --start-date 2024-06-01

# View job status
npm run job:status

# Reset stuck jobs
npm run job:reset
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── commanders/        # Commander pages
│   ├── cards/             # Card detail pages
│   ├── tournaments/       # Tournament browser
│   └── analyze/           # Deck analysis
├── components/            # React components
│   ├── commanders/        # Commander-specific components
│   ├── data-table/        # DataTable with sorting/filtering
│   ├── shared/            # Shared components
│   └── ui/                # shadcn/ui components
├── lib/                   # Core utilities
│   ├── api/               # External API clients
│   ├── db/                # Database types and clients
│   └── jobs/              # Background job implementations
├── scripts/               # CLI scripts for data management
├── supabase/              # Database migrations
└── worker/                # Background job worker
```

## Data Pipeline

```
TopDeck.gg API → Sync Job → Raw Tables
                              ↓
Scryfall API → Enrich Job → Enriched Tables
                              ↓
              Aggregate Job → Weekly Stats Tables
                              ↓
                           Frontend API
```

### Tables

| Table | Purpose |
|-------|---------|
| `tournaments` | Tournament metadata |
| `entries` | Player entries (commander, standing, wins/losses) |
| `decklist_items` | Cards in each decklist |
| `commander_weekly_stats` | Aggregated commander stats by week |
| `card_commander_weekly_stats` | Card stats per commander by week |
| `seat_position_weekly_stats` | Win rates by seat position |

## License

MIT
