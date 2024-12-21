DROP MATERIALIZED VIEW IF EXISTS mv_card_details;

CREATE MATERIALIZED VIEW mv_card_details AS
SELECT
    mc.unique_card_id,
    sc.scryfall_id, -- Include Scryfall ID
    cf.id AS card_face_id,
    cf.name AS card_face_name,
    cf.mana_cost,
    cf.type_line,
    cf.oracle_text,
    cf.colors,
    cf.image_uris
FROM
    moxfield_card mc
JOIN
    scryfall_card sc ON mc.scryfall_id = sc.scryfall_id
JOIN
    scryfall_card_face cf ON sc.scryfall_id = cf.card_id
WHERE
    cf.image_uris IS NOT NULL -- Ensure image data exists
GROUP BY
    mc.unique_card_id, sc.scryfall_id, cf.id, cf.name, cf.mana_cost, cf.type_line, cf.oracle_text, cf.colors, cf.image_uris;

CREATE INDEX IF NOT EXISTS idx_mv_card_details_unique_card_id
ON mv_card_details (unique_card_id);

CREATE INDEX IF NOT EXISTS idx_mv_card_details_scryfall_id
ON mv_card_details (scryfall_id);
