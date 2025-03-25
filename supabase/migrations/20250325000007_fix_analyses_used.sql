-- Drop any existing trigger
DROP TRIGGER IF EXISTS increment_analyses_used ON deck_analyses;

-- Create a trigger function to increment analyses_used
CREATE OR REPLACE FUNCTION increment_analyses_used()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment analyses_used for the user
    UPDATE users
    SET analyses_used = analyses_used + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER increment_analyses_used
    AFTER INSERT ON deck_analyses
    FOR EACH ROW
    EXECUTE FUNCTION increment_analyses_used(); 