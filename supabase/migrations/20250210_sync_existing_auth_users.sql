-- Migration: Sync existing auth.users to public.users
-- This handles any users created before the trigger was in place

-- Insert any auth.users that don't have a corresponding public.users record
INSERT INTO public.users (id, email, phone, credits, current_plan_id, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.phone,
  5,  -- Give 5 initial credits
  (SELECT id FROM subscription_plans WHERE slug = 'free' LIMIT 1),  -- Assign free plan
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
