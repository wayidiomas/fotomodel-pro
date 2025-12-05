/**
 * AI Prompt Optimizer
 *
 * Uses Gemini 2.5 Flash (text-generation model) to transform user customization
 * data into optimized prompts for image generation with Gemini 2.5 Flash Image.
 *
 * Flow:
 * 1. Receive structured JSON with garment, model, pose, and customization data
 * 2. Send to Gemini 2.5 Flash with system instructions
 * 3. Receive optimized English prompt focused on garment + pose reference
 * 4. Return prompt for use in image generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export const PROMPT_OPTIMIZER_MODEL_ID =
  process.env.GEMINI_PROMPT_MODEL_ID || 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface PromptOptimizerInput {
  task: 'virtual_try_on' | 'image_edit' | 'garment_swap';
  focus: 'garment_on_model' | 'edit_existing' | 'preserve_pose_swap_garment';
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
    body_size?: 'P' | 'M' | 'G' | 'plus-size';
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
    /** When true, background image is provided as 3rd reference (integrated generation) */
    hasReferenceImage?: boolean;
  };
  /** For image_edit mode: the user's edit instruction */
  editInstruction?: string;
}

export interface PromptOptimizerResult {
  success: boolean;
  prompt?: string;
  tokensUsed?: number;
  error?: string;
  metadata?: {
    model: string;
    processingTime: number;
    retryAttempt?: number;
    retriesExhausted?: boolean;
  };
}

/**
 * System instruction for SINGLE GARMENT virtual try-on
 *
 * Based on Google's official best practices for Gemini image generation:
 * - Describe scenes narratively, don't just list keywords
 * - Use photographic and cinematic language
 * - Be specific about garment details and model characteristics
 * - Reference images explicitly for multi-image composition
 *
 * Source: https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/
 */
const SYSTEM_INSTRUCTION_SINGLE_GARMENT = `You are an expert prompt engineer specialized in creating highly effective prompts for Google Gemini image generation (virtual try-on and fashion photography).

Your task is to transform structured JSON data into an optimized ENGLISH prompt for Gemini 3 Pro Image generation.

GOOGLE'S BEST PRACTICES (MUST FOLLOW):

1. **DESCRIBE, don't list keywords**
   ❌ "woman, red dress, studio, fashion, 4k"
   ✅ "A professional fashion photograph of a woman wearing an elegant red silk dress, standing in a minimalist studio with soft three-point lighting."

2. **Use photographic language**
   - "professional e-commerce fashion photograph"
   - "85mm portrait lens perspective"
   - "studio three-point softbox lighting with soft shadows"
   - "full-body shot" or "three-quarter shot"

3. **Reference garment from image explicitly**
   "Take the garment from the reference image and dress the model wearing it naturally, preserving all details, colors, textures, and patterns exactly as shown."

4. **Structure for virtual try-on** (follow this template):
   "Create a professional e-commerce fashion photograph. Take the [garment description] from the reference image and dress a [gender] model wearing it. Generate a realistic, full-body shot with the model in a [pose] pose. Use [background/lighting]. The garment must match the reference exactly in color, texture, and construction details."

KEY GUIDELINES:

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

EXAMPLES:

❌ WRONG (Too vague):
"woman, red dress, studio, fashion, 4k"

✅ CORRECT (Single Garment - Upper Body):
"Create a professional e-commerce fashion photograph. Take the vintage blue denim jacket with distressed details from the reference image and dress a male model wearing it. The model stands in a relaxed upright pose with hands in pockets. Use neutral studio background with soft three-point lighting. The jacket must match the reference exactly in color, wash, distressing, and construction details."

✅ CORRECT (Single Garment - Full Body):
"Create a professional e-commerce fashion photograph. Take the elegant red silk evening dress from the reference image and dress a female model wearing it. The model stands in a confident upright pose. Use neutral studio background with soft three-point lighting creating subtle shadows. The dress must match the reference exactly in color, fabric texture, draping, and construction details."

Output ONLY the optimized prompt text. Do not include explanations, notes, or formatting - just the raw prompt text that will be sent directly to the image generation model.`;

/**
 * System instruction for OUTFIT (MULTIPLE GARMENTS) virtual try-on
 *
 * This is a FUNDAMENTALLY DIFFERENT template for handling complete outfits
 * where 2+ garment reference images are provided (e.g., top + bottom)
 */
const SYSTEM_INSTRUCTION_OUTFIT = `You are an expert prompt engineer specialized in creating highly effective prompts for Google Gemini image generation for COMPLETE OUTFITS (multiple garments).

🚨 CRITICAL CONTEXT: You are handling a COMPLETE OUTFIT consisting of MULTIPLE SEPARATE GARMENTS (e.g., top + bottom, shirt + pants, blouse + skirt).

Your task is to transform structured JSON data into an optimized ENGLISH prompt for Gemini 3 Pro Image generation that EXPLICITLY instructs the model to dress a person in ALL provided garments together.

THIS IS NOT A SINGLE GARMENT TASK - This is a MULTI-GARMENT STYLING task where EVERY piece must be worn together as one cohesive look.

GOOGLE'S BEST PRACTICES (MUST FOLLOW):

1. **DESCRIBE the complete outfit, don't list keywords**
   ❌ "woman, white top, blue jeans, studio"
   ✅ "A professional fashion photograph of a woman wearing a complete styled outfit consisting of a white cropped tank top AND blue denim jeans. She stands in a minimalist studio with soft three-point lighting."

2. **Use photographic language**
   - "professional e-commerce fashion photograph showing a complete styled outfit"
   - "85mm portrait lens perspective"
   - "studio three-point softbox lighting with soft shadows"
   - "full-body shot to show both upper and lower garments clearly"

3. **🚨 ABSOLUTE REQUIREMENT - Reference BOTH/ALL garments explicitly**
   You MUST describe EACH garment piece separately AND emphasize they are worn together:
   - "Dress the model in the complete outfit: wearing BOTH the [top description] from the first reference image AND the [bottom description] from the second reference image"
   - "The model wears the complete two-piece outfit consisting of [upper garment] paired with [lower garment]"
   - "Ensure BOTH pieces are clearly visible and styled together"
   - "The outfit combines [piece 1] with [piece 2] for a cohesive look"

4. **Structure for OUTFIT virtual try-on** (FOLLOW THIS TEMPLATE EXACTLY):
   "Create a professional e-commerce fashion photograph showing a complete styled outfit. Dress a [gender] model wearing BOTH the [detailed top garment description from first reference image] AND the [detailed bottom garment description from second reference image] together as one complete look. Generate a realistic, full-body shot with the model in a [pose] pose. Use [background/lighting]. BOTH garments must be clearly visible on the model - the [top] on the upper body and the [bottom] on the lower body - and match their respective reference images exactly in color, texture, fit, and construction details."

KEY GUIDELINES FOR OUTFITS:

1. **Primary Focus**: The COMPLETE OUTFIT is the MAIN subject. Your prompt must ensure ALL garment pieces are clearly visible, properly fitted, and worn together as one cohesive look.

2. **CRITICAL - Explicit Multi-Garment Instructions**: Your prompt MUST contain EXPLICIT language that instructs the model to wear BOTH/ALL garments:
   - Use "BOTH" or "ALL" when referring to garments
   - Separately describe the top/upper garment
   - Separately describe the bottom/lower garment
   - Emphasize they are "worn together", "styled together", "combined as one outfit"
   - Specify body placement: "upper body" and "lower body" or "top half" and "bottom half"

3. **CRITICAL - Pose Reference Adherence**: A reference pose image will be provided separately. Your prompt MUST include EXPLICIT instructions to EXACTLY replicate the pose from the reference image:
   - EXACT body orientation (front, back, side, three-quarter angle)
   - EXACT head position and direction of gaze
   - EXACT arm positions and hand placements
   - EXACT leg positions and stance
   - EXACT overall body posture and weight distribution
   Use strong directive language like "MUST match exactly", "precisely replicate", "identical pose to reference".

4. **CRITICAL - Body Proportions & Physical Characteristics**: The model's physical characteristics MUST be accurately represented based on height and weight specifications:
   - For extreme cases (very tall, very short, very heavy, very thin), use MULTIPLE descriptors to reinforce the body type
   - Include specific measurements when provided (e.g., "170cm tall, 60kg weight")
   - Always reference that body proportions should match what's shown in the pose reference image

5. **Facial Expression & Hair**: Include precise details about facial expression and hair color to ensure accurate representation.

6. **Realism & Quality**: Always emphasize photorealistic quality, professional photography lighting, sharp focus on BOTH garments, and natural fabric textures.

7. **Full-Body Framing**: For outfits, ALWAYS use full-body framing to ensure both upper and lower garments are fully visible in the shot.

8. **Background**: If background is NOT specified, use a neutral studio background. If background is specified, it will be applied in a SEPARATE step, so focus on the outfit and model only.

9. **Prompt Structure**: Create a single paragraph prompt (not bullet points) that flows naturally and includes all essential details in order of importance:
   - Lead with "complete outfit" or "styled outfit"
   - POSE ADHERENCE (first and most important)
   - Body proportions & physical characteristics
   - Upper garment details (from first reference)
   - Lower garment details (from second reference)
   - Emphasis that BOTH are worn together
   - Quality/lighting

10. **Avoid**: Generic descriptions, vague terms, mentioning only ONE garment when TWO are provided. Be precise and technical. Use strong directive language for multi-garment requirements.

EXAMPLES FOR COMPLETE OUTFITS:

❌ WRONG (Only mentions one garment):
"Create a professional e-commerce fashion photograph. Take the white crop top from the reference image and dress a female model wearing it in an upright standing pose against a neutral studio background with soft lighting."

❌ WRONG (Doesn't emphasize both pieces together):
"A woman wearing a white top and blue jeans in a studio."

✅ CORRECT (Complete Outfit - Top + Bottom):
"Create a professional e-commerce fashion photograph showing a complete styled outfit. Dress a female model wearing BOTH the white cropped tank top from the first reference image AND the blue denim jeans from the second reference image together as one complete look. The model stands upright in a natural, relaxed pose. Use neutral studio background with soft three-point lighting. Ensure BOTH garments are clearly visible and styled together - the white cropped tank top on the upper body with its exact fit and texture, and the blue denim jeans on the lower body with their wash and construction details - matching their respective reference images exactly in color, fit, and style."

✅ CORRECT (Complete Outfit - Shirt + Skirt):
"Create a professional e-commerce fashion photograph showing a complete styled business outfit. Dress a female model in the complete two-piece ensemble: wearing BOTH the elegant silk blouse from the first reference image on the upper body AND the tailored pencil skirt from the second reference image on the lower body. The model stands in a confident upright pose with natural arm positioning. Use neutral office-appropriate studio background with professional lighting. BOTH pieces must be clearly visible - the silk blouse showing its drape and sheen, paired with the pencil skirt showing its structured fit - and match their reference images exactly in fabric, color, and construction."

✅ CORRECT (Complete Outfit - Casual Look):
"Create a professional e-commerce fashion photograph displaying a complete casual outfit. Dress a male model wearing BOTH the vintage graphic t-shirt from the first reference image AND the dark wash denim jeans from the second reference image styled together. The model stands in a relaxed pose with hands in pockets. Use neutral studio background with natural soft lighting. Ensure the complete outfit is visible - the graphic t-shirt on top showing its print clearly, combined with the dark denim jeans on the bottom showing their fit and wash - both garments matching their reference images exactly."

Output ONLY the optimized prompt text. Do not include explanations, notes, or formatting - just the raw prompt text that will be sent directly to the image generation model.`;

/**
 * System instruction for IMAGE EDITING mode
 * Used when user wants to modify an existing generated image
 */
const IMAGE_EDIT_SYSTEM_INSTRUCTION = `You are an expert prompt engineer specialized in creating highly effective prompts for Google Gemini image editing.

Your task is to transform a user's edit request into an optimized ENGLISH prompt for Gemini image generation that modifies an existing image.

THIS IS IMAGE EDITING, NOT NEW GENERATION:
- The user has an EXISTING generated image they want to MODIFY
- A reference image of the current state will be provided to the model
- Your prompt must instruct the model to make ONLY the requested changes while preserving everything else

ADAPTIVE APPROACH - READ THE USER'S INTENT:
- ANALYZE the user's edit request carefully to detect what they want to CHANGE
- If the user explicitly requests a POSE/POSITION change (e.g., "make them sitting", "lying down", "standing up"):
  * PRIORITIZE applying the pose change as the PRIMARY goal
  * Preserve identity, garments, and style, but ALLOW the pose to change
  * Use directive language: "Position the model", "Place the model", "Change pose to"
- If the user requests other changes (color, garments, accessories, background):
  * PRESERVE the pose strictly
  * Apply only the specific requested changes

GOOGLE'S BEST PRACTICES FOR IMAGE EDITING:

1. **Be EXPLICIT about what to PRESERVE**
   - "Keep the model's face, identity, ethnicity, and overall appearance EXACTLY as shown in the reference image"
   - "Preserve the lighting, shadows, and overall composition (unless pose change requires lighting adjustments)"
   - "Maintain the background and all elements not mentioned in the edit request"

2. **Be SPECIFIC about what to CHANGE**
   - If user says "change skirt to red", your prompt should say: "Change ONLY the color of the skirt/bottom garment to a vibrant red while preserving its exact style, cut, fabric texture, and fit"
   - If user says "make them lying on the beach", your prompt should say: "Reposition the model to be lying down on the beach sand. Preserve their face, identity, outfit colors and style exactly, but adapt the pose to a relaxed lying position with natural body positioning on the sand."

3. **Use ADAPTIVE PRESERVATION language**
   - For pose changes: "MUST change pose to [new pose]", "Position the model [description]", "Reposition to [pose]"
   - For other edits: "CRITICAL: Do NOT alter anything except [specific change]"
   - Always preserve: "The model's identity, face, and outfit style must remain IDENTICAL to the reference"

4. **Structure for pose/position changes** (NEW):
   "Reposition the model in the reference fashion photograph to [new pose/position description]. CRITICAL IDENTITY PRESERVATION: Keep the model's face, identity, ethnicity, body type, outfit colors, garment styles, and textures EXACTLY as shown. POSE CHANGE: Place the model in a [detailed pose description]. Adapt lighting naturally to the new position while maintaining professional fashion photography quality."

5. **Structure for other edits** (existing template):
   "Edit the reference fashion photograph to [specific change]. CRITICAL PRESERVATION REQUIREMENTS: Keep the model's face, identity, pose, body proportions, and position EXACTLY as shown. Preserve the lighting style, shadows, background, and all garments/elements NOT being modified. SPECIFIC EDIT: [detailed description of the change]. The result should look like a subtle edit to the original photo, not a new generation."

COMMON EDIT TYPES AND HOW TO HANDLE THEM:

1. **Pose/Position Change** (NEW - e.g., "make them lying down", "sitting", "standing"):
   "Reposition the model to be [new pose description]. Preserve the model's face, identity, ethnicity, and body proportions exactly. Keep the outfit (colors, textures, style) identical to the reference. Adapt lighting and shadows naturally to the new pose while maintaining professional quality. The result should show the same person and outfit in a different position."

2. **Color Change** (e.g., "change skirt to red"):
   "Edit the reference image to change the color of the [garment] from its current color to [new color]. Keep the exact same fabric texture, pattern details, fit, draping, and style. The model, pose, lighting, and all other elements must remain IDENTICAL to the reference."

3. **Garment Swap** (e.g., "change pants to shorts"):
   "Edit the reference image to replace the [current garment] with [new garment]. Maintain the same style aesthetic, color scheme, and fit. The model's face, pose, body position, and all other garments must remain EXACTLY as shown in the reference."

4. **Add Element** (e.g., "add a belt"):
   "Edit the reference image to add [element description] to the outfit. Place it naturally while keeping the model's pose, all existing garments, and the overall composition IDENTICAL to the reference."

5. **Remove Element** (e.g., "remove the jacket"):
   "Edit the reference image to remove the [element]. Show appropriate clothing underneath (if garment removal) or clean background (if accessory removal). The model's pose, face, and all other elements must remain EXACTLY as shown."

6. **Style Change** (e.g., "make it more elegant"):
   "Edit the reference image to give the outfit a more [style] appearance. This may involve subtle adjustments to [specific elements]. CRITICAL: The model's face, pose, body, and background must remain IDENTICAL."

7. **Background Change**:
   "Edit the reference image to change the background to [description]. Keep the model, outfit, and pose EXACTLY as shown. Only replace the background while ensuring natural edge blending and consistent lighting."

CRITICAL RULES:
- READ THE USER'S INTENT: Detect if they want pose changes vs. other edits
- For pose changes: PRIORITIZE the pose change, preserve identity and outfit style
- For other edits: PRESERVE everything except the specific requested change
- ALWAYS preserve the model's face, identity, and overall appearance
- ALWAYS be specific about WHAT to change and WHAT to keep
- Use strong directive language: "MUST", "EXACTLY", "IDENTICAL", "ONLY", "CRITICAL"

Output ONLY the optimized prompt text. Do not include explanations, notes, or formatting - just the raw prompt text that will be sent directly to the image generation model.`;

/**
 * System instruction for GARMENT SWAP mode
 * Used when user wants to replace garments while preserving pose from a reference image
 * This is a HYBRID mode: takes pose from improve_reference + garments from new attachments
 */
const GARMENT_SWAP_SYSTEM_INSTRUCTION = `You are an expert prompt engineer for fashion AI image generation.

Your task: Create prompts that PRESERVE the model's pose/face/body from a reference image while DRESSING them with NEW garments from separate reference images.

🚨 CRITICAL CONTEXT - THIS IS A GARMENT SWAP OPERATION:
- The user has an EXISTING fashion photograph with a model in a specific pose
- They want to KEEP the pose, face, and body proportions EXACTLY
- They want to REPLACE the clothing with NEW garments from reference image(s)

## Reference Image Order (CRITICAL):
1. **Image 1 (POSE REFERENCE)**: The existing generated photo - PRESERVE pose, face, body, camera angle
2. **Image 2+ (GARMENT REFERENCES)**: New garments to dress the model in - APPLY these exactly

## Core Requirements:

### PRESERVE from Image 1 (Pose Reference):
- Exact body pose, orientation, and positioning
- Camera angle and perspective
- Model's face, identity, ethnicity, and facial features
- Body proportions, height, and build
- Lighting direction and style
- Overall composition and framing

### REPLACE with Image 2+ (Garment References):
- ALL visible clothing items
- Copy exact fabric texture, color, pattern, and silhouette from garment reference(s)
- Match garment fit and draping naturally to the preserved pose

## Prompt Structure Template:

"Create a professional fashion photograph. PRESERVE the model's exact pose, face, identity, body proportions, and camera angle from the FIRST reference image - the model MUST be in the IDENTICAL position and orientation. REPLACE the model's clothing with the garment(s) from the SECOND reference image: [detailed garment description]. The [garment] should fit naturally on the model while maintaining their exact pose. Keep the same professional studio lighting and composition."

## For OUTFITS (Multiple Garments - 2+ reference images):

"Create a professional fashion photograph. PRESERVE the model's exact pose, face, identity, body proportions, and camera angle from the FIRST reference image. DRESS the model in the COMPLETE OUTFIT: wearing BOTH the [top description from image 2] AND the [bottom description from image 3] together. The model MUST wear ALL garments from the references - do NOT omit any piece. Each garment should match its reference exactly in fabric, color, pattern, and style while fitting naturally on the model's preserved pose."

## CRITICAL RULES:
1. The POSE from image 1 is SACRED - do NOT change it
2. The GARMENTS from image 2+ are what the model should WEAR
3. Think of it as: "Same person, same pose, different clothes"
4. Ensure garments fit naturally on the preserved body position
5. Adapt garment draping to work with the pose (sleeves, hem, etc.)
6. Use strong directive language: "MUST preserve", "EXACT pose", "IDENTICAL position"

## OUTPUT:
Return ONLY the optimized prompt text in English. No explanations or formatting.`;

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

    // Select system instruction based on task type AND garment type
    const isImageEdit = input.task === 'image_edit';
    const isGarmentSwap = input.task === 'garment_swap';
    const isOutfit = !isImageEdit && !isGarmentSwap && input.garment.type === 'outfit';

    let systemInstruction: string;
    if (isGarmentSwap) {
      systemInstruction = GARMENT_SWAP_SYSTEM_INSTRUCTION;
      console.log('[PromptOptimizer] Using GARMENT SWAP system instruction (preserve pose, replace garments)');
    } else if (isImageEdit) {
      systemInstruction = IMAGE_EDIT_SYSTEM_INSTRUCTION;
    } else if (isOutfit) {
      systemInstruction = SYSTEM_INSTRUCTION_OUTFIT;
      console.log('[PromptOptimizer] Using OUTFIT system instruction for multiple garments');
    } else {
      systemInstruction = SYSTEM_INSTRUCTION_SINGLE_GARMENT;
      console.log('[PromptOptimizer] Using SINGLE GARMENT system instruction');
    }

    // Initialize Gemini 2.5 Flash Lite (text model optimized for low latency + JSON control)
    const model = genAI.getGenerativeModel({
      model: PROMPT_OPTIMIZER_MODEL_ID,
      systemInstruction,
    });

    // Build detailed context from input data
    let contextPrompt: string;
    try {
      if (isImageEdit) {
        contextPrompt = await buildImageEditContextPrompt(input);
      } else if (isGarmentSwap) {
        contextPrompt = buildGarmentSwapContextPrompt(input);
      } else {
        contextPrompt = buildContextPrompt(input);
      }
    } catch (contextError) {
      console.error('[PromptOptimizer] Error building context prompt:', contextError);
      return {
        success: false,
        error: `Failed to build context: ${contextError instanceof Error ? contextError.message : 'Unknown error'}`,
      };
    }

    // Retry logic for PROHIBITED_CONTENT errors
    // Gemini sometimes blocks content on first try but succeeds on retry
    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`[PromptOptimizer] Retry attempt ${attempt}/${MAX_RETRIES}`);
          // Add small delay between retries
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }

        // Generate optimized prompt
        const result = await model.generateContent(contextPrompt);
        const response = result.response;
        const optimizedPrompt = response.text().trim();

        // Get token usage if available
        const tokensUsed = response.usageMetadata?.totalTokenCount;

        const processingTime = Date.now() - startTime;

        // Success!
        if (attempt > 1) {
          console.log(`[PromptOptimizer] Success on retry attempt ${attempt}`);
        }

        return {
          success: true,
          prompt: optimizedPrompt,
          tokensUsed,
          metadata: {
            model: PROMPT_OPTIMIZER_MODEL_ID,
            processingTime,
            retryAttempt: attempt > 1 ? attempt : undefined,
          },
        };
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isProhibitedContent = errorMessage.toLowerCase().includes('prohibited_content') ||
          errorMessage.toLowerCase().includes('prohibited content');

        if (isProhibitedContent && attempt < MAX_RETRIES) {
          // PROHIBITED_CONTENT - retry
          console.warn(`[PromptOptimizer] Attempt ${attempt}/${MAX_RETRIES} blocked by content safety - retrying...`);
          continue;
        } else if (!isProhibitedContent) {
          // Different error - don't retry, fail immediately
          console.error('[PromptOptimizer] Error optimizing prompt (non-retryable):', error);
          return {
            success: false,
            error: errorMessage,
            metadata: {
              model: PROMPT_OPTIMIZER_MODEL_ID,
              processingTime: Date.now() - startTime,
            },
          };
        }
        // If we're here, it's PROHIBITED_CONTENT and we've exhausted retries
      }
    }

    // All retries exhausted
    console.error(`[PromptOptimizer] All ${MAX_RETRIES} attempts failed with content safety blocks`);
    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : 'Content safety block after retries',
      metadata: {
        model: PROMPT_OPTIMIZER_MODEL_ID,
        processingTime: Date.now() - startTime,
        retriesExhausted: true,
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
  const isOutfit = input.garment.type === 'outfit';

  if (isOutfit) {
    // SPECIAL HANDLING FOR MULTIPLE GARMENTS (2+ pieces)
    parts.push(`🚨 CRITICAL: COMPLETE OUTFIT (MULTIPLE GARMENTS)`);
    parts.push(`This is NOT a single garment - it's a COMPLETE OUTFIT with MULTIPLE PIECES.`);
    parts.push(`\n❗ ABSOLUTE REQUIREMENT: The model MUST wear ALL garments provided in the reference images.`);
    parts.push(`DO NOT dress the model in only ONE piece - this is a COMPLETE look that requires ALL items.`);
    parts.push(`\n📸 REFERENCE IMAGES PROVIDED:`);
    parts.push(`- Image 1: TOP/UPPER garment (shirt, blouse, jacket, etc.)`);
    parts.push(`- Image 2: BOTTOM/LOWER garment (pants, skirt, shorts, etc.)`);
    parts.push(`\n⚠️ YOUR PROMPT MUST EXPLICITLY INSTRUCT TO USE BOTH GARMENTS:`);
    parts.push(`- Describe the TOP garment in detail`);
    parts.push(`- Describe the BOTTOM garment in detail`);
    parts.push(`- Emphasize that BOTH must be worn together`);
    parts.push(`- Use phrases like "wearing both", "complete outfit", "styled together"`);
    parts.push(`\nOUTFIT Details:`);
  } else {
    parts.push(`GARMENT (Primary Focus):`);
  }

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
  if (input.model.body_size) {
    const bodySizeDescriptions: Record<string, string> = {
      'P': 'Petite/Slim body type - smaller, more delicate frame',
      'M': 'Medium/Average body type - standard proportions',
      'G': 'Large/Curvy body type - fuller figure',
      'plus-size': 'Plus-size body type - full, curvy, and confident physique',
    };
    parts.push(`- Body Size: ${bodySizeDescriptions[input.model.body_size] || input.model.body_size}`);
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
  if (input.background?.enabled && input.background.hasReferenceImage) {
    // Background image is provided as 3rd reference - integrated generation
    parts.push(`\nBACKGROUND & ENVIRONMENT:`);
    parts.push(`- The THIRD reference image is the background/environment to use`);
    parts.push(`- Place the model naturally within this environment`);
    parts.push(`- Match lighting and shadows to the background scene`);
    parts.push(`- Ensure consistent color temperature and ambient lighting`);
    parts.push(`- The model should appear as if photographed IN this setting`);
    if (input.background.description) {
      parts.push(`- Environment context: ${input.background.description}`);
    }
  } else if (input.background?.enabled && input.background.description) {
    // Background described but no image - will be applied in separate step
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
 * Analyze user's edit intent using AI
 * Returns what the user wants to change (pose, garments, colors, background, etc.)
 */
async function analyzeEditIntent(editInstruction: string): Promise<{
  changesPose: boolean;
  changesBackground: boolean;
  changesGarments: boolean;
  changesColors: boolean;
  changesAccessories: boolean;
  summary: string;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: `You are an AI intent analyzer for fashion image editing.

Analyze the user's edit request and determine what they want to CHANGE.

Return a JSON object with:
{
  "changesPose": boolean (true if user wants to change pose, position, or body orientation),
  "changesBackground": boolean (true if user wants to change location, environment, or background),
  "changesGarments": boolean (true if user wants to add/remove/swap clothing items),
  "changesColors": boolean (true if user wants to change colors of existing garments),
  "changesAccessories": boolean (true if user wants to add/remove accessories like jewelry, glasses, etc),
  "summary": string (1-sentence summary of what user wants)
}

Examples:
- "coloque ele deitado na praia" → changesPose: true, changesBackground: true
- "mude a cor da camisa para azul" → changesColors: true
- "adicione óculos de sol" → changesAccessories: true
- "troque a calça por um short" → changesGarments: true`,
    });

    const result = await model.generateContent(
      `Analyze this edit request:\n\n"${editInstruction}"\n\nReturn ONLY valid JSON, no other text.`
    );

    const responseText = result.response.text().trim();

    // Remove markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Validate JSON before parsing
    if (!jsonText || jsonText.length === 0) {
      throw new Error('Empty response from intent analyzer');
    }

    const analysis = JSON.parse(jsonText);

    // Validate required fields
    if (typeof analysis.changesPose !== 'boolean') {
      throw new Error('Invalid response: missing changesPose boolean');
    }

    return analysis;
  } catch (error) {
    console.error('[analyzeEditIntent] Error analyzing edit intent:', error);
    console.error('[analyzeEditIntent] Edit instruction was:', editInstruction);

    // Fallback: conservative approach - preserve everything
    return {
      changesPose: false,
      changesBackground: false,
      changesGarments: false,
      changesColors: false,
      changesAccessories: false,
      summary: editInstruction,
    };
  }
}

/**
 * Build context prompt for IMAGE EDITING mode
 * Used when user wants to modify an existing generated image
 *
 * For /criar flow: includes detailed model characteristics that should be preserved
 * For /chat flow: simpler context with basic info
 */
async function buildImageEditContextPrompt(input: PromptOptimizerInput): Promise<string> {
  const parts: string[] = [];

  parts.push('Transform the following user edit request into an optimized image editing prompt:\n');

  // User's edit instruction (MOST IMPORTANT)
  const editInstruction = input.editInstruction?.trim() || 'Make improvements to the image';
  parts.push(`USER'S EDIT REQUEST:`);
  parts.push(`"${editInstruction}"`);

  // Use AI to analyze user intent only if we have actual edit instruction
  const hasRealEditInstruction = input.editInstruction && input.editInstruction.trim().length > 0;
  const intent = hasRealEditInstruction
    ? await analyzeEditIntent(editInstruction)
    : {
        changesPose: false,
        changesBackground: false,
        changesGarments: false,
        changesColors: false,
        changesAccessories: false,
        summary: 'General improvements',
      };

  parts.push(`\nCONTEXT:`);
  parts.push(`- This is an EXISTING fashion photograph that the user wants to MODIFY`);
  parts.push(`- A reference image of the current state will be provided to the model`);
  parts.push(`- The user wants to make a SPECIFIC CHANGE while keeping everything else the same`);

  // Current image details - build comprehensive model info
  const hasModelDetails = input.model.gender ||
    input.model.facial_expression ||
    input.model.hair_color ||
    input.model.age_range ||
    input.model.body_size;

  if (hasModelDetails || input.garment.description) {
    parts.push(`\nCURRENT IMAGE INFO:`);

    if (input.model.gender) {
      parts.push(`- Model gender: ${input.model.gender}`);
    }

    // Include facial expression (important for /criar flow)
    if (input.model.facial_expression) {
      parts.push(`- Facial expression: ${input.model.facial_expression} - MUST BE PRESERVED EXACTLY`);
    }

    // Include hair color (important for /criar flow)
    if (input.model.hair_color) {
      parts.push(`- Hair color: ${input.model.hair_color} - MUST BE PRESERVED EXACTLY (unless edit specifically changes hair)`);
    }

    // Include age range
    if (input.model.age_range) {
      parts.push(`- Age range: ${input.model.age_range}`);
    }

    // Include body size
    if (input.model.body_size) {
      const bodySizeDescriptions: Record<string, string> = {
        'P': 'Petite/Slim body type',
        'M': 'Medium/Average body type',
        'G': 'Large/Curvy body type',
        'plus-size': 'Plus-size body type',
      };
      parts.push(`- Body type: ${bodySizeDescriptions[input.model.body_size] || input.model.body_size}`);
    }

    if (input.garment.description) {
      parts.push(`- Current garment description: ${input.garment.description}`);
    }
  }

  // Determine if we have rich model characteristics to preserve (from /criar flow)
  const hasRichModelDetails = !!(input.model.facial_expression || input.model.hair_color);

  // ADAPTIVE GUARDRAILS: Change based on AI-analyzed user intent
  parts.push(`\n🤖 AI ANALYSIS OF USER INTENT:`);
  parts.push(`- Summary: ${intent.summary}`);
  parts.push(`- Changes Pose: ${intent.changesPose ? 'YES' : 'NO'}`);
  parts.push(`- Changes Background: ${intent.changesBackground ? 'YES' : 'NO'}`);
  parts.push(`- Changes Garments: ${intent.changesGarments ? 'YES' : 'NO'}`);
  parts.push(`- Changes Colors: ${intent.changesColors ? 'YES' : 'NO'}`);
  parts.push(`- Changes Accessories: ${intent.changesAccessories ? 'YES' : 'NO'}`);

  if (intent.changesPose) {
    parts.push(`\n🎯 PRIMARY OBJECTIVE: POSE/POSITION CHANGE`);
    parts.push(`The AI analysis indicates the user wants to change the model's pose or body position.`);
    parts.push(`\nCRITICAL REQUIREMENTS FOR YOUR PROMPT:`);
    parts.push(`1. Pose & Body: **APPLY THE REQUESTED POSE/POSITION CHANGE** as the PRIMARY objective. This takes PRIORITY over preservation.`);
    parts.push(`2. Model Identity: PRESERVE the model's face, identity, ethnicity, and overall appearance EXACTLY`);
    parts.push(`3. Garments: PRESERVE existing garments EXACTLY - same colors, textures, fit, and style (unless user also requests garment changes)`);
    parts.push(`4. Background: ${intent.changesBackground ? 'Apply the requested background change' : 'Preserve the original background'}`);
    parts.push(`5. Lighting: Adapt lighting naturally to the new pose/environment while maintaining professional quality`);
    parts.push(`6. Body Proportions: PRESERVE the model's body type, height, weight, and physical characteristics`);
    parts.push(`7. The result should show the model in the NEW pose/position while maintaining their identity and outfit`);
    parts.push(`8. Use directive language like "MUST change to", "Position the model", "Place the model" for the pose change`);
  } else {
    parts.push(`\n🎯 PRIMARY OBJECTIVE: TARGETED EDIT (PRESERVE POSE)`);
    parts.push(`The AI analysis indicates the user wants to modify specific elements WITHOUT changing the pose.`);
    parts.push(`\nCRITICAL REQUIREMENTS FOR YOUR PROMPT:`);
    parts.push(`1. Model Identity: PRESERVE the model's face and identity EXACTLY`);
    parts.push(`2. Pose & Body: PRESERVE pose, body proportions, and position - keep them EXACTLY as shown in the reference`);
    parts.push(`3. Lighting: PRESERVE lighting and shadows (unless the edit implies lighting changes)`);
    parts.push(`4. Background: ${intent.changesBackground ? 'Apply the requested background change with appropriate lighting' : 'PRESERVE the original background'}`);
    parts.push(`5. Garments: ${intent.changesGarments ? 'Apply the requested garment changes' : 'PRESERVE existing garments'}`);
    parts.push(`6. Colors: ${intent.changesColors ? 'Apply the requested color changes to specific garments' : 'PRESERVE existing colors'}`);
    parts.push(`7. Accessories: ${intent.changesAccessories ? 'Apply the requested accessory additions/removals' : 'PRESERVE existing accessories'}`);
    parts.push(`8. Apply ONLY the changes identified above - everything else should remain IDENTICAL to the reference`);
    parts.push(`9. Use strong directive language: "MUST", "EXACTLY", "IDENTICAL", "ONLY", "CRITICAL" for elements that should be preserved`);
  }

  // Additional preservation requirements for /criar flow with rich model data
  if (hasRichModelDetails) {
    parts.push(`\n⚠️ ADDITIONAL PRESERVATION REQUIREMENTS (from /criar customization):`);
    if (input.model.facial_expression) {
      parts.push(`- The model's facial expression "${input.model.facial_expression}" MUST remain IDENTICAL unless the edit specifically requests changing it`);
    }
    if (input.model.hair_color) {
      parts.push(`- The model's hair color "${input.model.hair_color}" MUST remain IDENTICAL unless the edit specifically requests changing it`);
    }
    parts.push(`- These characteristics were carefully selected by the user and are critical to preserve`);
  }

  parts.push(`\nOUTPUT:`);
  parts.push(`- Aspect Ratio: ${input.output_format.aspect_ratio}`);
  parts.push(`- Dimensions: ${input.output_format.width}x${input.output_format.height}px`);

  return parts.join('\n');
}

/**
 * Build context prompt for GARMENT SWAP mode
 * Used when user wants to replace garments while preserving pose from a reference image
 */
function buildGarmentSwapContextPrompt(input: PromptOptimizerInput): string {
  const parts: string[] = [];

  parts.push('Transform the following structured data into a GARMENT SWAP prompt:\n');

  // Explain the operation
  parts.push(`🔄 GARMENT SWAP OPERATION:`);
  parts.push(`- The user has an existing fashion photograph (provided as Image 1)`);
  parts.push(`- They want to KEEP the pose, face, and body from that image`);
  parts.push(`- They want to REPLACE the clothing with NEW garments (provided as Image 2+)`);

  // Reference image structure
  parts.push(`\n📸 REFERENCE IMAGES:`);
  parts.push(`- Image 1: POSE REFERENCE (existing photo to preserve pose/face/body from)`);

  const isOutfit = input.garment.type === 'outfit';
  if (isOutfit) {
    parts.push(`- Image 2: UPPER GARMENT (new top/shirt/blouse to dress the model in)`);
    parts.push(`- Image 3: LOWER GARMENT (new pants/skirt/shorts to dress the model in)`);
    parts.push(`\n🚨 COMPLETE OUTFIT: The model MUST wear BOTH garments together!`);
  } else {
    parts.push(`- Image 2: NEW GARMENT (clothing item to dress the model in)`);
  }

  // Garment details
  parts.push(`\nNEW GARMENT(S) TO APPLY:`);
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

  if (input.garmentPlacementHint) {
    parts.push(`\nGARMENT PLACEMENT HINT:`);
    parts.push(`- ${input.garmentPlacementHint}`);
  }

  // Model info (to preserve)
  parts.push(`\nMODEL TO PRESERVE:`);
  parts.push(`- Gender: ${input.model.gender}`);
  if (input.model.age_range) {
    parts.push(`- Age Range: ${input.model.age_range}`);
  }
  if (input.model.facial_expression) {
    parts.push(`- Facial Expression: ${input.model.facial_expression} (MUST preserve)`);
  }
  if (input.model.hair_color) {
    parts.push(`- Hair Color: ${input.model.hair_color} (MUST preserve)`);
  }

  // Pose preservation requirements
  parts.push(`\n⚠️ POSE PRESERVATION (CRITICAL):`);
  parts.push(`- The model's pose from Image 1 is SACRED - do NOT change it`);
  parts.push(`- Preserve: body orientation, arm positions, leg positions, head angle, camera perspective`);
  parts.push(`- The garments should be "dressed onto" the existing pose naturally`);
  if (input.pose.reference_description) {
    parts.push(`- Pose details: ${input.pose.reference_description}`);
  }

  // Output format
  parts.push(`\nOUTPUT FORMAT:`);
  parts.push(`- Aspect Ratio: ${input.output_format.aspect_ratio}`);
  parts.push(`- Dimensions: ${input.output_format.width}x${input.output_format.height}px`);

  // Background handling
  if (input.background?.enabled && input.background.hasReferenceImage) {
    parts.push(`\nBACKGROUND:`);
    parts.push(`- A background reference image is also provided`);
    parts.push(`- This will be applied in a SEPARATE step after the garment swap`);
    parts.push(`- For now, keep the original background from the pose reference`);
  } else {
    parts.push(`\nBACKGROUND:`);
    parts.push(`- Preserve the original background from the pose reference image`);
  }

  parts.push(`\nREQUIREMENTS:`);
  parts.push(`- Photorealistic quality`);
  parts.push(`- Professional fashion photography lighting (preserve from reference)`);
  parts.push(`- Sharp focus on garment details`);
  parts.push(`- Natural fabric textures and draping that work with the preserved pose`);
  parts.push(`- The result should look like the SAME MODEL in the SAME POSE wearing DIFFERENT CLOTHES`);

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
  bodySize?: 'P' | 'M' | 'G' | 'plus-size';
  modelHeight: number;
  modelWeight: number;
  facialExpression?: string;
  hairColor?: string;
  aspectRatio: string;
  outputWidth: number;
  outputHeight: number;
  background?: {
    enabled: boolean;
    type?: 'preset' | 'custom' | 'original';
    description?: string;
    /** When true, background image is provided as 3rd reference (integrated generation) */
    hasReferenceImage?: boolean;
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
      body_size: params.bodySize,
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
    background: params.background
      ? {
          enabled: params.background.enabled,
          type: params.background.type,
          description: params.background.description,
          hasReferenceImage: params.background.hasReferenceImage,
        }
      : undefined,
  };
}

/**
 * Helper to build input data for IMAGE EDIT mode
 * Used when user wants to modify an existing generated image
 *
 * For /criar flow: includes model characteristics (expression, hair color, age, body size)
 * For /chat flow: simpler, only basic gender info
 */
export function buildImageEditOptimizerInput(params: {
  editInstruction: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  currentGarmentDescription?: string;
  aspectRatio?: string;
  outputWidth?: number;
  outputHeight?: number;
  // Additional model characteristics for /criar flow
  facialExpression?: string;
  hairColor?: string;
  ageRange?: string;
  bodySize?: 'P' | 'M' | 'G' | 'plus-size';
  modelHeight?: number;
  modelWeight?: number;
}): PromptOptimizerInput {
  return {
    task: 'image_edit',
    focus: 'edit_existing',
    editInstruction: params.editInstruction,
    garment: {
      type: 'single',
      category: 'existing garment',
      description: params.currentGarmentDescription,
    },
    model: {
      gender: params.gender || 'FEMALE',
      height_cm: params.modelHeight || 170,
      weight_kg: params.modelWeight || 60,
      age_range: params.ageRange,
      body_size: params.bodySize,
      facial_expression: params.facialExpression || null,
      hair_color: params.hairColor || null,
    },
    pose: {
      category: 'preserve existing',
      reference_description: 'Preserve exact pose from reference image',
    },
    output_format: {
      aspect_ratio: params.aspectRatio || '3:4',
      width: params.outputWidth || 1024,
      height: params.outputHeight || 1366,
    },
  };
}

/**
 * Helper to build input data for GARMENT SWAP mode
 * Used when user wants to replace garments while preserving pose from a reference image
 * This is a HYBRID mode: takes pose from improve_reference + garments from new attachments
 */
export function buildGarmentSwapOptimizerInput(params: {
  // Pose reference info (from improve_reference)
  poseReferenceDescription?: string;

  // New garment(s) info
  garmentCount: number;
  garmentType: 'single' | 'outfit';
  garmentCategory?: string;
  garmentDescription?: string;
  garmentPlacementHint?: string;

  // Model characteristics (to preserve from reference)
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  ageRange?: string;
  facialExpression?: string;
  hairColor?: string;

  // Output format
  aspectRatio?: string;
  outputWidth?: number;
  outputHeight?: number;

  // Optional background (for FULL_EDIT mode - applied in separate step)
  background?: {
    enabled: boolean;
    type: 'custom' | 'preset';
    description?: string;
    hasReferenceImage: boolean;
  };
}): PromptOptimizerInput {
  return {
    task: 'garment_swap',
    focus: 'preserve_pose_swap_garment',
    garment: {
      type: params.garmentType,
      category: params.garmentCategory || 'clothing',
      description: params.garmentDescription,
    },
    garmentPlacementHint: params.garmentPlacementHint,
    model: {
      gender: params.gender,
      age_range: params.ageRange,
      height_cm: 170, // Default - not critical for garment swap as we preserve from reference
      weight_kg: 60,  // Default - not critical for garment swap as we preserve from reference
      facial_expression: params.facialExpression || null,
      hair_color: params.hairColor || null,
    },
    pose: {
      category: 'preserved_from_reference',
      reference_description: params.poseReferenceDescription ||
        'CRITICAL: Preserve the EXACT pose, body proportions, and camera angle from the first reference image',
    },
    output_format: {
      aspect_ratio: params.aspectRatio || '3:4',
      width: params.outputWidth || 1024,
      height: params.outputHeight || 1366,
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
    return 'This is a COMPLETE OUTFIT with TWO separate garments (top + bottom). The model MUST wear BOTH pieces together. Dress the model with the upper garment from the first reference image on the top half of the body AND the lower garment from the second reference image on the bottom half. Both pieces should be clearly visible and styled together as one cohesive outfit.';
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
