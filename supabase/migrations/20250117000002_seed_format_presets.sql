-- Seed image_format_presets with popular platform formats
-- Categories: social, ecommerce, print

-- Instagram Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Instagram Post', 'instagram', '1:1', 1080, 1080, 'Quadrado perfeito para feed', 'instagram', 'social', 1),
  ('Instagram Story', 'instagram', '9:16', 1080, 1920, 'Formato vertical para stories', 'instagram', 'social', 2),
  ('Instagram Reels', 'instagram', '9:16', 1080, 1920, 'Formato vertical para reels', 'instagram', 'social', 3),
  ('Instagram Retrato', 'instagram', '4:5', 1080, 1350, 'Formato vertical para feed', 'instagram', 'social', 4);

-- Shopify / E-commerce Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Shopify Produto', 'shopify', '1:1', 2048, 2048, 'Alta resolução para produtos', 'shopify', 'ecommerce', 10),
  ('Shopify Thumbnail', 'shopify', '1:1', 600, 600, 'Miniatura para listagens', 'shopify', 'ecommerce', 11),
  ('E-commerce Padrão', 'ecommerce', '1:1', 1500, 1500, 'Formato universal para lojas', 'shopping-cart', 'ecommerce', 12);

-- Facebook Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Facebook Post', 'facebook', '1:1', 1200, 1200, 'Quadrado para feed', 'facebook', 'social', 20),
  ('Facebook Story', 'facebook', '9:16', 1080, 1920, 'Formato vertical para stories', 'facebook', 'social', 21),
  ('Facebook Capa', 'facebook', '16:9', 820, 462, 'Imagem de capa', 'facebook', 'social', 22);

-- Pinterest Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Pinterest Pin', 'pinterest', '2:3', 1000, 1500, 'Formato vertical ideal', 'pinterest', 'social', 30),
  ('Pinterest Quadrado', 'pinterest', '1:1', 1000, 1000, 'Alternativa quadrada', 'pinterest', 'social', 31);

-- LinkedIn Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('LinkedIn Post', 'linkedin', '1.91:1', 1200, 627, 'Formato horizontal para feed', 'linkedin', 'social', 40),
  ('LinkedIn Quadrado', 'linkedin', '1:1', 1200, 1200, 'Alternativa quadrada', 'linkedin', 'social', 41);

-- Twitter/X Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Twitter Post', 'twitter', '16:9', 1200, 675, 'Formato horizontal', 'twitter', 'social', 50),
  ('Twitter Quadrado', 'twitter', '1:1', 1200, 1200, 'Formato quadrado', 'twitter', 'social', 51);

-- TikTok Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('TikTok Vertical', 'tiktok', '9:16', 1080, 1920, 'Formato vertical', 'tiktok', 'social', 60);

-- WhatsApp Business
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('WhatsApp Status', 'whatsapp', '9:16', 1080, 1920, 'Para status/stories', 'whatsapp', 'social', 70),
  ('WhatsApp Catálogo', 'whatsapp', '1:1', 640, 640, 'Produtos para catálogo', 'whatsapp', 'ecommerce', 71);

-- Print Formats
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Print A4', 'print', '1.41:1', 2480, 3508, 'Tamanho A4 (300 DPI)', 'printer', 'print', 80),
  ('Print Quadrado', 'print', '1:1', 3000, 3000, 'Impressão quadrada', 'printer', 'print', 81);

-- Custom / Generic
INSERT INTO image_format_presets (name, platform, aspect_ratio, width, height, description, icon_name, category, display_order) VALUES
  ('Personalizado', 'custom', 'custom', 1080, 1080, 'Defina suas próprias dimensões', 'settings', 'custom', 999);

-- Add comment about updating
COMMENT ON TABLE image_format_presets IS 'Predefined image formats last updated: 2025-01-17';
