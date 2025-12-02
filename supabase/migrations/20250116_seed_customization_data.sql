-- =====================================================
-- Migration: Seed Customization Data
-- Date: 2025-01-16
-- Description: Populates initial data for customization system:
--              - 6 Facial expressions
--              - 8 Hair colors
--              - 20 Background presets
--              - 4 AI editing tools
--              - 3 Credit pricing rules
-- =====================================================

-- =====================================================
-- SEED DATA: Facial Expressions (6 options)
-- =====================================================
INSERT INTO customization_options (option_type, option_value, display_name, display_name_pt, display_order, metadata) VALUES
  ('facial_expression', 'smiling', 'Smiling', 'Sorrindo', 1, '{"description": "Happy, cheerful expression with visible smile"}'),
  ('facial_expression', 'serious', 'Serious', 'Séria', 2, '{"description": "Professional, neutral expression"}'),
  ('facial_expression', 'confident', 'Confident', 'Confiante', 3, '{"description": "Strong, assertive expression with slight smile"}'),
  ('facial_expression', 'thoughtful', 'Thoughtful', 'Pensativa', 4, '{"description": "Contemplative, introspective expression"}'),
  ('facial_expression', 'relaxed', 'Relaxed', 'Relaxada', 5, '{"description": "Calm, at-ease expression"}'),
  ('facial_expression', 'elegant', 'Elegant', 'Elegante', 6, '{"description": "Sophisticated, poised expression"}')
ON CONFLICT (option_type, option_value) DO NOTHING;

-- =====================================================
-- SEED DATA: Hair Colors (8 options)
-- =====================================================
INSERT INTO customization_options (option_type, option_value, display_name, display_name_pt, display_order, metadata) VALUES
  ('hair_color', 'blonde', 'Blonde', 'Loiro', 1, '{"hex": "#F5E5B8", "description": "Light golden blonde hair"}'),
  ('hair_color', 'brown', 'Brown', 'Moreno', 2, '{"hex": "#8B6F47", "description": "Medium brown hair"}'),
  ('hair_color', 'black', 'Black', 'Preto', 3, '{"hex": "#1C1C1C", "description": "Deep black hair"}'),
  ('hair_color', 'red', 'Red', 'Ruivo', 4, '{"hex": "#B94E48", "description": "Auburn/ginger red hair"}'),
  ('hair_color', 'light_brown', 'Light Brown', 'Castanho Claro', 5, '{"hex": "#A68A64", "description": "Light chestnut brown"}'),
  ('hair_color', 'dark_brown', 'Dark Brown', 'Castanho Escuro', 6, '{"hex": "#4A3728", "description": "Dark chocolate brown"}'),
  ('hair_color', 'gray', 'Gray', 'Grisalho', 7, '{"hex": "#A8A8A8", "description": "Silver/gray hair"}'),
  ('hair_color', 'colorful', 'Colorful', 'Colorido', 8, '{"description": "Fantasy colors (pink, blue, purple, etc)"}')
ON CONFLICT (option_type, option_value) DO NOTHING;

-- =====================================================
-- SEED DATA: Background Presets (20 options)
-- =====================================================
INSERT INTO background_presets (
  name, name_pt, description, description_pt, category, color_hex, display_order, is_active
) VALUES
  -- Solid Colors (7)
  ('Pure White', 'Branco Puro', 'Clean white studio background', 'Fundo branco limpo de estúdio', 'solid', '#FFFFFF', 1, true),
  ('Deep Black', 'Preto Profundo', 'Professional black backdrop', 'Fundo preto profissional', 'solid', '#000000', 2, true),
  ('Light Gray', 'Cinza Claro', 'Soft neutral gray', 'Cinza neutro suave', 'solid', '#D3D3D3', 3, true),
  ('Dark Gray', 'Cinza Escuro', 'Elegant dark gray', 'Cinza escuro elegante', 'solid', '#4A4A4A', 4, true),
  ('Warm Beige', 'Bege Quente', 'Warm natural beige tone', 'Tom bege natural e quente', 'solid', '#E8D4B8', 5, true),
  ('Soft Cream', 'Creme Suave', 'Delicate cream background', 'Fundo creme delicado', 'solid', '#F5F5DC', 6, true),
  ('Sky Blue', 'Azul Céu', 'Light sky blue backdrop', 'Fundo azul céu claro', 'solid', '#87CEEB', 7, true),

  -- Additional Solid Colors (3)
  ('Navy Blue', 'Azul Marinho', 'Deep navy blue', 'Azul marinho profundo', 'solid', '#1B2A49', 8, true),
  ('Soft Pink', 'Rosa Suave', 'Gentle pastel pink', 'Rosa pastel suave', 'solid', '#FFD5E5', 9, true),
  ('Mint Green', 'Verde Menta', 'Fresh mint background', 'Fundo verde menta fresco', 'solid', '#A8E4A0', 10, true),

  -- Gradients (4)
  ('Gray-White Gradient', 'Degradê Cinza-Branco', 'Smooth gradient from gray to white', 'Degradê suave de cinza para branco', 'gradient', '#D3D3D3', 11, true),
  ('Blue Sky Gradient', 'Degradê Azul Céu', 'Sky blue gradient backdrop', 'Degradê azul céu', 'gradient', '#87CEEB', 12, true),
  ('Pink Sunset Gradient', 'Degradê Pôr do Sol Rosa', 'Warm pink to cream gradient', 'Degradê quente de rosa para creme', 'gradient', '#FFB6C1', 13, true),
  ('Pastel Yellow Gradient', 'Degradê Amarelo Pastel', 'Soft yellow to cream gradient', 'Degradê suave amarelo para creme', 'gradient', '#FFF8DC', 14, true),

  -- Textures (3)
  ('White Marble', 'Mármore Branco', 'Elegant white marble texture', 'Textura de mármore branco elegante', 'texture', '#F8F8F8', 15, true),
  ('Concrete Wall', 'Parede de Concreto', 'Modern concrete texture', 'Textura moderna de concreto', 'texture', '#B8B8B8', 16, true),
  ('Light Wood', 'Madeira Clara', 'Natural light wood texture', 'Textura de madeira clara natural', 'texture', '#D4A574', 17, true),

  -- Studio Setups (3)
  ('Professional Studio White', 'Estúdio Profissional Branco', 'Classic white studio with soft lighting', 'Estúdio branco clássico com iluminação suave', 'studio', '#FAFAFA', 18, true),
  ('Blurred Urban Background', 'Fundo Urbano Desfocado', 'Blurred city backdrop for depth', 'Fundo urbano desfocado para profundidade', 'studio', '#9E9E9E', 19, true),
  ('Nature Urban Mix', 'Mix Urbano Natural', 'Blend of natural and urban elements', 'Mistura de elementos naturais e urbanos', 'studio', '#A5B8A5', 20, true)
ON CONFLICT DO NOTHING;

-- Note: In production, you would populate image_url and storage_path with actual CDN/storage URLs

-- =====================================================
-- SEED DATA: AI Editing Tools (4 tools)
-- =====================================================
INSERT INTO ai_editing_tools (
  tool_name, display_name, display_name_pt, description, description_pt,
  credits_cost, category, display_order, is_active
) VALUES
  (
    'remove_background',
    'Remove Background',
    'Remover Fundo',
    'Remove the background from the generated image, leaving a transparent background',
    'Remove o fundo da imagem gerada, deixando um fundo transparente',
    1,
    'background',
    1,
    true
  ),
  (
    'change_background',
    'Change Background',
    'Alterar Fundo',
    'Replace the background with a preset or custom uploaded image',
    'Substitui o fundo por uma imagem pré-definida ou personalizada',
    1,
    'background',
    2,
    true
  ),
  (
    'change_hair_color',
    'Change Hair Color',
    'Trocar Cor do Cabelo',
    'Modify the model''s hair color to match your brand or preference',
    'Modifica a cor do cabelo da modelo para combinar com sua marca ou preferência',
    1,
    'appearance',
    3,
    true
  ),
  (
    'add_brand_logo',
    'Add Brand Logo',
    'Inserir Logo da Marca',
    'Place your brand logo on the image or garment',
    'Coloca o logo da sua marca na imagem ou na roupa',
    1,
    'branding',
    4,
    true
  )
ON CONFLICT (tool_name) DO NOTHING;

-- =====================================================
-- SEED DATA: Credit Pricing (3 pricing rules)
-- =====================================================
INSERT INTO credit_pricing (
  action_type, credits_required, description, description_pt, is_active
) VALUES
  (
    'base_generation',
    2,
    'Cost for generating base image (model + garment)',
    'Custo para gerar imagem base (modelo + roupa)',
    true
  ),
  (
    'ai_edit',
    1,
    'Cost per AI editing tool applied (background, hair, logo)',
    'Custo por ferramenta de IA aplicada (fundo, cabelo, logo)',
    true
  ),
  (
    'watermark_removal',
    3,
    'Cost to download final image without watermark',
    'Custo para baixar imagem final sem marca d''água',
    true
  )
ON CONFLICT (action_type) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================
-- SELECT COUNT(*) as facial_expressions FROM customization_options WHERE option_type = 'facial_expression';
-- SELECT COUNT(*) as hair_colors FROM customization_options WHERE option_type = 'hair_color';
-- SELECT COUNT(*) as backgrounds FROM background_presets;
-- SELECT COUNT(*) as ai_tools FROM ai_editing_tools;
-- SELECT COUNT(*) as pricing_rules FROM credit_pricing;

-- =====================================================
-- END OF SEED DATA
-- =====================================================
