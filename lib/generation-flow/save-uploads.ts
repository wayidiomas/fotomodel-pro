import type { SupabaseClient } from '@supabase/supabase-js';
import type { GarmentType, PieceType, GarmentUpload } from './upload-types';

export interface SaveUploadParams {
  userId: string;
  garmentType: GarmentType;
  uploads: GarmentUpload[];
}

export interface SavedUpload {
  id: string;
  filePath: string;
  pieceType: PieceType;
  existing: boolean;
}

export interface SaveUploadsResult {
  success: boolean;
  uploadIds?: string[];
  savedUploads?: SavedUpload[];
  error?: string;
}

/**
 * Saves upload records to the database with metadata
 * @param supabase - Supabase client instance
 * @param params - Upload parameters including userId, garmentType, and uploads array
 * @returns Result with success status and upload IDs or error message
 */
export async function saveUploads(
  supabase: SupabaseClient,
  params: SaveUploadParams
): Promise<SaveUploadsResult> {
  const { userId, garmentType, uploads } = params;

  try {
    // Validate inputs
    if (!userId) {
      return { success: false, error: 'ID do usuário é obrigatório' };
    }

    if (!uploads || uploads.length === 0) {
      return { success: false, error: 'Nenhum upload para salvar' };
    }

    // Ensure all uploads have successful upload results
    const failedUploads = uploads.filter(u => !u.uploadResult?.success);
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: `${failedUploads.length} upload(s) falharam. Todos os uploads devem ser bem-sucedidos.`,
      };
    }

    const existingUploads = uploads.filter(u => u.existingUploadId);
    const uploadsToInsert = uploads.filter(u => !u.existingUploadId);

    const existingSaved: SavedUpload[] = existingUploads.map(upload => ({
      id: upload.existingUploadId!,
      filePath: upload.uploadResult?.path || '',
      pieceType: upload.pieceType,
      existing: true,
    }));

    let insertedSaved: SavedUpload[] = [];
    let insertedIds: string[] = [];

    if (uploadsToInsert.length > 0) {
      // Prepare records for insertion
      const records = uploadsToInsert.map(upload => {
        const uploadResult = upload.uploadResult!;

        // Use file metadata if file object is not available (e.g., restored from localStorage)
        const fileName = upload.file?.name || upload.fileMetadata?.name || 'unknown';
        const fileSize = upload.file?.size || upload.fileMetadata?.size || 0;
        const mimeType = upload.file?.type || upload.fileMetadata?.type || 'image/jpeg';

        return {
          user_id: userId,
          file_path: uploadResult.path,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          status: 'uploaded' as const,
          metadata: {
            garmentType,
            pieceType: upload.pieceType,
            publicUrl: uploadResult.publicUrl,
          },
        };
      });

      // Insert records into database
      const { data, error } = await supabase
        .from('user_uploads')
        .insert(records)
        .select('id, file_path, metadata');

      if (error) {
        console.error('Error saving uploads to database:', error);
        return {
          success: false,
          error: `Erro ao salvar no banco de dados: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Nenhum registro foi criado no banco de dados',
        };
      }

      insertedSaved = data.map(record => ({
        id: record.id,
        filePath: record.file_path,
        pieceType: (record.metadata as any)?.pieceType || 'upper',
        existing: false,
      }));
      insertedIds = data.map(d => d.id);
    }

    const combinedSaved = [...existingSaved, ...insertedSaved];
    const combinedIds = [
      ...existingSaved.map(upload => upload.id),
      ...insertedIds,
    ];

    return {
      success: true,
      uploadIds: combinedIds,
      savedUploads: combinedSaved,
    };
  } catch (error) {
    console.error('Unexpected error in saveUploads:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar uploads',
    };
  }
}

/**
 * Gets saved uploads for a user filtered by garment type
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param garmentType - Optional filter by garment type
 * @returns Array of saved upload records
 */
export async function getUserUploads(
  supabase: SupabaseClient,
  userId: string,
  garmentType?: GarmentType
) {
  try {
    let query = supabase
      .from('user_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // Filter by garmentType if provided
    if (garmentType) {
      query = query.eq('metadata->>garmentType', garmentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user uploads:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error in getUserUploads:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: [],
    };
  }
}
