-- Migration: Create model_poses table for storing pose metadata
-- Created: 2025-01-15
-- Purpose: Store model pose images with metadata for filtering and selection

-- ============================================================================
-- CREATE ENUMS
-- ============================================================================

-- Model Gender Enum
CREATE TYPE model_gender AS ENUM (
  'MALE',
  'FEMALE',
  'NON_BINARY'
);

-- Model Ethnicity Enum
CREATE TYPE model_ethnicity AS ENUM (
  'CAUCASIAN',
  'AFRICAN',
  'ASIAN',
  'HISPANIC',
  'MIDDLE_EASTERN',
  'MIXED',
  'OTHER'
);

-- Pose Category Enum
CREATE TYPE pose_category AS ENUM (
  'STANDING_STRAIGHT',
  'STANDING_CASUAL',
  'STANDING_CONFIDENT',
  'SITTING',
  'WALKING',
  'LEANING',
  'DYNAMIC',
  'RELAXED'
);

-- Age Range Enum (for quick filtering)
CREATE TYPE age_range AS ENUM (
  'TEENS',        -- 13-19
  'TWENTIES',     -- 20-29
  'THIRTIES',     -- 30-39
  'FORTIES',      -- 40-49
  'FIFTIES',      -- 50-59
  'SIXTIES_PLUS'  -- 60+
);

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE model_poses (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Image Storage
  image_url TEXT NOT NULL,
  storage_path TEXT, -- Optional: Supabase storage path if stored internally

  -- Model Characteristics
  gender model_gender NOT NULL,
  age_min INTEGER NOT NULL CHECK (age_min >= 13 AND age_min <= 100),
  age_max INTEGER NOT NULL CHECK (age_max >= 13 AND age_max <= 100),
  age_range age_range NOT NULL,
  ethnicity model_ethnicity NOT NULL,

  -- Pose Characteristics
  pose_category pose_category NOT NULL,

  -- Garment Compatibility (array of garment category slugs)
  garment_categories TEXT[] NOT NULL DEFAULT '{}',

  -- Optional Metadata
  name TEXT, -- Optional: Model name or pose identifier
  description TEXT, -- Optional: Pose description
  tags TEXT[] DEFAULT '{}', -- Optional: Additional search tags

  -- Additional flexible metadata (JSONB for extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status flags
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT age_min_max_check CHECK (age_max >= age_min)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for filtering by gender
CREATE INDEX idx_model_poses_gender ON model_poses(gender) WHERE is_active = true;

-- Index for filtering by age range
CREATE INDEX idx_model_poses_age_range ON model_poses(age_range) WHERE is_active = true;

-- Composite index for age filtering (more precise than age_range)
CREATE INDEX idx_model_poses_age_min_max ON model_poses(age_min, age_max) WHERE is_active = true;

-- Index for filtering by ethnicity
CREATE INDEX idx_model_poses_ethnicity ON model_poses(ethnicity) WHERE is_active = true;

-- Index for filtering by pose category
CREATE INDEX idx_model_poses_category ON model_poses(pose_category) WHERE is_active = true;

-- GIN index for filtering by garment categories (array containment)
CREATE INDEX idx_model_poses_garment_categories ON model_poses USING GIN(garment_categories) WHERE is_active = true;

-- Index for featured poses
CREATE INDEX idx_model_poses_featured ON model_poses(is_featured, created_at DESC) WHERE is_active = true AND is_featured = true;

-- Composite index for common filter combinations
CREATE INDEX idx_model_poses_common_filters ON model_poses(gender, age_range, is_active);

-- GIN index for JSONB metadata (for flexible querying)
CREATE INDEX idx_model_poses_metadata ON model_poses USING GIN(metadata);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_model_poses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to table
CREATE TRIGGER trigger_update_model_poses_updated_at
  BEFORE UPDATE ON model_poses
  FOR EACH ROW
  EXECUTE FUNCTION update_model_poses_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE model_poses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to SELECT active poses
CREATE POLICY "Allow authenticated users to select active poses"
  ON model_poses
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to perform all operations (for admin/seeding)
CREATE POLICY "Allow service role full access"
  ON model_poses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE model_poses IS 'Stores model pose images with metadata for filtering and selection in the generation flow';
COMMENT ON COLUMN model_poses.id IS 'Unique identifier for the pose';
COMMENT ON COLUMN model_poses.image_url IS 'Public URL to the pose image';
COMMENT ON COLUMN model_poses.storage_path IS 'Storage path if image is stored in Supabase Storage';
COMMENT ON COLUMN model_poses.gender IS 'Model gender (MALE, FEMALE, NON_BINARY)';
COMMENT ON COLUMN model_poses.age_min IS 'Minimum age represented by this model (13-100)';
COMMENT ON COLUMN model_poses.age_max IS 'Maximum age represented by this model (13-100)';
COMMENT ON COLUMN model_poses.age_range IS 'Categorical age range for quick filtering';
COMMENT ON COLUMN model_poses.ethnicity IS 'Model ethnicity category';
COMMENT ON COLUMN model_poses.pose_category IS 'Type of pose (standing, sitting, etc.)';
COMMENT ON COLUMN model_poses.garment_categories IS 'Array of compatible garment category slugs (e.g., ["vestido-midi", "calca-jeans"])';
COMMENT ON COLUMN model_poses.name IS 'Optional identifier or model name';
COMMENT ON COLUMN model_poses.description IS 'Optional description of the pose';
COMMENT ON COLUMN model_poses.tags IS 'Optional additional search tags';
COMMENT ON COLUMN model_poses.metadata IS 'Flexible JSONB field for additional pose metadata';
COMMENT ON COLUMN model_poses.is_active IS 'Whether this pose is currently available for selection';
COMMENT ON COLUMN model_poses.is_featured IS 'Whether this pose should be featured/highlighted';
