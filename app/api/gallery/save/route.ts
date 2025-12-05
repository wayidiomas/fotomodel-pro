import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { generationResultId, imageUrl, thumbnailUrl } = body;

    if (!generationResultId) {
      return NextResponse.json(
        { success: false, error: 'generation_result_id é obrigatório' },
        { status: 400 }
      );
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('gallery_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('generation_result_id', generationResultId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Imagem já está na galeria' },
        { status: 400 }
      );
    }

    // Save to gallery
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        user_id: user.id,
        generation_result_id: generationResultId,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        metadata: {
          saved_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving to gallery:', error);

      // Provide more specific error message
      let errorMessage = 'Erro ao salvar na galeria';

      if (error.code === '42P01') {
        errorMessage = 'Tabela gallery_items não existe. Entre em contato com o suporte.';
      } else if (error.code === '42501') {
        errorMessage = 'Sem permissão para salvar na galeria. Verifique as políticas RLS.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      galleryItemId: data.id,
      message: 'Imagem salva na galeria com sucesso!',
    });
  } catch (error) {
    console.error('Error in gallery save API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado',
      },
      { status: 500 }
    );
  }
}
