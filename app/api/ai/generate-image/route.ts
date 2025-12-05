/**
 * POST /api/ai/generate-image
 * Generate virtual try-on images using Gemini 3 Pro Image (Nano Banana Pro)
 *
 * Configuration loaded dynamically from ai_generation_config table.
 *
 * Flow:
 * 1. Validate user and authentication
 * 2. Load garment images and pose selection from database
 * 3. Load customization data (height, weight, expression, AI tools)
 * 4. Get Virtual Try-On Tool ID from database
 * 5. Calculate credit cost (base + AI edits)
 * 6. Check user has sufficient credits
 * 7. Create generation record with tool_id
 * 8. Fetch images as base64
 * 8.5. Optimize prompt with Gemini (model from config)
 *      - Build structured JSON input with all customization data
 *      - Call Gemini to generate optimized English prompt
 *      - Save generated prompt to ai_generated_prompts table
 *      - On failure: return error and ask user to retry (credits not yet debited)
 * 9. Generate virtual try-on image (model from config, with fallback)
 * 10. Apply AI edits sequentially if requested
 * 11. Apply background change as separate step (if enabled)
 * 12. Upload to storage and create thumbnail
 * 13. Save generation result
 * 14. Save AI edits records
 * 15. Update generation status
 * 16. Debit user credits
 * 17. Return results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { virtualTryOn, editImage, blendImages } from '@/lib/ai/gemini';
import { createVirtualTryOnPrompt, createBackgroundRemovalPrompt, createBackgroundChangePrompt, createHairColorChangePrompt, createLogoInsertionPrompt } from '@/lib/ai/gemini-prompts';
import { optimizePrompt, buildPromptOptimizerInput, buildImageEditOptimizerInput, buildGarmentPlacementHint, PROMPT_OPTIMIZER_MODEL_ID } from '@/lib/ai/prompt-optimizer';
import { calculateGenerationCredits, resolveCreditPricing } from '@/lib/credits/credit-calculator';
import { fetchCreditPricingOverrides, CREDIT_ACTIONS } from '@/lib/credits/credit-pricing';
import { createThumbnail, base64ToBuffer } from '@/lib/images/watermark';
import { uploadGeneratedImage, uploadThumbnail } from '@/lib/storage/upload';
import { GEMINI_ASPECT_RATIOS } from '@/lib/generation-flow/image-formats';
import type { CustomizationData } from '@/lib/generation-flow/useCustomization';
import { assessGarmentPoseCompatibility } from '@/lib/ai/pose-advisor';
import { describePose, type PoseDescription } from '@/lib/ai/pose-describer';

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

/**
 * Map body size (P, M, G, Plus Size) to approximate weight in kg
 * Height is kept at a reasonable default based on age
 */
function getWeightFromBodySize(bodySize?: string, gender?: string): number {
  const isMale = gender === 'MALE';

  switch (bodySize) {
    case 'P':
      return isMale ? 58 : 52;
    case 'M':
      return isMale ? 70 : 62;
    case 'G':
      return isMale ? 85 : 75;
    case 'plus-size':
      return isMale ? 105 : 95;
    default:
      return isMale ? 70 : 62; // Default to M
  }
}

/**
 * Get reasonable height based on age range and gender
 */
function getHeightFromAge(ageRange?: string, gender?: string): number {
  const isMale = gender === 'MALE';

  switch (ageRange) {
    case '0-2':
      return 75; // Baby/toddler (average ~75cm)
    case '2-10':
      return 120; // Child
    case '10-15':
      return 150; // Pre-teen
    case '15-20':
      return isMale ? 172 : 162;
    default:
      return isMale ? 178 : 168; // Adult default
  }
}

/**
 * Check if the age range represents a minor (under 18)
 * For minors, we use simplified prompts to avoid content safety blocks
 */
function isMinorAge(ageRange?: string, ageMin?: number | null): boolean {
  if (ageMin !== null && ageMin !== undefined && ageMin < 18) {
    return true;
  }

  if (!ageRange) return false;

  // Check common age range patterns
  const minorRanges = ['0-2', '2-10', '10-15', '15-20'];
  if (minorRanges.includes(ageRange)) return true;

  // Parse age range like "0-2" or "15-20"
  const match = ageRange.match(/^(\d+)-(\d+)$/);
  if (match) {
    const minAge = parseInt(match[1]);
    return minAge < 18;
  }

  return false;
}

/**
 * Create simplified prompt for minors to avoid content safety blocks
 * Uses minimal description and focuses on direct garment placement
 */
function buildSimplifiedMinorPrompt(params: {
  garmentType: 'single' | 'outfit';
  aspectRatio: string;
  outputWidth: number;
  outputHeight: number;
  backgroundType?: 'original' | 'preset' | 'custom' | 'neutral';
}): string {
  const { garmentType, aspectRatio, outputWidth, outputHeight, backgroundType } = params;

  // Very simple, direct prompt without detailed descriptions
  let prompt = `Generate a virtual try-on image showing the ${garmentType === 'outfit' ? 'outfit pieces' : 'garment'} on the model in the reference pose. `;

  // Background instruction
  if (backgroundType === 'original') {
    prompt += `Keep the original garment background. `;
  } else if (backgroundType === 'preset' || backgroundType === 'custom') {
    prompt += `Use the provided background reference. `;
  } else {
    prompt += `Use a clean, neutral studio background. `;
  }

  // Format and quality
  prompt += `Output dimensions: ${outputWidth}×${outputHeight}px (${aspectRatio}). Natural lighting, professional quality.`;

  return prompt;
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
    const { uploadIds, regenerationType, improvementText } = body;

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

    // Load selected format from generation_format_selections
    const { data: formatSelection } = await (supabase
      .from('generation_format_selections') as any)
      .select('format_preset_id')
      .eq('upload_id', uploadIds[0])
      .single();

    const selectedFormatId = formatSelection?.format_preset_id || null;

    // Build customization object
    const customization: CustomizationData = customizationData
      ? {
          modelCharacteristics: (customizationData.metadata as any)?.model_characteristics || {},
          height: customizationData.model_height_cm || 170,
          weight: customizationData.model_weight_kg || 60,
          facialExpression: customizationData.facial_expression,
          hairColor: (customizationData.metadata as any)?.hair_color || null,
          selectedFormat: selectedFormatId,
          aiTools: (customizationData.metadata as any)?.ai_tools || {
            removeBackground: false,
            changeBackground: { enabled: false, selection: null },
            addLogo: { enabled: false, logo: null },
          },
          uploadIds,
        }
      : {
          modelCharacteristics: {},
          height: 170,
          weight: 60,
          facialExpression: null,
          hairColor: null,
          selectedFormat: selectedFormatId,
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
      // Get ALL garment images (support for outfits with 2+ pieces)
      // For Bubble uploads, file_path is already a complete URL
      // For Supabase uploads, use metadata.publicUrl
      const garmentBase64Array: string[] = [];
      const garmentMimeTypesArray: string[] = [];

      for (const upload of uploads) {
        const publicUrl = (upload.metadata as any)?.publicUrl || upload.file_path;
        if (!publicUrl) {
          throw new Error(`Garment image URL not found for upload ${upload.id}`);
        }
        const imageData = await fetchImageAsBase64(publicUrl);
        garmentBase64Array.push(imageData.data);
        garmentMimeTypesArray.push(imageData.mimeType);
      }

      const poseBase64Data = await fetchImageAsBase64(poseData.image_url);
      const poseBase64 = poseBase64Data.data;

      // For backward compatibility with single garment
      const garmentBase64 = garmentBase64Array[0];

      console.log(`[generate-image] Loaded ${garmentBase64Array.length} garment image(s)`);

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
          .select('gemini_aspect_ratio, width, height, aspect_ratio, name')
          .eq('id', customization.selectedFormat)
          .single();

        if (formatData?.gemini_aspect_ratio) {
          const dimensions = GEMINI_ASPECT_RATIOS[formatData.gemini_aspect_ratio as keyof typeof GEMINI_ASPECT_RATIOS];
          if (dimensions) {
            outputWidth = dimensions.width;
            outputHeight = dimensions.height;
            aspectRatio = formatData.gemini_aspect_ratio;
            console.log(`[generate-image] Using selected format: ${formatData.name} (${aspectRatio})`);
          }
        }
      } else {
        console.log(`[generate-image] No format selected, using default: ${aspectRatio}`);
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

      // Determine if we should use integrated background (3rd image) approach
      // This produces better results with natural lighting and shadows
      const useIntegratedBackground = !!(
        wantsCustomBackground &&
        backgroundReferenceImage &&
        backgroundSelection?.type !== 'ai' // AI backgrounds are text descriptions, not images
      );

      console.log(`[generate-image] Background approach: ${useIntegratedBackground ? 'integrated (3 images)' : wantsCustomBackground ? 'post-processing' : 'neutral'}`);

      // Determine gender from user selection or pose metadata
      // Priority: 1. User-selected modelCharacteristics.gender, 2. Pose metadata, 3. Default
      const modelGender: 'MALE' | 'FEMALE' | 'UNISEX' =
        customization.modelCharacteristics?.gender ||
        poseMetadata.gender ||
        'FEMALE';

      // Determine age range from user selection or pose metadata
      const modelAgeRange: string | undefined =
        customization.modelCharacteristics?.ageRange ||
        poseMetadata.ageRange;

      // Check if model is a minor (under 18) - use simplified prompt to avoid content safety blocks
      const poseAgeMin = poseData.age_min ?? poseMetadata.ageMin ?? null;
      const isMinor = isMinorAge(modelAgeRange, poseAgeMin);

      console.log(`[generate-image] Model profile: gender=${modelGender}, ageRange=${modelAgeRange}, bodySize=${customization.modelCharacteristics?.bodySize || 'not set'}, isMinor=${isMinor}`);

      // Derive height/weight from body size and age (sliders removed from UI)
      const derivedHeight = getHeightFromAge(modelAgeRange, modelGender);
      const derivedWeight = getWeightFromBodySize(customization.modelCharacteristics?.bodySize, modelGender);

      // ====================================
      // 8.1. Generate Dynamic Pose Description with AI
      // ====================================
      let dynamicPoseDescription: PoseDescription | null = null;
      try {
        dynamicPoseDescription = await describePose({
          poseImageData: poseBase64,
          poseCategory: poseData.pose_category,
          gender: modelGender,
        });
        if (dynamicPoseDescription) {
          console.log(`[generate-image] Dynamic pose description: ${dynamicPoseDescription.description.substring(0, 100)}...`);
        }
      } catch (poseDescError) {
        console.warn('[generate-image] Pose description failed, using fallback:', poseDescError);
      }

      // Use dynamic AI description or fallback to database metadata
      const poseReferenceDescription = dynamicPoseDescription?.description
        || poseMetadata.description
        || poseMetadata.reference
        || poseMetadata.poseDescription;

      // Build optimizer input - use IMAGE EDIT mode when improvement text is provided
      const isImprovementRequest = !!improvementText && improvementText.trim().length > 0;

      const optimizerInput = isImprovementRequest
        ? buildImageEditOptimizerInput({
            editInstruction: improvementText.trim(),
            gender: modelGender === 'UNISEX' ? 'FEMALE' : modelGender,
            currentGarmentDescription: garmentMetadata.description,
            aspectRatio,
            outputWidth,
            outputHeight,
            // Include /criar-specific model characteristics for better preservation
            facialExpression: customization.facialExpression || undefined,
            hairColor: customization.hairColor || undefined,
            ageRange: modelAgeRange,
            bodySize: customization.modelCharacteristics?.bodySize,
            modelHeight: derivedHeight,
            modelWeight: derivedWeight,
          })
        : buildPromptOptimizerInput({
            garmentType: uploads.length > 1 ? 'outfit' : 'single',
            garmentCategory: garmentMetadata.category || 'clothing',
            garmentDescription: garmentMetadata.description,
            gender: modelGender,
            poseCategory: poseMetadata.poseCategory || poseData.pose_category || 'standing',
            poseReferenceDescription,
            ageRange: modelAgeRange,
            bodySize: customization.modelCharacteristics?.bodySize,
            modelHeight: derivedHeight,
            modelWeight: derivedWeight,
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
                  hasReferenceImage: useIntegratedBackground,
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

      if (isImprovementRequest) {
        console.log(`[generate-image] Using IMAGE EDIT mode for improvement: "${improvementText.trim().substring(0, 50)}..."`);
      }

      let poseAssessment = null;
      try {
        poseAssessment = await assessGarmentPoseCompatibility({
          garmentImageData: garmentBase64,
          poseImageData: poseBase64,
          garmentCategory: garmentMetadata.category,
          pieceType: primaryPieceType,
          poseDescription: poseReferenceDescription,
        });
      } catch (advisorError) {
        console.error('Pose advisor failed:', advisorError);
      }

      // ====================================
      // 8.2. Generate Prompt (Simplified for Minors, Full Optimization for Adults)
      // ====================================
      // For minors, use simplified direct prompt to avoid content safety blocks
      // For adults, use full AI-optimized prompt with detailed descriptions
      let finalPrompt: string;
      let optimizerResult: any = null;

      if (isMinor) {
        // MINOR FLOW: Use simplified prompt without AI optimization
        console.log('[generate-image] Using SIMPLIFIED MINOR FLOW - skipping prompt optimizer to avoid content safety blocks');

        const backgroundType = wantsCustomBackground
          ? (backgroundSelection?.type === 'original' ? 'original' : useIntegratedBackground ? 'preset' : 'neutral')
          : 'neutral';

        finalPrompt = buildSimplifiedMinorPrompt({
          garmentType: uploads.length > 1 ? 'outfit' : 'single',
          aspectRatio,
          outputWidth,
          outputHeight,
          backgroundType,
        });

        console.log('[generate-image] Simplified minor prompt:', finalPrompt);

        // Save simplified prompt to database for auditing
        await supabase
          .from('ai_generated_prompts')
          .insert({
            generation_id: generation.id,
            input_data: { simplified_flow: true, minor_detection: true, ageRange: modelAgeRange },
            generated_prompt: finalPrompt,
            prompt_optimizer_model: 'simplified-minor-flow',
            tokens_used: null,
            metadata: { isMinor: true, ageRange: modelAgeRange },
          });

        // Create mock optimizerResult for consistency
        optimizerResult = {
          success: true,
          prompt: finalPrompt,
          tokensUsed: 0,
          metadata: {
            model: 'simplified-minor-flow',
            processingTime: 0,
            isMinor: true,
            ageRange: modelAgeRange,
          },
        };
      } else {
        // ADULT FLOW: Use full AI prompt optimization
        console.log('[generate-image] Using STANDARD ADULT FLOW - calling prompt optimizer');

        optimizerResult = await optimizePrompt(optimizerInput);

        if (!optimizerResult.success || !optimizerResult.prompt) {
          // Prompt optimization failed - ask user to retry (credits not yet debited)
          const errorStr = (optimizerResult.error || '').toLowerCase();
          const isProhibitedContent = errorStr.includes('prohibited_content') ||
            errorStr.includes('prohibited content') ||
            errorStr.includes('safety');

          // Don't log full error details for content safety (avoid confusion)
          if (isProhibitedContent) {
            console.warn('[generate-image] Prompt optimization blocked by content safety - user can retry');
          } else {
            console.error('[generate-image] Prompt optimization failed:', optimizerResult.error);
          }

          let userMessage = 'Erro ao processar a geração. Por favor, tente novamente.';
          let errorDetails = 'Processing error';

          if (isProhibitedContent) {
            // Generic message - don't expose technical details
            userMessage = 'Não foi possível processar esta geração no momento. Por favor, tente novamente.';
            errorDetails = 'Content processing restriction';
          }

          await supabase
            .from('generations')
            .update({
              status: 'failed',
              error_message: errorDetails,
            })
            .eq('id', generation.id);

          return NextResponse.json(
            {
              error: userMessage,
              retryable: true,
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

        // Use the optimized prompt with pose guidance
        let poseGuidance =
          'Siga exatamente a pose de referência fornecida, incluindo orientação do tronco, membros e distribuição de peso.';
        if (poseAssessment) {
          poseGuidance = poseAssessment.recommendPoseAdjustment
            ? `O assistente detectou compatibilidade moderada (${poseAssessment.score}/100). ${poseAssessment.guidance}`
            : `Compatibilidade alta (${poseAssessment.score}/100). ${poseAssessment.guidance}`;
        }

        finalPrompt = `${optimizerResult.prompt}

${poseGuidance}
Ensure realistic human proportions with a natural head-to-body ratio, keeping limbs and torso proportional to a real human reference.`;
      }

      const tryOnPrompt = finalPrompt;

      // ====================================
      // 9. Generate Virtual Try-On Image (with retry)
      // ====================================
      // When using integrated background, pass it as 3rd reference image
      // This produces better lighting and shadow integration
      const generateTryOn = async (attempts = 2) => {
        let lastResult: Awaited<ReturnType<typeof virtualTryOn>> | null = null;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const result = await virtualTryOn({
            prompt: tryOnPrompt,
            garmentImageData: garmentBase64Array, // Pass ALL garment images for outfits
            poseImageData: poseBase64,
            garmentMimeType: garmentMimeTypesArray, // Pass matching mime types
            // Include background as 3rd reference image for integrated generation
            backgroundImageData: useIntegratedBackground ? backgroundReferenceImage!.data : undefined,
            backgroundMimeType: useIntegratedBackground ? backgroundReferenceImage!.mimeType : undefined,
            backgroundDescription: useIntegratedBackground ? backgroundDescription : undefined,
            // Pass aspect ratio from format selection (default 3:4)
            aspectRatio: aspectRatio as any,
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
      // 11. Apply Background Change (Separate Step - only if not using integrated approach)
      // ====================================
      // When using integrated background (3 images), background is already applied in virtualTryOn
      // Otherwise, apply background as a separate post-processing step
      if (useIntegratedBackground) {
        // Background was already integrated in virtualTryOn - just mark as applied
        aiEditsApplied.push('change_background');
        console.log('[generate-image] Background integrated in initial generation (3 images)');
      } else if (
        wantsCustomBackground &&
        !customization.aiTools.removeBackground &&
        backgroundSelection
      ) {
        // Fallback: Apply background as post-processing step
        const backgroundDesc = backgroundDescription || 'custom background';
        console.log('[generate-image] Applying background as post-processing step');

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
      // 12. Prepare Image Buffer
      // ====================================
      const imageBuffer = base64ToBuffer(currentImageData);

      // ====================================
      // 13. Create Thumbnail
      // ====================================
      const thumbnailBuffer = await createThumbnail(imageBuffer, 300, 400);

      // ====================================
      // 14. Upload to Storage
      // ====================================
      const uploadResult = await uploadGeneratedImage(
        user.id,
        generation.id,
        imageBuffer,
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
          has_watermark: false,
          is_purchased: true,
          metadata: {
            tokensUsed: tryOnResult.tokensUsed,
            promptTokensUsed: optimizerResult.tokensUsed,
            mimeType: currentMimeType,
            aiEditsApplied,
            optimizedPrompt: optimizerResult.prompt,
            poseAssessment,
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
          transaction_type: 'generation',
          description: `Geração de imagem virtual try-on com ${uploadIds.length} peça(s)`,
          metadata: {
            generation_id: generation.id,
            tool_id: virtualTryOnTool.id,
            upload_ids: uploadIds,
            credits_breakdown: creditBreakdown,
            customization: {
              height_cm: getHeightFromAge(customization.modelCharacteristics?.ageRange, customization.modelCharacteristics?.gender),
              weight_kg: getWeightFromBodySize(customization.modelCharacteristics?.bodySize, customization.modelCharacteristics?.gender),
              body_size: customization.modelCharacteristics?.bodySize,
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
