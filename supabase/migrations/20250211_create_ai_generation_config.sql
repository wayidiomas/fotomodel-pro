-- Migration: Create AI Generation Config Table
-- Allows dynamic configuration of AI models and parameters via database

CREATE TABLE IF NOT EXISTS ai_generation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE ai_generation_config IS 'Dynamic configuration for AI image generation models and parameters';

-- Insert default configurations for Gemini 3 Pro (Nano Banana Pro)
INSERT INTO ai_generation_config (config_key, config_value, description) VALUES
  ('gemini_model_id', 'gemini-3-pro-image-preview', 'Modelo Gemini para geração de imagens (Nano Banana Pro)'),
  ('gemini_image_size', '1K', 'Tamanho da imagem gerada: 1K (1024px), 2K (2048px) ou 4K (4096px)'),
  ('gemini_prompt_model_id', 'gemini-2.5-flash-lite', 'Modelo para otimização de prompts'),
  ('gemini_enable_thinking', 'false', 'Habilitar thought signatures para edição multi-turn'),
  ('gemini_media_resolution', 'medium', 'Resolução de processamento de mídia: low, medium, high'),
  ('gemini_fallback_model_id', 'gemini-2.5-flash-image', 'Modelo de fallback caso o principal falhe')
ON CONFLICT (config_key) DO NOTHING;

-- Enable RLS
ALTER TABLE ai_generation_config ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (config is read-only for app)
CREATE POLICY "Allow read access for authenticated users"
  ON ai_generation_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow full access for service role (admin operations)
CREATE POLICY "Allow full access for service role"
  ON ai_generation_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_generation_config_key ON ai_generation_config(config_key);
