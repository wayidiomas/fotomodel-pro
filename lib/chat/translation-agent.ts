/**
 * Translation Agent
 *
 * Translates user messages from Portuguese to English for AI processing.
 * All prompts sent to Gemini image generation must be in English for best results.
 *
 * Flow:
 * 1. User sends message in Portuguese
 * 2. Translation Agent converts to English (for AI)
 * 3. AI processes in English
 * 4. Response Agent converts response back to Portuguese (for user)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  originalLanguage?: 'pt' | 'en' | 'other';
  error?: string;
}

const TRANSLATION_SYSTEM_INSTRUCTION = `You are a specialized translator for a fashion AI application.

YOUR TASK:
Translate user messages from Portuguese to English, optimized for AI image generation.

TRANSLATION RULES:
1. Translate naturally, not literally - adapt fashion/clothing terminology correctly
2. Keep garment names accurate (vestido = dress, blusa = blouse, calça = pants, etc.)
3. Preserve any specific details about colors, patterns, styles
4. If the user mentions body types, translate appropriately:
   - "magra" = "slim/slender"
   - "curvilínea" = "curvy"
   - "atlética" = "athletic"
   - "plus size" = "plus size"
5. Convert measurements if mentioned (maintain cm/kg as-is, they're universal)
6. If already in English, return as-is
7. Remove filler words and make the message concise but complete

FASHION VOCABULARY:
- "modelo feminina" = "female model"
- "modelo masculino" = "male model"
- "vestindo" = "wearing"
- "fundo branco" = "white background"
- "fundo de estúdio" = "studio background"
- "pose natural" = "natural pose"
- "iluminação" = "lighting"
- "catálogo" = "catalog"
- "e-commerce" = "e-commerce"

OUTPUT:
Return ONLY the translated text. No explanations, no quotes, no formatting.
If the input is empty or just greetings, translate literally.`;

/**
 * Translate user message from Portuguese to English
 */
export async function translateToEnglish(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: true,
      translatedText: text,
      originalLanguage: 'pt',
    };
  }

  // Check if already primarily English
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  const seemsEnglish = englishPattern.test(text.trim()) &&
    !text.toLowerCase().includes('ção') &&
    !text.toLowerCase().includes('ão') &&
    !text.toLowerCase().includes('ê') &&
    !text.toLowerCase().includes('á');

  if (seemsEnglish) {
    return {
      success: true,
      translatedText: text,
      originalLanguage: 'en',
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: TRANSLATION_SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(`Translate to English:\n${text}`);
    const response = await result.response;
    const translatedText = response.text().trim();

    return {
      success: true,
      translatedText,
      originalLanguage: 'pt',
    };
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original text
    return {
      success: false,
      translatedText: text,
      originalLanguage: 'pt',
      error: error instanceof Error ? error.message : 'Translation failed',
    };
  }
}

/**
 * Translate AI response from English to Portuguese for user
 */
export async function translateToPortuguese(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: true,
      translatedText: text,
      originalLanguage: 'en',
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: `You are a translator. Translate the following English text to Brazilian Portuguese.
Keep it natural and friendly. This is a response from a fashion AI assistant.
Return ONLY the translated text, no explanations.`,
    });

    const result = await model.generateContent(`Translate to Portuguese:\n${text}`);
    const response = await result.response;
    const translatedText = response.text().trim();

    return {
      success: true,
      translatedText,
      originalLanguage: 'en',
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      translatedText: text,
      originalLanguage: 'en',
      error: error instanceof Error ? error.message : 'Translation failed',
    };
  }
}

/**
 * Build optimized English prompt for virtual try-on from user intent
 * This is the core prompt builder following Google's best practices
 */
export function buildVirtualTryOnPrompt(params: {
  garmentDescription: string;
  modelGender: 'male' | 'female' | 'non-binary';
  modelDescription?: string;
  poseDescription?: string;
  backgroundDescription?: string;
  additionalDetails?: string;
  garmentCount?: number;
}): string {
  const {
    garmentDescription,
    modelGender,
    modelDescription,
    poseDescription,
    backgroundDescription,
    additionalDetails,
    garmentCount = 1,
  } = params;

  // Base prompt following Google's recommended structure
  let prompt = `Create a professional e-commerce fashion photograph.`;

  // Garment reference instruction
  if (garmentCount === 1) {
    prompt += ` Take the garment from the reference image and dress the model wearing it naturally.`;
  } else {
    prompt += ` Take all ${garmentCount} garments from the reference images and dress the model wearing them as a complete outfit.`;
  }

  // Garment details
  prompt += ` The garment is: ${garmentDescription}.`;

  // Model specification
  const genderMap = {
    'male': 'male',
    'female': 'female',
    'non-binary': 'androgynous',
  };

  prompt += ` Generate a realistic, full-body shot of a ${genderMap[modelGender]} model`;

  if (modelDescription) {
    prompt += ` with ${modelDescription}`;
  }

  prompt += ` wearing the garment.`;

  // Pose
  if (poseDescription) {
    prompt += ` The model should be in a ${poseDescription} pose.`;
  } else {
    prompt += ` The model should be in a natural, confident catalog pose.`;
  }

  // Background
  if (backgroundDescription) {
    prompt += ` Set the scene in ${backgroundDescription}.`;
  } else {
    prompt += ` Use a clean, professional white studio backdrop.`;
  }

  // Technical requirements
  prompt += `

Technical requirements:
- Photorealistic quality with professional studio lighting
- Sharp focus on garment details, textures, and fit
- Natural fabric draping that follows the model's body
- Accurate colors and patterns matching the reference garment
- Full-body framing showing the complete outfit
- The garment must be the exact same as in the reference image`;

  // Additional details
  if (additionalDetails) {
    prompt += `\n\nAdditional requirements: ${additionalDetails}`;
  }

  return prompt;
}

/**
 * Build prompt for specific quick actions
 */
export function buildQuickActionPrompt(
  actionType: string,
  garmentDescription?: string
): string {
  const prompts: Record<string, string> = {
    'add-model-female': `Create a professional e-commerce fashion photograph. Take the garment from the reference image and dress a female model wearing it. Generate a realistic, full-body shot with the model in a natural, confident catalog pose. Use professional studio lighting on a clean white background. The garment must match the reference exactly in color, texture, and details.`,

    'add-model-male': `Create a professional e-commerce fashion photograph. Take the garment from the reference image and dress a male model wearing it. Generate a realistic, full-body shot with the model in a natural, confident catalog pose. Use professional studio lighting on a clean white background. The garment must match the reference exactly in color, texture, and details.`,

    'background-studio': `Keep the model and garment exactly as they are. Change only the background to a professional photography studio with clean white or light gray backdrop. Maintain soft, even studio lighting with subtle shadows. Do not alter the model, pose, or garment in any way.`,

    'background-lifestyle-office': `Keep the model and garment exactly as they are. Change only the background to a modern, elegant corporate office environment. Include subtle elements like glass walls, minimalist furniture, or city views through windows. Adjust lighting to match the new environment naturally. Do not alter the model, pose, or garment in any way.`,

    'background-lifestyle-cafe': `Keep the model and garment exactly as they are. Change only the background to a cozy, modern coffee shop interior. Include warm ambient lighting, wooden textures, and café atmosphere. Do not alter the model, pose, or garment in any way.`,

    'background-outdoor': `Keep the model and garment exactly as they are. Change only the background to an outdoor natural environment with good natural lighting. Could be a park, urban street, or garden setting. Adjust lighting and shadows to match the outdoor scene naturally. Do not alter the model, pose, or garment in any way.`,

    'remove-background': `Remove the background completely from this image. Keep only the model and garment with a clean, pure white background. Maintain crisp edges around the subject. Preserve all garment details and the model's appearance exactly as they are.`,

    'enhance-quality': `Enhance the quality of this fashion photograph. Increase sharpness and clarity, especially on the garment details and textures. Improve color vibrancy while keeping it natural. Enhance lighting to be more professional and flattering. Do not change the model, pose, garment, or background - only improve the overall image quality.`,

    'color-variants': `Generate 4 color variations of this garment on the model. Create versions in: black, white, navy blue, and burgundy red. Keep the model, pose, and background exactly the same. Only change the garment color while maintaining the same fabric texture and style.`,
  };

  return prompts[actionType] || prompts['add-model-female'];
}
