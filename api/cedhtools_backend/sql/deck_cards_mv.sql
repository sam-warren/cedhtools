DROP MATERIALIZED VIEW IF EXISTS deck_cards_mv;

CREATE MATERIALIZED VIEW deck_cards_mv AS
SELECT
    mb.deck_id,
    c.unique_card_id, -- Unique identifier for the card
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
    mb.deck_id, c.unique_card_id, c.name;
