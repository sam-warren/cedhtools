DROP MATERIALIZED VIEW IF EXISTS commander_statistics_by_week;

CREATE MATERIALIZED VIEW commander_statistics_by_week AS
WITH weekly_summary AS (
    SELECT
        ps.commander_ids,         -- Commander IDs array
        ps.commander_names,       -- Commander names array
        date_trunc('week', TO_TIMESTAMP(ps.start_date)) AS week, -- Weekly bucket
        COUNT(DISTINCT ps.deck_id) AS total_decks,  -- Unique decks
        AVG(ps.win_rate) AS avg_win_rate,           -- Average win rate
        AVG(ps.draw_rate) AS avg_draw_rate          -- Average draw rate
    FROM
        player_standing_mv ps
    WHERE
        ps.deck_id IS NOT NULL  -- Exclude entries without a deck
    GROUP BY
        ps.commander_ids,
        ps.commander_names,
        week
)
SELECT
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
