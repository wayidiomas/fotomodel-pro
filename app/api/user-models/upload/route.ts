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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const modelName = formData.get('modelName') as string | null;
    const ageMin = formData.get('ageMin') as string | null;
    const ageMax = formData.get('ageMax') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'A imagem deve ter no máximo 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `custom-model-${user.id}-${timestamp}.${fileExt}`;
    const filePath = `user-models/${user.id}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filePath);

    // Save model to database
    const finalModelName = modelName?.trim() || `Modelo Personalizado ${new Date().toLocaleDateString('pt-BR')}`;
    const parsedAgeMin = ageMin ? parseInt(ageMin, 10) : null;
    const parsedAgeMax = ageMax ? parseInt(ageMax, 10) : null;
    const ageRangeString = parsedAgeMin && parsedAgeMax ? `${parsedAgeMin}-${parsedAgeMax} anos` : null;

    const insertPayload = {
      user_id: user.id,
      image_url: filePath, // Store relative path
      thumbnail_url: filePath, // Same as image for now
      model_name: finalModelName,
      gender: null, // User can update later
      age_range: ageRangeString,
      age_min: parsedAgeMin,
      age_max: parsedAgeMax,
      height_cm: null,
      weight_kg: null,
      facial_expression: null,
      hair_color: null,
      ethnicity: null,
      pose_category: 'custom',
      pose_id: null,
      pose_name: 'Personalizado',
      garment_categories: null,
      pose_metadata: {
        source: 'custom_upload',
        uploaded_at: new Date().toISOString(),
      },
      metadata: {
        source: 'chat_upload',
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString(),
      },
    };

    const { data: modelData, error: modelError } = await supabase
      .from('user_models')
      .insert(insertPayload)
      .select('id')
      .single();

    if (modelError) {
      console.error('Error saving model to database:', modelError);
      // Try to delete uploaded file
      await supabase.storage.from('generated-images').remove([filePath]);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar modelo no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modelId: modelData.id,
      imageUrl: publicUrl,
      message: 'Modelo personalizado criado com sucesso!',
    });
  } catch (error) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado ao processar upload',
      },
      { status: 500 }
    );
  }
}
