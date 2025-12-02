/**
 * API Route: Improve Generation with AI
 *
 * This endpoint allows users to improve a generated image by providing
 * free-form improvement text. Costs 1 credit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const IMPROVEMENT_CREDIT_COST = 1;

export async function POST(request: NextRequest) {
  try {
    const { resultId, improvementText } = await request.json();

    if (!resultId || !improvementText) {
      return NextResponse.json(
        { error: 'Missing required fields: resultId and improvementText' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Check user credits
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Erro ao verificar créditos' },
        { status: 500 }
      );
    }

    if (userData.credits < IMPROVEMENT_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Créditos insuficientes. Você precisa de pelo menos 1 crédito para melhorar a imagem.',
          creditsRequired: IMPROVEMENT_CREDIT_COST,
          creditsAvailable: userData.credits,
        },
        { status: 402 }
      );
    }

    // Get the original generation result
    const { data: originalResult, error: resultError } = await (supabase
      .from('generation_results') as any)
      .select(`
        id,
        generation_id,
        metadata,
        generations!inner (
          id,
          input_data,
          tool_id
        )
      `)
      .eq('id', resultId)
      .single();

    if (resultError || !originalResult) {
      console.error('Error fetching generation result:', resultError);
      return NextResponse.json(
        { error: 'Resultado não encontrado' },
        { status: 404 }
      );
    }

    // Deduct credits
    const newCreditBalance = userData.credits - IMPROVEMENT_CREDIT_COST;

    const { error: deductError } = await (supabase
      .from('users') as any)
      .update({ credits: newCreditBalance })
      .eq('id', user.id);

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      return NextResponse.json(
        { error: 'Erro ao processar créditos' },
        { status: 500 }
      );
    }

    // Record transaction
    await (supabase
      .from('credit_transactions') as any)
      .insert({
        user_id: user.id,
        amount: -IMPROVEMENT_CREDIT_COST,
        type: 'improvement',
        description: 'Melhoria de imagem com IA',
        metadata: {
          originalResultId: resultId,
          improvementText,
        },
      });

    const trimmedImprovement = improvementText.trim();
    const originalGeneration = originalResult.generations;
    if (!originalGeneration || !originalGeneration.input_data) {
      return NextResponse.json(
        { error: 'Não encontramos os dados completos desta geração para refazer.' },
        { status: 422 }
      );
    }

    const inputData = originalGeneration.input_data as Record<string, any>;
    const adjustedInputData = {
      ...(inputData || {}),
      improvementRequest: trimmedImprovement,
      improvementContext: {
        originalResultId: resultId,
        requestedBy: user.id,
      },
      isImprovementRegeneration: true,
    };

    // Create a new generation record
    const { data: newGeneration, error: generationError } = await (supabase
      .from('generations') as any)
      .insert({
        user_id: user.id,
        tool_id: originalGeneration.tool_id,
        status: 'pending',
        input_data: adjustedInputData,
        output_data: {
          improvement_text: trimmedImprovement,
          original_result_id: resultId,
        },
        credits_used: IMPROVEMENT_CREDIT_COST,
      })
      .select('id')
      .single();

    if (generationError || !newGeneration) {
      console.error('Error creating new generation:', generationError);

      // Refund credits if generation creation failed
      await (supabase
        .from('users') as any)
        .update({ credits: userData.credits })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'Erro ao criar nova geração' },
        { status: 500 }
      );
    }

    // TODO: Trigger actual image generation
    // For now, return success. The actual generation will be handled by the generate-image endpoint
    // which should be called by the client or triggered via a background job

    return NextResponse.json({
      success: true,
      newGenerationId: newGeneration.id,
      creditsRemaining: newCreditBalance,
      creditsCost: IMPROVEMENT_CREDIT_COST,
      message: 'Melhoria iniciada com sucesso',
    });

  } catch (error) {
    console.error('Error in improve-generation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
