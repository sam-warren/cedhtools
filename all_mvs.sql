-- 1. Base view for commander deck relationships
DROP MATERIALIZED VIEW IF EXISTS commander_deck_relationships CASCADE;
CREATE MATERIALIZED VIEW commander_deck_relationships AS
WITH commander_cards AS (
    SELECT 
        dc.deck_id,
        mc.unique_card_id,
        sc.name
    FROM moxfield_deck_card dc
    JOIN moxfield_card mc ON dc.card_id = mc.id
    JOIN scryfall_card sc ON mc.scryfall_id = sc.id
    WHERE dc.board = 'commanders'
),
deck_commanders AS (
    SELECT 
        deck_id,
        CASE 
            WHEN COUNT(*) = 1 THEN 
                ARRAY[MIN(unique_card_id)]
            ELSE 
                ARRAY[
                    MIN(unique_card_id),
                    MAX(unique_card_id)
                ]
        END as commander_list,
        CASE 
            WHEN COUNT(*) = 1 THEN 
                ARRAY[MIN(name)]
            ELSE 
                ARRAY[
                    MIN(name),
                    MAX(name)
                ]
        END as commander_names,
        COUNT(*) as num_commanders
    FROM commander_cards
    GROUP BY deck_id
)
SELECT 
    deck_id,
    commander_list,
    commander_names,
    num_commanders,
    md.colors,
    md.color_identity
FROM deck_commanders
JOIN moxfield_deck md ON deck_commanders.deck_id = md.id;

CREATE UNIQUE INDEX ON commander_deck_relationships(deck_id);
CREATE INDEX ON commander_deck_relationships USING gin(commander_list);
CREATE INDEX ON commander_deck_relationships USING gin(commander_names);
CREATE INDEX ON commander_deck_relationships USING gin(colors);
CREATE INDEX ON commander_deck_relationships USING gin(color_identity);

-- 2. View for card color identity relationships
DROP MATERIALIZED VIEW IF EXISTS card_color_identity_relationships CASCADE;
CREATE MATERIALIZED VIEW card_color_identity_relationships AS
WITH card_base AS (
    SELECT DISTINCT
        mc.unique_card_id,
        sc.color_identity,
        sc.name,
        sc.type,
        sc.cmc
    FROM moxfield_card mc
    JOIN scryfall_card sc ON mc.scryfall_id = sc.id
    WHERE mc.unique_card_id IS NOT NULL
),
color_identity_counts AS (
    SELECT 
        cb.unique_card_id,
        cb.color_identity,
        cb.name,
        cb.type,
        cb.cmc,
        COUNT(DISTINCT md.id) as potential_deck_count
    FROM card_base cb
    CROSS JOIN moxfield_deck md
    WHERE 
        cb.color_identity = '{}' 
        OR cb.color_identity <@ md.color_identity
    GROUP BY cb.unique_card_id, cb.color_identity, cb.name, cb.type, cb.cmc
)
SELECT 
    unique_card_id,
    color_identity,
    name,
    type,
    cmc,
    potential_deck_count
FROM color_identity_counts;

CREATE UNIQUE INDEX ON card_color_identity_relationships(unique_card_id);
CREATE INDEX ON card_color_identity_relationships USING gin(color_identity);
CREATE INDEX ON card_color_identity_relationships(potential_deck_count);

-- 3. View for commander matchup statistics
DROP MATERIALIZED VIEW IF EXISTS commander_matchup_statistics CASCADE;
CREATE MATERIALIZED VIEW commander_matchup_statistics AS
WITH match_players AS (
    SELECT 
        m.id as match_id,
        m.tournament_id,
        t.start_date as tournament_date,
        m.winner_topdeck_id,
        array_remove(array_agg(DISTINCT tmp.player_topdeck_id), m.winner_topdeck_id) as loser_topdeck_ids
    FROM topdeck_match m
    JOIN topdeck_tournament t ON m.tournament_id = t.tid
    JOIN topdeck_match_player tmp ON m.id = tmp.match_id
    WHERE NOT m.is_draw
    GROUP BY m.id, m.tournament_id, t.start_date, m.winner_topdeck_id
),
expanded_matchups AS (
    SELECT 
        mp.match_id,
        mp.tournament_id,
        mp.tournament_date,
        mp.winner_topdeck_id,
        unnest(mp.loser_topdeck_ids) as loser_topdeck_id
    FROM match_players mp
),
match_commander_details AS (
    SELECT 
        em.match_id,
        em.tournament_date,
        cdr_winner.commander_list as winning_commanders,
        cdr_winner.commander_names as winning_commander_names,
        cdr_loser.commander_list as losing_commanders,
        cdr_loser.commander_names as losing_commander_names
    FROM expanded_matchups em
    JOIN topdeck_player_standing tps_winner 
        ON em.winner_topdeck_id = tps_winner.player_topdeck_id 
        AND em.tournament_id = tps_winner.tournament_id
    JOIN commander_deck_relationships cdr_winner 
        ON tps_winner.deck_id = cdr_winner.deck_id
    JOIN topdeck_player_standing tps_loser 
        ON em.loser_topdeck_id = tps_loser.player_topdeck_id 
        AND em.tournament_id = tps_loser.tournament_id
    JOIN commander_deck_relationships cdr_loser 
        ON tps_loser.deck_id = cdr_loser.deck_id
),
matchup_aggregates AS (
    SELECT 
        winning_commanders,
        winning_commander_names,
        losing_commanders,
        losing_commander_names,
        tournament_date,
        COUNT(*) as win_count,
        MIN(tournament_date) as first_match_date,
        MAX(tournament_date) as last_match_date
    FROM match_commander_details
    GROUP BY 
        winning_commanders,
        winning_commander_names,
        losing_commanders,
        losing_commander_names,
        tournament_date
)
SELECT 
    ROW_NUMBER() OVER () as id,
    winning_commanders,
    winning_commander_names,
    losing_commanders,
    losing_commander_names,
    tournament_date,
    win_count,
    first_match_date,
    last_match_date
FROM matchup_aggregates;

CREATE UNIQUE INDEX ON commander_matchup_statistics(id);
CREATE INDEX ON commander_matchup_statistics USING gin(winning_commanders);
CREATE INDEX ON commander_matchup_statistics USING gin(losing_commanders);
CREATE INDEX ON commander_matchup_statistics(tournament_date);

-- 4. View for card synergy statistics
DROP MATERIALIZED VIEW IF EXISTS card_synergy_statistics CASCADE;
CREATE MATERIALIZED VIEW card_synergy_statistics AS
WITH deck_cards AS (
    SELECT DISTINCT
        cdr.commander_list,
        mdc.deck_id,
        mc.unique_card_id,
        t.start_date as tournament_date
    FROM moxfield_deck_card mdc
    JOIN moxfield_card mc ON mdc.card_id = mc.id
    JOIN commander_deck_relationships cdr ON mdc.deck_id = cdr.deck_id
    JOIN topdeck_player_standing tps ON mdc.deck_id = tps.deck_id
    JOIN topdeck_tournament t ON tps.tournament_id = t.tid
    WHERE mdc.board = 'mainboard'
),
tournament_decks AS (
    SELECT DISTINCT
        tps.deck_id,
        cdr.color_identity,
        t.start_date as tournament_date
    FROM topdeck_player_standing tps
    JOIN topdeck_tournament t ON tps.tournament_id = t.tid
    JOIN commander_deck_relationships cdr ON tps.deck_id = cdr.deck_id
),
commander_totals AS (
    SELECT 
        commander_list,
        tournament_date,
        COUNT(DISTINCT deck_id) as total_decks
    FROM deck_cards
    GROUP BY commander_list, tournament_date
),
commander_card_counts AS (
    SELECT 
        dc.commander_list,
        dc.unique_card_id,
        dc.tournament_date,
        COUNT(DISTINCT dc.deck_id) as deck_count,
        ct.total_decks
    FROM deck_cards dc
    JOIN commander_totals ct 
        ON dc.commander_list = ct.commander_list 
        AND dc.tournament_date = ct.tournament_date
    GROUP BY dc.commander_list, dc.unique_card_id, dc.tournament_date, ct.total_decks
),
color_identity_usage AS (
    SELECT 
        ccr.unique_card_id,
        td.tournament_date,
        COUNT(DISTINCT dc.deck_id) as used_in_count,
        COUNT(DISTINCT td.deck_id) as potential_tournament_decks
    FROM card_color_identity_relationships ccr
    CROSS JOIN tournament_decks td
    LEFT JOIN deck_cards dc 
        ON ccr.unique_card_id = dc.unique_card_id 
        AND td.tournament_date = dc.tournament_date
        AND td.deck_id = dc.deck_id
    WHERE 
        ccr.color_identity = '{}'
        OR ccr.color_identity <@ td.color_identity
    GROUP BY ccr.unique_card_id, td.tournament_date
)
SELECT 
    ROW_NUMBER() OVER () as id,
    ccc.commander_list,
    ccc.unique_card_id,
    ccc.tournament_date,
    ccc.deck_count::float / NULLIF(ccc.total_decks, 0) as commander_usage_rate,
    ciu.used_in_count::float / NULLIF(ciu.potential_tournament_decks, 0) as color_identity_usage_rate,
    (ccc.deck_count::float / NULLIF(ccc.total_decks, 0)) - 
    (ciu.used_in_count::float / NULLIF(ciu.potential_tournament_decks, 0)) as synergy_score
FROM commander_card_counts ccc
JOIN color_identity_usage ciu 
    ON ccc.unique_card_id = ciu.unique_card_id 
    AND ccc.tournament_date = ciu.tournament_date;

CREATE UNIQUE INDEX ON card_synergy_statistics(id);
CREATE INDEX ON card_synergy_statistics USING gin(commander_list);
CREATE INDEX ON card_synergy_statistics(unique_card_id);
CREATE INDEX ON card_synergy_statistics(tournament_date);
CREATE INDEX ON card_synergy_statistics(synergy_score);