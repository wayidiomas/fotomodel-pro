import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SaveModelRequest {
  generationResultId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  modelName?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  facialExpression?: string | null;
  hairColor?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  poseId?: string | null;
}

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

    const body: SaveModelRequest = await request.json();
    const {
      generationResultId,
      imageUrl,
      thumbnailUrl,
      modelName,
      heightCm,
      weightKg,
      facialExpression,
      hairColor,
      ageMin,
      ageMax,
      poseId,
    } = body;

    if (!generationResultId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Informe o resultado gerado e a imagem para salvar o modelo.' },
        { status: 400 }
      );
    }

    // Validate result belongs to user
    const { data: resultRecord, error: resultError } = await (supabase
      .from('generation_results') as any)
      .select('id, image_url, thumbnail_url, generation:generations!inner(user_id)')
      .eq('id', generationResultId)
      .single();

    if (resultError || !resultRecord) {
      return NextResponse.json(
        { success: false, error: 'Resultado não encontrado.' },
        { status: 404 }
      );
    }

    if (resultRecord.generation?.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não tem permissão para salvar este modelo.' },
        { status: 403 }
      );
    }

    // Resolve pose metadata if available
    let poseMetadata: Record<string, any> | null = null;
    let poseName: string | null = null;
    let poseGender: string | null = null;
    let poseAgeMin: number | null = null;
    let poseAgeMax: number | null = null;
    let poseAgeRange: string | null = null;
    let poseEthnicity: string | null = null;
    let poseCategory: string | null = null;
    let garmentCategories: string[] | null = null;
    let storedPoseId: string | null = poseId || null;

    const resolvePoseFromModel = async (modelId: string) => {
      const { data, error } = await (supabase
        .from('model_poses') as any)
        .select('*')
        .eq('id', modelId)
        .single();
      if (error || !data) return;
      poseMetadata = data.metadata || null;
      poseName = data.name || null;
      poseGender = data.gender || null;
      poseAgeMin = data.age_min || null;
      poseAgeMax = data.age_max || null;
      poseAgeRange = data.age_range || null;
      poseEthnicity = data.ethnicity || null;
      poseCategory = data.pose_category || null;
      garmentCategories = data.garment_categories || null;
    };

    const resolvePoseFromUserModel = async (modelId: string) => {
      const { data, error } = await (supabase
        .from('user_models') as any)
        .select('*')
        .eq('id', modelId)
        .eq('user_id', user.id)
        .single();
      if (error || !data) return;
      poseMetadata = data.pose_metadata || null;
      poseName = data.model_name || null;
      poseGender = data.gender || null;
      poseAgeMin = data.age_min || null;
      poseAgeMax = data.age_max || null;
      poseAgeRange = data.age_range || null;
      poseEthnicity = data.ethnicity || null;
      poseCategory = data.pose_category || null;
      garmentCategories = data.garment_categories || null;
    };

    if (poseId) {
      if (poseId.startsWith('user-model:')) {
        const savedId = poseId.replace('user-model:', '');
        await resolvePoseFromUserModel(savedId);
      } else if (poseId.startsWith('original:')) {
        poseName = 'Pose original';
      } else {
        await resolvePoseFromModel(poseId);
      }
    }

    // Use user-provided age values if available, otherwise fall back to pose metadata
    const finalAgeMin = ageMin ?? poseAgeMin;
    const finalAgeMax = ageMax ?? poseAgeMax;

    // Generate age_range string if we have age values
    let finalAgeRange = poseAgeRange;
    if (finalAgeMin !== null && finalAgeMax !== null) {
      finalAgeRange = `${finalAgeMin}-${finalAgeMax}`;
    }

    const insertPayload = {
      user_id: user.id,
      generation_result_id: generationResultId,
      image_url: imageUrl || resultRecord.image_url,
      thumbnail_url: thumbnailUrl || resultRecord.thumbnail_url,
      model_name: modelName?.trim() || 'Modelo Personalizado',
      height_cm: heightCm,
      weight_kg: weightKg,
      facial_expression: facialExpression,
      hair_color: hairColor,
      pose_id: storedPoseId,
      pose_name: poseName,
      gender: poseGender,
      age_min: finalAgeMin,
      age_max: finalAgeMax,
      age_range: finalAgeRange,
      ethnicity: poseEthnicity,
      pose_category: poseCategory,
      garment_categories: garmentCategories,
      pose_metadata: poseMetadata,
      metadata: {
        facial_expression: facialExpression,
        hair_color: hairColor,
        saved_at: new Date().toISOString(),
      },
    };

    const { data: insertData, error: insertError } = await (supabase
      .from('user_models') as any)
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting user model:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar modelo. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modelId: insertData.id,
      message: 'Modelo salvo com sucesso!',
    });
  } catch (error) {
    console.error('Error in user-models API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado ao salvar modelo',
      },
      { status: 500 }
    );
  }
}
