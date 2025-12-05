/**
 * Chat Decision Agent
 *
 * Uses Gemini 2.5 Flash Lite to analyze user messages and determine:
 * 1. If we have enough information to generate an image
 * 2. What questions to ask the user if not ready
 * 3. How to construct the final prompt for image generation
 *
 * IMPORTANT: All prompts sent to image generation are in ENGLISH.
 * User messages are translated before analysis.
 * Responses to user are always in PORTUGUESE.
 *
 * Flow:
 * 1. User sends message in Portuguese
 * 2. Message is translated to English for analysis
 * 3. Agent analyzes conversation history + attachments
 * 4. Returns either: questions (in Portuguese) OR ready-to-generate prompt (in English)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { translateToEnglish } from './translation-agent';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatAttachment {
  type: 'garment' | 'background' | 'model';
  url: string;
  referenceId?: string;
  metadata?: {
    name?: string;
    gender?: string;
    ageRange?: string;
    heightCm?: number;
    weightKg?: number;
    hairColor?: string;
    facialExpression?: string;
    [key: string]: any;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
}

export interface DecisionAgentInput {
  messages: ChatMessage[]; // Conversation history
  currentMessage: string; // Latest user message
  attachments: ChatAttachment[]; // Attachments in current message
}

export interface DecisionAgentResponse {
  ready: boolean; // True if ready to generate image

  // If NOT ready:
  questions?: string[]; // Questions to ask user (in Portuguese)
  missingInfo?: string[]; // List of missing information
  awaitingOptionalDescription?: boolean; // True if waiting for optional description step

  // If ready:
  prompt?: string; // Optimized prompt for image generation (in English)
  modelSpecs?: {
    gender?: 'MALE' | 'FEMALE' | 'NON_BINARY';
    heightCm?: number;
    weightKg?: number;
    hairColor?: string;
    facialExpression?: string;
    ageRange?: string;
  };
  garmentIds?: string[]; // IDs of garments to use
  backgroundId?: string; // ID of background to use

  error?: string;
}

/**
 * System instruction for Decision Agent
 * This agent analyzes in English but responds to users in Portuguese
 */
const SYSTEM_INSTRUCTION = `You are a specialized AI assistant for a fashion virtual try-on application.

YOUR ROLE:
Analyze user requests and determine the next step in the generation flow. Be PROACTIVE - generate immediately when you have a garment.

GENERATION FLOW:
1. **Step 1 - Garment**: User must provide at least 1 garment image
2. **Step 2 - Generate**: Create the image immediately (detect or default gender)

REQUIRED INFORMATION:
1. **Garment** (REQUIRED): At least 1 garment image attached

OPTIONAL INFORMATION (with smart defaults):
2. **Gender**: Detect from user message or DEFAULT TO FEMALE if not specified
3. **Description**: User can optionally add details like pose, style, context
4. **Background image**: If provided, composite the model onto it

GENDER DETECTION (check user message for these keywords):
- MALE keywords: "masculino", "homem", "male", "man", "modelo masculino", "cara", "garoto"
- FEMALE keywords: "feminino", "mulher", "female", "woman", "modelo feminina", "garota"
- NON_BINARY keywords: "não-binário", "nao-binario", "androgino", "andrógino"
- If NO gender keywords found → USE FEMALE AS DEFAULT

DECISION RULES:
1. If NO garment attached → ask user to upload a garment image
2. If garment IS attached → IMMEDIATELY READY TO GENERATE (use detected or default gender)
3. Do NOT ask for gender - detect from context or use FEMALE default
4. Do NOT ask for optional description - just include any text the user wrote
5. Background is always OPTIONAL - don't ask about it

DETECTING USER INTENT:
- If user says things like "gerar", "criar", "pronto", "ok", "sim", "pode gerar", "vamos" → they want to generate NOW
- If user provides a description text → include it and generate
- Empty message after having garment + model → generate with defaults

RESPONSE FORMAT (JSON only):

If NO garment attached:
{
  "ready": false,
  "questions": ["Para começar, envie uma foto da roupa que você quer ver em uma modelo. Pode ser uma foto do cabide, superfície plana, ou qualquer imagem da peça."],
  "missingInfo": ["garment"]
}

If garment IS attached (ALWAYS ready to generate):
{
  "ready": true,
  "prompt": "English prompt with garment description and any user context...",
  "modelSpecs": {
    "gender": "FEMALE" // or "MALE" or "NON_BINARY" if detected from user message
  }
}

PROMPT TEMPLATES:

**WITHOUT background image (studio shot):**
"Create a professional e-commerce fashion photograph. Take the garment from the reference image and dress a [gender] model wearing it exactly as shown, preserving all details, colors, textures, and patterns. Generate a realistic, full-body shot of the model [with additional details from user]. The model should be in a natural, confident catalog pose. Use a clean, professional white studio backdrop with soft three-point lighting that creates subtle shadows and highlights the garment's texture and fit.

CRITICAL REQUIREMENTS:
- The garment MUST match the reference image exactly in color, fabric, texture, pattern, and construction details
- Photorealistic quality with professional studio lighting (soft three-point setup)
- Sharp focus on garment details, stitching, and textures
- Natural fabric draping that follows the model's body naturally
- Proper fit based on the model's body proportions
- Full-body framing showing the complete outfit from head to toe
- Clean white/light gray studio background with professional shadows
- The model should look like a real fashion photography subject"

**WITH background image (composite shot):**
"Create a professional fashion photograph by compositing the model onto the provided background scene. Take the garment from the reference image and dress a [gender] model wearing it exactly as shown. Generate a realistic, full-body shot of the model [with additional details].

IMPORTANT FOR BACKGROUND COMPOSITE:
- Place the model naturally within the background scene
- Match the lighting direction and color temperature of the background
- Add appropriate shadows beneath the model that match the environment
- Ensure the model's scale and perspective match the background
- Blend the edges naturally so the composite looks seamless
- Adjust the model's lighting to match the ambient light in the scene

CRITICAL REQUIREMENTS:
- The garment MUST match the reference image exactly
- Photorealistic quality with lighting that matches the background environment
- Natural fabric draping and proper fit
- Seamless integration between model and background"

IMPORTANT:
- Questions to user must be in PORTUGUESE
- Image generation prompts must be in ENGLISH
- Return ONLY valid JSON, no explanations
- Always include the "awaitingOptionalDescription" field when asking for the optional step`;

/**
 * Analyze conversation and decide if ready to generate or what to ask
 */
export async function analyzeConversation(
  input: DecisionAgentInput
): Promise<DecisionAgentResponse> {
  try {
    // Translate current message to English for analysis
    const translatedMessage = await translateToEnglish(input.currentMessage);
    const englishMessage = translatedMessage.translatedText || input.currentMessage;

    // Build context from conversation history
    const conversationContext = input.messages
      .map((msg) => {
        const attachInfo = msg.attachments && msg.attachments.length > 0
          ? ` [Attachments: ${msg.attachments.map(a => a.type).join(', ')}]`
          : '';
        return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}${attachInfo}`;
      })
      .join('\n');

    const currentAttachInfo = input.attachments.length > 0
      ? `\n[Current message attachments: ${input.attachments.map(a => `${a.type}`).join(', ')}]`
      : '';

    const garmentCount = input.attachments.filter(a => a.type === 'garment').length;
    const hasBackground = input.attachments.some(a => a.type === 'background');
    const modelAttachment = input.attachments.find(a => a.type === 'model');

    // Build model info string if a model was selected
    let modelInfoString = '';
    if (modelAttachment?.metadata) {
      const m = modelAttachment.metadata;
      const modelDetails: string[] = [];
      if (m.gender) modelDetails.push(`Gender: ${m.gender}`);
      if (m.ageRange) modelDetails.push(`Age range: ${m.ageRange}`);
      if (m.heightCm) modelDetails.push(`Height: ${m.heightCm}cm`);
      if (m.weightKg) modelDetails.push(`Weight: ${m.weightKg}kg`);
      if (m.hairColor) modelDetails.push(`Hair color: ${m.hairColor}`);
      if (m.facialExpression) modelDetails.push(`Expression: ${m.facialExpression}`);
      if (modelDetails.length > 0) {
        modelInfoString = `\n- Model pre-selected with: ${modelDetails.join(', ')}`;
      }
    }

    const fullContext = `CONVERSATION HISTORY:
${conversationContext}

CURRENT USER MESSAGE (translated to English):
${englishMessage}${currentAttachInfo}

ATTACHMENT SUMMARY:
- Garment images attached: ${garmentCount}
- Background image attached: ${hasBackground ? 'Yes' : 'No'}
- Model pre-selected: ${modelAttachment ? 'Yes' : 'No'}${modelInfoString}

${modelAttachment ? 'IMPORTANT: User has already selected a model with the specifications above. Use these specifications in the prompt. Do NOT ask about gender or model characteristics - they are already defined.' : ''}

Analyze the conversation and decide if you have enough information to generate a virtual try-on image. Return JSON as instructed.`;

    // Use Gemini 2.5 Flash Lite for decision making
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(fullContext);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const decision: DecisionAgentResponse = JSON.parse(text);

    return decision;
  } catch (error) {
    console.error('Error in decision agent:', error);

    const hasGarment = input.attachments.some(a => a.type === 'garment');
    const hasModel = input.attachments.some(a => a.type === 'model');
    const modelMeta = input.attachments.find(a => a.type === 'model')?.metadata;

    // If we have both garment and model, we're ready to generate
    if (hasGarment && hasModel && modelMeta?.gender) {
      return {
        ready: true,
        prompt: buildOptimizedPrompt({
          gender: modelMeta.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'NON_BINARY',
          garmentCount: input.attachments.filter(a => a.type === 'garment').length,
          hasBackground: input.attachments.some(a => a.type === 'background'),
          modelHeight: modelMeta.heightCm,
          modelWeight: modelMeta.weightKg,
          hairColor: modelMeta.hairColor,
          facialExpression: modelMeta.facialExpression,
          ageRange: modelMeta.ageRange,
          userDescription: input.currentMessage,
        }),
        modelSpecs: {
          gender: modelMeta.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'NON_BINARY',
          heightCm: modelMeta.heightCm,
          weightKg: modelMeta.weightKg,
          hairColor: modelMeta.hairColor,
          facialExpression: modelMeta.facialExpression,
          ageRange: modelMeta.ageRange,
        },
      };
    }

    // Fallback: ask for gender if we have garments but no model
    if (hasGarment && !hasModel) {
      return {
        ready: false,
        questions: ['Qual o gênero da modelo que você deseja criar? (feminina, masculino ou não-binário)'],
        missingInfo: ['gender'],
      };
    }

    return {
      ready: false,
      questions: ['Por favor, envie uma foto da roupa que você quer ver em uma modelo, ou descreva o que deseja criar.'],
      missingInfo: ['garment', 'gender'],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build optimized English prompt for virtual try-on
 * Following Google's official best practices
 *
 * Two distinct modes:
 * 1. STUDIO SHOT (no background): Professional e-commerce style with white/gray backdrop
 * 2. COMPOSITE SHOT (with background): Model integrated into provided background scene
 */
export function buildOptimizedPrompt(params: {
  garmentDescription?: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  garmentCount?: number;
  hasBackground?: boolean;
  poseDescription?: string;
  backgroundDescription?: string;
  modelHeight?: number;
  modelWeight?: number;
  hairColor?: string;
  facialExpression?: string;
  ageRange?: string;
  userDescription?: string;
}): string {
  const {
    gender,
    garmentCount = 1,
    hasBackground = false,
    poseDescription,
    modelHeight,
    modelWeight,
    hairColor,
    facialExpression,
    ageRange,
    userDescription,
  } = params;

  // Gender mapping
  const genderMap: Record<string, string> = {
    'MALE': 'male',
    'FEMALE': 'female',
    'NON_BINARY': 'androgynous',
  };

  const genderText = genderMap[gender] || 'female';

  // Build physical characteristics string
  const physicalDetails: string[] = [];
  if (ageRange) physicalDetails.push(`in their ${ageRange}`);
  if (modelHeight) physicalDetails.push(`${modelHeight}cm tall`);
  if (modelWeight) physicalDetails.push(`${modelWeight}kg build`);
  if (hairColor) physicalDetails.push(`with ${hairColor} hair`);
  if (facialExpression) physicalDetails.push(`with a ${facialExpression} expression`);

  const physicalDetailsText = physicalDetails.length > 0
    ? ` ${physicalDetails.join(', ')}`
    : '';

  // Garment reference text
  const garmentRefText = garmentCount === 1
    ? 'Take the garment from the reference image and dress the model wearing it exactly as shown, preserving all details, colors, textures, and patterns.'
    : `Take all ${garmentCount} garments from the reference images and dress the model wearing them as a coordinated outfit, preserving all details, colors, textures, and patterns of each piece.`;

  // Pose text
  const poseText = poseDescription
    ? `in a ${poseDescription} pose`
    : 'in a natural, confident catalog pose suitable for e-commerce';

  // User description addendum
  const userDescriptionText = userDescription && userDescription.trim()
    ? `\n\nAdditional context from user: ${userDescription}`
    : '';

  // ============================================
  // COMPOSITE SHOT (with background image)
  // ============================================
  if (hasBackground) {
    return `Create a professional fashion photograph by compositing the model onto the provided background scene.

${garmentRefText}

Generate a realistic, full-body shot of a ${genderText} model${physicalDetailsText} wearing the garment naturally, ${poseText}.

BACKGROUND COMPOSITE REQUIREMENTS:
- Place the model naturally within the background scene with correct scale and perspective
- Match the lighting direction, intensity, and color temperature of the background
- Add realistic shadows beneath the model that match the environment's light source
- Blend the edges seamlessly so the composite looks like a real photograph
- Adjust the model's overall lighting and color grading to match the ambient scene
- Ensure the model doesn't look "pasted on" - integrate naturally

GARMENT REQUIREMENTS:
- The garment MUST match the reference image exactly in color, fabric, texture, pattern, and construction details
- Natural fabric draping that follows the model's body
- Proper fit based on the model's body proportions
- Sharp focus on garment details and textures

FINAL IMAGE:
- Photorealistic quality with seamless background integration
- Full-body framing showing the complete outfit
- The model should look like they were actually photographed in this location${userDescriptionText}`;
  }

  // ============================================
  // STUDIO SHOT (no background - clean studio)
  // ============================================
  return `Create a professional e-commerce fashion photograph in a clean studio setting.

${garmentRefText}

Generate a realistic, full-body shot of a ${genderText} model${physicalDetailsText} wearing the garment naturally, ${poseText}.

STUDIO SETUP:
- Clean, professional white or light gray studio backdrop
- Soft three-point lighting setup with key light, fill light, and rim light
- Subtle shadows that add depth without being harsh
- Even, flattering illumination that highlights the garment's texture and details

GARMENT REQUIREMENTS:
- The garment MUST match the reference image exactly in color, fabric, texture, pattern, and construction details
- Photorealistic quality with professional studio lighting
- Sharp focus on garment details, stitching, and textures
- Natural fabric draping that follows the model's body naturally
- Proper fit based on the model's body proportions

FINAL IMAGE:
- E-commerce catalog quality photography
- Full-body framing showing the complete outfit from head to toe
- The model should look like a real professional fashion photography subject
- Clean, sellable product image style${userDescriptionText}`;
}

/**
 * Build simplified prompt from user description (fallback)
 */
export function buildSimplePrompt(params: {
  userDescription: string;
  garmentCount: number;
  hasBackground: boolean;
}): string {
  let prompt = `Create a professional e-commerce fashion photograph. ${params.userDescription}.`;

  if (params.garmentCount > 0) {
    prompt += ` Take the garment${params.garmentCount > 1 ? 's' : ''} from the reference image${params.garmentCount > 1 ? 's' : ''} and dress the model wearing ${params.garmentCount > 1 ? 'them' : 'it'} exactly as shown.`;
  }

  if (params.hasBackground) {
    prompt += ` Use the provided background image, adjusting lighting to match.`;
  }

  prompt += ` Generate a photorealistic result with professional studio lighting, sharp focus on garment details and textures, and natural fabric draping.`;

  return prompt;
}
