import type { SupabaseClient } from '@supabase/supabase-js';
import type { GarmentMetadata } from './garment-metadata-types';

export interface SaveCategorizationParams {
  uploadId: string;
  metadata: GarmentMetadata;
}

export interface SaveCategorizationResult {
  success: boolean;
  error?: string;
}

/**
 * Saves AI-generated garment categorization metadata to the database
 * Updates the user_uploads record with structured metadata
 */
export async function saveCategorization(
  supabase: SupabaseClient,
  params: SaveCategorizationParams
): Promise<SaveCategorizationResult> {
  const { uploadId, metadata } = params;

  try {
    // Validate inputs
    if (!uploadId) {
      return { success: false, error: 'ID do upload é obrigatório' };
    }

    if (!metadata) {
      return { success: false, error: 'Metadados são obrigatórios' };
    }

    // Validate metadata structure
    if (!metadata.category || !metadata.colors || !metadata.description) {
      return { success: false, error: 'Metadados incompletos' };
    }

    // Get current upload record
    const { data: currentUpload, error: fetchError } = await supabase
      .from('user_uploads')
      .select('metadata')
      .eq('id', uploadId)
      .single();

    if (fetchError) {
      console.error('Error fetching upload record:', fetchError);
      return {
        success: false,
        error: `Erro ao buscar registro: ${fetchError.message}`,
      };
    }

    // Merge with existing metadata (preserve publicUrl, pieceType, garmentType)
    const updatedMetadata = {
      ...(currentUpload.metadata || {}),
      garmentMetadata: {
        category: metadata.category,
        colors: metadata.colors,
        description: metadata.description,
        occasions: metadata.occasions,
        patterns: metadata.patterns,
        ...(metadata.season && { season: metadata.season }),
        ...(metadata.material && { material: metadata.material }),
        ...(metadata.styleNotes && { styleNotes: metadata.styleNotes }),
      },
    };

    // Update database record
    const { error: updateError } = await supabase
      .from('user_uploads')
      .update({ metadata: updatedMetadata })
      .eq('id', uploadId);

    if (updateError) {
      console.error('Error updating categorization:', updateError);
      return {
        success: false,
        error: `Erro ao salvar categorização: ${updateError.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in saveCategorization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar categorização',
    };
  }
}

/**
 * Saves multiple categorizations in a batch
 * Returns array of results for each upload
 */
export async function saveCategorizationsBatch(
  supabase: SupabaseClient,
  categorizations: SaveCategorizationParams[]
): Promise<{ success: boolean; results: SaveCategorizationResult[]; error?: string }> {
  try {
    if (!categorizations || categorizations.length === 0) {
      return {
        success: false,
        results: [],
        error: 'Nenhuma categorização para salvar',
      };
    }

    // Save all categorizations in parallel
    const results = await Promise.all(
      categorizations.map(cat => saveCategorization(supabase, cat))
    );

    // Check if all succeeded
    const allSuccess = results.every(r => r.success);

    if (!allSuccess) {
      const failedCount = results.filter(r => !r.success).length;
      return {
        success: false,
        results,
        error: `${failedCount} categorização(ões) falharam ao salvar`,
      };
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Unexpected error in saveCategorizationsBatch:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
