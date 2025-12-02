/**
 * Gemini 2.5 Flash Prompt Templates
 * Optimized for Virtual Try-On and Fashion Photography
 * Based on Google's best practices for image generation
 */

export interface VirtualTryOnParams {
  // Garment info
  garmentType: 'single' | 'outfit';
  garmentCategory: string;
  garmentDescription?: string;

  // Model characteristics
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  poseCategory: string;
  ageRange?: string;
  height?: number; // cm
  weight?: number; // kg
  facialExpression?: string;

  // Styling
  background?: string;
  hairColor?: string;
  lighting?: string;
}

/**
 * Main virtual try-on prompt template
 * Combines garment + pose images using best practices:
 * - Descriptive sentences instead of keywords
 * - Specific photographic language
 * - Clear multi-image composition instructions
 */
export function createVirtualTryOnPrompt(params: VirtualTryOnParams): string {
  const {
    garmentType,
    garmentCategory,
    garmentDescription,
    gender,
    poseCategory,
    ageRange,
    height,
    weight,
    facialExpression,
    background,
    hairColor,
    lighting,
  } = params;

  // Build model description
  const modelDesc = buildModelDescription({
    gender,
    poseCategory,
    ageRange,
    height,
    weight,
    facialExpression,
  });

  // Build garment description
  const garmentDesc = buildGarmentDescription({
    garmentType,
    garmentCategory,
    garmentDescription,
  });

  // Build styling description
  const stylingDesc = buildStylingDescription({
    background,
    hairColor,
    lighting,
  });

  return `Create a professional fashion photograph by combining elements from the provided images.

Take the ${garmentDesc} from the garment image and place it on the model from the pose image, showing the model wearing it naturally and realistically.

Model characteristics: ${modelDesc}

${stylingDesc}

Photography setup:
- Shot type: Full-body fashion portrait using an 85mm portrait lens
- Lighting: ${lighting || 'Studio three-point softbox lighting with soft shadows for professional e-commerce quality'}
- Style: High-end fashion catalog photography with clean, professional presentation

Technical requirements:
- Generate a realistic, photorealistic result
- Ensure natural fabric draping and accurate garment fit based on the model's body proportions
- Maintain proper lighting and shadows that match the studio environment
- Preserve garment details, textures, colors, and patterns from the original image
- Create depth and dimension through proper lighting and shadow placement
- Ensure the model's pose and body language appear natural and confident

The final image should look like a professional e-commerce or fashion catalog photo shoot, with the garment appearing as if it was actually worn by the model during a real photography session.`;
}

/**
 * Background removal prompt
 * Semantic positive framing instead of negatives
 */
export function createBackgroundRemovalPrompt(): string {
  return `Carefully remove the background from this image, leaving only the subject (model and garment) on a completely transparent background.

Preserve all details of the subject:
- Maintain crisp, clean edges around the model and garment
- Keep all fabric details, textures, and fine elements like hair strands
- Preserve the natural lighting and shadows on the subject itself
- Ensure smooth, professional edge detection without jagged artifacts

The background should be completely transparent (alpha channel), suitable for compositing onto any new background.`;
}

/**
 * Background change prompt
 * Uses specific environmental descriptions
 */
export function createBackgroundChangePrompt(backgroundDesc: string, useReferenceImage = false): string {
  return `Change only the background of this image to ${backgroundDesc}. Keep everything else (the subject, model, garment, pose, lighting on the subject) exactly the same.${useReferenceImage ? '\nUse the additional reference image as the new background. Composite the subject from the main image onto that reference scene, matching perspective and scale.' : ''}

New background requirements:
- ${backgroundDesc}
- Ensure the new background's lighting and ambiance complement the subject
- Maintain natural depth and perspective
- Blend the edges seamlessly where the subject meets the new background
- Preserve all original details of the subject

The subject should appear naturally placed in the new environment, as if the photo was originally taken in that setting.`;
}

/**
 * Hair color change prompt
 * Specific modification with preservation instructions
 */
export function createHairColorChangePrompt(newColor: string, colorHex?: string): string {
  return `Change only the model's hair color to ${newColor}${colorHex ? ` (${colorHex})` : ''}. Keep everything else exactly the same.

Hair color modification requirements:
- Apply the new hair color naturally, respecting highlights, shadows, and hair texture
- Maintain the hair's original style, volume, and structure
- Preserve natural-looking shine and dimension in the hair
- Ensure the color transition looks realistic and professionally done
- Keep all other aspects of the image unchanged (face, skin tone, clothing, background, pose)

The result should look like the model naturally has ${newColor} hair, not artificially colored.`;
}

/**
 * Logo insertion prompt
 * Precise placement with natural integration
 */
export function createLogoInsertionPrompt(
  position: string,
  logoDescription?: string
): string {
  return `Add the logo from the second image onto the garment or image at the ${position} position.

Logo placement requirements:
- Position: ${position}
- Scale the logo appropriately to look natural and professional (not too large or small)
- Ensure the logo follows the contours and perspective of the garment if placed on fabric
- Apply subtle shadows and highlights to make the logo appear naturally integrated
- Maintain the logo's clarity and readability
- Keep all other aspects of the image unchanged
${logoDescription ? `- Logo description: ${logoDescription}` : ''}

The logo should appear as if it was originally part of the garment or photo composition, professionally placed and naturally integrated.`;
}

/**
 * Helper: Build model description
 */
function buildModelDescription(params: {
  gender: string;
  poseCategory: string;
  ageRange?: string;
  height?: number;
  weight?: number;
  facialExpression?: string;
}): string {
  const parts: string[] = [];

  // Gender
  const genderLabels = {
    MALE: 'male',
    FEMALE: 'female',
    NON_BINARY: 'non-binary',
  };
  parts.push(`${genderLabels[params.gender as keyof typeof genderLabels] || 'female'} model`);

  // Age range
  if (params.ageRange) {
    parts.push(`in their ${params.ageRange.toLowerCase()}`);
  }

  // Height and weight
  if (params.height) {
    parts.push(`${params.height}cm tall`);
  }
  if (params.weight) {
    parts.push(`${params.weight}kg`);
  }

  // Pose
  const poseLabel = params.poseCategory.toLowerCase().replace(/_/g, ' ');
  parts.push(`in a ${poseLabel} pose`);

  // Facial expression
  if (params.facialExpression) {
    parts.push(`with a ${params.facialExpression} expression`);
  }

  return parts.join(', ');
}

/**
 * Helper: Build garment description
 */
function buildGarmentDescription(params: {
  garmentType: string;
  garmentCategory: string;
  garmentDescription?: string;
}): string {
  const parts: string[] = [];

  if (params.garmentType === 'outfit') {
    parts.push('complete outfit');
  } else {
    parts.push(params.garmentCategory.toLowerCase());
  }

  if (params.garmentDescription) {
    parts.push(`(${params.garmentDescription})`);
  }

  return parts.join(' ');
}

/**
 * Helper: Build styling description
 */
function buildStylingDescription(params: {
  background?: string;
  hairColor?: string;
  lighting?: string;
}): string {
  const parts: string[] = [];

  if (params.background) {
    parts.push(`Background: ${params.background} studio backdrop`);
  } else {
    parts.push('Background: Clean, professional white studio backdrop');
  }

  if (params.hairColor) {
    parts.push(`Hair color: ${params.hairColor}`);
  }

  return parts.join('\n');
}

/**
 * Combined editing prompt for multiple operations
 * Applies edits sequentially in the correct order
 */
export function createCombinedEditingPrompt(edits: {
  removeBackground?: boolean;
  changeBackground?: string;
  changeHairColor?: { color: string; hex?: string };
  addLogo?: { position: string; description?: string };
}): string {
  const operations: string[] = [];

  // Order matters: background removal → background change → hair color → logo
  if (edits.removeBackground) {
    operations.push('1. Remove the background completely, leaving only the subject on a transparent background.');
  }

  if (edits.changeBackground) {
    operations.push(`2. ${edits.removeBackground ? 'Then, place' : 'Change'} the ${edits.removeBackground ? 'subject on a' : 'background to a'} ${edits.changeBackground} backdrop.`);
  }

  if (edits.changeHairColor) {
    operations.push(`3. Change the model's hair color to ${edits.changeHairColor.color}${edits.changeHairColor.hex ? ` (${edits.changeHairColor.hex})` : ''}.`);
  }

  if (edits.addLogo) {
    operations.push(`4. Add the logo at the ${edits.addLogo.position} position${edits.addLogo.description ? `, ${edits.addLogo.description}` : ''}.`);
  }

  if (operations.length === 0) {
    return '';
  }

  return `Perform the following edits to this image, in order:

${operations.join('\n')}

For each edit:
- Keep all other aspects of the image unchanged
- Ensure natural, professional results
- Maintain photorealistic quality
- Blend all changes seamlessly

The final result should look professionally edited with all modifications appearing natural and intentional.`;
}
