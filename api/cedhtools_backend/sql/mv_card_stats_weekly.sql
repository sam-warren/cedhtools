DROP MATERIALIZED VIEW IF EXISTS card_statistics_by_week;

CREATE MATERIALIZED VIEW card_statistics_by_week AS
WITH weekly_card_summary AS (
    SELECT
        ccs.commander_ids,        -- Commander IDs array
        ccs.commander_names,      -- Commander names array
        ccs.unique_card_id,       -- Unique identifier for the card
        ccs.card_name,            -- Card name
        date_trunc('week', TO_TIMESTAMP(ps.start_date)) AS week, -- Weekly bucket
        COUNT(DISTINCT ccs.deck_id) AS total_decks,  -- Unique decks including the card
        AVG(ps.win_rate) AS avg_win_rate,           -- Average win rate when this card is included
        AVG(ps.draw_rate) AS avg_draw_rate          -- Average draw rate when this card is included
    FROM
        mv_player_standings ps
    JOIN
        mv_commander_card_stats ccs ON ps.deck_id = ccs.deck_id  -- Join on deck_id
    WHERE
        ccs.deck_id IS NOT NULL  -- Exclude entries without a deck
    GROUP BY
        ccs.commander_ids,
        ccs.commander_names,
        ccs.unique_card_id,
        ccs.card_name,
        week
)
SELECT
    commander_ids,
    commander_names,
    unique_card_id,
    card_name,
    week,
    total_decks,
    avg_win_rate,
    avg_draw_rate
FROM
    weekly_card_summary
ORDER BY
    week, commander_names, card_name;

CREATE INDEX IF NOT EXISTS idx_mv_card_stats_weekly_unique_card_id
ON mv_card_stats_weekly (unique_card_id);

CREATE INDEX IF NOT EXISTS idx_mv_card_stats_weekly_week
ON mv_card_stats_weekly (week);

CREATE INDEX IF NOT EXISTS idx_mv_card_stats_weekly_commander_ids
ON mv_card_stats_weekly
USING GIN (commander_ids);

CREATE INDEX IF NOT EXISTS idx_mv_card_stats_weekly_commander_names
ON mv_card_stats_weekly
USING GIN (commander_names);