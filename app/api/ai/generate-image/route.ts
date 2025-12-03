/**
 * POST /api/ai/generate-image
 * Generate virtual try-on images using Gemini 2.5 Flash with AI-optimized prompts
 *
 * New Flow:
 * 1. Validate user and authentication
 * 2. Load garment images and pose selection from database
 * 3. Load customization data (height, weight, expression, AI tools)
 * 4. Get Virtual Try-On Tool ID from database
 * 5. Calculate credit cost (base + AI edits)
 * 6. Check user has sufficient credits
 * 7. Create generation record with tool_id
 * 8. Fetch images as base64
 * 8.5. Optimize prompt with Gemini 2.0 Flash (NEW)
 *      - Build structured JSON input with all customization data
 *      - Call Gemini 2.0 Flash to generate optimized English prompt
 *      - Save generated prompt to ai_generated_prompts table
 *      - On failure: return error and ask user to retry (credits not yet debited)
 * 9. Generate virtual try-on image with Gemini 2.5 Flash (using optimized prompt)
 * 10. Apply AI edits sequentially if requested (background removed for now)
 * 11. Apply background change as separate step (if enabled)
 * 12. Add watermark to final image
 * 13. Upload to storage and create thumbnail
 * 14. Save generation result
 * 15. Save AI edits records
 * 16. Update generation status
 * 17. Debit user credits
 * 18. Return results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { virtualTryOn, editImage, blendImages } from '@/lib/ai/gemini';
import { createVirtualTryOnPrompt, createBackgroundRemovalPrompt, createBackgroundChangePrompt, createHairColorChangePrompt, createLogoInsertionPrompt } from '@/lib/ai/gemini-prompts';
import { optimizePrompt, buildPromptOptimizerInput, buildGarmentPlacementHint, PROMPT_OPTIMIZER_MODEL_ID } from '@/lib/ai/prompt-optimizer';
import { calculateGenerationCredits, resolveCreditPricing } from '@/lib/credits/credit-calculator';
import { fetchCreditPricingOverrides, CREDIT_ACTIONS } from '@/lib/credits/credit-pricing';
import { addWatermark, createThumbnail, base64ToBuffer } from '@/lib/images/watermark';
import { uploadGeneratedImage, uploadThumbnail } from '@/lib/storage/upload';
import { GEMINI_ASPECT_RATIOS } from '@/lib/generation-flow/image-formats';
import type { CustomizationData } from '@/lib/generation-flow/useCustomization';
import { assessGarmentPoseCompatibility } from '@/lib/ai/pose-advisor';

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Fetch image from Supabase Storage and convert to base64
 */
async function fetchImageAsBase64(publicUrl: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { data: base64, mimeType: contentType };
}

function parseDataUrl(dataUrl?: string | null): { data: string; mimeType: string } | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1] || 'image/png',
    data: match[2],
  };
}

interface BackgroundSelectionPayload {
  type?: 'preset' | 'custom' | 'ai' | 'original';
  presetId?: string;
  presetName?: string;
  presetCategory?: string;
  customUrl?: string;
  customFileName?: string;
  customMimeType?: string;
  aiPrompt?: string;
  aiImageData?: string;
  aiImageMimeType?: string;
  aiPreviewUrl?: string;
}

async function resolveBackgroundReference(
  supabase: ReturnType<typeof getServiceRoleClient>,
  selection: BackgroundSelectionPayload | null | undefined
): Promise<{ data: string; mimeType: string } | null> {
  if (!selection) return null;

  if (selection.type === 'custom') {
    const parsed = parseDataUrl(selection.customUrl);
    if (parsed) {
      return parsed;
    }
    if (selection.customUrl?.startsWith('http')) {
      return await fetchImageAsBase64(selection.customUrl);
    }
    return null;
  }

  if (selection.type === 'ai') {
    if (selection.aiImageData) {
      return {
        data: selection.aiImageData,
        mimeType: selection.aiImageMimeType || 'image/png',
      };
    }
    const parsed = parseDataUrl(selection.aiPreviewUrl);
    if (parsed) return parsed;
    return null;
  }

  if (selection.type === 'preset' && selection.presetId) {
    const { data: preset, error } = await supabase
      .from('background_presets')
      .select('image_url')
      .eq('id', selection.presetId)
      .single();

    if (error || !preset?.image_url) return null;
    return await fetchImageAsBase64(preset.image_url);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadIds, regenerationType } = body;
    // Watermark disabled - always skip
    const skipWatermark = true;

    // Validate inputs
    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json(
        { error: 'uploadIds array is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch user data and check credits
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ====================================
    // 1. Load Garment Images
    // ====================================
    const { data: uploads, error: uploadsError } = await supabase
      .from('user_uploads')
      .select('id, file_path, metadata')
      .eq('user_id', user.id)
      .in('id', uploadIds);

    if (uploadsError || !uploads || uploads.length === 0) {
      return NextResponse.json(
        { error: 'Uploads not found' },
        { status: 404 }
      );
    }

    // ====================================
    // 2. Load Pose Selection
    // ====================================
    // Get pose selection from metadata (supports both old and new formats)
    const firstUpload = uploads[0];
    const metadata = firstUpload.metadata as any;

    // Try new format first (poseSelection.selectedPoseIds)
    let poseId = metadata?.poseSelection?.selectedPoseIds?.[0];

    // Fall back to old format (selectedPoseId)
    if (!poseId) {
      poseId = metadata?.selectedPoseId;
    }

    if (!poseId) {
      return NextResponse.json(
        { error: 'No pose selected. Please select a pose first.' },
        { status: 400 }
      );
    }

    const originalPoseMatch = typeof poseId === 'string' ? poseId.match(/^original:(.+)$/) : null;
    const userModelPoseMatch = typeof poseId === 'string' ? poseId.match(/^user-model:(.+)$/) : null;
    let poseData: any;

    if (originalPoseMatch) {
      const originalUploadId = originalPoseMatch[1];
      const originalUpload =
        uploads.find((upload: any) => upload.id === originalUploadId) || uploads[0];
      const originalPublicUrl = (originalUpload?.metadata as any)?.publicUrl;

      if (!originalPublicUrl) {
        return NextResponse.json(
          { error: 'Original pose reference not available' },
          { status: 400 }
        );
      }

      poseData = {
        id: poseId,
        image_url: originalPublicUrl,
        metadata: {
          description: 'Pose original enviada pelo usuário',
          poseCategory: 'original_reference',
          referenceUploadId: originalUpload?.id,
        },
        gender: 'FEMALE',
        age_min: 20,
        age_max: 40,
        age_range: 'TWENTIES',
        ethnicity: 'MIXED',
        pose_category: 'standing',
      };
    } else if (userModelPoseMatch) {
      const savedModelId = userModelPoseMatch[1];
      const { data: savedModel, error: savedModelError } = await supabase
        .from('user_models')
        .select('id, user_id, image_url, gender, age_min, age_max, age_range, ethnicity, pose_category, pose_metadata')
        .eq('id', savedModelId)
        .single();

      if (savedModelError || !savedModel) {
        return NextResponse.json(
          { error: 'Modelo salvo não encontrado.' },
          { status: 404 }
        );
      }

      if (savedModel.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Você não pode usar um modelo salvo de outro usuário.' },
          { status: 403 }
        );
      }

      poseData = {
        id: poseId,
        image_url: savedModel.image_url,
        metadata: savedModel.pose_metadata || {
          description: 'Modelo personalizado salvo pelo usuário',
        },
        gender: savedModel.gender || 'FEMALE',
        age_min: savedModel.age_min || 20,
        age_max: savedModel.age_max || 40,
        age_range: savedModel.age_range || 'TWENTIES',
        ethnicity: savedModel.ethnicity || 'MIXED',
        pose_category: savedModel.pose_category || 'standing',
      };
    } else {
      const { data, error: poseError } = await (supabase
        .from('model_poses') as any)
        .select('id, image_url, metadata, gender, age_min, age_max, age_range, ethnicity, pose_category')
        .eq('id', poseId)
        .single();

      if (poseError || !data) {
        return NextResponse.json(
          { error: 'Selected pose not found' },
          { status: 404 }
        );
      }
      poseData = data;
    }

    // ====================================
    // 3. Load Customization Data
    // ====================================
    const { data: customizationData, error: customizationError } = await supabase
      .from('generation_customizations')
      .select('*')
      .eq('upload_id', uploadIds[0])
      .single();

    if (customizationError && customizationError.code !== 'PGRST116') {
      console.error('Error loading customization:', customizationError);
    }

    // Build customization object
    const customization: CustomizationData = customizationData
      ? {
          height: customizationData.model_height_cm || 170,
          weight: customizationData.model_weight_kg || 60,
          facialExpression: customizationData.facial_expression,
          hairColor: (customizationData.metadata as any)?.hair_color || null,
          selectedFormat: null, // Will be loaded separately from generation_format_selections
          aiTools: (customizationData.metadata as any)?.ai_tools || {
            removeBackground: false,
            changeBackground: { enabled: false, selection: null },
            addLogo: { enabled: false, logo: null },
          },
          uploadIds,
        }
      : {
          height: 170,
          weight: 60,
          facialExpression: null,
          hairColor: null,
          selectedFormat: null,
          aiTools: {
            removeBackground: false,
            changeBackground: { enabled: false, selection: null },
            addLogo: { enabled: false, logo: null },
          },
          uploadIds,
        };

    // ====================================
    // 4. Get Virtual Try-On Tool ID
    // ====================================
    const { data: virtualTryOnTool, error: toolError } = await supabase
      .from('ai_tools')
      .select('id, credits_cost')
      .eq('name', 'Prova Virtual IA')
      .eq('is_active', true)
      .single();

    if (toolError || !virtualTryOnTool) {
      return NextResponse.json(
        { error: 'Virtual Try-On tool not found' },
        { status: 500 }
      );
    }

    // ====================================
    // 5. Calculate Credit Cost
    // ====================================
    const pricingOverrides = await fetchCreditPricingOverrides(supabase, [
      CREDIT_ACTIONS.BASE_GENERATION,
      CREDIT_ACTIONS.AI_EDIT,
    ]);
    const creditPricing = resolveCreditPricing(pricingOverrides);
    const creditBreakdown = calculateGenerationCredits(customization.aiTools, creditPricing);
    const totalCredits = creditBreakdown.total;

    // Check if user has enough credits
    if (userData.credits < totalCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCredits,
          available: userData.credits,
        },
        { status: 402 } // Payment Required
      );
    }

    // ====================================
    // 6. Create Generation Record
    // ====================================
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        tool_id: virtualTryOnTool.id,
        status: 'pending',
        input_data: {
          uploadIds,
          poseId,
          customization,
        },
        credits_used: totalCredits,
      })
      .select()
      .single();

    if (generationError || !generation) {
      console.error('Error creating generation:', generationError);
      return NextResponse.json(
        { error: 'Failed to create generation' },
        { status: 500 }
      );
    }

    // Update generation status to processing
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generation.id);

    try {
      // ====================================
      // 7. Fetch Images as Base64
      // ====================================
      // Get garment image (assuming first upload is the garment)
      const garmentPublicUrl = (firstUpload.metadata as any)?.publicUrl;
      if (!garmentPublicUrl) {
        throw new Error('Garment image URL not found');
      }

      const garmentBase64Data = await fetchImageAsBase64(garmentPublicUrl);
      const poseBase64Data = await fetchImageAsBase64(poseData.image_url);
      const garmentBase64 = garmentBase64Data.data;
      const poseBase64 = poseBase64Data.data;

      // ====================================
      // 8. Optimize Prompt with Gemini 2.0 Flash
      // ====================================
      const garmentMetadata = (firstUpload.metadata as any)?.garment || {};
      const poseMetadata = (poseData.metadata as any) || {};

      // Determine output dimensions from selected format or use default 3:4
      let outputWidth = 864;
      let outputHeight = 1184;
      let aspectRatio = '3:4';

      // Try to load selected format
      if (customization.selectedFormat) {
        const { data: formatData } = await supabase
          .from('image_format_presets')
          .select('gemini_aspect_ratio, width, height, aspect_ratio')
          .eq('id', customization.selectedFormat)
          .single();

        if (formatData?.gemini_aspect_ratio) {
          const dimensions = GEMINI_ASPECT_RATIOS[formatData.gemini_aspect_ratio as keyof typeof GEMINI_ASPECT_RATIOS];
          if (dimensions) {
            outputWidth = dimensions.width;
            outputHeight = dimensions.height;
            aspectRatio = formatData.gemini_aspect_ratio;
          }
        }
      }

      const primaryPieceType: 'upper' | 'lower' | undefined =
        (firstUpload.metadata as any)?.pieceType || undefined;
      const garmentPlacementHint = buildGarmentPlacementHint({
        garmentType: uploads.length > 1 ? 'outfit' : 'single',
        primaryPieceType,
        garmentCategory: garmentMetadata.category,
      });

      const changeBackgroundTool = customization.aiTools.changeBackground;
      const backgroundSelection = (changeBackgroundTool?.selection || null) as BackgroundSelectionPayload | null;
      const keepOriginalBackground = backgroundSelection?.type === 'original';
      const wantsCustomBackground =
        changeBackgroundTool.enabled &&
        backgroundSelection &&
        backgroundSelection.type !== 'original';
      let backgroundReferenceImage: { data: string; mimeType: string } | null = null;
      if (wantsCustomBackground && backgroundSelection) {
        try {
          backgroundReferenceImage = await resolveBackgroundReference(supabase, backgroundSelection);
        } catch (bgError) {
          console.warn('Could not load background reference:', bgError);
        }
      }
      const backgroundDescription = backgroundSelection
        ? backgroundSelection.type === 'preset'
          ? backgroundSelection.presetName || backgroundSelection.presetId || 'preset background'
          : backgroundSelection.type === 'ai'
            ? backgroundSelection.aiPrompt || 'custom AI-generated background'
            : backgroundSelection.type === 'custom'
              ? backgroundSelection.customFileName || 'custom uploaded background'
              : 'original garment background'
        : undefined;

      // Build optimizer input
      const optimizerInput = buildPromptOptimizerInput({
        garmentType: uploads.length > 1 ? 'outfit' : 'single',
        garmentCategory: garmentMetadata.category || 'clothing',
        garmentDescription: garmentMetadata.description,
        gender: poseMetadata.gender || 'FEMALE',
        poseCategory: poseMetadata.poseCategory || poseData.pose_category || 'standing',
        poseReferenceDescription: poseMetadata.description || poseMetadata.reference || poseMetadata.poseDescription,
        ageRange: poseMetadata.ageRange,
        modelHeight: customization.height,
        modelWeight: customization.weight,
        facialExpression: customization.facialExpression || undefined,
        hairColor: customization.hairColor || undefined,
        aspectRatio,
        outputWidth,
        outputHeight,
        garmentPlacementHint,
        background: wantsCustomBackground
          ? {
              enabled: true,
              type: backgroundSelection.type === 'preset' ? 'preset' : 'custom',
              description: backgroundDescription || '',
            }
          : keepOriginalBackground
            ? {
                enabled: true,
                type: 'original',
                description:
                  backgroundDescription ||
                  'Preserve the original background and environment from the garment reference photo.',
              }
            : undefined,
      });

      let poseAssessment = null;
      try {
        poseAssessment = await assessGarmentPoseCompatibility({
          garmentImageData: garmentBase64,
          poseImageData: poseBase64,
          garmentCategory: garmentMetadata.category,
          pieceType: primaryPieceType,
          poseDescription: poseMetadata.description || poseMetadata.poseDescription,
        });
      } catch (advisorError) {
        console.error('Pose advisor failed:', advisorError);
      }

      // Call Gemini 2.0 Flash to optimize prompt
      const optimizerResult = await optimizePrompt(optimizerInput);

      if (!optimizerResult.success || !optimizerResult.prompt) {
        // Prompt optimization failed - ask user to retry (credits not yet debited)
        console.error('Prompt optimization failed:', optimizerResult.error);

        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: `Prompt optimization failed: ${optimizerResult.error}. Please try again.`,
          })
          .eq('id', generation.id);

        // No need to refund credits - they haven't been debited yet
        // (Credits are only debited at the end on success)

        return NextResponse.json(
          {
            error: 'Failed to optimize prompt. Please try generating again.',
            details: optimizerResult.error,
          },
          { status: 500 }
        );
      }

      // Save generated prompt to database for auditing
      const { error: promptSaveError } = await supabase
        .from('ai_generated_prompts')
        .insert({
          generation_id: generation.id,
          input_data: optimizerInput,
          generated_prompt: optimizerResult.prompt,
          prompt_optimizer_model: optimizerResult.metadata?.model || PROMPT_OPTIMIZER_MODEL_ID,
            tokens_used: optimizerResult.tokensUsed || null,
            metadata: optimizerResult.metadata || {},
          });

      if (promptSaveError) {
        console.error('Error saving generated prompt:', promptSaveError);
        // Continue anyway - this is not critical
      }

      // Use the optimized prompt
      let poseGuidance =
        'Siga exatamente a pose de referência fornecida, incluindo orientação do tronco, membros e distribuição de peso.';
      if (poseAssessment) {
        poseGuidance = poseAssessment.recommendPoseAdjustment
          ? `O assistente detectou compatibilidade moderada (${poseAssessment.score}/100). ${poseAssessment.guidance}`
          : `Compatibilidade alta (${poseAssessment.score}/100). ${poseAssessment.guidance}`;
      }

      const tryOnPrompt = `${optimizerResult.prompt}

${poseGuidance}
Ensure realistic human proportions with a natural head-to-body ratio, keeping limbs and torso proportional to a real human reference.`;

      // ====================================
      // 9. Generate Virtual Try-On Image (with retry)
      // ====================================
      const generateTryOn = async (attempts = 2) => {
        let lastResult: Awaited<ReturnType<typeof virtualTryOn>> | null = null;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const result = await virtualTryOn({
            prompt: tryOnPrompt,
            garmentImageData: garmentBase64,
            poseImageData: poseBase64,
          });
          if (result.success && result.imageData) {
            return result;
          }
          lastResult = result;
        }
        return lastResult!;
      };

      const tryOnResult = await generateTryOn(2);

      if (!tryOnResult.success || !tryOnResult.imageData) {
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: tryOnResult.error || 'Failed to generate virtual try-on',
          })
          .eq('id', generation.id);

        return NextResponse.json(
          {
            error:
              tryOnResult.error ||
              'Não conseguimos gerar a imagem desta vez. Tente novamente em instantes.',
          },
          { status: 502 }
        );
      }

      let currentImageData = tryOnResult.imageData;
      let currentMimeType = tryOnResult.mimeType || 'image/png';

      // ====================================
      // 10. Apply AI Edits Sequentially
      // ====================================
      const aiEditsApplied: string[] = [];

      // 10.1 Remove Background (if enabled)
      if (customization.aiTools.removeBackground) {
        const bgRemovalResult = await editImage({
          prompt: createBackgroundRemovalPrompt(),
          imageData: currentImageData,
          mimeType: 'image/png',
        });

        if (bgRemovalResult.success && bgRemovalResult.imageData) {
          currentImageData = bgRemovalResult.imageData;
          currentMimeType = bgRemovalResult.mimeType || currentMimeType;
          aiEditsApplied.push('remove_background');
        }
      }

      // 10.2 Add Logo (if enabled)
      if (customization.aiTools.addLogo.enabled && customization.aiTools.addLogo.logo) {
        const logoResult = await editImage({
          prompt: createLogoInsertionPrompt('center'),
          imageData: currentImageData,
          mimeType: 'image/png',
        });

        if (logoResult.success && logoResult.imageData) {
          currentImageData = logoResult.imageData;
          currentMimeType = logoResult.mimeType || currentMimeType;
          aiEditsApplied.push('add_logo');
        }
      }

      // ====================================
      // 11. Apply Background Change (Separate Step)
      // ====================================
      // Background changes are now applied as a separate step AFTER initial generation
      // This ensures better quality and respects the garment-first approach
      if (
        wantsCustomBackground &&
        !customization.aiTools.removeBackground &&
        backgroundSelection
      ) {
        const backgroundDesc = backgroundDescription || 'custom background';

        if (backgroundReferenceImage) {
          const blendResult = await blendImages({
            prompt: createBackgroundChangePrompt(backgroundDesc, true),
            images: [
              { data: currentImageData, mimeType: 'image/png' },
              { data: backgroundReferenceImage.data, mimeType: backgroundReferenceImage.mimeType },
            ],
          });

          if (blendResult.success && blendResult.imageData) {
            currentImageData = blendResult.imageData;
            currentMimeType = blendResult.mimeType || currentMimeType;
            aiEditsApplied.push('change_background');
          }
        } else {
          const bgChangeResult = await editImage({
            prompt: createBackgroundChangePrompt(backgroundDesc),
            imageData: currentImageData,
            mimeType: 'image/png',
          });

          if (bgChangeResult.success && bgChangeResult.imageData) {
            currentImageData = bgChangeResult.imageData;
            currentMimeType = bgChangeResult.mimeType || currentMimeType;
            aiEditsApplied.push('change_background');
          }
        }
      }

      // ====================================
      // 12. Add Watermark (unless regeneration/improvement)
      // ====================================
      const cleanImageData = currentImageData;
      const imageBuffer = base64ToBuffer(cleanImageData);
      const watermarkedBuffer = skipWatermark
        ? imageBuffer
        : await addWatermark(imageBuffer, {
            opacity: 0.3,
            position: 'center',
          });

      // ====================================
      // 13. Create Thumbnail
      // ====================================
      const thumbnailBuffer = await createThumbnail(watermarkedBuffer, 300, 400, false);

      // ====================================
      // 14. Upload to Storage
      // ====================================
      const uploadResult = await uploadGeneratedImage(
        user.id,
        generation.id,
        watermarkedBuffer,
        'image/png'
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload image: ${uploadResult.error}`);
      }

      const thumbnailResult = await uploadThumbnail(
        user.id,
        generation.id,
        thumbnailBuffer,
        'image/jpeg'
      );

      // ====================================
      // 15. Save Generation Result
      // ====================================
      const { error: resultError } = await supabase
        .from('generation_results')
        .insert({
          generation_id: generation.id,
          image_url: uploadResult.path!,
          thumbnail_url: thumbnailResult.path || null,
          has_watermark: !skipWatermark,
          is_purchased: false,
          metadata: {
            tokensUsed: tryOnResult.tokensUsed,
            promptTokensUsed: optimizerResult.tokensUsed,
            mimeType: currentMimeType,
            aiEditsApplied,
            optimizedPrompt: optimizerResult.prompt,
            cleanImageData,
            cleanMimeType: currentMimeType,
            purchasedPath: null,
            poseAssessment,
            skipWatermark,
            regenerationType: regenerationType || null,
          },
        });

      if (resultError) {
        console.error('Error saving generation result:', resultError);
      }

      // ====================================
      // 16. Save AI Edits Records
      // ====================================
      if (aiEditsApplied.length > 0) {
        for (const editName of aiEditsApplied) {
          // Get tool_id from ai_editing_tools table
          const { data: toolData } = await supabase
            .from('ai_editing_tools')
            .select('id')
            .eq('tool_name', editName)
            .single();

          if (toolData) {
            await supabase.from('generation_ai_edits').insert({
              generation_id: generation.id,
              tool_id: toolData.id,
              parameters: {},
              credits_used: creditPricing.AI_EDIT,
            });
          }
        }
      }

      // ====================================
      // 17. Update Generation Status
      // ====================================
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          output_data: {
            tokensUsed: tryOnResult.tokensUsed,
            promptTokensUsed: optimizerResult.tokensUsed,
            aiEditsApplied,
            optimizedPromptSaved: true,
            poseAssessment,
          },
        })
        .eq('id', generation.id);

      // ====================================
      // 18. Debit User Credits
      // ====================================
      await supabase
        .from('users')
        .update({
          credits: userData.credits - totalCredits,
        })
        .eq('id', user.id);

      // ====================================
      // 19. Record Credit Transaction
      // ====================================
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -totalCredits,
          type: 'generation',
          description: `Geração de imagem virtual try-on com ${uploadIds.length} peça(s)`,
          metadata: {
            generation_id: generation.id,
            tool_id: virtualTryOnTool.id,
            upload_ids: uploadIds,
            credits_breakdown: creditBreakdown,
            customization: {
              height_cm: customization.height,
              weight_kg: customization.weight,
              facial_expression: customization.facialExpression,
              hair_color: customization.hairColor,
              ai_tools_applied: aiEditsApplied,
            },
          },
        });

      if (transactionError) {
        console.error('Failed to record credit transaction:', transactionError);
        // Not blocking - continue execution
      }

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        previewUrl: uploadResult.publicUrl,
        thumbnailUrl: thumbnailResult.publicUrl,
        creditsUsed: totalCredits,
        creditsRemaining: userData.credits - totalCredits,
        aiEditsApplied,
      });
    } catch (error) {
      console.error('Error during image generation process:', error);

      // Update generation status to failed
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', generation.id);

      return NextResponse.json(
        {
          error: 'Failed to process image generation',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-image route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
