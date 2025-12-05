-- =====================================================
-- Migration: Fix Wardrobe Items UPDATE RLS Policy
-- Date: 2025-02-05
-- Description: Adds explicit WITH CHECK clause to allow soft delete
--              and creates a helper function for safe item deletion
-- =====================================================

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own wardrobe items" ON wardrobe_items;

-- Create a new UPDATE policy with explicit WITH CHECK
-- This allows users to update any column on their own items
CREATE POLICY "Users can update their own wardrobe items"
  ON wardrobe_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a SECURITY DEFINER function for soft-deleting wardrobe items
-- This function bypasses RLS and runs with the privileges of the function owner
CREATE OR REPLACE FUNCTION soft_delete_wardrobe_item(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_user_id UUID;
  requesting_user_id UUID;
BEGIN
  -- Get the requesting user's ID
  requesting_user_id := auth.uid();

  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the item's user_id to verify ownership
  SELECT user_id INTO item_user_id
  FROM wardrobe_items
  WHERE id = item_id;

  IF item_user_id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF item_user_id != requesting_user_id THEN
    RAISE EXCEPTION 'Not authorized to delete this item';
  END IF;

  -- Perform the soft delete
  UPDATE wardrobe_items
  SET is_deleted = true, updated_at = now()
  WHERE id = item_id;

  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_wardrobe_item(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION soft_delete_wardrobe_item IS 'Safely soft-deletes a wardrobe item, verifying ownership first';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
