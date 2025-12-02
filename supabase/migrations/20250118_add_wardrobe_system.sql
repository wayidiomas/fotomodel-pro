-- =====================================================
-- Migration: Add Wardrobe System
-- Date: 2025-01-18
-- Description: Adds wardrobe management system with collections and items
--              Users can organize their garments into collections and
--              use them across the app (chat flow, criar flow, etc.)
-- =====================================================

-- =====================================================
-- TABLE 1: wardrobe_collections
-- Purpose: User-created collections to organize garments (e.g., "Moda Inverno", "Linha Casual")
-- =====================================================
CREATE TABLE IF NOT EXISTS wardrobe_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Collection metadata
  name TEXT NOT NULL,
  description TEXT,
  icon_color TEXT DEFAULT '#3B82F6', -- Hex color for collection icon (blue-500 default)

  -- Computed/cached fields
  item_count INTEGER DEFAULT 0, -- Denormalized count for performance

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_wardrobe_collections_user
  ON wardrobe_collections(user_id, is_deleted)
  WHERE is_deleted = false;

-- Index for sorting by creation date
CREATE INDEX idx_wardrobe_collections_created
  ON wardrobe_collections(user_id, created_at DESC)
  WHERE is_deleted = false;

COMMENT ON TABLE wardrobe_collections IS 'User-created collections to organize wardrobe items';
COMMENT ON COLUMN wardrobe_collections.icon_color IS 'Hex color for collection icon (e.g., #3B82F6, #F97316)';
COMMENT ON COLUMN wardrobe_collections.item_count IS 'Cached count of items in collection (denormalized for performance)';

-- =====================================================
-- TABLE 2: wardrobe_items
-- Purpose: Individual garment pieces saved to user's wardrobe
-- =====================================================
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to uploaded image
  upload_id UUID NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,

  -- Organization
  collection_id UUID REFERENCES wardrobe_collections(id) ON DELETE SET NULL,

  -- Categorization (from generation flow)
  category_slug TEXT, -- e.g., "vestido-midi", "calca-jeans", "cabide", etc.
  garment_type TEXT, -- "single" or "outfit"
  piece_type TEXT, -- "upper", "lower", "full" (for outfit type)

  -- Tagging and organization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Custom tags for search/filtering

  -- Usage tracking
  is_favorite BOOLEAN DEFAULT false,
  wear_count INTEGER DEFAULT 0, -- How many times used in generations
  last_worn_at TIMESTAMPTZ, -- Last time used in a generation

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (color, pattern, occasion, etc.)

  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique upload per user (same upload can't be added twice)
  UNIQUE(user_id, upload_id)
);

-- Index for user lookups
CREATE INDEX idx_wardrobe_items_user
  ON wardrobe_items(user_id, is_deleted)
  WHERE is_deleted = false;

-- Index for collection lookups
CREATE INDEX idx_wardrobe_items_collection
  ON wardrobe_items(collection_id, is_deleted)
  WHERE is_deleted = false AND collection_id IS NOT NULL;

-- Index for category filtering
CREATE INDEX idx_wardrobe_items_category
  ON wardrobe_items(user_id, category_slug)
  WHERE is_deleted = false AND category_slug IS NOT NULL;

-- Index for favorites
CREATE INDEX idx_wardrobe_items_favorites
  ON wardrobe_items(user_id, is_favorite)
  WHERE is_deleted = false AND is_favorite = true;

-- Index for tag searching
CREATE INDEX idx_wardrobe_items_tags
  ON wardrobe_items USING gin(tags);

-- Index for sorting by wear count
CREATE INDEX idx_wardrobe_items_wear_count
  ON wardrobe_items(user_id, wear_count DESC)
  WHERE is_deleted = false;

COMMENT ON TABLE wardrobe_items IS 'Individual garment pieces saved to user wardrobe';
COMMENT ON COLUMN wardrobe_items.upload_id IS 'Foreign key to user_uploads table';
COMMENT ON COLUMN wardrobe_items.category_slug IS 'Category slug from generation flow (e.g., vestido-midi, cabide)';
COMMENT ON COLUMN wardrobe_items.garment_type IS 'Type: single (one piece) or outfit (conjunto)';
COMMENT ON COLUMN wardrobe_items.piece_type IS 'For outfit type: upper, lower, or full for single piece';
COMMENT ON COLUMN wardrobe_items.wear_count IS 'Number of times this item was used in generations';

-- =====================================================
-- FUNCTION: Update collection item_count
-- Purpose: Automatically update item count when items are added/removed
-- =====================================================
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for old collection (if item was moved)
  IF TG_OP = 'UPDATE' AND OLD.collection_id IS DISTINCT FROM NEW.collection_id THEN
    IF OLD.collection_id IS NOT NULL THEN
      UPDATE wardrobe_collections
      SET item_count = (
        SELECT COUNT(*)
        FROM wardrobe_items
        WHERE collection_id = OLD.collection_id
          AND is_deleted = false
      )
      WHERE id = OLD.collection_id;
    END IF;
  END IF;

  -- Update count for current collection
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.collection_id IS NOT NULL THEN
    UPDATE wardrobe_collections
    SET item_count = (
      SELECT COUNT(*)
      FROM wardrobe_items
      WHERE collection_id = NEW.collection_id
        AND is_deleted = false
    )
    WHERE id = NEW.collection_id;
  END IF;

  -- Update count when item is deleted
  IF TG_OP = 'DELETE' AND OLD.collection_id IS NOT NULL THEN
    UPDATE wardrobe_collections
    SET item_count = (
      SELECT COUNT(*)
      FROM wardrobe_items
      WHERE collection_id = OLD.collection_id
        AND is_deleted = false
    )
    WHERE id = OLD.collection_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update collection item count
CREATE TRIGGER trigger_update_collection_item_count
  AFTER INSERT OR UPDATE OR DELETE ON wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_item_count();

-- =====================================================
-- TRIGGERS: Auto-update updated_at columns
-- =====================================================
CREATE TRIGGER update_wardrobe_collections_updated_at
  BEFORE UPDATE ON wardrobe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wardrobe_items_updated_at
  BEFORE UPDATE ON wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE wardrobe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Collections: Users can only see/manage their own collections
CREATE POLICY "Users can view their own collections"
  ON wardrobe_collections FOR SELECT
  USING (user_id = auth.uid() AND is_deleted = false);

CREATE POLICY "Users can create their own collections"
  ON wardrobe_collections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own collections"
  ON wardrobe_collections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own collections"
  ON wardrobe_collections FOR DELETE
  USING (user_id = auth.uid());

-- Wardrobe Items: Users can only see/manage their own items
CREATE POLICY "Users can view their own wardrobe items"
  ON wardrobe_items FOR SELECT
  USING (user_id = auth.uid() AND is_deleted = false);

CREATE POLICY "Users can create their own wardrobe items"
  ON wardrobe_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wardrobe items"
  ON wardrobe_items FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own wardrobe items"
  ON wardrobe_items FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- GRANTS: Ensure proper permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON wardrobe_collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wardrobe_items TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
