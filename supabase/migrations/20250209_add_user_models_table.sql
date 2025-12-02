-- Create table to store user-specific saved models
CREATE TABLE IF NOT EXISTS public.user_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_result_id UUID REFERENCES public.generation_results(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL DEFAULT 'Modelo personalizado',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  facial_expression TEXT,
  hair_color TEXT,
  pose_id TEXT,
  pose_name TEXT,
  gender TEXT,
  age_min INTEGER,
  age_max INTEGER,
  age_range TEXT,
  ethnicity TEXT,
  pose_category TEXT,
  garment_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  pose_metadata JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can view their models"
  ON public.user_models
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their models"
  ON public.user_models
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their models"
  ON public.user_models
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their models"
  ON public.user_models
  FOR DELETE
  USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_models_user_created_at
  ON public.user_models(user_id, created_at DESC);

-- Keep updated_at fresh
CREATE TRIGGER update_user_models_updated_at
  BEFORE UPDATE ON public.user_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
