# cedhtools application architecture

cedhtools is an analytics tool that provides insights on cEDH stats and trends. It is designed to empower players to make data-driven decisions in their deckbuilding process and analyze performance of decks in the meta.

## Definitions
The following definitions are used throughout the project:

### Deck
A deck is a collection of 100 Magic: The Gathering cards played in a tournament. Decks are registered by players in tournaments. For this application, each deck is a commander deck, meaning it has either one or two commanders, and the rest of the deck is made up of unique cards with the exception of basic land cards, of which there can be any number. Each deck is exactly 100 cards including the commander(s). Decks have the following properties:

### Card
A card is a Magic: The Gathering card. Cards are played in decks which are played by players in tournaments. Cards can vary greatly in properties, the main card types we care about are:
- Creature
- Planeswalker
- Instant
- Sorcery
- Enchantment
- Artifact
- Land

Cards have the following properties:

### Tournament
Tournaments are events where commander decks are played. Tournaments consist of any number of rounds, each round consisting of any number of games, depending on tournamnet attendance. Tournaments have a date which all other statistics are associated with for temporal data. 

### Player
A 
### 


## Architecture

### Frontend
- Next.js
- Typescript
- Tailwind CSS
- Shadcn UI
- Recharts
- Lucide Icons

### API
- Rust

### Databases
Two databases are used:
- User DB: A PostgreSQL database that stores user information and authentication data.
- Data DB: A TimescaleDB database that stores cEDH data ingested from Topdeck.gg, Moxfield, and Scryfall.

### Ingestion
The ingestion process is a multi-step process that ingests data from Topdeck.gg, Moxfield, and Scryfall.

1. Topdeck.gg Ingestion
2. Moxfield Ingestion
3. Scryfall Ingestion

## Frontend Pages and Views


