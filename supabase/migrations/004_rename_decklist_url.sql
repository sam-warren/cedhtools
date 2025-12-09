-- Rename decklist_url to decklist for clarity
-- The field contains the actual decklist text, not just a URL

ALTER TABLE entries RENAME COLUMN decklist_url TO decklist;








