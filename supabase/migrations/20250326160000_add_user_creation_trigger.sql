-- Create a function to automatically create a user record when a new auth user is registered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, analyses_used, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 0, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add any existing users that might be missing
INSERT INTO public.users (id, email, analyses_used, created_at, updated_at)
SELECT id, email, 0, created_at, created_at 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.users); 