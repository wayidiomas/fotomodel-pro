import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { base64ToBuffer } from '@/lib/images/watermark';
import { uploadGeneratedImage } from '@/lib/storage/upload';

interface GenerationResultRecord {
  id: string;
  generation_id: string;
  image_url: string;
  thumbnail_url: string | null;
  is_purchased: boolean | null;
  metadata: Record<string, any> | null;
  generations: {
    user_id: string;
  };
}

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
        is_purchased,
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

    const generatedUrlData = result.image_url
      ? supabase.storage.from('generated-images').getPublicUrl(result.image_url)
      : null;
    const currentImageUrl = generatedUrlData?.data?.publicUrl || null;

    // If already purchased, just provide the clean image URL (cache-busted)
    if (result.is_purchased && metadata?.cleanImageData == null) {
      const purchasedPath = metadata?.purchasedPath || result.image_url;
      const purchasedBucket =
        metadata?.purchasedBucket ||
        (metadata?.purchasedPath ? 'purchased-images' : 'generated-images');

      let purchasedUrl: string | null = null;
      if (purchasedPath) {
        const { data: bucketUrlData } = supabase.storage
          .from(purchasedBucket)
          .getPublicUrl(purchasedPath);
        purchasedUrl = bucketUrlData?.publicUrl || null;
      }

      const resolvedUrl = purchasedUrl || currentImageUrl;

      return NextResponse.json({
        success: true,
        imageUrl: resolvedUrl ? `${resolvedUrl}?t=${Date.now()}` : null,
        mimeType: metadata?.cleanMimeType || 'image/png',
        creditsRemaining: undefined,
        resultId,
        alreadyPurchased: true,
      });
    }

    const cleanImageData = metadata?.cleanImageData;
    const cleanMimeType = metadata?.cleanMimeType || 'image/png';

    if (!cleanImageData) {
      return NextResponse.json(
        {
          error:
            'Não foi possível localizar a imagem original sem marca d’água. Gere novamente e tente de novo.',
        },
        { status: 422 }
      );
    }

    const cleanBuffer = base64ToBuffer(cleanImageData);

    const uploadResult = await uploadGeneratedImage(
      user.id,
      result.generation_id,
      cleanBuffer,
      cleanMimeType,
      result.image_url || undefined
    );

    if (!uploadResult.success || !uploadResult.path) {
      return NextResponse.json(
        { error: uploadResult.error || 'Erro ao salvar imagem limpa' },
        { status: 500 }
      );
    }

    const cleanPublicUrl = uploadResult.publicUrl || currentImageUrl;
    const cleanImageUrl = cleanPublicUrl ? `${cleanPublicUrl}?t=${Date.now()}` : null;

    const updatedMetadata = {
      ...metadata,
      cleanImageData: null,
      purchasedPath: uploadResult.path,
      purchasedBucket: 'generated-images',
      purchasedAt: new Date().toISOString(),
    };

    await Promise.all([
      (supabase.from('generation_results') as any)
        .update({
          is_purchased: true,
          has_watermark: false,
          image_url: uploadResult.path,
          metadata: updatedMetadata,
        })
        .eq('id', resultId),
      (supabase.from('user_downloads') as any).insert({
        user_id: user.id,
        generation_id: result.generation_id,
        result_id: result.id,
        image_url: uploadResult.path,
        thumbnail_url: result.thumbnail_url,
        credits_charged: 0,
      }),
    ]);

    return NextResponse.json({
      success: true,
      imageUrl: cleanImageUrl,
      mimeType: cleanMimeType,
      creditsRemaining: undefined,
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
