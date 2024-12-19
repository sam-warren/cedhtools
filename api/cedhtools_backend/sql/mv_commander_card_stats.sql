DROP MATERIALIZED VIEW IF EXISTS mv_commander_card_stats;

CREATE MATERIALIZED VIEW mv_commander_card_stats AS
WITH deck_cards AS (
    -- Step 1: Gather cards from mainboard and companions, and ensure legality and color identity
    SELECT
        mb.deck_id,               -- Include deck_id here
        c.unique_card_id,         -- Unique identifier for the card
        c.name AS card_name,
        ARRAY(SELECT jsonb_array_elements_text(c.color_identity)) AS card_color_identity,  -- Cast card color identity to array
        ARRAY(SELECT jsonb_array_elements_text(d.color_identity)) AS deck_color_identity   -- Cast deck color identity to array
    FROM
        moxfield_board mb
    JOIN
        moxfield_board_card mbc ON mb.id = mbc.board_id
    JOIN
        moxfield_card c ON mbc.card_id = c.id
    JOIN
        moxfield_deck d ON mb.deck_id = d.id
    WHERE
        mb.key IN ('mainboard', 'companions')  -- Include cards from mainboard and companions
        AND c.legalities->>'commander' = 'legal'  -- Only include cards legal in Commander format
        AND ARRAY(SELECT jsonb_array_elements_text(c.color_identity)) <@ ARRAY(SELECT jsonb_array_elements_text(d.color_identity))  -- Card color identity must be a subset of the deck color identity
        AND c.type_line NOT LIKE 'Basic Land —%'  -- Exclude basic lands
    GROUP BY
        mb.deck_id, c.unique_card_id, c.name, c.color_identity, d.color_identity
),
tournament_summary AS (
    -- Step 2: Calculate tournament size dynamically
    SELECT
        t.id AS tournament_id,
        t.start_date,
        t.top_cut,
        COUNT(ps.id) AS tournament_size  -- Tournament size = total player standings
    FROM
        topdeck_tournament t
    LEFT JOIN
        topdeck_player_standing ps ON t.id = ps.tournament_id
    GROUP BY
        t.id, t.start_date, t.top_cut
)

-- Step 3: Aggregate commander-card statistics
SELECT
    ps.deck_id,               -- Include deck_id from mv_player_standings
    ps.tournament_id,         -- Include tournament_id
    ps.commander_ids,         -- Include commander IDs
    ps.commander_names,       -- Commander names as a single entity
    dc.unique_card_id,        -- Include unique_card_id
    dc.card_name,
    AVG(ps.win_rate) AS avg_win_rate,  -- Average win rate
    AVG(ps.draw_rate) AS avg_draw_rate, -- Average draw rate
    ts.tournament_size,        -- Dynamically calculated tournament size
    ts.start_date,
    ts.top_cut
FROM
    mv_player_standings ps
JOIN
    deck_cards dc ON ps.deck_id = dc.deck_id  -- Join on deck_id
JOIN
    tournament_summary ts ON ps.tournament_id = ts.tournament_id
GROUP BY
    ps.deck_id,               -- Group by deck_id
    ps.tournament_id,         -- Group by tournament_id
    ps.commander_ids,
    ps.commander_names,
    dc.unique_card_id,
    dc.card_name,
    ts.tournament_size,
    ts.start_date,
    ts.top_cut;


CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_deck_id
ON mv_commander_card_stats (deck_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_tournament_id
ON mv_commander_card_stats (tournament_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_commander_ids
ON mv_commander_card_stats
USING GIN (commander_ids);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_commander_names
ON mv_commander_card_stats
USING GIN (commander_names);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_unique_card_id
ON mv_commander_card_stats (unique_card_id);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_start_date
ON mv_commander_card_stats (start_date);

CREATE INDEX IF NOT EXISTS idx_mv_commander_card_stats_top_cut
ON mv_commander_card_stats (top_cut);
