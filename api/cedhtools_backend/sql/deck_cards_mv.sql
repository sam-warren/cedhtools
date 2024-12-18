CREATE MATERIALIZED VIEW deck_cards_mv AS
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
    mb.key IN ('mainboard', 'companions')
GROUP BY
    mb.deck_id, c.id, c.name;
