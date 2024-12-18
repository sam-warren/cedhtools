DROP MATERIALIZED VIEW IF EXISTS mv_deck_cards;

CREATE MATERIALIZED VIEW mv_deck_cards AS
SELECT
    mb.deck_id,
    c.unique_card_id, -- Unique identifier for the card
    c.name AS card_name
FROM
    moxfield_board mb
JOIN
    moxfield_board_card mbc ON mb.id = mbc.board_id
JOIN
    moxfield_card c ON mbc.card_id = c.id
WHERE
    mb.key IN ('mainboard', 'companions')  -- Include cards from mainboard and companions
GROUP BY
    mb.deck_id, c.unique_card_id, c.name;

CREATE INDEX IF NOT EXISTS idx_mv_deck_cards_deck_id
ON mv_deck_cards (deck_id);

CREATE INDEX IF NOT EXISTS idx_mv_deck_cards_unique_card_id
ON mv_deck_cards (unique_card_id);