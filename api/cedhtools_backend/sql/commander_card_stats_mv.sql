CREATE MATERIALIZED VIEW commander_card_stats_mv AS
WITH deck_cards AS (
    -- Step 1: Gather cards from mainboard and companions
    SELECT
        mb.deck_id,
        c.id AS card_id,
        c.name AS card_name
    FROM
        cedhtools_backend_moxfieldboard mb
    JOIN
        cedhtools_backend_moxfieldboardcard mbc ON mb.id = mbc.board_id
    JOIN
        cedhtools_backend_moxfieldcard c ON mbc.card_id = c.id
    WHERE
        mb.key IN ('mainboard', 'companions')  -- Include cards from mainboard and companions
    GROUP BY
        mb.deck_id, c.id, c.name
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
    ps.commander_names,        -- Commander names as a single entity
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
    ps.commander_names,
    dc.card_id,
    dc.card_name,
    ts.tournament_size,
    ts.start_date,
    ts.top_cut;
