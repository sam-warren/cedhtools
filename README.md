# cedhtools ETL Pipeline

This repository contains the ETL (Extract, Transform, Load) pipeline for the cedhtools application. The pipeline fetches tournament data from Topdeck.gg, processes it, and stores it in a Supabase database.

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase CLI
- Docker (for local Supabase)

### Setting up local Supabase

1. Install Supabase CLI:
   ```
   npm install -g supabase
   ```

2. Start local Supabase:
   ```
   supabase start
   ```

3. Apply migrations:
   ```
   supabase migration up
   ```

### Environment Variables

Create a `.env.local` file in the `client` directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ETL_API_KEY=<your-secret-api-key>
```

## Running the ETL Pipeline

### Local Testing

To test the ETL pipeline locally:

1. Install dependencies:
   ```
   cd client
   npm install
   ```

2. Run the test script:
   ```
   npm run etl:test
   ```

This will process tournament data from the last 7 days.

### API Endpoints

- `GET /api/etl` - Check if the ETL API is running
- `POST /api/etl` - Trigger the ETL process

The POST endpoint requires authentication with the ETL_API_KEY as a Bearer token.

Example request:
```
curl -X POST https://your-domain.com/api/etl \
  -H "Authorization: Bearer YOUR_ETL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2023-01-01", "endDate": "2023-01-31"}'
```

## Deployment

### Deploying to Vercel

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy!

### Setting up Scheduled ETL Runs

To run the ETL process daily, you can set up a scheduled job using Vercel Cron Jobs:

1. Create a `vercel.json` file:
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

2. Create the cron endpoint at `app/api/etl-cron/route.ts`

## Database Schema

The database schema includes the following tables:

- `commanders` - Information about commanders
- `cards` - Information about cards
- `statistics` - Statistics for each commander-card pair
- `users` - User information and subscription status
- `deck_analyses` - Record of deck analyses performed by users
- `etl_status` - Status and logs of ETL runs 