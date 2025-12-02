-- =====================================================
-- Migration: Add Customization System
-- Date: 2025-01-16
-- Description: Adds personalization system with height, weight, facial expressions,
--              AI editing tools, backgrounds, and credit pricing
-- =====================================================

-- =====================================================
-- TABLE 1: customization_options
-- Purpose: Store all enum values for customization (expressions, hair colors, etc)
-- =====================================================
CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type TEXT NOT NULL CHECK (option_type IN (
    'facial_expression',
    'hair_color',
    'background_preset'
  )),
  option_value TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_name_pt TEXT, -- Portuguese translation
  display_order INTEGER DEFAULT 0,
  icon_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique combinations
  UNIQUE(option_type, option_value)
);

-- Index for fast filtering by type and active status
CREATE INDEX idx_customization_options_type_active
  ON customization_options(option_type, is_active, display_order);

COMMENT ON TABLE customization_options IS 'Stores enumerated options for model customization';
COMMENT ON COLUMN customization_options.option_type IS 'Type of option: facial_expression, hair_color, background_preset';
COMMENT ON COLUMN customization_options.option_value IS 'Internal value used in code (e.g., "smiling", "blonde")';
COMMENT ON COLUMN customization_options.display_name IS 'User-facing display name in English';
COMMENT ON COLUMN customization_options.display_name_pt IS 'User-facing display name in Portuguese';

-- =====================================================
-- TABLE 2: generation_customizations
-- Purpose: Store physical attributes and preferences for each generation
-- =====================================================
CREATE TABLE IF NOT EXISTS generation_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,

  -- Physical attributes
  model_height_cm INTEGER CHECK (model_height_cm IS NULL OR (model_height_cm BETWEEN 60 AND 220)),
  model_weight_kg INTEGER CHECK (model_weight_kg IS NULL OR (model_weight_kg BETWEEN 10 AND 150)),

  -- Facial expression (FK to customization_options)
  facial_expression TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one customization per upload
  UNIQUE(upload_id)
);

-- Index for fast lookup by upload
CREATE INDEX idx_generation_customizations_upload
  ON generation_customizations(upload_id);

-- Index for filtering by expression
CREATE INDEX idx_generation_customizations_expression
  ON generation_customizations(facial_expression) WHERE facial_expression IS NOT NULL;

COMMENT ON TABLE generation_customizations IS 'Stores physical attributes and facial expression for model generation';
COMMENT ON COLUMN generation_customizations.model_height_cm IS 'Model height in centimeters (60-220cm)';
COMMENT ON COLUMN generation_customizations.model_weight_kg IS 'Model weight in kilograms (10-150kg)';
COMMENT ON COLUMN generation_customizations.facial_expression IS 'Selected facial expression (references customization_options)';

-- =====================================================
-- TABLE 3: ai_editing_tools
-- Purpose: Catalog of available AI editing tools (remove bg, change hair, etc)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_editing_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL UNIQUE, -- Internal identifier: 'remove_background', 'change_background', etc.
  display_name TEXT NOT NULL, -- English display name
  display_name_pt TEXT, -- Portuguese display name
  description TEXT,
  description_pt TEXT, -- Portuguese description

  -- Pricing
  credits_cost INTEGER NOT NULL DEFAULT 1 CHECK (credits_cost >= 0),

  -- UI/UX
  icon_path TEXT,
  display_order INTEGER DEFAULT 0,
  category TEXT, -- 'background', 'appearance', 'branding'

  -- Status flags
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false, -- Requires premium subscription

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active tools ordered by display
CREATE INDEX idx_ai_editing_tools_active_order
  ON ai_editing_tools(is_active, display_order) WHERE is_active = true;

-- Index for category filtering
CREATE INDEX idx_ai_editing_tools_category
  ON ai_editing_tools(category, is_active) WHERE is_active = true;

COMMENT ON TABLE ai_editing_tools IS 'Catalog of AI-powered editing tools available for image generation';
COMMENT ON COLUMN ai_editing_tools.tool_name IS 'Unique internal identifier (e.g., "remove_background")';
COMMENT ON COLUMN ai_editing_tools.credits_cost IS 'Cost in credits per use of this tool';
COMMENT ON COLUMN ai_editing_tools.category IS 'Tool category: background, appearance, branding';

-- =====================================================
-- TABLE 4: generation_ai_edits
-- Purpose: Track individual AI edits applied to each generation
-- =====================================================
CREATE TABLE IF NOT EXISTS generation_ai_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES ai_editing_tools(id),

  -- Tool-specific parameters (stored as JSONB for flexibility)
  params JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- { "background_preset_id": "uuid" }
  -- { "custom_background_url": "https://..." }
  -- { "hair_color": "blonde" }
  -- { "logo_url": "https://...", "logo_position": "top-right" }

  -- Pricing & status
  credits_charged INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  -- Results
  result_url TEXT, -- URL of the edited image
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for finding edits by generation
CREATE INDEX idx_generation_ai_edits_generation
  ON generation_ai_edits(generation_id, status);

-- Index for finding edits by tool
CREATE INDEX idx_generation_ai_edits_tool
  ON generation_ai_edits(tool_id, status);

-- Index for processing queue (pending/processing edits)
CREATE INDEX idx_generation_ai_edits_queue
  ON generation_ai_edits(status, created_at)
  WHERE status IN ('pending', 'processing');

COMMENT ON TABLE generation_ai_edits IS 'Tracks individual AI editing operations applied to generations';
COMMENT ON COLUMN generation_ai_edits.params IS 'Tool-specific parameters in JSONB format';
COMMENT ON COLUMN generation_ai_edits.credits_charged IS 'Credits charged for this edit (usually 1)';
COMMENT ON COLUMN generation_ai_edits.status IS 'Processing status: pending, processing, completed, failed';

-- =====================================================
-- TABLE 5: background_presets
-- Purpose: Store 20+ pre-made background options
-- =====================================================
CREATE TABLE IF NOT EXISTS background_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_pt TEXT, -- Portuguese name
  description TEXT,
  description_pt TEXT, -- Portuguese description

  -- Image references
  image_url TEXT NOT NULL, -- Public URL
  storage_path TEXT, -- Supabase storage path
  thumbnail_url TEXT, -- Smaller preview

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'solid',      -- Solid colors
    'gradient',   -- Gradient backgrounds
    'texture',    -- Textured (marble, concrete, wood)
    'studio'      -- Studio photography setups
  )),
  color_hex TEXT, -- Primary color in hex (for solid/gradient)
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Additional searchable tags

  -- Business logic
  is_premium BOOLEAN DEFAULT false, -- Requires premium
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure legacy tables have the required columns
ALTER TABLE background_presets
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color_hex TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Index for filtering active backgrounds by category
CREATE INDEX IF NOT EXISTS idx_background_presets_category_active
  ON background_presets(category, is_active, display_order) WHERE is_active = true;

-- Index for premium filtering
CREATE INDEX IF NOT EXISTS idx_background_presets_premium
  ON background_presets(is_premium, is_active) WHERE is_active = true;

-- Index for tag searching
CREATE INDEX IF NOT EXISTS idx_background_presets_tags
  ON background_presets USING gin(tags);

COMMENT ON TABLE background_presets IS 'Pre-made background options for image generation';
COMMENT ON COLUMN background_presets.category IS 'Background type: solid, gradient, texture, studio';
COMMENT ON COLUMN background_presets.color_hex IS 'Primary color in hex format (e.g., #FFFFFF)';
COMMENT ON COLUMN background_presets.is_premium IS 'Whether this background requires premium subscription';

-- =====================================================
-- TABLE 6: credit_pricing
-- Purpose: Define credit costs for different actions
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE, -- 'base_generation', 'ai_edit', 'watermark_removal', etc.
  credits_required INTEGER NOT NULL CHECK (credits_required >= 0),
  description TEXT,
  description_pt TEXT, -- Portuguese description

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active pricing lookup
CREATE INDEX idx_credit_pricing_active
  ON credit_pricing(action_type, is_active) WHERE is_active = true;

COMMENT ON TABLE credit_pricing IS 'Defines credit costs for various actions in the system';
COMMENT ON COLUMN credit_pricing.action_type IS 'Type of action (e.g., "base_generation", "watermark_removal")';
COMMENT ON COLUMN credit_pricing.credits_required IS 'Number of credits required for this action';

-- =====================================================
-- TRIGGERS: Auto-update updated_at columns
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_customization_options_updated_at
  BEFORE UPDATE ON customization_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_customizations_updated_at
  BEFORE UPDATE ON generation_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_editing_tools_updated_at
  BEFORE UPDATE ON ai_editing_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_background_presets_updated_at
  BEFORE UPDATE ON background_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_pricing_updated_at
  BEFORE UPDATE ON credit_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_editing_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_ai_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public read access for customization options"
  ON customization_options FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for AI tools"
  ON ai_editing_tools FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for background presets"
  ON background_presets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public read access for credit pricing"
  ON credit_pricing FOR SELECT
  USING (is_active = true);

-- User-specific access for generation_customizations
CREATE POLICY "Users can view their own customizations"
  ON generation_customizations FOR SELECT
  USING (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own customizations"
  ON generation_customizations FOR INSERT
  WITH CHECK (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own customizations"
  ON generation_customizations FOR UPDATE
  USING (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

-- User-specific access for generation_ai_edits
CREATE POLICY "Users can view their own AI edits"
  ON generation_ai_edits FOR SELECT
  USING (
    generation_id IN (
      SELECT id FROM generations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own AI edits"
  ON generation_ai_edits FOR INSERT
  WITH CHECK (
    generation_id IN (
      SELECT id FROM generations WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- GRANTS: Ensure proper permissions
-- =====================================================
GRANT SELECT ON customization_options TO authenticated, anon;
GRANT SELECT ON ai_editing_tools TO authenticated, anon;
GRANT SELECT ON background_presets TO authenticated, anon;
GRANT SELECT ON credit_pricing TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE ON generation_customizations TO authenticated;
GRANT SELECT, INSERT ON generation_ai_edits TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
