-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS card_color_identity_relationships;

-- Create materialized view for card color identity relationships
CREATE MATERIALIZED VIEW card_color_identity_relationships AS
WITH card_base AS (
    -- Get unique cards and their color identities
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
    -- Calculate how many decks could potentially play each card
    SELECT 
        cb.unique_card_id,
        cb.color_identity,
        cb.name,
        cb.type,
        cb.cmc,
        COUNT(DISTINCT md.id) as potential_deck_count
    FROM card_base cb
    CROSS JOIN moxfield_deck md
    WHERE cb.color_identity <@ md.color_identity  -- color identity is a subset
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

-- Create indices for efficient querying
CREATE UNIQUE INDEX ON card_color_identity_relationships(unique_card_id);
CREATE INDEX ON card_color_identity_relationships USING gin(color_identity);
CREATE INDEX ON card_color_identity_relationships(potential_deck_count);