-- Migration: Auto-create public.users when auth.users is created
-- This ensures Google OAuth (and any other OAuth provider) creates the corresponding public.users record

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id FROM subscription_plans WHERE slug = 'free' LIMIT 1;

  -- Insert into public.users only if the user doesn't already exist
  INSERT INTO public.users (id, email, phone, credits, current_plan_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    5,  -- Give 5 initial credits to new users
    free_plan_id,  -- Assign free plan by default
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Skip if user already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates to auth.users (in case email/phone is added later)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update public.users with new email/phone if changed
  UPDATE public.users
  SET
    email = COALESCE(NEW.email, email),
    phone = COALESCE(NEW.phone, phone),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing update trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger for updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone)
  EXECUTE FUNCTION public.handle_user_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.users TO supabase_auth_admin;
