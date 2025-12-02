import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithImagen } from '@/lib/ai/imagen';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Descreva melhor o background que deseja gerar.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const backgroundPrompt = `Create a high-resolution background for a fashion photoshoot. ${prompt}.
Requirements:
- No people or models visible
- Cinematic lighting that flatters clothing photography
- Natural depth and perspective
- Clean composition without text or logos`;

    const result = await generateWithImagen({
      prompt: backgroundPrompt,
      negativePrompt: 'person, people, model, human, text, watermark, logo',
      aspectRatio: '3:4',
      model: 'gemini-2.5-flash-image',
    });

    if (!result.success || !result.imageData) {
      return NextResponse.json(
        { success: false, error: result.error || 'Falha ao gerar background.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageData: result.imageData,
      mimeType: result.mimeType || 'image/png',
    });
  } catch (error) {
    console.error('Error generating background:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar background.' },
      { status: 500 }
    );
  }
}
