-- Add type and type_line columns to the cards table
-- type is a numeric value (1-8) representing the card type from Moxfield
-- type_line is a string containing the full type line text

-- First, add the columns if they don't exist
ALTER TABLE IF EXISTS cards
ADD COLUMN IF NOT EXISTS type INTEGER,
ADD COLUMN IF NOT EXISTS type_line TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN cards.type IS 'Numeric type value (1-8) from Moxfield API: 1=Battle, 2=Planeswalker, 3=Creature, 4=Sorcery, 5=Instant, 6=Artifact, 7=Enchantment, 8=Land, 0=Unknown';
COMMENT ON COLUMN cards.type_line IS 'Full type line text from the card (e.g. "Legendary Creature — Human Wizard")'; 