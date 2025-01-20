-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS commander_matchup_statistics;

-- Create materialized view for commander matchup statistics
CREATE MATERIALIZED VIEW commander_matchup_statistics AS
WITH match_results AS (
    -- Get all matches with their winners and participants
    SELECT 
        m.id as match_id,
        m.tournament_id,
        t.start_date as tournament_date,
        m.winner_topdeck_id,
        m.is_draw,
        cdr_winner.commander_list as winning_commanders,
        cdr_loser.commander_list as losing_commanders,
        tps_winner.deck_id as winning_deck,
        tps_loser.deck_id as losing_deck
    FROM topdeck_match m
    JOIN topdeck_tournament t ON m.tournament_id = t.tid
    -- Join to get winner's deck info
    LEFT JOIN topdeck_player_standing tps_winner 
        ON m.winner_topdeck_id = tps_winner.player_topdeck_id 
        AND m.tournament_id = tps_winner.tournament_id
    LEFT JOIN commander_deck_relationships cdr_winner 
        ON tps_winner.deck_id = cdr_winner.deck_id
    -- Join to get loser's deck info through match players
    LEFT JOIN topdeck_match_player tmp 
        ON m.id = tmp.match_id
    LEFT JOIN topdeck_player_standing tps_loser 
        ON tmp.player_topdeck_id = tps_loser.player_topdeck_id 
        AND m.tournament_id = tps_loser.tournament_id
    LEFT JOIN commander_deck_relationships cdr_loser 
        ON tps_loser.deck_id = cdr_loser.deck_id
    WHERE NOT m.is_draw 
    AND tps_winner.deck_id != tps_loser.deck_id -- Exclude same deck matches
),
matchup_aggregates AS (
    -- Aggregate statistics for each commander matchup
    SELECT 
        winning_commanders,
        losing_commanders,
        tournament_date,
        COUNT(*) as win_count,
        MIN(tournament_date) as first_match_date,
        MAX(tournament_date) as last_match_date
    FROM match_results
    WHERE winning_commanders IS NOT NULL 
    AND losing_commanders IS NOT NULL
    GROUP BY winning_commanders, losing_commanders, tournament_date
)
SELECT 
    ROW_NUMBER() OVER () as id,
    winning_commanders,
    losing_commanders,
    tournament_date,
    win_count,
    first_match_date,
    last_match_date
FROM matchup_aggregates;

-- Create indices for efficient querying
CREATE UNIQUE INDEX ON commander_matchup_statistics(id);
CREATE INDEX ON commander_matchup_statistics USING gin(winning_commanders);
CREATE INDEX ON commander_matchup_statistics USING gin(losing_commanders);
CREATE INDEX ON commander_matchup_statistics(tournament_date);