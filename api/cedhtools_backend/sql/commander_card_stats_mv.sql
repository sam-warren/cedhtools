-- Drop the existing materialized view if necessary
DROP MATERIALIZED VIEW IF EXISTS commander_card_stats_mv;

-- Recreate the materialized view
CREATE MATERIALIZED VIEW commander_card_stats_mv AS
WITH deck_cards AS (
    -- Step 1: Gather cards from mainboard and companions, and ensure legality and color identity
    SELECT
        mb.deck_id,
        c.id AS card_id,
        c.name AS card_name,
        ARRAY(SELECT jsonb_array_elements_text(c.color_identity)) AS card_color_identity,  -- Cast card color identity to array
        ARRAY(SELECT jsonb_array_elements_text(d.color_identity)) AS deck_color_identity   -- Cast deck color identity to array
    FROM
        cedhtools_backend_moxfieldboard mb
    JOIN
        cedhtools_backend_moxfieldboardcard mbc ON mb.id = mbc.board_id
    JOIN
        cedhtools_backend_moxfieldcard c ON mbc.card_id = c.id
    JOIN
        cedhtools_backend_moxfielddeck d ON mb.deck_id = d.id
    WHERE
        mb.key IN ('mainboard', 'companions')  -- Include cards from mainboard and companions
        AND c.legalities->>'commander' = 'legal'  -- Only include cards legal in Commander format
        AND ARRAY(SELECT jsonb_array_elements_text(c.color_identity)) <@ ARRAY(SELECT jsonb_array_elements_text(d.color_identity))  -- Card color identity must be a subset of the deck color identity
    GROUP BY
        mb.deck_id, c.id, c.name, c.color_identity, d.color_identity
),
tournament_summary AS (
    -- Step 2: Calculate tournament size dynamically
    SELECT
        t.id AS tournament_id,
        t.start_date,
        t.top_cut,
        COUNT(ps.id) AS tournament_size  -- Tournament size = total player standings
    FROM
        cedhtools_backend_topdecktournament t
    LEFT JOIN
        cedhtools_backend_topdeckplayerstanding ps ON t.id = ps.tournament_id
    GROUP BY
        t.id, t.start_date, t.top_cut
)

-- Step 3: Aggregate commander-card statistics
SELECT
    ps.commander_ids,         -- Include commander IDs
    ps.commander_names,       -- Commander names as a single entity
    dc.card_id,
    dc.card_name,
    COUNT(*) AS total_decks,   -- Total number of decks for this commander-card pair
    AVG(ps.win_rate) AS avg_win_rate,  -- Average win rate
    AVG(ps.draw_rate) AS avg_draw_rate, -- Average draw rate
    ts.tournament_size,        -- Dynamically calculated tournament size
    ts.start_date,
    ts.top_cut
FROM
    playerstanding_mv ps
JOIN
    deck_cards dc ON ps.deck_id = dc.deck_id
JOIN
    tournament_summary ts ON ps.tournament_id = ts.tournament_id
GROUP BY
    ps.commander_ids,
    ps.commander_names,
    dc.card_id,
    dc.card_name,
    ts.tournament_size,
    ts.start_date,
    ts.top_cut;
