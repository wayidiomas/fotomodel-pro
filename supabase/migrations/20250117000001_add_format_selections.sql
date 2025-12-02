-- Create generation_format_selections table
-- Links user uploads to their selected image format

CREATE TABLE IF NOT EXISTS generation_format_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  upload_id UUID NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,
  format_preset_id UUID NOT NULL REFERENCES image_format_presets(id) ON DELETE RESTRICT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One format per upload
  CONSTRAINT unique_upload_format UNIQUE(upload_id)
);

-- Create index for upload lookup
CREATE INDEX idx_format_selections_upload
  ON generation_format_selections(upload_id);

-- Create index for format lookup
CREATE INDEX idx_format_selections_format
  ON generation_format_selections(format_preset_id);

-- Add updated_at trigger
CREATE TRIGGER update_format_selections_updated_at
  BEFORE UPDATE ON generation_format_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE generation_format_selections IS 'Stores the selected image format for each user upload/generation';

-- Enable RLS (Row Level Security)
ALTER TABLE generation_format_selections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own format selections
CREATE POLICY "Users can read own format selections"
  ON generation_format_selections
  FOR SELECT
  USING (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own format selections
CREATE POLICY "Users can insert own format selections"
  ON generation_format_selections
  FOR INSERT
  WITH CHECK (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own format selections
CREATE POLICY "Users can update own format selections"
  ON generation_format_selections
  FOR UPDATE
  USING (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own format selections
CREATE POLICY "Users can delete own format selections"
  ON generation_format_selections
  FOR DELETE
  USING (
    upload_id IN (
      SELECT id FROM user_uploads WHERE user_id = auth.uid()
    )
  );
