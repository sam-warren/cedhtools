DROP MATERIALIZED VIEW IF EXISTS mv_commander_card_stats;

CREATE MATERIALIZED VIEW mv_commander_card_stats AS
SELECT
    ps.deck_id,
    ps.tournament_id,
    ps.commander_ids,
    ps.commander_names,
    dc.unique_card_id, -- Group by unique_card_id
    dc.card_face_id, -- Add card face ID for face-specific stats
    dc.card_face_name, -- Add card face name for clarity
    ps.win_rate,
    ps.draw_rate,
    ts.tournament_size,
    ts.start_date,
    ts.top_cut,
    cf.image_uris AS card_face_image_uris, -- Include face-specific images
    cf.mana_cost AS card_face_mana_cost,
    cf.type_line AS card_face_type_line,
    cf.oracle_text AS card_face_oracle_text,
    cf.colors AS card_face_colors
FROM
    mv_player_standings ps
JOIN
    mv_deck_cards dc ON ps.deck_id = dc.deck_id
JOIN
    card_face cf ON dc.card_face_id = cf.id -- Join with card_face table
JOIN
    mv_tournament_summary ts ON ps.tournament_id = ts.tournament_id
GROUP BY
    ps.deck_id, ps.tournament_id, dc.unique_card_id, dc.card_face_id, dc.card_face_name, ps.win_rate, ps.draw_rate, ps.commander_ids, ps.commander_names, ts.tournament_size, ts.start_date, ts.top_cut, cf.image_uris, cf.mana_cost, cf.type_line, cf.oracle_text, cf.colors;

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_deck_id
ON mv_commander_card_stats (deck_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_tournament_id
ON mv_commander_card_stats (tournament_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_unique_card_id
ON mv_commander_card_stats (unique_card_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_card_face_id
ON mv_commander_card_stats (card_face_id);
