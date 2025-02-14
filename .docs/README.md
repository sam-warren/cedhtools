# cedhtools

cedhtools is a comprehensive analytics platform for competitive EDH (cEDH) that provides data-driven insights on deck performance, card usage, and meta trends. The platform empowers players to make informed decisions in their deckbuilding process by analyzing tournament data and performance statistics. It specifically focuses on the competitive EDH format, which is a multiplayer variant of Magic: The Gathering where typically four players compete using 100-card singleton decks led by legendary creatures known as commanders.

## Table of Contents
- [Overview](#overview)
- [Component Hierarchy](#component-hierarchy)
- [Core Concepts](#core-concepts)
  - [Deck](#deck)
  - [Card](#card)
  - [Tournament](#tournament)
  - [Player](#player)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [API](#api)
  - [Databases](#databases)
  - [Data Ingestion](#data-ingestion)
- [Frontend Routes](#frontend-routes)

## Overview

The application integrates and normalizes data from multiple authoritative sources:
- Tournament data from Topdeck.gg (tournament structure, results, and player information)
- Decklist data from Moxfield (deck compositions and commander information)
- Card data from Scryfall (comprehensive card details and metadata)

This data undergoes extensive processing, normalization, and analysis to provide comprehensive statistics and insights about the cEDH meta. The platform handles complex relationships between different entities and accounts for various edge cases in data collection and tournament structure.

## Component Hierarchy

The application's data model follows a hierarchical structure where components are related as follows:

```
Tournament
├── Rounds (Swiss + Top Cut)
│   └── Tables
│       ├── Players (1-5 per table)
│       │   └── Decks
│       │       ├── Commander Card(s) (1-2)
│       │       └── Other Cards (98-99)
│       └── Winner (or Draw)
└── Standings
    └── Players
        └── Decks (with performance metrics)
```

**Detailed Relationships:**
- **Cards → Decks**: 
  - Cards are the fundamental building blocks of the format
  - Each deck contains exactly 100 cards total:
    - 1-2 commander cards in the command zone
    - 98-99 other cards in the main deck
  - Commander cards define the deck's color identity
  - Color identity restricts which cards can be included in the deck
  - Example: A Tymna + Kraum deck ({W}{U}{B}{R}) cannot play green cards
  - Basic lands and certain cards (e.g., "Relentless Rats") can appear multiple times
  - The same card can appear in multiple different decks
  
- **Decks → Players**: 
  - Players must register a deck for each tournament entry
  - The same player can:
    - Register different decks in different tournaments
    - Register the same deck multiple times across tournaments
    - Only register one deck per tournament
  - Decks are identified by Moxfield URLs, but some players may register with other platforms
  - A deck's performance is tracked across all instances of its use
  
- **Players → Tables**: 
  - Players are assigned to tables during tournament rounds
  - Standard configuration is 4 players per table
  - Edge cases include:
    - 3-player tables (odd number of players)
    - 5-player tables (tournament organizer decision)
    - 2-player tables (rare, usually in final brackets)
    - Single-player tables (byes)
  - Each table must have:
    - A defined set of players
    - A winner (or designated as a draw)
    - Associated decklists for each player
  
- **Tables → Rounds**: 
  - Tables are organized within rounds
  - Round types:
    - Swiss rounds (determined by tournament size)
    - Top cut rounds (e.g., Top 16, Top 8, etc.)
  - Each round:
    - Has a unique identifier/number
    - Contains multiple tables
    - Must complete before the next round begins
  
- **Rounds → Tournament**: 
  - Tournaments follow a structured format:
    1. Swiss rounds (variable number based on attendance)
    2. Top cut elimination rounds (optional)
    3. Final standings
  - Each tournament has:
    - A unique identifier
    - A start date/time
    - A defined number of swiss rounds
    - A specified top cut size (if applicable)
  
- **Players → Standings**: 
  - Tournament standings track comprehensive player performance:
    - Overall match record
      - Wins
      - Losses
      - Draws
      - Byes
    - Performance by tournament stage
      - Swiss rounds (winsSwiss/lossesSwiss)
      - Bracket rounds (winsBracket/lossesBracket)
    - Final placement
    - Tiebreaker metrics

**Data Analysis Capabilities:**
This hierarchical structure enables sophisticated analysis:
- Card-level analysis:
  - Win rate when included in decks
  - Frequency of inclusion by commander
  - Performance in different strategies
  - Meta share over time

- Deck-level analysis:
  - Overall win rates
  - Performance by player skill level
  - Matchup statistics
  - Meta adaptation over time

- Player-level analysis:
  - Tournament performance history
  - Preferred strategies/commanders
  - Win rates with different decks
  - Consistency metrics

- Meta-level analysis:
  - Color identity success rates
  - Commander popularity trends
  - Strategy prevalence
  - Format evolution over time

- Tournament structure analysis:
  - Optimal round numbers
  - Table size impact
  - Position-based advantages
  - Bracket structure effectiveness

**Edge Cases and Special Considerations:**
1. Player Identity:
   - Anonymous players without Topdeck.gg IDs
   - Players using different names across tournaments
   - Account merging/splitting

2. Decklist Verification:
   - Non-Moxfield decklist URLs
   - Invalid/broken decklist links
   - Missing decklist information
   - Decklist changes during tournaments

3. Tournament Structure:
   - Variable player counts per table
   - Incomplete rounds
   - Modified bracket structures
   - Tournament cancellations

4. Card Data:
   - Multiple printings of the same card
   - Double-faced cards
   - Split cards
   - Cards with errata
   - Digital-only versions
   - Inconsistent card IDs between systems

5. Data Consistency:
   - Timestamp synchronization
   - Result reporting accuracy
   - Player name standardization
   - Deck identification across platforms

## Core Concepts

### Deck

A deck in cedhtools represents a 100-card Commander deck played in tournaments. Key characteristics:

- Exactly 100 cards including commander(s)
- One or two commanders that define color identity
- Unique cards except for basic lands and special cases
- Identified by Moxfield's publicId

**Properties:**
| Property | Description |
|----------|-------------|
| id | Moxfield publicDeckId for unique identification |
| name | Given name of the deck |
| description | Deck description |
| commanders | Array of commander Card objects |
| cards | Array of non-commander Card objects |
| colorIdentity | Array of colors from commander(s) |

> See `/sample_data/moxfield_deck.json` for a complete example.

### Card

A Magic: The Gathering card that can be played in commander decks. 

**Relevant Card Types:**
- Creature
- Planeswalker
- Instant
- Sorcery
- Enchantment
- Artifact
- Land

**Properties:**
| Property | Description |
|----------|-------------|
| id | Moxfield uniqueCardId |
| uri | Scryfall page URI |
| type | Card supertype |
| typeLine | Full type line |
| name | Card name(s) |
| colorIdentity | Array of colors in identity |
| manaCost | Mana cost(s) |
| imageUri | Scryfall image URI |
| legality | Commander format legality |
| oracleText | Card's oracle text |

> See `/sample_data/scryfall_cards.json` for examples.

### Tournament

A cEDH event from Topdeck.gg where decks compete.

**Properties:**
| Property | Description |
|----------|-------------|
| id | Topdeck.gg tournament ID |
| name | Tournament name |
| swissNum | Number of swiss rounds |
| startDate | Tournament start date/time |
| rounds | Array of Round objects |
| topCut | Number of players advancing |
| standings | Array of Standing objects |

**Round Properties:**
| Property | Description |
|----------|-------------|
| round | Round number or stage (e.g. "Top 16") |
| tables | Array of Table objects |

**Table Properties:**
| Property | Description |
|----------|-------------|
| table | Table number |
| players | Array of player information |
| winner | Winner name or "Draw" |
| winner_id | Winner ID or "Draw" |

> See `/sample_data/topdeck_tournament.json` for a complete example.

### Player

A person who participates in tournaments.

**Properties:**
| Property | Description |
|----------|-------------|
| id | Topdeck.gg player ID (if available) |
| name | Player name |

**Standing Properties:**
| Property | Description |
|----------|-------------|
| name | Player name |
| id | Player ID |
| decklist | Moxfield decklist URL |
| wins/losses/draws | Game results |
| winsSwiss/lossesSwiss | Swiss round results |
| winsBracket/lossesBracket | Bracket results |
| byes | Number of byes received |

## Architecture

### Frontend

**Tech Stack:**
- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Recharts
- Lucide Icons

### API

Currently evaluating:
- Rust
- FastAPI
- Other options that prioritize performance while maintaining reliability

### Databases

The application uses two databases:
1. **User DB** (PostgreSQL)
   - User information
   - Authentication data

2. **Data DB** (TimescaleDB)
   - cEDH tournament data
   - Card and deck statistics
   - Historical trends

### Data Ingestion

Multi-step ETL pipeline:
1. Topdeck.gg tournament data
2. Moxfield decklist data
3. Scryfall card data

## Frontend Routes

### Dashboard (`/`)

The home page serves as a comprehensive overview of the current cEDH meta state.

**Key Metrics Cards:**
```typescript
interface MetricCard {
  title: string;
  value: number;
  change: number;  // Percentage change from previous period
  trend: 'up' | 'down' | 'neutral';
  period: 'day' | 'week' | 'month';
}

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  tournamentSize: {
    min: number;
    max: number;
  };
  topCut: number[];  // e.g., [8, 16, 32]
  minGames: number;
}
```
- Total tournaments this month
- Active players this month
- Most popular commander
- Most successful commander (by win rate)

**Meta Overview:**
```typescript
interface ColorIdentityStats {
  colors: string[];
  deckCount: number;
  winRate: number;
  popularity: number;
  recentTrend: number;
  byTournamentSize: Array<{
    size: string;  // e.g., "Small (<32)", "Medium (32-64)", "Large (>64)"
    winRate: number;
    popularity: number;
  }>;
  byTopCut: Array<{
    cut: number;
    winRate: number;
    popularity: number;
  }>;
}
```
- Pie Chart: Color identity distribution
- Bar Chart: Color identity win rates
- Line Chart: Color identity trends over time (last 3 months)

**Commander Performance:**
```typescript
interface CommanderStats {
  name: string;
  colors: string[];
  gamesPlayed: number;
  winRate: number;
  popularity: number;
  recentResults: Array<{
    tournamentId: string;
    placement: number;
    playerName: string;
    date: string;
    tournamentSize: number;
    topCut: number;
  }>;
  performance: {
    overall: {
      winRate: number;
      popularity: number;
    };
    byTournamentSize: Array<{
      size: string;
      winRate: number;
      popularity: number;
    }>;
    byTopCut: Array<{
      cut: number;
      winRate: number;
      popularity: number;
    }>;
  };
}
```
- Table: Top 10 commanders by win rate (min. 20 games)
- Bar Chart: Most played commanders
- Scatter Plot: Win rate vs. Popularity

**Recent Tournament Results:**
```typescript
interface TournamentSummary {
  id: string;
  name: string;
  date: string;
  playerCount: number;
  winner: {
    name: string;
    deck: {
      commanders: string[];
      colors: string[];
      url: string;
    };
  };
  topCut: Array<{
    placement: number;
    playerName: string;
    commanders: string[];
  }>;
}
```
- Table: Last 5 tournaments with winners
- Stats: Average tournament size
- Chart: Tournament attendance trend

**Position Analysis:**
```typescript
interface PositionStats {
  position: number;  // 1-4
  gamesPlayed: number;
  winRate: number;
  drawRate: number;
  byColorIdentity: Record<string, number>;  // Win rates by color
}
```
- Bar Chart: Win rates by seat position
- Heat Map: Color identity performance by position

### Commanders

#### List (`/commanders`)
```typescript
interface CommanderListStats {
  commanders: Array<{
    id: string;
    name: string;
    colors: string[];
    partnerWith?: string;
    stats: {
      gamesPlayed: number;
      winRate: number;
      drawRate: number;
      popularity: number;
      trend: number;
      byTournamentSize: Array<{
        size: string;
        gamesPlayed: number;
        winRate: number;
      }>;
      byTopCut: Array<{
        cut: number;
        appearances: number;
        winRate: number;
      }>;
    };
    recentResults: Array<{
      tournamentId: string;
      placement: number;
      date: string;
    }>;
  }>;
  filters: {
    colors: string[];
    minGames: number;
    period: string;
    partnerOnly: boolean;
    dateRange: {
      start: string;
      end: string;
    };
    tournamentSize: {
      min: number;
      max: number;
    };
    topCut: number[];
  };
}
```

**Components:**
- Filterable data table with columns:
  - Commander name(s)
  - Color identity
  - Games played
  - Win rate
  - Draw rate
  - Popularity
  - Trend
- Color identity filter (shadcn multi-select)
- Time period selector
- Partner commander toggle

#### Details (`/commanders/[commanderId]`)
```typescript
interface CommanderDetailStats {
  commander: {
    id: string;
    name: string;
    colors: string[];
    partnerWith?: string;
    imageUri: string;
  };
  performance: {
    overall: {
      gamesPlayed: number;
      winRate: number;
      drawRate: number;
      tournamentWins: number;
      topCuts: number[];  // Array of top X finishes
    };
    byPeriod: Array<{
      period: string;
      gamesPlayed: number;
      winRate: number;
      popularity: number;
    }>;
    byMatchup: Array<{
      opponent: string;
      gamesPlayed: number;
      winRate: number;
    }>;
    byPosition: Array<{
      position: number;
      gamesPlayed: number;
      winRate: number;
    }>;
  };
  players: Array<{
    name: string;
    gamesPlayed: number;
    winRate: number;
    bestFinish: number;
    recentResults: Array<{
      tournamentId: string;
      placement: number;
      date: string;
    }>;
  }>;
  decklists: Array<{
    url: string;
    player: string;
    tournament: string;
    placement: number;
    date: string;
  }>;
}
```

**Components:**
- Hero section with commander card(s)
- Performance metrics cards
- Line chart: Win rate over time
- Line chart: Popularity over time
- Bar chart: Position performance
- Heat map: Matchup win rates
- Table: Top players
- Table: Recent tournament results
- Table: Notable decklists

#### Cards (`/commanders/[commanderId]/cards`)
```typescript
interface CommanderCardStats {
  cardsByType: Record<string, Array<{
    id: string;
    name: string;
    type: string;
    inclusion: {
      count: number;
      percentage: number;
    };
    performance: {
      winRate: number;
      drawRate: number;
    };
    trend: number;
    synergy: number;  // 0-1 score
  }>>;
  stapleMetrics: {
    averageSynergyScore: number;
    stapleCount: number;
    innovationScore: number;
  };
}
```

**Components:**
- Tabs for each card type
- Sortable tables with columns:
  - Card name
  - Inclusion rate
  - Win rate
  - Trend
  - Synergy score
- Pie chart: Card type distribution
- Bar chart: Top performing cards
- Line chart: Card inclusion trends
- Synergy heat map

#### Card Details (`/commanders/[commanderId]/cards/[cardId]`)
```typescript
interface CommanderCardDetail {
  card: {
    id: string;
    name: string;
    type: string;
    imageUri: string;
    oracleText: string;
  };
  usage: {
    overall: {
      inclusion: number;
      winRate: number;
      synergy: number;
    };
    byPeriod: Array<{
      period: string;
      inclusion: number;
      winRate: number;
    }>;
    byVariant: Array<{
      decklist: string;
      inclusion: number;
      winRate: number;
    }>;
  };
  alternatives: Array<{
    card: string;
    inclusion: number;
    winRate: number;
    correlation: number;
  }>;
}
```

**Components:**
- Card display with oracle text
- Performance metrics cards
- Line chart: Usage over time
- Line chart: Win rate over time
- Bar chart: Performance in different variants
- Table: Alternative card suggestions
- Synergy network graph

### Players

#### List (`/players`)
```typescript
interface PlayerListStats {
  players: Array<{
    id: string;
    name: string;
    stats: {
      tournaments: number;
      wins: number;
      topCuts: number;
      winRate: number;
      favorite: {
        commander: string;
        games: number;
        winRate: number;
      };
      byTournamentSize: Array<{
        size: string;
        tournaments: number;
        winRate: number;
      }>;
      byTopCut: Array<{
        cut: number;
        appearances: number;
        winRate: number;
      }>;
    };
    recent: {
      trend: number;
      lastSeen: string;
      lastDeck: string;
    };
  }>;
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    tournamentSize: {
      min: number;
      max: number;
    };
    topCut: number[];
    minTournaments: number;
  };
}
```

**Components:**
- Searchable data table
- Performance filters
- Activity period selector
- Commander filters

#### Details (`/players/[playerId]`)
```typescript
interface PlayerDetailStats {
  player: {
    id: string;
    name: string;
    joinDate: string;
  };
  performance: {
    overall: {
      tournaments: number;
      wins: number;
      topCuts: number[];
      winRate: number;
    };
    byCommander: Array<{
      commander: string;
      games: number;
      winRate: number;
      lastPlayed: string;
    }>;
    byPeriod: Array<{
      period: string;
      tournaments: number;
      winRate: number;
      deck: string;
    }>;
  };
  tournaments: Array<{
    id: string;
    date: string;
    name: string;
    deck: string;
    placement: number;
    record: {
      wins: number;
      losses: number;
      draws: number;
    };
  }>;
}
```

**Components:**
- Player stats cards
- Line chart: Performance over time
- Pie chart: Commander distribution
- Bar chart: Tournament placements
- Table: Tournament history
- Heat map: Win rates by commander

### Tournaments

#### List (`/tournaments`)
```typescript
interface TournamentListStats {
  tournaments: Array<{
    id: string;
    name: string;
    date: string;
    players: number;
    rounds: number;
    topCut: number;
    winner: {
      name: string;
      deck: string;
    };
    meta: {
      topCommander: string;
      colorDistribution: Record<string, number>;
    };
  }>;
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    size: {
      min: number;
      max: number;
    };
    topCut: number[];
    format: 'swiss' | 'bracket' | 'both';
  };
  aggregates: {
    bySize: Array<{
      size: string;
      count: number;
      averagePlayerCount: number;
    }>;
    byTopCut: Array<{
      cut: number;
      count: number;
      averagePlayerCount: number;
    }>;
    byMonth: Array<{
      month: string;
      count: number;
      averagePlayerCount: number;
    }>;
  };
}
```

**Components:**
- Filterable tournament table
- Calendar view option
- Tournament size distribution chart
- Meta breakdown charts

#### Details (`/tournaments/[tournamentId]`)
```typescript
interface TournamentDetailStats {
  tournament: {
    id: string;
    name: string;
    date: string;
    format: {
      players: number;
      swiss: number;
      topCut: number;
    };
    rounds: Array<{
      number: number;
      tables: Array<{
        players: Array<{
          name: string;
          deck: string;
          result: string;
        }>;
      }>;
    }>;
    standings: Array<{
      rank: number;
      player: string;
      deck: string;
      record: {
        wins: number;
        losses: number;
        draws: number;
      };
      tiebreakers: number[];
    }>;
    meta: {
      commanders: Record<string, number>;
      colors: Record<string, number>;
      archetypes: Record<string, number>;
    };
  };
}
```

**Components:**
- Tournament info cards
- Bracket visualization
- Swiss rounds tables
- Final standings table
- Meta breakdown charts:
  - Commander distribution
  - Color identity distribution
  - Archetype distribution
- Performance analysis:
  - Position win rates
  - Color identity success rates
  - Commander success rates

---

**Note:** The application handles edge cases such as:
- Anonymous players
- Non-Moxfield decklists
- Variable player counts per table
- Multiple printings of cards
- Data inconsistencies between sources