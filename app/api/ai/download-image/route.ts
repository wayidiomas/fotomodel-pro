import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/download-image
 * Returns the download URL for a generated image.
 * Since watermarks are disabled, all images are already clean.
 */
export async function POST(request: NextRequest) {
  try {
    const { resultId } = await request.json();

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { data: result, error: resultError } = await (supabase
      .from('generation_results') as any)
      .select(
        `
        id,
        generation_id,
        image_url,
        thumbnail_url,
        metadata,
        generations!inner (
          user_id
        )
      `
      )
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Resultado não encontrado' },
        { status: 404 }
      );
    }

    if (result.generations.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para baixar esta imagem' },
        { status: 403 }
      );
    }

    const metadata = (result.metadata || {}) as Record<string, any>;

    // Get public URL for the image
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(result.image_url);

    const imageUrl = urlData?.publicUrl
      ? `${urlData.publicUrl}?t=${Date.now()}`
      : null;

    // Record download
    await (supabase.from('user_downloads') as any).insert({
      user_id: user.id,
      generation_id: result.generation_id,
      result_id: result.id,
      image_url: result.image_url,
      thumbnail_url: result.thumbnail_url,
      credits_charged: 0,
    });

    // Also save to gallery (ignore if already exists)
    try {
      await (supabase.from('gallery_items') as any).insert({
        user_id: user.id,
        generation_result_id: result.id,
        image_url: result.image_url,
        thumbnail_url: result.thumbnail_url,
        metadata: {
          saved_at: new Date().toISOString(),
          saved_from: 'download',
        },
      });
    } catch (galleryError: any) {
      // Ignore duplicate errors (unique constraint violation)
      if (galleryError.code !== '23505') {
        console.error('Error saving to gallery:', galleryError);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      mimeType: metadata?.mimeType || 'image/png',
      resultId,
    });
  } catch (error) {
    console.error('Error in download-image route:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
