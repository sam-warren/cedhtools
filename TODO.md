High Level
- [ ] Set up Supabase Auth
- [ ] Set up Stripe

MVP
- [ ] User should be able to upload Moxfield decklist
- [ ] User should be able to see cards in their decklist and their winrates with that commander
- [ ] User should be able to see cards NOT in their decklist and their winrates
- [ ] User gets three free deck analyses per month
- [ ] User can pay $9 USD / month for unlimited deck analyses
- [ ] User can pay $99 USD / year for unlimited deck analyses

ETL Pipeline
- [ ] Ingest data from Moxfield and Topdeck.gg
- [ ] First we need to collect tournament data from topdeck
- [ ] Our response model will map data

Technical Stack
- Supabase DB
- FastAPI
- React + TailwindCSS + shadcn + Tanstack Rotuer + Tanstack Query + Tanstack Table
- Deployed to Vercel
