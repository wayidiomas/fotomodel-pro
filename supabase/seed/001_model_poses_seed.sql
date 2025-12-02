-- Seed file: Model Poses
-- Purpose: Insert sample model poses for development and testing
-- Created: 2025-11-16

-- Note: Using Unsplash placeholder images for development
-- In production, these should be replaced with actual model images from Figma/Storage

INSERT INTO model_poses (
  image_url,
  gender,
  age_min,
  age_max,
  age_range,
  ethnicity,
  pose_category,
  garment_categories,
  name,
  description,
  tags,
  is_active,
  is_featured
) VALUES
  -- Female poses
  (
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
    'FEMALE',
    25, 32,
    'TWENTIES',
    'CAUCASIAN',
    'STANDING_STRAIGHT',
    ARRAY['vestido-midi', 'vestido-longo', 'blusa']::TEXT[],
    'Pose Frontal Elegante',
    'Modelo feminina em pose frontal elegante, ideal para vestidos e blusas',
    ARRAY['elegante', 'formal', 'frontal']::TEXT[],
    true,
    true
  ),
  (
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    'FEMALE',
    22, 28,
    'TWENTIES',
    'ASIAN',
    'STANDING_CASUAL',
    ARRAY['calca-jeans', 'camiseta', 'blusa']::TEXT[],
    'Pose Casual Descontraída',
    'Modelo feminina em pose casual, perfeita para looks do dia a dia',
    ARRAY['casual', 'descontraída', 'jovem']::TEXT[],
    true,
    true
  ),
  (
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
    'FEMALE',
    30, 38,
    'THIRTIES',
    'AFRICAN',
    'STANDING_CONFIDENT',
    ARRAY['blazer', 'calca-alfaiataria', 'camisa']::TEXT[],
    'Pose Confiante Corporativa',
    'Modelo feminina em pose confiante, ideal para roupas corporativas',
    ARRAY['confiante', 'corporativo', 'profissional']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop',
    'FEMALE',
    24, 30,
    'TWENTIES',
    'HISPANIC',
    'RELAXED',
    ARRAY['vestido-curto', 'saia-midi', 'blusa']::TEXT[],
    'Pose Relaxada Natural',
    'Modelo feminina em pose relaxada e natural',
    ARRAY['relaxada', 'natural', 'suave']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    'FEMALE',
    20, 26,
    'TWENTIES',
    'CAUCASIAN',
    'DYNAMIC',
    ARRAY['shorts', 'camiseta', 'bermuda']::TEXT[],
    'Pose Dinâmica Jovem',
    'Modelo feminina em pose dinâmica, ideal para roupas esportivas e casuais',
    ARRAY['dinâmica', 'jovem', 'esportiva']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    'FEMALE',
    28, 35,
    'THIRTIES',
    'MIXED',
    'STANDING_STRAIGHT',
    ARRAY['vestido-longo', 'saia-lapis', 'camisa']::TEXT[],
    'Pose Clássica Atemporal',
    'Modelo feminina em pose clássica e atemporal',
    ARRAY['clássica', 'atemporal', 'sofisticada']::TEXT[],
    true,
    false
  ),

  -- Male poses
  (
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    'MALE',
    28, 35,
    'THIRTIES',
    'CAUCASIAN',
    'STANDING_CONFIDENT',
    ARRAY['terno', 'blazer', 'calca-alfaiataria', 'camisa']::TEXT[],
    'Pose Masculina Executiva',
    'Modelo masculino em pose confiante, ideal para roupas formais',
    ARRAY['executivo', 'formal', 'confiante']::TEXT[],
    true,
    true
  ),
  (
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    'MALE',
    25, 32,
    'TWENTIES',
    'HISPANIC',
    'STANDING_CASUAL',
    ARRAY['camiseta', 'calca-jeans', 'bermuda']::TEXT[],
    'Pose Casual Moderna',
    'Modelo masculino em pose casual moderna',
    ARRAY['casual', 'moderno', 'jovem']::TEXT[],
    true,
    true
  ),
  (
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    'MALE',
    30, 40,
    'THIRTIES',
    'ASIAN',
    'RELAXED',
    ARRAY['blusa', 'calca-jeans', 'camisa']::TEXT[],
    'Pose Relaxada Elegante',
    'Modelo masculino em pose relaxada mas elegante',
    ARRAY['relaxada', 'elegante', 'sofisticada']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
    'MALE',
    22, 28,
    'TWENTIES',
    'AFRICAN',
    'STANDING_STRAIGHT',
    ARRAY['camisa', 'blusa', 'blazer']::TEXT[],
    'Pose Frontal Clássica',
    'Modelo masculino em pose frontal clássica',
    ARRAY['clássica', 'frontal', 'limpa']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop',
    'MALE',
    35, 45,
    'THIRTIES',
    'CAUCASIAN',
    'LEANING',
    ARRAY['terno', 'blazer', 'camisa', 'calca-alfaiataria']::TEXT[],
    'Pose Apoiada Sofisticada',
    'Modelo masculino em pose apoiada, transmite sofisticação',
    ARRAY['sofisticada', 'madura', 'profissional']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop',
    'MALE',
    26, 33,
    'TWENTIES',
    'MIDDLE_EASTERN',
    'DYNAMIC',
    ARRAY['camiseta', 'calca-jeans', 'shorts']::TEXT[],
    'Pose Dinâmica Urbana',
    'Modelo masculino em pose dinâmica urbana',
    ARRAY['dinâmica', 'urbana', 'moderna']::TEXT[],
    true,
    false
  ),

  -- Additional diverse poses
  (
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop',
    'FEMALE',
    40, 50,
    'FORTIES',
    'CAUCASIAN',
    'STANDING_CONFIDENT',
    ARRAY['vestido-midi', 'blazer', 'calca-alfaiataria']::TEXT[],
    'Pose Madura Confiante',
    'Modelo feminina madura em pose confiante',
    ARRAY['madura', 'confiante', 'executiva']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop',
    'FEMALE',
    18, 24,
    'TEENS',
    'ASIAN',
    'SITTING',
    ARRAY['vestido-curto', 'saia-midi', 'blusa']::TEXT[],
    'Pose Sentada Jovem',
    'Modelo jovem em pose sentada descontraída',
    ARRAY['jovem', 'sentada', 'descontraída']::TEXT[],
    true,
    false
  ),
  (
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
    'MALE',
    45, 55,
    'FORTIES',
    'CAUCASIAN',
    'STANDING_STRAIGHT',
    ARRAY['terno', 'camisa', 'blazer']::TEXT[],
    'Pose Executiva Sênior',
    'Modelo masculino sênior em pose executiva',
    ARRAY['sênior', 'executivo', 'experiente']::TEXT[],
    true,
    false
  );

-- Verify insert
SELECT COUNT(*) as total_poses_inserted FROM model_poses;
