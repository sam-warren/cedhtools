CREATE MATERIALIZED VIEW mv_tournament_summary AS
SELECT
    t.id AS tournament_id,
    t.start_date,
    t.top_cut,
    COUNT(ps.id) AS tournament_size
FROM
    topdeck_tournament t
LEFT JOIN
    topdeck_player_standing ps ON t.id = ps.tournament_id
GROUP BY
    t.id;

CREATE INDEX IF NOT EXISTS idx_mv_tournament_summary_tournament_id ON mv_tournament_summary (tournament_id);