# DBs

## data-mongodb

### Collections (cedhtools-data)

- `card`
- `deck`
- `player`
- `stats`
- `tags`
- `tournament`

## user-mongodb

### Collections (user-data)

- `user`
- `session`

# TABLES

### ANY TABLE

- `{table_name}_id` (ObjectId)
- `{table_name}_name` (String)
- `{table_name}_desc` (String)
- `{table_name}_keys` (Array)
- `{table_name}_rules` (Array)

- `createdAt` (Date)
- `createdBy` (ObjectId)
- `updatedAt` (Date)
- `updatedBy` (ObjectId)

## cedhtools-data

### CARD

- `card_id` (ObjectId)
- `card_name` (String)
- `card_desc` (String)
- `card_keys` (Array)
- `card_rules` (Array)

- `card_link` (String)
- `card_image` (String)

- `card_createdAt` (Date)
- `card_createdBy` (ObjectId)
- `card_updatedAt` (Date)
- `card_updatedBy` (ObjectId)

### DECK

- `deck_id` (ObjectId)
- `deck_name` (String)
- `deck_desc` (String)
- `deck_keys` (Array)
- `deck_rules` (Array)

- `deck_cards` (Array)

- `deck_createdAt` (Date)
- `deck_createdBy` (ObjectId)
- `deck_updatedAt` (Date)
- `deck_updatedBy` (ObjectId)

### PLAYER

- `player_id` (ObjectId)
- `player_name` (String)
- `player_desc` (String)
- `player_keys` (Array)
- `player_rules` (Array)

- `player_stats` (Array)
- `player_links` (Array)

- `player_createdAt` (Date)
- `player_createdBy` (ObjectId)
- `player_updatedAt` (Date)
- `player_updatedBy` (ObjectId)

### STATS

- `stats_id` (ObjectId)
- `stats_name` (String)
- `stats_desc` (String)
- `stats_keys` (Array)
- `stats_rules` (Array)

- `stats_createdAt` (Date)
- `stats_createdBy` (ObjectId)
- `stats_updatedAt` (Date)
- `stats_updatedBy` (ObjectId)

### TAGS

- `tags_id` (ObjectId)
- `tags_name` (String)
- `tags_desc` (String)
- `tags_keys` (Array)
- `tags_rules` (Array)

- `tags_createdAt` (Date)
- `tags_createdBy` (ObjectId)
- `tags_updatedAt` (Date)
- `tags_updatedBy` (ObjectId)

### TOURNAMENT

- `tournament_id` (ObjectId)
- `tournament_name` (String)
- `tournament_desc` (String)
- `tournament_keys` (Array)
- `tournament_rules` (Array)

- `tournament_players` (Array)
- `tournament_decks` (Array)
- `tournament_cards` (Array)
- `tournament_stats` (Array)
- `tournament_tags` (Array)

- `tournament_createdAt` (Date)
- `tournament_createdBy` (ObjectId)
- `tournament_updatedAt` (Date)
- `tournament_updatedBy` (ObjectId)

## user-data

### USER

- `user_id` (ObjectId)
- `user_name` (String)
- `user_email` (String)
- `user_password` (String)
- `user_createdAt` (Date)
- `user_createdBy` (ObjectId)
- `user_updatedAt` (Date)
- `user_updatedBy` (ObjectId)

### SESSION

- `session_id` (ObjectId)
- `session_user` (ObjectId)
- `session_token` (String)
- `session_createdAt` (Date)
- `session_createdBy` (ObjectId)
- `session_updatedAt` (Date)
- `session_updatedBy` (ObjectId)



