/**
 * API Route: Regenerate Image from Dislike Feedback
 *
 * This endpoint regenerates an image based on user dislike feedback.
 * It's FREE for users (up to 3 times per day) and helps improve AI outputs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DAILY_DISLIKE_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const { resultId, feedbackText } = await request.json();

    if (!resultId || !feedbackText) {
      return NextResponse.json(
        { error: 'Missing required fields: resultId and feedbackText' },
        { status: 400 }
      );
    }
    const sanitizedFeedback = feedbackText.trim();

    if (!sanitizedFeedback) {
      return NextResponse.json(
        { error: 'O feedback não pode estar vazio.' },
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

    // Check daily dislike limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: dailyLimitData, error: limitError } = await (supabase
      .from('user_daily_limits') as any)
      .select('dislike_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentDislikeCount = dailyLimitData?.dislike_count || 0;

    if (limitError && limitError.code !== 'PGRST116') {
      console.error('Error checking daily limit:', limitError);
    }

    if (currentDislikeCount >= DAILY_DISLIKE_LIMIT) {
      return NextResponse.json(
        {
          error: `Você atingiu o limite de ${DAILY_DISLIKE_LIMIT} melhorias grátis por dia. Tente novamente amanhã!`,
          limitReached: true
        },
        { status: 429 }
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

    const originalGeneration = originalResult.generations;
    if (!originalGeneration || !originalGeneration.input_data) {
      return NextResponse.json(
        { error: 'Não encontramos os dados completos desta geração para refazer.' },
        { status: 422 }
      );
    }

    // Store feedback in database
    await (supabase
      .from('generation_feedback') as any)
      .upsert({
        user_id: user.id,
        generation_result_id: resultId,
        feedback_type: 'dislike',
        feedback_text: sanitizedFeedback,
      }, {
        onConflict: 'user_id,generation_result_id',
      });

    // Update daily dislike count
    if (dailyLimitData) {
      await (supabase
        .from('user_daily_limits') as any)
        .update({ dislike_count: currentDislikeCount + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await (supabase
        .from('user_daily_limits') as any)
        .insert({
          user_id: user.id,
          date: today,
          dislike_count: 1,
        });
    }

    // Trigger new generation with feedback-adjusted prompt
    // For now, we'll redirect to the generate-image endpoint with feedback metadata
    const inputData = originalGeneration.input_data as Record<string, any>;

    // Add feedback to the generation metadata
    const adjustedInputData = {
      ...(inputData || {}),
      feedbackRegeneration: {
        feedback: sanitizedFeedback,
        originalResultId: resultId,
      },
      isFeedbackRegeneration: true,
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
          feedback_text: sanitizedFeedback,
          original_result_id: resultId,
        },
        credits_used: 0,
      })
      .select('id')
      .single();

    if (generationError || !newGeneration) {
      console.error('Error creating new generation:', generationError);
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
      message: 'Nova geração iniciada com base no seu feedback',
      dislikesRemaining: DAILY_DISLIKE_LIMIT - (currentDislikeCount + 1),
    });

  } catch (error) {
    console.error('Error in regenerate-from-feedback:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
