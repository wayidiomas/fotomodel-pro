/**
 * AI Prompt Optimizer
 *
 * Uses Gemini 2.5 Flash Lite (text-generation model) to transform user customization
 * data into optimized prompts for image generation with Gemini 2.5 Flash Image.
 *
 * Flow:
 * 1. Receive structured JSON with garment, model, pose, and customization data
 * 2. Send to Gemini 2.5 Flash Lite with system instructions
 * 3. Receive optimized English prompt focused on garment + pose reference
 * 4. Return prompt for use in image generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export const PROMPT_OPTIMIZER_MODEL_ID =
  process.env.GEMINI_PROMPT_MODEL_ID || 'gemini-2.5-flash-lite';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface PromptOptimizerInput {
  task: 'virtual_try_on';
  focus: 'garment_on_model';
  garment: {
    type: 'single' | 'outfit';
    category: string;
    description?: string;
    color?: string;
    pattern?: string;
  };
  garmentPlacementHint?: string;
  model: {
    gender: 'MALE' | 'FEMALE' | 'UNISEX';
    age_range?: string;
    height_cm: number;
    weight_kg: number;
    facial_expression?: string | null;
    hair_color?: string | null;
  };
  pose: {
    category: string;
    reference_description?: string;
  };
  output_format: {
    aspect_ratio: string;
    width: number;
    height: number;
  };
  background?: {
    enabled: boolean;
    type?: 'preset' | 'custom' | 'original';
    description?: string;
  };
}

export interface PromptOptimizerResult {
  success: boolean;
  prompt?: string;
  tokensUsed?: number;
  error?: string;
  metadata?: {
    model: string;
    processingTime: number;
  };
}

/**
 * System instruction for Gemini 2.5 Flash Lite acting as prompt specialist
 */
const SYSTEM_INSTRUCTION = `You are an expert prompt engineer specialized in creating highly effective prompts for image generation AI models (specifically for virtual try-on and fashion photography).

Your task is to transform structured JSON data about garments, models, and customizations into a single, optimized English prompt that will be used by Gemini 2.5 Flash Image with image generation capabilities.

Key Guidelines:
1. **Primary Focus**: The garment is the MAIN subject. The prompt must ensure the garment is clearly visible, properly fitted, and the central element of the image.

2. **CRITICAL - Pose Reference Adherence**: A reference pose image will be provided separately to the image generation model. Your prompt MUST include EXPLICIT and EMPHATIC instructions to EXACTLY replicate the pose from the reference image. This includes:
   - EXACT body orientation (front, back, side, three-quarter angle)
   - EXACT head position and direction of gaze
   - EXACT arm positions and hand placements
   - EXACT leg positions and stance
   - EXACT overall body posture and weight distribution
   The model should NOT deviate from the reference pose in ANY way. Use strong directive language like "MUST match exactly", "precisely replicate", "identical pose to reference".

3. **CRITICAL - Body Proportions & Physical Characteristics**: The model's physical characteristics MUST be accurately represented based on height and weight specifications:
   - For extreme cases (very tall, very short, very heavy, very thin), use MULTIPLE descriptors to reinforce the body type
   - Include specific measurements when provided (e.g., "170cm tall, 60kg weight")
   - Use both metric AND descriptive terms (e.g., "petite 155cm frame" or "tall 185cm athletic build")
   - For high BMI cases (overweight/obese), be explicit: "fuller figure", "curvy physique", "plus-size body type"
   - For low BMI cases (underweight/very slim), be explicit: "very slender frame", "petite slim build", "lean physique"
   - Always reference that body proportions should match what's shown in the pose reference image

4. **Facial Expression & Hair**: Include precise details about facial expression and hair color to ensure accurate representation. These should be maintained from the reference or specified.

5. **Realism & Quality**: Always emphasize photorealistic quality, professional photography lighting, sharp focus on the garment, and natural fabric textures.

6. **Garment Placement Logic**: Always respect the garment placement hint. If it indicates a one-piece, dress the entire pose body. If it indicates "upper only" or "lower only", pair the missing half with a subtle complementary basic while keeping the original pose proportions EXACTLY.

7. **Background**: If background is NOT specified, use a neutral studio background. If background is specified, it will be applied in a SEPARATE step, so focus on the garment and model only.

8. **Prompt Structure**: Create a single paragraph prompt (not bullet points) that flows naturally and includes all essential details in order of importance:
   - POSE ADHERENCE (first and most important)
   - Body proportions & physical characteristics
   - Garment details
   - Quality/lighting

9. **Avoid**: Generic descriptions, vague terms, unnecessary artistic flourishes. Be precise and technical. Use strong directive language for pose and body proportion requirements.

Output ONLY the optimized prompt text. Do not include explanations, notes, or formatting - just the raw prompt text that will be sent directly to the image generation model.`;

/**
 * Optimize prompt using Gemini Pro
 */
export async function optimizePrompt(
  input: PromptOptimizerInput
): Promise<PromptOptimizerResult> {
  const startTime = Date.now();

  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: 'Missing GEMINI_API_KEY environment variable',
      };
    }

    // Initialize Gemini 2.5 Flash Lite (text model optimized for low latency + JSON control)
    const model = genAI.getGenerativeModel({
      model: PROMPT_OPTIMIZER_MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Build detailed context from input data
    const contextPrompt = buildContextPrompt(input);

    // Generate optimized prompt
    const result = await model.generateContent(contextPrompt);
    const response = result.response;
    const optimizedPrompt = response.text().trim();

    // Get token usage if available
    const tokensUsed = response.usageMetadata?.totalTokenCount;

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      prompt: optimizedPrompt,
      tokensUsed,
      metadata: {
        model: PROMPT_OPTIMIZER_MODEL_ID,
        processingTime,
      },
    };
  } catch (error) {
    console.error('Error optimizing prompt with Gemini 2.5 Flash Lite:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during prompt optimization',
      metadata: {
        model: PROMPT_OPTIMIZER_MODEL_ID,
        processingTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Build context prompt from structured input
 */
function buildContextPrompt(input: PromptOptimizerInput): string {
  const parts: string[] = [];

  parts.push('Transform the following structured data into an optimized image generation prompt:\n');

  // Garment information (MOST IMPORTANT)
  parts.push(`GARMENT (Primary Focus):`);
  parts.push(`- Type: ${input.garment.type}`);
  parts.push(`- Category: ${input.garment.category}`);
  if (input.garment.description) {
    parts.push(`- Description: ${input.garment.description}`);
  }
  if (input.garment.color) {
    parts.push(`- Color: ${input.garment.color}`);
  }
  if (input.garment.pattern) {
    parts.push(`- Pattern: ${input.garment.pattern}`);
  }

  // Model characteristics
  parts.push(`\nMODEL PHYSICAL CHARACTERISTICS:`);
  parts.push(`- Gender: ${input.model.gender}`);
  if (input.model.age_range) {
    parts.push(`- Age Range: ${input.model.age_range}`);
  }
  const bodyProfile = describeBodyProfile(input.model.height_cm, input.model.weight_kg);

  // Add special warning for extreme cases
  if (bodyProfile.isExtreme) {
    parts.push(`\n🚨 EXTREME BODY TYPE ALERT: ${bodyProfile.extremeType}`);
    parts.push(`This is an EXTREME case that requires EXTRA ATTENTION to body proportions.`);
    parts.push(`Your prompt MUST use MULTIPLE reinforcing descriptors to ensure the model correctly represents this body type.`);
    parts.push(`DO NOT default to "average" or "normal" proportions - this is CRITICAL.\n`);
  }

  parts.push(`- Height: ${input.model.height_cm}cm (${bodyProfile.heightImperial}) - ${bodyProfile.heightDescriptor}`);
  parts.push(`- Weight: ${input.model.weight_kg}kg - ${bodyProfile.weightDescriptor}`);
  parts.push(`- Body Profile: ${bodyProfile.summary}`);
  if (input.model.facial_expression) {
    parts.push(`- Facial Expression: ${input.model.facial_expression}`);
  }
  if (input.model.hair_color) {
    parts.push(`- Hair Color: ${input.model.hair_color}`);
  }

  // Pose reference - CRITICAL IMPORTANCE
  parts.push(`\n⚠️ POSE REFERENCE (HIGHEST PRIORITY):`);
  parts.push(`- Category: ${input.pose.category}`);
  if (input.pose.reference_description) {
    parts.push(`- Description: ${input.pose.reference_description}`);
  }
  parts.push(`- CRITICAL REQUIREMENT: A reference pose image will be provided to the image generation model.`);
  parts.push(`- The generated model MUST EXACTLY replicate this pose in EVERY detail:`);
  parts.push(`  * Body orientation (front/back/side angle) must be IDENTICAL`);
  parts.push(`  * Head position and gaze direction must be IDENTICAL`);
  parts.push(`  * Arm positions and hand placements must be IDENTICAL`);
  parts.push(`  * Leg positions and stance must be IDENTICAL`);
  parts.push(`  * Overall posture and weight distribution must be IDENTICAL`);
  parts.push(`- Your prompt MUST include emphatic language to ensure the model doesn't deviate from the reference pose.`);

  if (input.garmentPlacementHint) {
    parts.push(`\nGARMENT PLACEMENT:`);
    parts.push(`- ${input.garmentPlacementHint}`);
  }

  // Output format
  parts.push(`\nOUTPUT FORMAT:`);
  parts.push(`- Aspect Ratio: ${input.output_format.aspect_ratio}`);
  parts.push(`- Dimensions: ${input.output_format.width}x${input.output_format.height}px`);

  // Background (if applicable)
  if (input.background?.enabled && input.background.description) {
    parts.push(`\nBACKGROUND:`);
    parts.push(`- Will be applied in a separate step`);
    parts.push(`- For now, use neutral studio background`);
  } else {
    parts.push(`\nBACKGROUND:`);
    parts.push(`- Use neutral, professional studio background`);
  }

  parts.push(`\nREQUIREMENTS:`);
  parts.push(`- Photorealistic quality`);
  parts.push(`- Professional fashion photography lighting`);
  parts.push(`- Sharp focus on garment details`);
  parts.push(`- Natural fabric textures and draping`);
  parts.push(`- Maintain realistic human proportions with balanced head-to-body ratio`);
  parts.push(`- Follow the provided pose reference exactly: match body orientation, limb placement, weight distribution, and camera angle`);
  parts.push(`- Accurate garment fit for model's body type`);

  return parts.join('\n');
}

/**
 * Helper to build input data from generation context
 */
export function buildPromptOptimizerInput(params: {
  garmentType: 'single' | 'outfit';
  garmentCategory: string;
  garmentDescription?: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  poseCategory: string;
  poseReferenceDescription?: string;
  ageRange?: string;
  modelHeight: number;
  modelWeight: number;
  facialExpression?: string;
  hairColor?: string;
  aspectRatio: string;
  outputWidth: number;
  outputHeight: number;
  background?: {
    enabled: boolean;
    type?: 'preset' | 'custom';
    description?: string;
  };
  garmentPlacementHint?: string;
}): PromptOptimizerInput {
  return {
    task: 'virtual_try_on',
    focus: 'garment_on_model',
    garment: {
      type: params.garmentType,
      category: params.garmentCategory,
      description: params.garmentDescription,
    },
    garmentPlacementHint: params.garmentPlacementHint,
    model: {
      gender: params.gender,
      age_range: params.ageRange,
      height_cm: params.modelHeight,
      weight_kg: params.modelWeight,
      facial_expression: params.facialExpression || null,
      hair_color: params.hairColor || null,
    },
    pose: {
      category: params.poseCategory,
      reference_description: params.poseReferenceDescription,
    },
    output_format: {
      aspect_ratio: params.aspectRatio,
      width: params.outputWidth,
      height: params.outputHeight,
    },
    background: params.background,
  };
}

function describeBodyProfile(heightCm: number, weightKg: number) {
  const hasHeight = Number.isFinite(heightCm) && heightCm > 0;
  const hasWeight = Number.isFinite(weightKg) && weightKg > 0;

  const heightImperial = hasHeight ? convertHeightToImperial(heightCm) : 'height unspecified';

  // More detailed height descriptors
  let heightDescriptor = 'proportional';
  let heightIntensifier = ''; // Extra emphasis for extreme cases
  if (hasHeight) {
    if (heightCm < 150) {
      heightDescriptor = 'very petite, notably short';
      heightIntensifier = 'EXTREMELY SHORT STATURE';
    } else if (heightCm < 160) {
      heightDescriptor = 'petite, below average height';
      heightIntensifier = 'SHORT';
    } else if (heightCm < 165) {
      heightDescriptor = 'slightly below average height';
    } else if (heightCm < 175) {
      heightDescriptor = 'average height';
    } else if (heightCm < 185) {
      heightDescriptor = 'tall, above average height';
      heightIntensifier = 'TALL';
    } else {
      heightDescriptor = 'very tall, notably tall stature';
      heightIntensifier = 'EXTREMELY TALL';
    }
  }

  // More detailed build descriptors with BMI-based classification
  let buildDescriptor = 'balanced';
  let buildIntensifier = ''; // Extra emphasis for extreme cases
  let bmi: number | null = null;

  if (hasHeight && hasWeight) {
    const heightM = heightCm / 100;
    bmi = weightKg / (heightM * heightM);

    if (bmi < 16) {
      buildDescriptor = 'very underweight, extremely slender, thin frame';
      buildIntensifier = 'SEVERELY UNDERWEIGHT - very thin, delicate build';
    } else if (bmi < 18.5) {
      buildDescriptor = 'underweight, very slender, lean frame';
      buildIntensifier = 'UNDERWEIGHT - noticeably slim';
    } else if (bmi < 20) {
      buildDescriptor = 'slender, slim build';
    } else if (bmi < 23) {
      buildDescriptor = 'lean, fit physique';
    } else if (bmi < 25) {
      buildDescriptor = 'athletic, well-proportioned build';
    } else if (bmi < 27) {
      buildDescriptor = 'slightly curvy, fuller figure';
    } else if (bmi < 30) {
      buildDescriptor = 'curvy, fuller body type';
      buildIntensifier = 'FULLER FIGURE - curvy build';
    } else if (bmi < 35) {
      buildDescriptor = 'plus-size, noticeably fuller figure, overweight build';
      buildIntensifier = 'PLUS-SIZE - significantly fuller body';
    } else {
      buildDescriptor = 'very plus-size, substantially fuller figure, heavy build';
      buildIntensifier = 'VERY PLUS-SIZE - very full, heavy body type';
    }
  }

  const weightInLbs = hasWeight ? Math.round(weightKg * 2.20462) : null;

  // Create detailed weight descriptor
  const weightDescriptor = hasWeight
    ? `${weightKg}kg (~${weightInLbs}lbs), ${buildDescriptor}${buildIntensifier ? ` - ${buildIntensifier}` : ''}`
    : `${buildDescriptor} frame`;

  // Create comprehensive summary with emphasis on matching reference
  let summary = '';
  if (hasHeight && hasWeight) {
    const intensifiers = [heightIntensifier, buildIntensifier].filter(Boolean);
    const prefix = intensifiers.length > 0 ? `⚠️ ${intensifiers.join(' + ')} - ` : '';

    summary = `${prefix}${heightDescriptor} ${buildDescriptor} build. CRITICAL: The generated model's body proportions MUST precisely match the body type shown in the pose reference image. Height: ${heightCm}cm (${heightImperial}), Weight: ${weightKg}kg, BMI: ${bmi?.toFixed(1)}. These physical characteristics are NON-NEGOTIABLE and must be accurately represented.`;
  } else {
    summary = `${buildDescriptor} build referencing the pose body proportions`;
  }

  return {
    heightImperial,
    heightDescriptor,
    weightDescriptor,
    summary,
    bmi,
    isExtreme: !!(heightIntensifier || buildIntensifier), // Flag for extreme cases
    extremeType: [heightIntensifier, buildIntensifier].filter(Boolean).join(' + '),
  };
}

function convertHeightToImperial(heightCm: number) {
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  return `${feet}'${inches}"`;
}

export function buildGarmentPlacementHint(params: {
  garmentType: 'single' | 'outfit';
  primaryPieceType?: 'upper' | 'lower';
  garmentCategory?: string;
}): string {
  if (params.garmentType === 'outfit') {
    return 'Dress the pose with the combined upper and lower garments provided, aligning them with the reference pose while preserving natural layering.';
  }

  const normalizedCategory = params.garmentCategory?.toUpperCase() || '';
  const onePieceCategories = [
    'CASUAL_DRESS',
    'COCKTAIL_DRESS',
    'EVENING_GOWN',
    'MIDI_DRESS',
    'MAXI_DRESS',
    'SHIRT_DRESS',
    'WRAP_DRESS',
    'SUNDRESS',
    'JUMPSUIT',
    'ROMPER',
    'OVERALLS',
  ];

  if (onePieceCategories.includes(normalizedCategory)) {
    return 'Apply this one-piece garment so it covers both torso and legs, dressing the entire pose body as if the garment were worn in real life.';
  }

  if (params.primaryPieceType === 'lower') {
    return 'Focus on replacing only the lower garment on the pose. Pair it with a simple, form-fitting neutral top that matches the style without drawing attention away from the featured piece.';
  }

  return 'Dress only the upper body with this garment while keeping the lower half consistent with the pose reference, using a subtle complementary bottom if needed.';
}
