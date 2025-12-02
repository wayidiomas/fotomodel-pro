/**
 * Wardrobe Save Helpers
 *
 * Functions to save categorized uploads to the wardrobe_items table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GarmentMetadata, GarmentCategory } from '@/lib/generation-flow/garment-metadata-types';

export interface SaveToWardrobeParams {
  userId: string;
  uploadIds: string[];
  collectionId?: string | null;
}

export interface SaveToWardrobeResult {
  success: boolean;
  itemIds?: string[];
  error?: string;
  skipped?: number; // Count of uploads that were already in wardrobe
}

/**
 * Maps GarmentCategory enum to category_slug
 * Groups detailed categories into broader slugs for filtering
 */
export function mapCategoryToSlug(category: string): string {
  const categoryMap: Record<string, string> = {
    // Tops
    TSHIRT: 'tops',
    TANK_TOP: 'tops',
    POLO: 'tops',
    HENLEY: 'tops',
    LONG_SLEEVE: 'tops',
    BLOUSE: 'tops',
    DRESS_SHIRT: 'tops',
    BUTTON_DOWN: 'tops',

    // Sweaters
    SWEATER: 'sweaters',
    CARDIGAN: 'sweaters',
    PULLOVER: 'sweaters',
    TURTLENECK: 'sweaters',
    HOODIE: 'sweaters',
    SWEATSHIRT: 'sweaters',
    TRACK_JACKET: 'sweaters',

    // Jackets
    BLAZER: 'jackets',
    SUIT_JACKET: 'jackets',
    BOMBER_JACKET: 'jackets',
    DENIM_JACKET: 'jackets',
    LEATHER_JACKET: 'jackets',
    TRENCH_COAT: 'jackets',
    PARKA: 'jackets',
    PEACOAT: 'jackets',
    PUFFER_JACKET: 'jackets',
    WINDBREAKER: 'jackets',
    VEST: 'jackets',

    // Pants
    JEANS: 'pants',
    DRESS_PANTS: 'pants',
    CHINOS: 'pants',
    CARGO_PANTS: 'pants',
    JOGGERS: 'pants',
    SWEATPANTS: 'pants',
    LEGGINGS: 'pants',

    // Shorts
    SHORTS: 'shorts',
    BERMUDA: 'shorts',
    CARGO_SHORTS: 'shorts',
    ATHLETIC_SHORTS: 'shorts',

    // Skirts
    PENCIL_SKIRT: 'skirts',
    A_LINE_SKIRT: 'skirts',
    MIDI_SKIRT: 'skirts',
    MAXI_SKIRT: 'skirts',
    MINI_SKIRT: 'skirts',
    PLEATED_SKIRT: 'skirts',

    // Dresses
    CASUAL_DRESS: 'dresses',
    COCKTAIL_DRESS: 'dresses',
    EVENING_GOWN: 'dresses',
    MIDI_DRESS: 'dresses',
    MAXI_DRESS: 'dresses',
    SHIRT_DRESS: 'dresses',
    WRAP_DRESS: 'dresses',
    SUNDRESS: 'dresses',

    // Jumpsuits
    JUMPSUIT: 'jumpsuits',
    ROMPER: 'jumpsuits',
    OVERALLS: 'jumpsuits',

    // Fallback
    OTHER: 'other',
  };

  return categoryMap[category] || 'other';
}

/**
 * Extracts tags from garment metadata
 * Combines occasions, patterns, and top colors into a tag array
 */
export function extractTagsFromMetadata(metadata: GarmentMetadata): string[] {
  const tags: string[] = [];

  // Add occasions (max 3)
  if (metadata.occasions && metadata.occasions.length > 0) {
    tags.push(...metadata.occasions.slice(0, 3));
  }

  // Add patterns (max 2)
  if (metadata.patterns && metadata.patterns.length > 0) {
    tags.push(...metadata.patterns.slice(0, 2));
  }

  // Add primary color
  if (metadata.colors && metadata.colors.length > 0) {
    tags.push(metadata.colors[0]);
  }

  // Add season if available
  if (metadata.season) {
    tags.push(metadata.season);
  }

  // Add material if available
  if (metadata.material) {
    tags.push(metadata.material);
  }

  return tags;
}

/**
 * Saves categorized uploads to wardrobe_items table
 * Skips uploads that are already in the wardrobe
 */
export async function saveUploadsToWardrobe(
  supabase: SupabaseClient,
  params: SaveToWardrobeParams
): Promise<SaveToWardrobeResult> {
  try {
    const { userId, uploadIds, collectionId } = params;

    if (!uploadIds || uploadIds.length === 0) {
      return {
        success: false,
        error: 'Nenhum upload fornecido',
      };
    }

    // Fetch uploads with their metadata
    const { data: uploads, error: fetchError } = await supabase
      .from('user_uploads')
      .select('*')
      .eq('user_id', userId)
      .in('id', uploadIds);

    if (fetchError) {
      console.error('Error fetching uploads:', fetchError);
      return {
        success: false,
        error: 'Erro ao buscar uploads',
      };
    }

    if (!uploads || uploads.length === 0) {
      return {
        success: false,
        error: 'Uploads não encontrados',
      };
    }

    // Check which uploads are already in wardrobe
    const { data: existingItems } = await supabase
      .from('wardrobe_items')
      .select('upload_id')
      .eq('user_id', userId)
      .in('upload_id', uploadIds);

    const existingUploadIds = new Set(
      existingItems?.map((item) => item.upload_id) || []
    );

    // Filter out uploads that are already in wardrobe
    const uploadsToSave = uploads.filter(
      (upload) => !existingUploadIds.has(upload.id)
    );

    if (uploadsToSave.length === 0) {
      return {
        success: true,
        itemIds: [],
        skipped: uploads.length,
      };
    }

    // Prepare wardrobe items
    const wardrobeItems = uploadsToSave.map((upload) => {
      const metadata = upload.metadata as any;
      const garmentMetadata = metadata?.garmentMetadata as GarmentMetadata | undefined;
      const pieceType = metadata?.pieceType;

      // Extract data from garment metadata
      const category = garmentMetadata?.category;
      const categorySlug = category ? mapCategoryToSlug(category) : null;
      const tags = garmentMetadata ? extractTagsFromMetadata(garmentMetadata) : [];

      return {
        user_id: userId,
        upload_id: upload.id,
        collection_id: collectionId || null,
        category_slug: categorySlug,
        garment_type: category || null,
        piece_type: pieceType || null,
        tags: tags,
        is_favorite: false,
        wear_count: 0,
        metadata: {
          description: garmentMetadata?.description,
          colors: garmentMetadata?.colors,
          occasions: garmentMetadata?.occasions,
          patterns: garmentMetadata?.patterns,
          season: garmentMetadata?.season,
          material: garmentMetadata?.material,
          styleNotes: garmentMetadata?.styleNotes,
        },
      };
    });

    // Insert wardrobe items
    const { data: insertedItems, error: insertError } = await supabase
      .from('wardrobe_items')
      .insert(wardrobeItems)
      .select('id');

    if (insertError) {
      console.error('Error inserting wardrobe items:', insertError);
      return {
        success: false,
        error: 'Erro ao salvar peças no vestuário',
      };
    }

    return {
      success: true,
      itemIds: insertedItems?.map((item) => item.id) || [],
      skipped: existingUploadIds.size,
    };
  } catch (error) {
    console.error('Error in saveUploadsToWardrobe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
