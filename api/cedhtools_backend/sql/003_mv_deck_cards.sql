DROP MATERIALIZED VIEW IF EXISTS mv_deck_cards;

CREATE MATERIALIZED VIEW mv_deck_cards AS
SELECT
    mb.deck_id,
    c.unique_card_id,
    cf.id AS card_face_id, -- Add the card face ID
    cf.name AS card_face_name, -- Include card face-specific name
    c.scryfall_id,
    cf.mana_cost AS card_face_mana_cost, -- Include face-specific mana cost
    cf.type_line AS card_face_type_line, -- Include face-specific type line
    cf.oracle_text AS card_face_oracle_text, -- Include face-specific oracle text
    cf.colors AS card_face_colors, -- Include face-specific colors
    c.color_identity AS card_color_identity,
    d.color_identity AS deck_color_identity
FROM
    moxfield_board mb
JOIN
    moxfield_board_card mbc ON mb.id = mbc.board_id
JOIN
    moxfield_card c ON mbc.card_id = c.id
JOIN
    card_face cf ON cf.card_id = c.id -- Join with card_face table
JOIN
    moxfield_deck d ON mb.deck_id = d.id
WHERE
    mb.key IN ('mainboard', 'companions')
    AND c.legalities->>'commander' = 'legal'
    AND c.type_line NOT LIKE 'Basic Land —%'
    AND c.color_identity <@ d.color_identity
GROUP BY
    mb.deck_id, c.id, c.unique_card_id, c.scryfall_id, cf.id, cf.name, cf.mana_cost, cf.type_line, cf.oracle_text, cf.colors, c.color_identity, d.color_identity;

CREATE INDEX IF NOT EXISTS idx_mv_deck_cards_deck_id ON mv_deck_cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_mv_deck_cards_unique_card_id ON mv_deck_cards (unique_card_id);
CREATE INDEX IF NOT EXISTS idx_mv_deck_cards_card_face_id ON mv_deck_cards (card_face_id);
