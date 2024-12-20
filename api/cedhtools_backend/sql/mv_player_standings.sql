DROP MATERIALIZED VIEW IF EXISTS mv_player_standings;

-- Create the materialized view for player standings with commander and tournament details
CREATE MATERIALIZED VIEW mv_player_standings AS

WITH deck_commanders AS (
    -- Step 1: Identify the commander IDs and names for each deck using the commanders board
    SELECT
        mb.deck_id,
        ARRAY_AGG(DISTINCT c.unique_card_id ORDER BY c.unique_card_id) AS commander_ids, -- Sorted array of commander IDs
        ARRAY_AGG(DISTINCT c.name ORDER BY c.name) AS commander_names -- Sorted array of commander names
    FROM
        moxfield_board mb
    JOIN
        moxfield_board_card mbc ON mb.id = mbc.board_id
    JOIN
        moxfield_card c ON mbc.card_id = c.id
    WHERE
        mb.key = 'commanders'  -- Only consider boards with key='commanders'
    GROUP BY
        mb.deck_id
    HAVING COUNT(mbc.card_id) > 0  -- Skip boards without commanders
),
tournament_summary AS (
    -- Step 2: Calculate tournament size, top cut, and start date directly
    SELECT
        t.id AS tournament_id,
        t.start_date,
        t.top_cut,
        COUNT(ps.id) AS num_players  -- Aggregate player count for tournament size
    FROM
        topdeck_tournament t
    LEFT JOIN
        topdeck_player_standing ps ON t.id = ps.tournament_id
    GROUP BY
        t.id, t.start_date, t.top_cut
)

-- Final Step: Combine player standings with commanders and tournament details
SELECT
    ps.id AS playerstanding_id,
    ps.wins,
    ps.draws,
    ps.losses,
    ps.deck_id,
    ps.tournament_id,
    dc.commander_ids,         -- Commander IDs array
    dc.commander_names,       -- Commander names array
    ts.num_players AS tournament_size,  -- Tournament size
    ts.top_cut,               -- Top cut
    ts.start_date,            -- Tournament start date
    CASE 
        WHEN (ps.wins + ps.draws + ps.losses) = 0 THEN 0
        ELSE ps.wins::FLOAT / (ps.wins + ps.draws + ps.losses)
    END AS win_rate,          -- Win rate: wins / total rounds
    CASE 
        WHEN (ps.wins + ps.draws + ps.losses) = 0 THEN 0
        ELSE ps.draws::FLOAT / (ps.wins + ps.draws + ps.losses)
    END AS draw_rate          -- Draw rate: draws / total rounds
FROM
    topdeck_player_standing ps
JOIN
    deck_commanders dc ON ps.deck_id = dc.deck_id
LEFT JOIN
    tournament_summary ts ON ps.tournament_id = ts.tournament_id
WHERE
    ps.deck_id IS NOT NULL;  -- Skip player standings where deck_id is NULL

CREATE INDEX IF NOT EXISTS idx_mv_player_standings_playerstanding_id
ON mv_player_standings (playerstanding_id);

CREATE INDEX IF NOT EXISTS idx_mv_player_standings_tournament_id
ON mv_player_standings (tournament_id);

CREATE INDEX IF NOT EXISTS idx_mv_player_standings_deck_id
ON mv_player_standings (deck_id);

CREATE INDEX IF NOT EXISTS idx_mv_player_standings_commander_ids
ON mv_player_standings
USING GIN (commander_ids);

CREATE INDEX IF NOT EXISTS idx_mv_player_standings_commander_names
ON mv_player_standings
USING GIN (commander_names);