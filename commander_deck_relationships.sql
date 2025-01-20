DROP MATERIALIZED VIEW IF EXISTS commander_deck_relationships;

-- Create materialized view for deck-commander relationships
CREATE MATERIALIZED VIEW commander_deck_relationships AS
WITH commander_cards AS (
    -- Get all commander cards for each deck
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
    -- Aggregate commanders for each deck, ensuring consistent ordering
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

-- Create indices for efficient querying
CREATE UNIQUE INDEX ON commander_deck_relationships(deck_id);
CREATE INDEX ON commander_deck_relationships USING gin(commander_list);
CREATE INDEX ON commander_deck_relationships USING gin(commander_names);
CREATE INDEX ON commander_deck_relationships USING gin(colors);
CREATE INDEX ON commander_deck_relationships USING gin(color_identity);