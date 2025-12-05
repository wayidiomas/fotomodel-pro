/**
 * Quick Action Prompts
 *
 * Optimized prompts for each quick action, following Google's best practices
 * for Gemini image generation.
 *
 * Each prompt is designed to:
 * 1. Be in ENGLISH (optimal for Gemini)
 * 2. Be specific and detailed
 * 3. Include critical requirements
 * 4. Reference attached images correctly
 */

export type QuickActionId =
  | 'add-model-female'
  | 'add-model-male'
  | 'background-studio'
  | 'background-lifestyle-office'
  | 'background-lifestyle-cafe'
  | 'background-outdoor'
  | 'background-custom'
  | 'style-summer'
  | 'color-variants'
  | 'create-look'
  | 'style-custom'
  | 'remove-background'
  | 'enhance-quality'
  | 'edit-custom';

export type AgeRange = '1-10' | '10-15' | '15-20' | '20-30' | '30-40' | '40-50' | '50-60' | '60+';
export type BodySize = 'P' | 'M' | 'G' | 'plus-size';

export interface QuickActionContext {
  hasGarmentImage: boolean;
  garmentCount: number;
  hasBackgroundImage: boolean;
  hasModelImage: boolean;
  hasExistingGeneration: boolean; // If editing a previously generated image
  customDescription?: string; // User's custom text for personalized actions
  customBackgroundDescription?: string; // For custom background text
  // Model characteristics (optional)
  modelAgeRange?: AgeRange;
  modelBodySize?: BodySize;
  modelGender?: 'MALE' | 'FEMALE' | 'NON_BINARY';
}

/**
 * Convert age range to English description
 */
function getAgeDescription(ageRange?: AgeRange): string {
  if (!ageRange) return 'young adult (20-30 years old)';
  const ageMap: Record<AgeRange, string> = {
    '1-10': 'child (1-10 years old)',
    '10-15': 'pre-teen (10-15 years old)',
    '15-20': 'teenager (15-20 years old)',
    '20-30': 'young adult (20-30 years old)',
    '30-40': 'adult (30-40 years old)',
    '40-50': 'middle-aged (40-50 years old)',
    '50-60': 'mature adult (50-60 years old)',
    '60+': 'senior (60+ years old)',
  };
  return ageMap[ageRange];
}

/**
 * Convert body size to English description
 */
function getBodySizeDescription(bodySize?: BodySize): string {
  if (!bodySize) return 'professional model proportions';
  const sizeMap: Record<BodySize, string> = {
    'P': 'petite/slim build (size S/P)',
    'M': 'medium/average build (size M)',
    'G': 'larger/curvy build (size L/G)',
    'plus-size': 'plus-size body type, curvy and confident, representing body diversity beautifully',
  };
  return sizeMap[bodySize];
}

/**
 * Build model specifications text from context
 */
function buildModelSpecsText(ctx: QuickActionContext, defaultGender: 'Female' | 'Male'): string {
  const gender = ctx.modelGender === 'MALE' ? 'Male' : ctx.modelGender === 'NON_BINARY' ? 'Non-binary/Androgynous' : defaultGender;
  const age = getAgeDescription(ctx.modelAgeRange);
  const build = getBodySizeDescription(ctx.modelBodySize);

  return `MODEL SPECIFICATIONS:
- Gender: ${gender}
- Age: ${age}
- Build: ${build}
- Expression: Confident, natural, and approachable
- Pose: Natural catalog pose with good posture`;
}

/**
 * Get optimized prompt for a quick action
 */
export function getQuickActionPrompt(
  actionId: QuickActionId,
  context: QuickActionContext
): string {
  const prompts: Record<QuickActionId, (ctx: QuickActionContext) => string> = {
    // ==========================================
    // MODEL ACTIONS
    // ==========================================
    'add-model-female': (ctx) => `Create a professional e-commerce fashion photograph.

TASK: Take the garment${ctx.garmentCount > 1 ? 's' : ''} from the reference image${ctx.garmentCount > 1 ? 's' : ''} and dress a female fashion model wearing ${ctx.garmentCount > 1 ? 'them' : 'it'} exactly as shown.

${buildModelSpecsText(ctx, 'Female')}

GARMENT REQUIREMENTS:
- MUST match the reference image exactly in color, fabric, texture, pattern, and all construction details
- Preserve every stitch, button, zipper, pocket, and decorative element
- Natural fabric draping that follows the model's body naturally
- Proper fit showing how the garment would look when worn on this body type

PHOTOGRAPHY STYLE:
- Professional studio setting with clean white/light gray backdrop
- Soft three-point lighting (key, fill, rim)
- Full-body framing from head to toe
- Sharp focus on garment details
- E-commerce catalog quality

IMPORTANT: The model should look authentic and represent the specified characteristics naturally. Ensure the garment fits appropriately for the model's body type.`,

    'add-model-male': (ctx) => `Create a professional e-commerce fashion photograph.

TASK: Take the garment${ctx.garmentCount > 1 ? 's' : ''} from the reference image${ctx.garmentCount > 1 ? 's' : ''} and dress a male fashion model wearing ${ctx.garmentCount > 1 ? 'them' : 'it'} exactly as shown.

${buildModelSpecsText(ctx, 'Male')}

GARMENT REQUIREMENTS:
- MUST match the reference image exactly in color, fabric, texture, pattern, and all construction details
- Preserve every stitch, button, zipper, pocket, and decorative element
- Natural fabric draping that follows the model's body naturally
- Proper fit showing how the garment would look when worn on this body type

PHOTOGRAPHY STYLE:
- Professional studio setting with clean white/light gray backdrop
- Soft three-point lighting (key, fill, rim)
- Full-body framing from head to toe
- Sharp focus on garment details
- E-commerce catalog quality

IMPORTANT: The model should look authentic and represent the specified characteristics naturally. Ensure the garment fits appropriately for the model's body type.`,

    // ==========================================
    // BACKGROUND ACTIONS
    // ==========================================
    'background-studio': (ctx) => `Transform this fashion photograph to have a professional studio background.

TASK: Keep the model and garment exactly as they are, but replace the background with a clean professional studio setting.

BACKGROUND REQUIREMENTS:
- Clean white or light gray seamless backdrop
- Professional photography studio environment
- Soft gradient from pure white to light gray
- No distracting elements or patterns

LIGHTING ADJUSTMENTS:
- Apply professional three-point studio lighting
- Soft key light from front-left
- Fill light to reduce harsh shadows
- Rim light to separate subject from background
- Create subtle, natural floor shadow beneath the model

CRITICAL:
- Do NOT modify the garment colors, patterns, or details
- Do NOT change the model's pose, expression, or features
- Only replace the background and adjust lighting to match`,

    'background-lifestyle-office': (ctx) => `Transform this fashion photograph into a lifestyle shot in a modern office setting.

TASK: Composite the model and garment into an elegant corporate office environment.

BACKGROUND REQUIREMENTS:
- Modern, upscale office interior
- Floor-to-ceiling windows with city view or natural light
- Minimalist furniture (desk, chair, plants)
- Neutral color palette (whites, grays, wood tones)
- Professional, aspirational atmosphere

INTEGRATION REQUIREMENTS:
- Match lighting direction with window light source
- Add natural shadows on floor matching the environment
- Adjust color temperature to match ambient office lighting
- Scale model appropriately to the space
- Ensure seamless edge blending

CRITICAL:
- Preserve all garment details exactly as shown
- Maintain model's pose and expression
- Create believable composite that looks like an actual photoshoot`,

    'background-lifestyle-cafe': (ctx) => `Transform this fashion photograph into a lifestyle shot in a trendy cafe setting.

TASK: Composite the model and garment into a cozy, modern cafe environment.

BACKGROUND REQUIREMENTS:
- Stylish cafe or coffee shop interior
- Warm, inviting atmosphere
- Elements: exposed brick, wooden furniture, plants, coffee cups
- Soft natural lighting from windows
- Instagram-worthy aesthetic

INTEGRATION REQUIREMENTS:
- Match warm ambient lighting of cafe setting
- Add appropriate shadows matching light sources
- Adjust skin and garment tones to match environment
- Natural positioning within the space
- Seamless edge integration

CRITICAL:
- Preserve all garment details exactly as shown
- Maintain model's pose and expression
- Create authentic lifestyle photography feel`,

    'background-outdoor': (ctx) => `Transform this fashion photograph into an outdoor lifestyle shot.

TASK: Composite the model and garment into a beautiful natural outdoor setting.

BACKGROUND REQUIREMENTS:
- Natural outdoor environment (park, garden, urban street)
- Good natural lighting (golden hour preferred)
- Blurred background (bokeh effect) for depth
- Lush greenery or interesting architecture
- Pleasant, aspirational setting

INTEGRATION REQUIREMENTS:
- Match natural daylight direction and warmth
- Add realistic ground shadows
- Apply subtle color grading to unify model with environment
- Appropriate depth of field effect
- Natural edge blending

CRITICAL:
- Preserve all garment details exactly as shown
- Maintain model's pose and expression
- Create professional outdoor fashion photography look`,

    'background-custom': (ctx) => {
      const bgDesc = ctx.customBackgroundDescription || ctx.customDescription || 'custom background';
      return `Transform this fashion photograph with a custom background setting.

TASK: Composite the model and garment into the following environment: ${bgDesc}

BACKGROUND REQUIREMENTS:
- Create the described environment authentically
- Professional photography quality
- Appropriate lighting for the setting
- Cohesive color palette

INTEGRATION REQUIREMENTS:
- Match lighting direction and color temperature to the new environment
- Add realistic shadows appropriate to the scene
- Adjust overall color grading for unity
- Seamless edge blending
- Correct scale and perspective

CRITICAL:
- Preserve all garment details exactly as shown
- Maintain model's pose and expression
- Create believable, professional composite`;
    },

    // ==========================================
    // STYLE ACTIONS
    // ==========================================
    'style-summer': (ctx) => `Apply a summer aesthetic to this fashion photograph.

TASK: Transform the image to have a warm, sunny, summer feeling while keeping all elements intact.

STYLE ADJUSTMENTS:
- Warm color temperature (golden/orange tones)
- Bright, sun-kissed lighting
- Slightly increased contrast
- Vibrant but natural colors
- Subtle lens flare or sun glow effects (optional)
- Summer vacation mood

COLOR GRADING:
- Lift shadows slightly for airy feel
- Add warmth to highlights
- Enhance yellows and oranges subtly
- Keep skin tones natural and healthy

CRITICAL:
- Preserve all garment details and colors accurately
- Keep the model recognizable
- Maintain professional photography quality
- Don't over-process - keep it natural`,

    'color-variants': (ctx) => `Generate color variations of this garment.

TASK: Create 4 color variants of the garment shown, displaying each option clearly.

VARIANTS TO CREATE:
1. Original color (for reference)
2. Black version
3. White/Cream version
4. Navy Blue version

REQUIREMENTS FOR EACH VARIANT:
- Maintain exact same garment design, cut, and details
- Only change the base color
- Keep all stitching, buttons, zippers visible
- Preserve fabric texture appearance
- Show same model in same pose

OUTPUT FORMAT:
- Display all 4 variants in a grid or side-by-side layout
- Label each color variant clearly
- Professional product photography style
- Equal sizing and lighting for each`,

    'create-look': (ctx) => `Create a complete outfit suggestion based on this garment.

TASK: Style a complete look around the main garment, suggesting complementary pieces.

STYLING REQUIREMENTS:
- Keep the original garment as the hero piece
- Add complementary top/bottom as needed
- Suggest appropriate footwear
- Include 1-2 accessories (bag, jewelry, belt)
- Create a cohesive, fashionable outfit

PRESENTATION:
- Full-body shot showing the complete look
- Professional styling photography
- Clear visibility of all pieces
- Natural, wearable outfit combination

STYLE DIRECTION:
- Modern and on-trend
- Appropriate for the garment's style (casual, formal, etc.)
- Color-coordinated palette
- Practical, real-world outfit`,

    'style-custom': (ctx) => {
      const styleDesc = ctx.customDescription || 'custom style';
      return `Apply a custom style transformation to this fashion photograph.

TASK: Transform the image according to this style direction: ${styleDesc}

STYLE APPLICATION:
- Apply the described aesthetic consistently
- Maintain professional photography quality
- Keep garment details visible and accurate
- Ensure the style enhances rather than obscures

CRITICAL:
- Preserve garment colors and details as much as the style allows
- Keep the model recognizable
- Maintain sellable product image quality
- Balance artistic style with commercial viability`;
    },

    // ==========================================
    // EDIT ACTIONS
    // ==========================================
    'remove-background': (ctx) => `Remove the background from this fashion photograph.

TASK: Isolate the model/garment from the background, leaving only the subject.

REQUIREMENTS:
- Clean, precise edge detection around the subject
- Preserve all fine details (hair, fabric edges, accessories)
- Replace background with pure white (#FFFFFF)
- No color spill from original background
- Maintain natural shadows at feet (subtle drop shadow)

EDGE QUALITY:
- Smooth, anti-aliased edges
- No jagged or pixelated boundaries
- Preserve semi-transparent areas (loose fabric, hair strands)
- Professional cutout quality

OUTPUT:
- Subject on clean white background
- Ready for e-commerce use
- Product photography standard`,

    'enhance-quality': (ctx) => `Enhance the quality of this fashion photograph.

TASK: Improve the overall image quality while maintaining authenticity.

ENHANCEMENTS TO APPLY:
- Increase sharpness, especially on garment details
- Improve color vibrancy and accuracy
- Reduce any noise or grain
- Enhance fabric texture visibility
- Optimize contrast and dynamic range
- Improve skin texture (natural, not plastic)

DETAIL FOCUS:
- Sharpen stitching and seams
- Enhance fabric weave/texture visibility
- Clarify buttons, zippers, and hardware
- Improve pattern definition

CRITICAL:
- Do NOT alter garment colors or design
- Maintain natural, realistic appearance
- Keep authentic photography look
- Don't over-sharpen or over-saturate`,

    'edit-custom': (ctx) => {
      const editDesc = ctx.customDescription || 'custom edits';
      return `Apply custom edits to this fashion photograph.

TASK: Make the following adjustments: ${editDesc}

EDITING GUIDELINES:
- Apply requested changes precisely
- Maintain professional image quality
- Keep edits subtle and natural
- Preserve garment accuracy

CRITICAL:
- Do not alter elements not mentioned in the request
- Maintain realistic, believable result
- Keep sellable product image quality
- Ensure changes enhance rather than distract`;
    },
  };

  const promptFn = prompts[actionId];
  if (!promptFn) {
    return `Apply the "${actionId}" transformation to this image while maintaining garment accuracy and professional quality.`;
  }

  return promptFn(context);
}

/**
 * Determine if an action requires an existing image
 */
export function actionRequiresImage(actionId: QuickActionId): boolean {
  // All actions except model generation require an existing image
  const modelActions: QuickActionId[] = ['add-model-female', 'add-model-male'];
  return !modelActions.includes(actionId);
}

/**
 * Determine if an action is an edit (vs. generation)
 */
export function isEditAction(actionId: QuickActionId): boolean {
  const editActions: QuickActionId[] = [
    'remove-background',
    'enhance-quality',
    'edit-custom',
    'background-studio',
    'background-lifestyle-office',
    'background-lifestyle-cafe',
    'background-outdoor',
    'background-custom',
    'style-summer',
    'style-custom',
  ];
  return editActions.includes(actionId);
}

/**
 * Get the category of an action
 */
export function getActionCategory(actionId: QuickActionId): 'model' | 'background' | 'style' | 'edit' {
  if (actionId.startsWith('add-model')) return 'model';
  if (actionId.startsWith('background')) return 'background';
  if (actionId.startsWith('style') || actionId === 'color-variants' || actionId === 'create-look') return 'style';
  return 'edit';
}

/**
 * Build a complete prompt with context for the API
 */
export function buildQuickActionRequest(
  actionId: QuickActionId,
  context: QuickActionContext
): {
  prompt: string;
  requiresGarment: boolean;
  requiresExistingImage: boolean;
  category: 'model' | 'background' | 'style' | 'edit';
} {
  return {
    prompt: getQuickActionPrompt(actionId, context),
    requiresGarment: ['add-model-female', 'add-model-male'].includes(actionId),
    requiresExistingImage: actionRequiresImage(actionId),
    category: getActionCategory(actionId),
  };
}
