# API Refactoring Plan

## 1. Service Layer Restructuring

### Current Issues
- Business logic is tightly coupled with the view layer
- Complex data aggregation happening directly in view methods
- Lack of separation between data fetching and processing

### Proposed Solution
Create a dedicated service layer with the following structure:

```
services/
├── commander/
│   ├── commander_service.py      # Core commander-related business logic
│   ├── commander_repository.py   # Data access for commander-specific queries
│   └── dto.py                   # Data transfer objects for commander data
├── deck/
│   ├── deck_service.py          # Deck processing logic
│   ├── deck_repository.py       # Data access for deck-specific queries
│   └── dto.py                   # DTOs for deck data
└── statistics/
    ├── statistics_service.py    # Statistical computation service
    ├── statistics_repository.py # Data access for statistics
    └── dto.py                   # DTOs for statistics
```

## 2. API Endpoint Restructuring

### Current Issues
- Single monolithic endpoint handling multiple concerns
- Tight coupling between deck data and statistics
- Limited flexibility for different query patterns

### Proposed Solution
Split into multiple focused endpoints:

```python
# New API structure
/api/v1/commanders/{commander_id}/statistics
/api/v1/commanders/{commander_id}/cards
/api/v1/decks/{deck_id}/analysis
/api/v1/statistics/meta
```

Each endpoint would have a specific responsibility and return normalized data that can be composed on the client side as needed.

## 3. Data Model Improvements

### Current Issues
- Redundant data in materialized views
- Complex JOIN operations in views
- Limited flexibility for different query patterns

### Proposed Solution
Create more focused materialized views and add new models:

```sql
-- New materialized views
CREATE MATERIALIZED VIEW commander_meta_statistics AS
SELECT 
    commander_list,
    COUNT(DISTINCT deck_id) as total_decks,
    AVG(win_rate) as avg_win_rate,
    STDDEV(win_rate) as win_rate_stddev
FROM commander_deck_relationships cdr
JOIN topdeck_player_standing tps ON cdr.deck_id = tps.deck_id
GROUP BY commander_list;

-- Card performance view
CREATE MATERIALIZED VIEW card_performance_metrics AS
SELECT 
    card_id,
    commander_list,
    COUNT(DISTINCT deck_id) as usage_count,
    AVG(win_rate) as win_rate,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY win_rate) as median_win_rate
FROM card_statistics_by_commander
GROUP BY card_id, commander_list;
```

## 4. DTOs and Response Models

### Current Issues
- Mixed concerns in response objects
- Redundant data transformation
- Complex nested structures

### Proposed Solution
Create clear DTOs for each domain:

```python
# dto/commander.py
@dataclass
class CommanderMetaDTO:
    total_decks: int
    win_rate: float
    win_rate_stddev: float
    
@dataclass
class CardStatisticsDTO:
    card_id: str
    usage_count: int
    win_rate: float
    chi_squared: float
    p_value: float

# dto/deck.py
@dataclass
class DeckAnalysisDTO:
    deck_id: str
    cards: List[CardDTO]
    meta_statistics: MetaStatisticsDTO
```

## 5. Caching Strategy

### Implementation
Add Redis caching layer:

```python
# services/cache/cache_service.py
class CacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 3600  # 1 hour default

    async def get_commander_stats(self, commander_id: str) -> Optional[dict]:
        key = f"commander:stats:{commander_id}"
        return await self.redis.get(key)

    async def set_commander_stats(self, commander_id: str, stats: dict):
        key = f"commander:stats:{commander_id}"
        await self.redis.set(key, stats, ex=self.ttl)
```

## 6. Query Optimization

### Current Issues
- Complex JOINs in views
- Redundant data fetching
- Lack of query optimization

### Proposed Solution
Add database indices and optimize queries:

```sql
-- Add composite indices for common queries
CREATE INDEX idx_deck_card_board ON moxfield_deck_card(deck_id, card_id, board);
CREATE INDEX idx_commander_win_rate ON commander_meta_statistics(commander_list, win_rate);

-- Optimize materialized view refresh
CREATE MATERIALIZED VIEW CONCURRENTLY ...
```

## 7. API Versioning and Documentation

### Implementation
Add OpenAPI/Swagger documentation:

```python
# api/v1/schemas.py
class CommanderStatisticsSchema(Schema):
    """
    @openapi.schema(
        title="Commander Statistics",
        description="Statistical analysis of commander performance"
    )
    """
    meta_statistics: MetaStatisticsSchema
    card_statistics: CardStatisticsSchema
```

## Implementation Priority Order

1. Service Layer Restructuring
   - Split business logic from views
   - Implement DTOs
   - Create repository pattern

2. Database Optimization
   - Create new materialized views
   - Add indices
   - Optimize queries

3. API Endpoint Restructuring
   - Split endpoints
   - Implement new routes
   - Add versioning

4. Caching Layer
   - Implement Redis caching
   - Add cache invalidation

5. Documentation and Testing
   - Add OpenAPI documentation
   - Implement comprehensive tests
   - Add monitoring

## Migration Strategy

1. Create new service layer alongside existing code
2. Gradually migrate functionality to new services
3. Create new endpoints while maintaining old ones
4. Add feature flags for new functionality
5. Deprecate old endpoints after migration

## Monitoring and Performance Metrics

Add monitoring for:
- Query performance
- Cache hit rates
- API response times
- Error rates
- Database load

## Future Considerations

1. GraphQL API
   - Consider adding GraphQL for more flexible querying
   - Implement DataLoader for efficient batch loading

2. Real-time Updates
   - WebSocket support for live statistics
   - Event-driven architecture for updates

3. Horizontal Scaling
   - Stateless service design
   - Load balancing strategy
   - Database sharding plan