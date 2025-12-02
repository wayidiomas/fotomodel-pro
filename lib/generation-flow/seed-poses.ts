/**
 * Seed Script for Model Poses
 * Populates the database with initial pose data from Unsplash
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type PoseInsert = Database['public']['Tables']['model_poses']['Insert'];

/**
 * Curated Unsplash images for model poses
 * All images are from professional fashion photography collections
 */
const POSE_SEEDS: Omit<PoseInsert, 'id' | 'created_at' | 'updated_at'>[] = [
  // FEMALE MODELS - TWENTIES
  {
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_STRAIGHT',
    garment_categories: ['vestido-midi', 'vestido-longo', 'saia-midi', 'calca-alfaiataria'],
    name: 'Sofia Martinez',
    description: 'Pose ereta e elegante, ideal para roupas formais',
    tags: ['formal', 'elegante', 'corpo-inteiro'],
    is_active: true,
    is_featured: true,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_CASUAL',
    garment_categories: ['vestido-curto', 'blusa', 'calca-jeans', 'shorts'],
    name: 'Emma Parker',
    description: 'Pose casual e descontraída',
    tags: ['casual', 'descontraído', 'corpo-inteiro'],
    is_active: true,
    is_featured: true,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'ASIAN',
    pose_category: 'STANDING_CONFIDENT',
    garment_categories: ['blazer', 'camisa', 'calca-alfaiataria', 'saia-lapis'],
    name: 'Yuki Tanaka',
    description: 'Pose confiante, mãos nos quadris',
    tags: ['confiante', 'executivo', 'corpo-inteiro'],
    is_active: true,
    is_featured: false,
  },

  // FEMALE MODELS - AFRICAN DESCENT
  {
    image_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'AFRICAN',
    pose_category: 'STANDING_STRAIGHT',
    garment_categories: ['vestido-midi', 'vestido-longo', 'blusa', 'calca-alfaiataria'],
    name: 'Amara Okafor',
    description: 'Pose elegante e sofisticada',
    tags: ['elegante', 'sofisticado', 'corpo-inteiro'],
    is_active: true,
    is_featured: true,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'AFRICAN',
    pose_category: 'WALKING',
    garment_categories: ['vestido-midi', 'calca-jeans', 'saia-midi', 'shorts'],
    name: 'Zara Williams',
    description: 'Pose em movimento, caminhando',
    tags: ['movimento', 'dinâmico', 'corpo-inteiro'],
    is_active: true,
    is_featured: false,
  },

  // FEMALE MODELS - THIRTIES
  {
    image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
    gender: 'FEMALE',
    age_min: 30,
    age_max: 39,
    age_range: 'THIRTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_CONFIDENT',
    garment_categories: ['blazer', 'vestido-midi', 'calca-alfaiataria', 'saia-lapis'],
    name: 'Elena Volkov',
    description: 'Pose executiva e confiante',
    tags: ['executivo', 'confiante', 'profissional'],
    is_active: true,
    is_featured: true,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    gender: 'FEMALE',
    age_min: 30,
    age_max: 39,
    age_range: 'THIRTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'RELAXED',
    garment_categories: ['blusa', 'vestido-curto', 'calca-jeans', 'shorts'],
    name: 'Lily Thompson',
    description: 'Pose relaxada e natural',
    tags: ['relaxado', 'natural', 'meio-corpo'],
    is_active: true,
    is_featured: false,
  },

  // MALE MODELS - TWENTIES
  {
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
    gender: 'MALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_STRAIGHT',
    garment_categories: ['camisa', 'camiseta', 'calca-jeans', 'calca-alfaiataria'],
    name: 'Marcus Johnson',
    description: 'Pose reta e profissional',
    tags: ['profissional', 'clássico', 'corpo-inteiro'],
    is_active: true,
    is_featured: true,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    gender: 'MALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_CASUAL',
    garment_categories: ['camiseta', 'camisa', 'calca-jeans', 'bermuda'],
    name: 'James Wilson',
    description: 'Pose casual com as mãos nos bolsos',
    tags: ['casual', 'descontraído', 'corpo-inteiro'],
    is_active: true,
    is_featured: false,
  },

  // MALE MODELS - AFRICAN DESCENT
  {
    image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    gender: 'MALE',
    age_min: 25,
    age_max: 34,
    age_range: 'TWENTIES',
    ethnicity: 'AFRICAN',
    pose_category: 'STANDING_CONFIDENT',
    garment_categories: ['blazer', 'camisa', 'calca-alfaiataria', 'terno'],
    name: 'Isaiah Brown',
    description: 'Pose confiante e executiva',
    tags: ['executivo', 'confiante', 'formal'],
    is_active: true,
    is_featured: true,
  },

  // MALE MODELS - THIRTIES
  {
    image_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
    gender: 'MALE',
    age_min: 30,
    age_max: 39,
    age_range: 'THIRTIES',
    ethnicity: 'HISPANIC',
    pose_category: 'STANDING_CASUAL',
    garment_categories: ['camisa', 'camiseta', 'calca-jeans', 'bermuda'],
    name: 'Carlos Rodriguez',
    description: 'Pose casual e amigável',
    tags: ['casual', 'amigável', 'corpo-inteiro'],
    is_active: true,
    is_featured: false,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
    gender: 'MALE',
    age_min: 30,
    age_max: 39,
    age_range: 'THIRTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'LEANING',
    garment_categories: ['camisa', 'camiseta', 'calca-jeans', 'blazer'],
    name: 'Oliver Bennett',
    description: 'Pose apoiado, relaxado',
    tags: ['relaxado', 'casual', 'meio-corpo'],
    is_active: true,
    is_featured: false,
  },

  // FEMALE MODELS - FORTIES
  {
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
    gender: 'FEMALE',
    age_min: 40,
    age_max: 49,
    age_range: 'FORTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_CONFIDENT',
    garment_categories: ['blazer', 'vestido-midi', 'calca-alfaiataria', 'camisa'],
    name: 'Victoria Adams',
    description: 'Pose executiva madura',
    tags: ['executivo', 'maduro', 'profissional'],
    is_active: true,
    is_featured: false,
  },

  // MALE MODELS - FORTIES
  {
    image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80',
    gender: 'MALE',
    age_min: 40,
    age_max: 49,
    age_range: 'FORTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_STRAIGHT',
    garment_categories: ['blazer', 'camisa', 'calca-alfaiataria', 'terno'],
    name: 'Richard Foster',
    description: 'Pose formal e elegante',
    tags: ['formal', 'elegante', 'executivo'],
    is_active: true,
    is_featured: false,
  },

  // FEMALE MODELS - FIFTIES
  {
    image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80',
    gender: 'FEMALE',
    age_min: 50,
    age_max: 59,
    age_range: 'FIFTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'STANDING_CONFIDENT',
    garment_categories: ['blazer', 'vestido-midi', 'vestido-longo', 'calca-alfaiataria'],
    name: 'Margaret Sullivan',
    description: 'Pose elegante e sofisticada',
    tags: ['elegante', 'sofisticado', 'maduro'],
    is_active: true,
    is_featured: false,
  },

  // DIVERSE POSES - SITTING
  {
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    gender: 'FEMALE',
    age_min: 25,
    age_max: 34,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'SITTING',
    garment_categories: ['vestido-midi', 'vestido-curto', 'saia-midi', 'calca-jeans'],
    name: 'Sophia Chen',
    description: 'Pose sentada elegante',
    tags: ['sentado', 'elegante', 'meio-corpo'],
    is_active: true,
    is_featured: false,
  },
  {
    image_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
    gender: 'MALE',
    age_min: 25,
    age_max: 34,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'SITTING',
    garment_categories: ['camisa', 'camiseta', 'calca-jeans', 'calca-alfaiataria'],
    name: 'Alex Turner',
    description: 'Pose sentado casual',
    tags: ['sentado', 'casual', 'meio-corpo'],
    is_active: true,
    is_featured: false,
  },

  // DIVERSE POSES - DYNAMIC
  {
    image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
    gender: 'FEMALE',
    age_min: 20,
    age_max: 29,
    age_range: 'TWENTIES',
    ethnicity: 'CAUCASIAN',
    pose_category: 'DYNAMIC',
    garment_categories: ['vestido-curto', 'vestido-midi', 'saia-midi', 'shorts'],
    name: 'Luna Rivera',
    description: 'Pose dinâmica em movimento',
    tags: ['dinâmico', 'movimento', 'energético'],
    is_active: true,
    is_featured: false,
  },
];

/**
 * Seeds the model_poses table with initial data
 */
export async function seedModelPoses() {
  try {
    const supabase = await createClient();

    // Check if poses already exist
    const { data: existingPoses, error: checkError } = await supabase
      .from('model_poses')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing poses:', checkError);
      throw checkError;
    }

    if (existingPoses && existingPoses.length > 0) {
      console.log('✅ Poses already seeded. Skipping...');
      return {
        success: true,
        message: 'Poses already exist in database',
        count: 0,
      };
    }

    // Insert all poses
    const { data, error } = await (supabase
      .from('model_poses') as any)
      .insert(POSE_SEEDS)
      .select('id');

    if (error) {
      console.error('Error seeding poses:', error);
      throw error;
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} poses`);
    return {
      success: true,
      message: `Successfully seeded ${data?.length || 0} poses`,
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('Unexpected error in seedModelPoses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
    };
  }
}
