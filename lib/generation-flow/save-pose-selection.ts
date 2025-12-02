'use server';

import { createClient } from '@/lib/supabase/server';
import type { PoseSelectionMetadata } from './pose-types';

export interface SavePoseSelectionResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to save pose selection to user_uploads metadata
 * Updates the metadata field for each upload with the selected pose IDs
 *
 * @param uploadIds - Array of upload IDs to update
 * @param selectedPoseIds - Array of selected pose IDs (max 1)
 * @returns Result with success status and optional error message
 */
export async function savePoseSelection(
  uploadIds: string[],
  selectedPoseIds: string[]
): Promise<SavePoseSelectionResult> {
  try {
    // Validate inputs
    if (!uploadIds || uploadIds.length === 0) {
      return {
        success: false,
        error: 'Nenhum upload fornecido',
      };
    }

    if (!selectedPoseIds || selectedPoseIds.length === 0) {
      return {
        success: false,
        error: 'Nenhuma pose selecionada',
      };
    }

    if (selectedPoseIds.length > 1) {
      return {
        success: false,
        error: 'Máximo de 1 pose permitida',
      };
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      };
    }

    // Fetch current uploads to get existing metadata
    const { data: uploads, error: fetchError } = await (supabase
      .from('user_uploads') as any)
      .select('id, metadata')
      .in('id', uploadIds)
      .eq('user_id', user.id);

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

    // Prepare pose selection metadata
    const poseSelection: PoseSelectionMetadata = {
      selectedPoseIds,
      selectedAt: new Date().toISOString(),
    };

    // Update each upload individually to respect RLS policies
    // Using update() instead of upsert() prevents attempts to insert new rows
    for (const upload of uploads as any[]) {
      const updatedMetadata = {
        ...(upload.metadata as object),
        poseSelection,
      };

      const { error: updateError } = await (supabase
        .from('user_uploads') as any)
        .update({ metadata: updatedMetadata })
        .eq('id', upload.id)
        .eq('user_id', user.id); // Ensure we only update our own uploads

      if (updateError) {
        console.error('Error updating upload:', updateError);
        return {
          success: false,
          error: 'Erro ao salvar seleção de poses',
        };
      }
    }

    console.log(`✅ Pose selection saved for ${uploads.length} uploads:`, selectedPoseIds);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error in savePoseSelection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
