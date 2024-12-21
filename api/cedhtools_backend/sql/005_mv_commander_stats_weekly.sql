DROP MATERIALIZED VIEW IF EXISTS mv_commander_stats_weekly;

CREATE MATERIALIZED VIEW mv_commander_stats_weekly AS
WITH weekly_summary AS (
    SELECT
        ps.commander_ids,         -- Commander IDs array
        ps.commander_names,       -- Commander names array
        date_trunc('week', TO_TIMESTAMP(ps.start_date)) AS week, -- Weekly bucket
        COUNT(DISTINCT ps.deck_id) AS total_decks,  -- Unique decks
        AVG(ps.win_rate) AS avg_win_rate,           -- Average win rate
        AVG(ps.draw_rate) AS avg_draw_rate          -- Average draw rate
    FROM
        mv_player_standings ps
    WHERE
        ps.deck_id IS NOT NULL  -- Exclude entries without a deck
    GROUP BY
        ps.commander_ids,
        ps.commander_names,
        week
)
select
    ROW_NUMBER() OVER (ORDER BY week, commander_names) AS id, -- Add a synthetic primary key
    commander_ids,
    commander_names,
    week,
    total_decks,
    avg_win_rate,
    avg_draw_rate
FROM
    weekly_summary
ORDER BY
    week, commander_names;

CREATE INDEX IF NOT EXISTS idx_mv_commander_stats_weekly_week
ON mv_commander_stats_weekly (week);

CREATE INDEX IF NOT EXISTS idx_mv_commander_stats_weekly_commander_ids
ON mv_commander_stats_weekly
USING GIN (commander_ids);

CREATE INDEX IF NOT EXISTS idx_mv_commander_stats_weekly_commander_names
ON mv_commander_stats_weekly
USING GIN (commander_names)
