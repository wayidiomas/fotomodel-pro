import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveUploadsToWardrobe } from '@/lib/wardrobe/save-to-wardrobe';

interface SaveItemsRequest {
  uploadIds: string[];
  collectionId?: string | null;
}

/**
 * POST /api/wardrobe/save-items
 * Saves categorized uploads to the wardrobe_items table
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SaveItemsRequest = await request.json();
    const { uploadIds, collectionId } = body;

    // Validate input
    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'uploadIds é obrigatório e deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Save to wardrobe
    const result = await saveUploadsToWardrobe(supabase, {
      userId: user.id,
      uploadIds,
      collectionId: collectionId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      itemIds: result.itemIds,
      saved: result.itemIds?.length || 0,
      skipped: result.skipped || 0,
      message:
        result.skipped && result.skipped > 0
          ? `${result.itemIds?.length || 0} peça(s) salva(s), ${result.skipped} já existia(m) no vestuário`
          : `${result.itemIds?.length || 0} peça(s) salva(s) no vestuário com sucesso`,
    });
  } catch (error) {
    console.error('Error in save-items API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar peças no vestuário',
      },
      { status: 500 }
    );
  }
}
