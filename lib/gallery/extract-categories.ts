/**
 * Gallery Helper Functions
 *
 * Utilities for extracting and organizing generation categories
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { mapCategoryToSlug } from '@/lib/wardrobe/save-to-wardrobe';

export interface GenerationWithCategories {
  id: string;
  created_at: string;
  credits_used: number;
  categories: string[]; // Extracted category slugs
  garmentTypes: string[]; // Original GarmentCategory enums
  generation_results: Array<{
    id: string;
    image_url: string;
    thumbnail_url: string | null;
    has_watermark: boolean;
    is_purchased: boolean;
    created_at: string;
  }>;
}

/**
 * Extracts garment categories from a generation's upload IDs
 */
export async function extractGenerationCategories(
  supabase: SupabaseClient,
  generation: any
): Promise<{ categories: string[]; garmentTypes: string[] }> {
  try {
    // Extract uploadIds from input_data
    const uploadIds = generation.input_data?.uploadIds || [];

    if (uploadIds.length === 0) {
      return { categories: [], garmentTypes: [] };
    }

    // Fetch uploads to get metadata
    const { data: uploads, error } = await supabase
      .from('user_uploads')
      .select('metadata')
      .in('id', uploadIds);

    if (error || !uploads) {
      console.error('Error fetching uploads for categories:', error);
      return { categories: [], garmentTypes: [] };
    }

    // Extract categories from metadata
    const garmentTypes: string[] = [];
    const categorySlugs: string[] = [];

    uploads.forEach((upload) => {
      const metadata = upload.metadata as any;
      const category = metadata?.garmentMetadata?.category;

      if (category) {
        garmentTypes.push(category);
        const slug = mapCategoryToSlug(category);
        if (slug && slug !== 'other') {
          categorySlugs.push(slug);
        }
      }
    });

    // Return unique values
    return {
      categories: [...new Set(categorySlugs)],
      garmentTypes: [...new Set(garmentTypes)],
    };
  } catch (error) {
    console.error('Error in extractGenerationCategories:', error);
    return { categories: [], garmentTypes: [] };
  }
}

/**
 * Enriches generations with category information
 */
export async function enrichGenerationsWithCategories(
  supabase: SupabaseClient,
  generations: any[]
): Promise<GenerationWithCategories[]> {
  const enriched = await Promise.all(
    generations.map(async (generation) => {
      const { categories, garmentTypes } = await extractGenerationCategories(
        supabase,
        generation
      );

      return {
        ...generation,
        categories,
        garmentTypes,
      };
    })
  );

  return enriched;
}

/**
 * Groups generations by category slug
 */
export function groupGenerationsByCategory(
  generations: GenerationWithCategories[]
): Map<string, GenerationWithCategories[]> {
  const grouped = new Map<string, GenerationWithCategories[]>();

  generations.forEach((generation) => {
    generation.categories.forEach((category) => {
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(generation);
    });
  });

  return grouped;
}

/**
 * Filters generations by category slug
 */
export function filterGenerationsByCategory(
  generations: GenerationWithCategories[],
  categorySlug: string | null
): GenerationWithCategories[] {
  if (!categorySlug) {
    return generations;
  }

  return generations.filter((generation) =>
    generation.categories.includes(categorySlug)
  );
}

/**
 * Counts generations by category
 */
export function countGenerationsByCategory(
  generations: GenerationWithCategories[]
): Map<string, number> {
  const counts = new Map<string, number>();

  generations.forEach((generation) => {
    generation.categories.forEach((category) => {
      counts.set(category, (counts.get(category) || 0) + 1);
    });
  });

  return counts;
}
