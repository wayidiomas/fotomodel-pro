-- Update dimensions to match Gemini 2.5 Flash exact outputs
-- This ensures the displayed dimensions match what will actually be generated

-- Instagram formats
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Instagram Post'; -- 1:1
UPDATE image_format_presets SET width = 768, height = 1344 WHERE name = 'Instagram Story'; -- 9:16
UPDATE image_format_presets SET width = 768, height = 1344 WHERE name = 'Instagram Reels'; -- 9:16
UPDATE image_format_presets SET width = 896, height = 1152 WHERE name = 'Instagram Retrato'; -- 4:5

-- Shopify / E-commerce
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Shopify Produto'; -- 1:1 (nota: será upscaled depois)
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Shopify Thumbnail'; -- 1:1
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'E-commerce Padrão'; -- 1:1

-- Facebook formats
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Facebook Post'; -- 1:1
UPDATE image_format_presets SET width = 768, height = 1344 WHERE name = 'Facebook Story'; -- 9:16
UPDATE image_format_presets SET width = 1344, height = 768 WHERE name = 'Facebook Capa'; -- 16:9

-- Pinterest formats
UPDATE image_format_presets SET width = 832, height = 1248 WHERE name = 'Pinterest Pin'; -- 2:3
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Pinterest Quadrado'; -- 1:1

-- LinkedIn formats (16:9 instead of 1.91:1)
UPDATE image_format_presets SET width = 1344, height = 768, description = 'Formato horizontal para feed (gerado em 16:9)' WHERE name = 'LinkedIn Post';
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'LinkedIn Quadrado'; -- 1:1

-- Twitter/X formats
UPDATE image_format_presets SET width = 1344, height = 768 WHERE name = 'Twitter Post'; -- 16:9
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Twitter Quadrado'; -- 1:1

-- TikTok format
UPDATE image_format_presets SET width = 768, height = 1344 WHERE name = 'TikTok Vertical'; -- 9:16

-- WhatsApp Business
UPDATE image_format_presets SET width = 768, height = 1344 WHERE name = 'WhatsApp Status'; -- 9:16
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'WhatsApp Catálogo'; -- 1:1

-- Print formats (3:2 instead of A4's 1.41:1, 1:1 for square)
UPDATE image_format_presets SET
  width = 1248,
  height = 832,
  aspect_ratio = '3:2',
  description = 'Impressão horizontal (gerado em 3:2, próximo ao A4)'
WHERE name = 'Print A4';

UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Print Quadrado'; -- 1:1

-- Custom
UPDATE image_format_presets SET width = 1024, height = 1024 WHERE name = 'Personalizado'; -- 1:1

-- Add comment about Gemini dimensions
COMMENT ON TABLE image_format_presets IS 'Predefined image formats last updated: 2025-01-17. Dimensions match Gemini 2.5 Flash outputs exactly.';
