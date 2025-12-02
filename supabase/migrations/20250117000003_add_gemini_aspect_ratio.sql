-- Add gemini_aspect_ratio column to image_format_presets
-- Maps user-facing formats to Gemini 2.5 Flash supported aspect ratios

ALTER TABLE image_format_presets
ADD COLUMN gemini_aspect_ratio TEXT;

-- Add comment
COMMENT ON COLUMN image_format_presets.gemini_aspect_ratio IS 'Actual aspect ratio used for Gemini 2.5 Flash generation (may differ from display aspect_ratio)';

-- Update existing records with Gemini-compatible aspect ratios
-- Most formats already use compatible ratios, but some need mapping

-- Instagram formats (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'instagram' AND aspect_ratio = '1:1';
UPDATE image_format_presets SET gemini_aspect_ratio = '9:16' WHERE platform = 'instagram' AND aspect_ratio = '9:16';
UPDATE image_format_presets SET gemini_aspect_ratio = '4:5' WHERE platform = 'instagram' AND aspect_ratio = '4:5';

-- Shopify/E-commerce (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform IN ('shopify', 'ecommerce') AND aspect_ratio = '1:1';

-- Facebook formats
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'facebook' AND aspect_ratio = '1:1';
UPDATE image_format_presets SET gemini_aspect_ratio = '9:16' WHERE platform = 'facebook' AND aspect_ratio = '9:16';
UPDATE image_format_presets SET gemini_aspect_ratio = '16:9' WHERE platform = 'facebook' AND aspect_ratio = '16:9';

-- Pinterest (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '2:3' WHERE platform = 'pinterest' AND aspect_ratio = '2:3';
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'pinterest' AND aspect_ratio = '1:1';

-- LinkedIn (map 1.91:1 to 16:9)
UPDATE image_format_presets SET gemini_aspect_ratio = '16:9' WHERE platform = 'linkedin' AND aspect_ratio = '1.91:1';
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'linkedin' AND aspect_ratio = '1:1';

-- Twitter (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '16:9' WHERE platform = 'twitter' AND aspect_ratio = '16:9';
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'twitter' AND aspect_ratio = '1:1';

-- TikTok (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '9:16' WHERE platform = 'tiktok';

-- WhatsApp (already compatible)
UPDATE image_format_presets SET gemini_aspect_ratio = '9:16' WHERE platform = 'whatsapp' AND aspect_ratio = '9:16';
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'whatsapp' AND aspect_ratio = '1:1';

-- Print formats (map 1.41:1 to 3:2 which is closest)
UPDATE image_format_presets SET gemini_aspect_ratio = '3:2' WHERE platform = 'print' AND aspect_ratio = '1.41:1';
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'print' AND aspect_ratio = '1:1';

-- Custom (allow 1:1)
UPDATE image_format_presets SET gemini_aspect_ratio = '1:1' WHERE platform = 'custom';
