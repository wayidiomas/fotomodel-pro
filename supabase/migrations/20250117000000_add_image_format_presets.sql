-- Create image_format_presets table
-- Stores predefined image formats for different platforms (Instagram, Shopify, etc.)

CREATE TABLE IF NOT EXISTS image_format_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Dimensions
  aspect_ratio TEXT NOT NULL,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),

  -- Metadata
  description TEXT,
  icon_name TEXT,
  category TEXT,

  -- Flags
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Ordering
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for active formats
CREATE INDEX idx_image_format_presets_active
  ON image_format_presets(is_active, display_order)
  WHERE is_active = true;

-- Create index for platform lookup
CREATE INDEX idx_image_format_presets_platform
  ON image_format_presets(platform);

-- Add updated_at trigger
CREATE TRIGGER update_image_format_presets_updated_at
  BEFORE UPDATE ON image_format_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE image_format_presets IS 'Predefined image format presets for different platforms (Instagram, Shopify, Facebook, etc.)';
