/**
 * API Route: Chat Messages
 *
 * GET  - List messages in conversation
 * POST - Send message and process with AI (conversational or generation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeConversation, type ChatMessage, type ChatAttachment, buildSimplePrompt } from '@/lib/chat/decision-agent';
import { generateChatTitle } from '@/lib/chat/title-generator';
import { generateWithImagen } from '@/lib/ai/imagen';
import { calculateChatCredits, resolveCreditPricing } from '@/lib/credits/credit-calculator';
import { fetchCreditPricingOverrides, CREDIT_ACTIONS } from '@/lib/credits/credit-pricing';
import { base64ToBuffer } from '@/lib/images/watermark';
import { optimizePrompt, buildPromptOptimizerInput, buildImageEditOptimizerInput, buildGarmentSwapOptimizerInput } from '@/lib/ai/prompt-optimizer';

/**
 * Fetch image from URL and convert to base64
 * Handles both data URLs and remote URLs (including Supabase storage)
 */
async function fetchImageAsBase64(url: string): Promise<{ base64Data: string; mimeType: string } | null> {
  try {
    // If already a data URL, extract base64
    if (url.startsWith('data:')) {
      const commaIndex = url.indexOf(',');
      const semiIndex = url.indexOf(';');
      if (commaIndex !== -1) {
        const base64Data = url.slice(commaIndex + 1);
        const mimeType = semiIndex !== -1 ? url.slice(5, semiIndex) : 'image/png';
        return { base64Data, mimeType };
      }
      return null;
    }

    // Fetch remote URL
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';

    return { base64Data, mimeType };
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

const SIMPLE_GREETINGS = [
  'oi',
  'olá',
  'ola',
  'hey',
  'hello',
  'hi',
  'bom dia',
  'boa tarde',
  'boa noite',
  'tudo bem',
  'como vai',
  'como você está',
  'como vc está',
  'e aí',
];

const OFF_TOPIC_KEYWORDS = [
  'carro',
  'investimento',
  'politica',
  'política',
  'futebol',
  'clima',
  'tempo',
  'receita',
  'cozinha',
  'jogo',
  'bitcoin',
  'cripto',
  'namoro',
  'filme',
  'série',
];

function detectGuardrailResponse(content: string) {
  const text = content.trim().toLowerCase();
  if (!text) {
    return null;
  }

  // Greeting detection (short messages or greeting keywords)
  const isGreeting =
    text.length <= 40 &&
    SIMPLE_GREETINGS.some((greeting) => text.startsWith(greeting) || text.includes(greeting));

  if (isGreeting) {
    return {
      message:
        'Oi! Tudo ótimo por aqui. Estou aqui para te ajudar a criar modelos virtuais e looks de moda. Me conte qual peça ou estilo você quer trabalhar e seguimos juntos.',
      reason: 'greeting',
    };
  }

  // Off-topic detection
  const isOffTopic = OFF_TOPIC_KEYWORDS.some((keyword) => text.includes(keyword));
  if (isOffTopic) {
    return {
      message:
        'Sou um assistente focado em gerar modelos virtuais e looks de moda. Me conte sobre roupas, poses ou fundos que você quer usar e eu te ajudo.',
      reason: 'off_topic',
    };
  }

  return null;
}

const GENDER_KEYWORDS: Record<'MALE' | 'FEMALE' | 'NON_BINARY', string[]> = {
  MALE: ['masculino', 'homem', 'modelo masculino', 'homens', 'garoto', 'boy', 'male'],
  FEMALE: ['feminino', 'mulher', 'modelo feminina', 'mulheres', 'garota', 'girl', 'female'],
  NON_BINARY: ['não-binário', 'nao binario', 'nao-binario', 'não binario', 'andrógino', 'androgino', 'androgynous', 'não binário'],
};

function detectGenderFromText(text: string | undefined | null): 'MALE' | 'FEMALE' | 'NON_BINARY' | null {
  if (!text) return null;
  const normalized = text.toLowerCase();
  for (const [gender, keywords] of Object.entries(GENDER_KEYWORDS) as Array<
    [keyof typeof GENDER_KEYWORDS, string[]]
  >) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return gender;
    }
  }
  return null;
}

function detectGenderFromConversation(history: ChatMessage[], currentMessage: string) {
  const currentGender = detectGenderFromText(currentMessage);
  if (currentGender) {
    return currentGender;
  }
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === 'user') {
      const gender = detectGenderFromText(msg.content);
      if (gender) {
        return gender;
      }
    }
  }
  return null;
}

/**
 * Build simplified Prompt Optimizer input for Chat
 * Uses default values where Chat doesn't have structured data
 */
function buildChatPromptInput(params: {
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  garmentCount: number;
  garmentRules?: string;
  userRequest: string;
  hasBackground: boolean;
  backgroundDescription?: string;
  isImprovement: boolean;
  // Model characteristics from decision agent
  modelSpecs?: {
    ageRange?: string;
    heightCm?: number;
    weightKg?: number;
    hairColor?: string;
    facialExpression?: string;
  };
}) {
  // Default model physical characteristics (fallback when not provided)
  const defaultHeight = params.gender === 'MALE' ? 180 : 170;
  const defaultWeight = params.gender === 'MALE' ? 75 : 60;

  // Map NON_BINARY to UNISEX for optimizer
  const gender = params.gender === 'NON_BINARY' ? 'UNISEX' : params.gender;

  return buildPromptOptimizerInput({
    garmentType: params.garmentCount > 1 ? 'outfit' : 'single',
    garmentCategory: 'fashion item', // Generic since Chat doesn't capture category
    garmentDescription: params.garmentRules,
    gender,
    poseCategory: 'fashion pose',
    poseReferenceDescription: params.isImprovement
      ? 'Preserve exact pose, body proportions, and camera angle from reference image'
      : 'Professional fashion photography pose',
    ageRange: params.modelSpecs?.ageRange,
    bodySize: undefined, // Not captured in Chat (would need mapping from height/weight)
    modelHeight: params.modelSpecs?.heightCm ?? defaultHeight,
    modelWeight: params.modelSpecs?.weightKg ?? defaultWeight,
    facialExpression: params.modelSpecs?.facialExpression,
    hairColor: params.modelSpecs?.hairColor,
    aspectRatio: '3:4',
    outputWidth: 1024,
    outputHeight: 1366,
    background: params.hasBackground ? {
      enabled: true,
      type: 'custom',
      description: params.backgroundDescription || 'Custom background',
      hasReferenceImage: false, // Background applied in STEP 2
    } : undefined,
    garmentPlacementHint: params.isImprovement
      ? 'Preserve all garments exactly as shown in reference image'
      : undefined,
  });
}

function extractAttachmentData(att: any) {
  const meta = att.metadata || {};
  const url = att.url || meta.url;
  let base64Data = att.base64Data || meta.base64Data;
  let mimeType = att.mimeType || meta.mimeType;

  if ((!base64Data || !mimeType) && typeof url === 'string' && url.startsWith('data:')) {
    const commaIndex = url.indexOf(',');
    const semiIndex = url.indexOf(';');
    if (!base64Data && commaIndex !== -1) {
      base64Data = url.slice(commaIndex + 1);
    }
    if (!mimeType && semiIndex !== -1) {
      mimeType = url.slice(url.indexOf(':') + 1, semiIndex);
    }
  }

  return {
    base64Data,
    mimeType: mimeType || 'image/png',
  };
}

type AttachmentPayload = {
  type: 'garment' | 'background' | 'improve_reference' | 'model';
  url?: string;
  base64Data?: string;
  mimeType?: string;
  referenceId?: string;
  attachedAt?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
};

function getLatestUniqueAttachments(
  attachments: AttachmentPayload[],
  type: AttachmentPayload['type'],
  limit: number
) {
  const filtered = attachments.filter((att) => att.type === type);
  const seen = new Set<string>();
  const selected: AttachmentPayload[] = [];

  for (let i = filtered.length - 1; i >= 0; i--) {
    const att = filtered[i];
    const key =
      att.referenceId ||
      att.url ||
      att.base64Data ||
      (att.metadata?.url as string | undefined) ||
      `${att.attachedAt || i}`;

    if (key && seen.has(key)) {
      continue;
    }
    if (key) {
      seen.add(key);
    }

    selected.unshift(att);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
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
  backgroundType?: 'original' | 'preset' | 'custom' | 'neutral';
}): string {
  const { garmentType, aspectRatio, backgroundType } = params;

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
  prompt += `Aspect ratio: ${aspectRatio}. Natural lighting, professional quality.`;

  return prompt;
}

/**
 * GET /api/chat/conversations/[id]/messages
 * List all messages in conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await (supabase
      .from('chat_conversations') as any)
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Fetch messages with generation results
    const { data: messages, error } = await (supabase
      .from('chat_messages') as any)
      .select(`
        id,
        role,
        content,
        credits_charged,
        generation_id,
        metadata,
        created_at,
        generations (
          id,
          status,
          generation_results (
            id,
            image_url,
            thumbnail_url
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Send message and process with Decision Agent
 *
 * Body: {
 *   content: string;
 *   attachments?: Array<{ type: 'garment' | 'background'; referenceId: string; url: string }>;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;
    const body = await request.json();
    const { content = '', attachments = [] } = body;

    // Allow empty content if there are attachments (garment/model/background)
    const hasAttachments = attachments && attachments.length > 0;
    if (!content?.trim() && !hasAttachments) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // If no text but has attachments, use a default message to trigger generation
    const effectiveContent = content?.trim() || 'Gerar imagem com os elementos selecionados';

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await (supabase
      .from('chat_conversations') as any)
      .select('id, metadata')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Save user message
    const { data: userMessage, error: userMsgError } = await (supabase
      .from('chat_messages') as any)
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: effectiveContent,
        credits_charged: 0,
        metadata: { attachments },
      })
      .select('id, created_at')
      .single();

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { error: 'Erro ao salvar mensagem' },
        { status: 500 }
      );
    }

    // Auto-generate conversation title if this is the first message
    if (conversation.title === 'Nova Conversa') {
      const generatedTitle = await generateChatTitle(effectiveContent);
      await (supabase
        .from('chat_conversations') as any)
        .update({ title: generatedTitle })
        .eq('id', conversationId);
    }

    // Guardrails for chit-chat/off-topic (only if user typed something)
    const guardrail = content?.trim() ? detectGuardrailResponse(content) : null;
    if (guardrail) {
      await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: guardrail.message,
          credits_charged: 0,
          metadata: {
            type: 'guardrail',
            reason: guardrail.reason,
          },
        });

      return NextResponse.json({
        success: true,
        guardrail: guardrail.reason,
        creditsRemaining: undefined,
      });
    }

    // Fetch conversation history
    const { data: historyMessages } = await (supabase
      .from('chat_messages') as any)
      .select('role, content, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Last 20 messages for context

    const { data: attachmentHistory } = await (supabase
      .from('chat_messages') as any)
      .select('metadata, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Fetch the most recent generated image in this conversation (for continuous improvements)
    const { data: latestGeneratedImage } = await (supabase
      .from('chat_messages') as any)
      .select(`
        id,
        generation_id,
        created_at,
        generations!inner (
          id,
          status,
          generation_results (
            id,
            image_url
          )
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .not('generation_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build conversation history for Decision Agent
    const chatHistory: ChatMessage[] = (historyMessages || [])
      .filter((msg: any) => msg.id !== userMessage.id) // Exclude current message
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.metadata?.attachments || [],
      }));

    const historyAttachments: AttachmentPayload[] = (attachmentHistory || []).flatMap((msg: any) =>
      (msg.metadata?.attachments || []).map((att: any) => ({
        ...att,
        attachedAt: msg.created_at,
      }))
    );

    const combinedAttachments: AttachmentPayload[] = [...historyAttachments];
    if (attachments?.length) {
      const nowIso = new Date().toISOString();
      combinedAttachments.push(
        ...attachments.map((att: any) => ({
          ...att,
          attachedAt: nowIso,
        }))
      );
    }

    const garmentSources = getLatestUniqueAttachments(combinedAttachments, 'garment', 3);
    const backgroundSources = getLatestUniqueAttachments(combinedAttachments, 'background', 1);
    const improveReferenceSources = getLatestUniqueAttachments(combinedAttachments, 'improve_reference', 1);
    const modelSources = getLatestUniqueAttachments(combinedAttachments, 'model', 1);
    const latestBackgroundAttachment = backgroundSources[0];
    let latestImproveReference = improveReferenceSources[0];
    const latestModelAttachment = modelSources[0];
    const totalGarments = garmentSources.length;
    const hasGarment = totalGarments > 0;
    const hasBackground = Boolean(latestBackgroundAttachment);
    const hasModel = Boolean(latestModelAttachment);

    // Debug logging for attachment processing
    console.log(`[Chat] Attachments in request body: ${JSON.stringify(attachments?.map((a: any) => ({ type: a.type, hasUrl: !!a.url, hasBase64: !!a.base64Data })) || [])}`);
    console.log(`[Chat] Combined attachments count: ${combinedAttachments.length}`);
    console.log(`[Chat] Garment sources: ${garmentSources.length}, Background: ${hasBackground}, Model: ${hasModel}, Improve reference found: ${!!latestImproveReference}`);
    if (latestModelAttachment) {
      console.log(`[Chat] Model attachment details: url=${latestModelAttachment.url?.substring(0, 80)}..., hasBase64=${!!latestModelAttachment.base64Data}`);
    }
    if (latestImproveReference) {
      console.log(`[Chat] Improve reference details: url=${latestImproveReference.url?.substring(0, 80)}..., hasBase64=${!!latestImproveReference.base64Data}`);
    }

    // Check if we have a more recent generated image than the improve_reference
    // This handles continuous improvements where user doesn't click "Melhorar com IA" button
    const latestGeneratedImageUrl = latestGeneratedImage?.generations?.generation_results?.[0]?.image_url;
    const latestGeneratedImageId = latestGeneratedImage?.generation_id;

    // Check if current message has new garments (indicates new generation, not improvement)
    const currentMessageHasNewGarment = attachments?.some((att: any) => att.type === 'garment');

    // If there's a generated image and either:
    // 1. No improve_reference exists, OR
    // 2. The improve_reference is older than the latest generation
    // Then use the latest generated image as reference for continuous improvements
    // BUT only if user is NOT adding new garments (which would be a new generation)
    if (latestGeneratedImageUrl && latestGeneratedImageId && !currentMessageHasNewGarment) {
      const improveRefTimestamp = latestImproveReference?.attachedAt
        ? new Date(latestImproveReference.attachedAt).getTime()
        : 0;
      const generatedImageTimestamp = latestGeneratedImage?.created_at
        ? new Date(latestGeneratedImage.created_at).getTime()
        : 0;

      // Check if current message attachments include a fresh improve_reference
      const currentMessageHasImproveRef = attachments?.some((att: any) => att.type === 'improve_reference');

      // If no fresh improve_reference in current message and latest generation is newer, use it
      if (!currentMessageHasImproveRef && generatedImageTimestamp > improveRefTimestamp) {
        console.log(`[Chat] Using latest generated image as reference for continuous improvement (generated: ${latestGeneratedImage.created_at}, improve_ref: ${latestImproveReference?.attachedAt || 'none'})`);
        latestImproveReference = {
          type: 'improve_reference',
          url: latestGeneratedImageUrl,
          referenceId: latestGeneratedImageId,
          attachedAt: latestGeneratedImage.created_at,
          metadata: {
            generationId: latestGeneratedImageId,
            imageUrl: latestGeneratedImageUrl,
            autoSelected: true, // Mark as auto-selected for debugging
          },
        };
      }
    }

    const hasImproveReference = Boolean(latestImproveReference);

    // Detect if current message has new background (for edit mode detection)
    const currentMessageHasNewBackground = attachments?.some((att: any) => att.type === 'background');

    // Determine edit mode type for hybrid edit support
    type EditModeType = 'TEXT_EDIT' | 'GARMENT_SWAP' | 'BACKGROUND_CHANGE' | 'FULL_EDIT';

    function determineEditMode(params: {
      hasImproveReference: boolean;
      hasNewGarments: boolean;
      hasNewBackground: boolean;
    }): EditModeType | null {
      if (!params.hasImproveReference) return null;

      if (params.hasNewGarments && params.hasNewBackground) return 'FULL_EDIT';
      if (params.hasNewGarments) return 'GARMENT_SWAP';
      if (params.hasNewBackground) return 'BACKGROUND_CHANGE';
      return 'TEXT_EDIT';
    }

    const editMode = determineEditMode({
      hasImproveReference,
      hasNewGarments: currentMessageHasNewGarment,
      hasNewBackground: currentMessageHasNewBackground,
    });

    console.log(`[Chat] Edit mode detection: ${editMode || 'NONE'} (improve_ref: ${hasImproveReference}, new_garments: ${currentMessageHasNewGarment}, new_background: ${currentMessageHasNewBackground})`);

    const detectedGender = detectGenderFromConversation(chatHistory, effectiveContent);

    // Analyze with Decision Agent
    let decision = await analyzeConversation({
      messages: chatHistory,
      currentMessage: effectiveContent,
      attachments: attachments.map((att: any) => ({
        type: att.type,
        url: att.url,
        metadata: att,
      })),
    });

    // If decision agent says not ready but we have garment, model, or improve reference, force generation
    // Use detected gender or default to FEMALE
    if (!decision.ready && (hasGarment || hasImproveReference || hasModel)) {
      const fallbackPrompt = buildSimplePrompt({
        userDescription: effectiveContent,
        garmentCount: Math.max(1, totalGarments || 1),
        hasBackground,
      });

      // Use detected gender, or modelSpecs gender, or default to FEMALE
      const gender = detectedGender || decision.modelSpecs?.gender || 'FEMALE';

      decision = {
        ready: true,
        prompt: decision.prompt || fallbackPrompt,
        modelSpecs: {
          ...(decision.modelSpecs || {}),
          gender: gender as 'MALE' | 'FEMALE' | 'NON_BINARY',
        },
        garmentIds: decision.garmentIds,
        backgroundId: decision.backgroundId,
      };

      console.log(`[Chat] Forcing generation with gender: ${gender} (detected: ${detectedGender || 'none'}), improve: ${hasImproveReference}, model: ${hasModel}`);
    }

    // If NOT ready to generate, respond with questions (free)
    if (!decision.ready) {
      const assistantResponse = decision.questions?.join('\n\n') ||
        'Por favor, me forneça mais informações sobre o que você deseja criar.';

      const { data: assistantMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantResponse,
          credits_charged: 0,
          metadata: { missingInfo: decision.missingInfo },
        })
        .select('id, content, created_at')
        .single();

      return NextResponse.json({
        success: true,
        message: assistantMessage,
        ready: false,
        creditsCharged: 0,
      });
    }

    // READY TO GENERATE - Check if it's a refinement or improvement
    const hasExistingGeneration = chatHistory.some((msg) => msg.role === 'assistant' && msg.content.includes('imagem gerada'));
    const isImprovement = hasImproveReference;

    const creditsRequired = calculateChatCredits({
      isGeneration: true,
      isRefinement: hasExistingGeneration || isImprovement,
    });

    // Check user credits
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Erro ao verificar créditos' },
        { status: 500 }
      );
    }

    if (userData.credits < creditsRequired) {
      // Not enough credits - send message explaining
      const { data: assistantMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: `Você não tem créditos suficientes para gerar esta imagem. São necessários ${creditsRequired} créditos. Você tem apenas ${userData.credits} créditos disponíveis. Por favor, recarregue sua conta.`,
          credits_charged: 0,
          metadata: { error: 'insufficient_credits' },
        })
        .select('id, content, created_at')
        .single();

      return NextResponse.json({
        success: false,
        error: 'Créditos insuficientes',
        message: assistantMessage,
        creditsRequired,
        creditsAvailable: userData.credits,
      }, { status: 402 });
    }

    // Generate image with Imagen
    // Process garment images - fetch from URL if base64 not available
    const referenceImages: Array<{ data: string; mimeType: string }> = [];
    const referenceDescriptions: string[] = [];
    let referenceIndex = 1;

    // Process model attachment FIRST (if no improve_reference exists)
    // Model defines the pose/identity for virtual try-on
    if (!latestImproveReference && latestModelAttachment) {
      console.log(`[Chat] Processing model attachment as POSE REFERENCE`);
      let modelImageData = extractAttachmentData(latestModelAttachment);

      // If no base64Data, try to fetch from URL
      if (!modelImageData.base64Data) {
        const url = latestModelAttachment.url || (latestModelAttachment.metadata as any)?.imageUrl;
        if (url) {
          console.log(`[Chat] Fetching model image from URL: ${url.substring(0, 100)}...`);
          const fetched = await fetchImageAsBase64(url);
          if (fetched) {
            modelImageData = fetched;
            console.log(`[Chat] Successfully fetched model image (${modelImageData.mimeType})`);
          } else {
            console.error(`[Chat] FAILED to fetch model image from URL: ${url.substring(0, 100)}`);
          }
        } else {
          console.error(`[Chat] No URL found for model attachment`);
        }
      } else {
        console.log(`[Chat] Model attachment already has base64Data`);
      }

      if (modelImageData.base64Data) {
        referenceImages.push({
          data: modelImageData.base64Data,
          mimeType: modelImageData.mimeType,
        });

        const poseRefDescription = `Reference image ${referenceIndex} (POSE & IDENTITY REFERENCE): CRITICAL - This is the MODEL's pose and identity reference. You MUST preserve the exact pose, body proportions, camera angle, facial features, and lighting style from this image. The model's IDENTITY and POSE must be preserved exactly. Dress this model with garments from the following reference images.`;

        referenceDescriptions.push(poseRefDescription);
        referenceIndex += 1;
        console.log(`[Chat] Added model as reference image ${referenceIndex - 1} (POSE REFERENCE)`);
      } else {
        // CRITICAL: Failed to load model image
        console.error(`[Chat] CRITICAL: Failed to load model image - no base64Data available`);

        const { data: errorMessage } = await (supabase
          .from('chat_messages') as any)
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: 'Não foi possível carregar a imagem da modelo selecionada. Por favor, tente novamente ou selecione outra modelo.',
            credits_charged: 0,
            metadata: { error: 'model_load_failed' },
          })
          .select('id, content, created_at')
          .single();

        return NextResponse.json({
          success: false,
          error: 'Falha ao carregar imagem da modelo',
          message: errorMessage,
          retryable: true,
        });
      }
    }

    // Process improve reference FIRST (highest priority)
    // This is CRITICAL for GARMENT_SWAP mode - the pose reference must be loaded
    if (latestImproveReference) {
      console.log(`[Chat] Processing improve_reference for ${editMode || 'standard'} mode`);
      let improveImageData = extractAttachmentData(latestImproveReference);

      // If no base64Data, try to fetch from URL
      if (!improveImageData.base64Data) {
        const url = latestImproveReference.url || (latestImproveReference.metadata as any)?.imageUrl;
        if (url) {
          console.log(`[Chat] Fetching improve reference image from URL: ${url.substring(0, 100)}...`);
          const fetched = await fetchImageAsBase64(url);
          if (fetched) {
            improveImageData = fetched;
            console.log(`[Chat] Successfully fetched improve_reference image (${improveImageData.mimeType})`);
          } else {
            console.error(`[Chat] FAILED to fetch improve_reference image from URL: ${url.substring(0, 100)}`);
          }
        } else {
          console.error(`[Chat] No URL found for improve_reference attachment`);
        }
      } else {
        console.log(`[Chat] improve_reference already has base64Data`);
      }

      if (improveImageData.base64Data) {
        referenceImages.push({
          data: improveImageData.base64Data,
          mimeType: improveImageData.mimeType,
        });

        // Use edit mode specific descriptions
        let poseRefDescription: string;
        if (editMode === 'GARMENT_SWAP' || editMode === 'FULL_EDIT') {
          // GARMENT_SWAP: This is the POSE reference - preserve pose, swap garments
          poseRefDescription = `Reference image ${referenceIndex} (POSE REFERENCE): CRITICAL - This is the POSE and IDENTITY reference. You MUST preserve the exact pose, body proportions, camera angle, facial features, and lighting style. The model's IDENTITY and POSE must be preserved exactly. ONLY the clothing will change - dress the model with garments from the following reference images.`;
        } else {
          // TEXT_EDIT or BACKGROUND_CHANGE: Standard improvement mode
          poseRefDescription = `Reference image ${referenceIndex}: CRITICAL - This is the base image to improve. You MUST preserve the exact model identity, face, pose, body proportions, lighting style, and overall composition. Only apply the specific improvements requested by the user while keeping everything else identical. This is a refinement, not a new generation.`;
        }

        referenceDescriptions.push(poseRefDescription);
        referenceIndex += 1;
        console.log(`[Chat] Added improve_reference as reference image ${referenceIndex - 1}`);
      } else {
        // CRITICAL: In GARMENT_SWAP mode, we MUST have the pose reference
        console.error(`[Chat] CRITICAL: Failed to load improve_reference image - no base64Data available`);

        if (editMode === 'GARMENT_SWAP' || editMode === 'FULL_EDIT') {
          // Return error instead of proceeding with random model
          const { data: errorMessage } = await (supabase
            .from('chat_messages') as any)
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: 'Não foi possível carregar a imagem de referência para edição. Por favor, tente novamente ou selecione uma nova imagem para editar.',
              credits_charged: 0,
              metadata: { error: 'improve_reference_load_failed', editMode },
            })
            .select('id, content, created_at')
            .single();

          return NextResponse.json({
            success: false,
            error: 'Falha ao carregar imagem de referência',
            message: errorMessage,
            retryable: true,
          });
        }
      }
    } else if (editMode === 'GARMENT_SWAP' || editMode === 'FULL_EDIT') {
      // GARMENT_SWAP mode requires improve_reference
      console.error(`[Chat] CRITICAL: ${editMode} mode but no improve_reference found!`);
    }

    // Process garments (limit to 3)
    const garmentsToProcess = garmentSources.slice(-3);
    for (let idx = 0; idx < garmentsToProcess.length; idx++) {
      const att = garmentsToProcess[idx];
      let imageData = extractAttachmentData(att);

      // If no base64Data, try to fetch from URL
      if (!imageData.base64Data) {
        const url = att.url || (att.metadata as any)?.url;
        if (url) {
          console.log(`[Chat] Fetching garment image from URL: ${url.substring(0, 100)}...`);
          const fetched = await fetchImageAsBase64(url);
          if (fetched) {
            imageData = fetched;
          }
        }
      }

      if (imageData.base64Data) {
        referenceImages.push({
          data: imageData.base64Data,
          mimeType: imageData.mimeType,
        });

        // Use edit mode specific garment descriptions
        let garmentDescription: string;
        const isOutfit = garmentsToProcess.length > 1;
        const garmentNum = idx + 1;

        if (editMode === 'GARMENT_SWAP' || editMode === 'FULL_EDIT') {
          // GARMENT_SWAP mode: Emphasize that this is the NEW garment to dress the model
          if (isOutfit) {
            garmentDescription = `Reference image ${referenceIndex} (GARMENT ${garmentNum}/${garmentsToProcess.length}): Part of COMPLETE OUTFIT. This is a NEW garment to dress the model in. Copy this garment's exact fabric, color, pattern, and silhouette onto the model while preserving their pose from image 1. Model MUST wear ALL ${garmentsToProcess.length} outfit pieces together.`;
          } else {
            garmentDescription = `Reference image ${referenceIndex} (NEW GARMENT): This is the NEW garment to dress the model in. Copy exact fabric texture, color, pattern, buttons, zippers, and silhouette onto the model while preserving their pose and identity from image 1.`;
          }
        } else {
          // Standard mode: Just match the garment
          garmentDescription = `Reference image ${referenceIndex}: garment ${garmentNum}. Match its silhouette, fabric texture, seams, patterns, and colors exactly on the model.`;
        }

        referenceDescriptions.push(garmentDescription);
        referenceIndex += 1;
      } else {
        console.warn(`[Chat] Could not get image data for garment at index ${idx}`);
      }
    }

    // Process background image
    if (latestBackgroundAttachment) {
      let backgroundImageData = extractAttachmentData(latestBackgroundAttachment);

      // If no base64Data, try to fetch from URL
      if (!backgroundImageData.base64Data) {
        const url = latestBackgroundAttachment.url || (latestBackgroundAttachment.metadata as any)?.url;
        if (url) {
          console.log(`[Chat] Fetching background image from URL: ${url.substring(0, 100)}...`);
          const fetched = await fetchImageAsBase64(url);
          if (fetched) {
            backgroundImageData = fetched;
          }
        }
      }

      if (backgroundImageData.base64Data) {
        // Store background image for STEP 2 (separate background application)
        // Don't add to referenceDescriptions since it won't be used in STEP 1
        referenceImages.push({
          data: backgroundImageData.base64Data,
          mimeType: backgroundImageData.mimeType,
        });

        console.log(`[Chat] Background image stored for STEP 2 application`);
      }
    }

    // Use gender detected earlier (line 520)
    const gender = detectedGender || 'FEMALE';

    // Build garment rules for optimizer
    const garmentRules: string[] = [];
    if (hasImproveReference) {
      garmentRules.push('IMPROVEMENT MODE: Preserve exact pose, body proportions, and camera angle from reference image');
    }
    if (garmentSources.length > 0) {
      garmentRules.push('Reproduce garment fabrics, trims, and silhouettes faithfully on the model');
    }
    if (hasExistingGeneration) {
      garmentRules.push('Refinement: Preserve model identity, pose, proportions, and styling');
    }

    const garmentRulesText = garmentRules.length > 0 ? garmentRules.join('. ') + '.' : undefined;

    // Build prompt optimizer input based on edit mode
    let promptInput;
    let optimizerMode: string;

    switch (editMode) {
      case 'TEXT_EDIT':
        // TEXT EDIT MODE: User describes changes via text only
        console.log('[Chat] Using TEXT_EDIT mode (text-based improvements)');
        promptInput = buildImageEditOptimizerInput({
          editInstruction: effectiveContent,
          gender: gender === 'NON_BINARY' ? 'UNISEX' : gender,
          currentGarmentDescription: garmentRulesText,
          aspectRatio: '3:4',
          outputWidth: 1024,
          outputHeight: 1366,
          facialExpression: decision.modelSpecs?.facialExpression,
          hairColor: decision.modelSpecs?.hairColor,
          ageRange: decision.modelSpecs?.ageRange,
          modelHeight: decision.modelSpecs?.heightCm,
          modelWeight: decision.modelSpecs?.weightKg,
        });
        optimizerMode = 'IMAGE_EDIT';
        break;

      case 'GARMENT_SWAP':
      case 'FULL_EDIT':
        // GARMENT SWAP MODE: Preserve pose from reference, apply new garment(s)
        // FULL_EDIT also starts with garment swap, then applies background in step 2
        console.log(`[Chat] Using ${editMode} mode (preserve pose, swap garments)`);
        promptInput = buildGarmentSwapOptimizerInput({
          poseReferenceDescription: 'CRITICAL: Preserve the exact pose, face, body proportions, and camera angle from the first reference image. Only the clothing should change.',
          garmentCount: garmentSources.length,
          garmentType: garmentSources.length > 1 ? 'outfit' : 'single',
          gender: gender === 'NON_BINARY' ? 'UNISEX' : gender,
          ageRange: decision.modelSpecs?.ageRange,
          facialExpression: decision.modelSpecs?.facialExpression,
          hairColor: decision.modelSpecs?.hairColor,
          aspectRatio: '3:4',
          outputWidth: 1024,
          outputHeight: 1366,
          // For FULL_EDIT, background will be applied in step 2, so don't include in prompt
          background: editMode === 'FULL_EDIT' ? undefined : (hasBackground ? {
            enabled: true,
            type: 'custom',
            hasReferenceImage: true,
          } : undefined),
        });
        optimizerMode = 'GARMENT_SWAP';
        break;

      case 'BACKGROUND_CHANGE':
        // BACKGROUND CHANGE MODE: Keep model/garments, just change background
        console.log('[Chat] Using BACKGROUND_CHANGE mode (preserve model, new background)');
        promptInput = buildImageEditOptimizerInput({
          editInstruction: effectiveContent || 'Apply the new background while preserving the model exactly',
          gender: gender === 'NON_BINARY' ? 'UNISEX' : gender,
          currentGarmentDescription: garmentRulesText,
          aspectRatio: '3:4',
          outputWidth: 1024,
          outputHeight: 1366,
          facialExpression: decision.modelSpecs?.facialExpression,
          hairColor: decision.modelSpecs?.hairColor,
          ageRange: decision.modelSpecs?.ageRange,
          modelHeight: decision.modelSpecs?.heightCm,
          modelWeight: decision.modelSpecs?.weightKg,
        });
        optimizerMode = 'IMAGE_EDIT';
        break;

      default:
        // VIRTUAL TRY-ON MODE: Standard generation with garments (no edit reference)
        promptInput = buildChatPromptInput({
          gender,
          garmentCount: garmentSources.length,
          garmentRules: garmentRulesText,
          userRequest: decision.prompt || effectiveContent,
          hasBackground,
          backgroundDescription: hasBackground ? 'Custom background (applied in separate step)' : undefined,
          isImprovement: false,
          modelSpecs: decision.modelSpecs,
        });
        optimizerMode = 'VIRTUAL_TRY_ON';
    }

    console.log(`[Chat] Using Prompt Optimizer in ${optimizerMode} mode...`);

    // Check if model is a minor (under 18) - use simplified prompt to avoid content safety blocks
    const modelAgeRange = decision.modelSpecs?.ageRange;
    const isMinor = isMinorAge(modelAgeRange, null);

    console.log(`[Chat] Age detection: ageRange=${modelAgeRange}, isMinor=${isMinor}`);

    // ====================================
    // Generate Prompt (Simplified for Minors, Full Optimization for Adults)
    // ====================================
    let promptResult: any;

    if (isMinor) {
      // MINOR FLOW: Use simplified prompt without AI optimization
      console.log('[Chat] Using SIMPLIFIED MINOR FLOW - skipping prompt optimizer to avoid content safety blocks');

      const backgroundType = hasBackground ? 'custom' : 'neutral';
      const finalPrompt = buildSimplifiedMinorPrompt({
        garmentType: garmentSources.length > 1 ? 'outfit' : 'single',
        aspectRatio: '3:4',
        backgroundType,
      });

      console.log('[Chat] Simplified minor prompt:', finalPrompt);

      // Create a mock success result to continue the flow
      promptResult = {
        success: true,
        prompt: finalPrompt,
        tokensUsed: 0,
        metadata: {
          model: 'simplified-minor-flow',
          isMinor: true,
          ageRange: modelAgeRange,
        },
      };
    } else {
      // ADULT FLOW: Use full AI prompt optimization
      console.log('[Chat] Using STANDARD ADULT FLOW - calling prompt optimizer');
      promptResult = await optimizePrompt(promptInput);
    }

    if (!promptResult.success || !promptResult.prompt) {
      // Detect error type
      const errorStr = (promptResult.error || '').toLowerCase();
      const isOverloadError = errorStr.includes('503') ||
        errorStr.includes('overload') ||
        errorStr.includes('service unavailable') ||
        errorStr.includes('temporarily unavailable') ||
        errorStr.includes('capacity');
      const isProhibitedContent = errorStr.includes('prohibited_content') ||
        errorStr.includes('prohibited content') ||
        errorStr.includes('safety');

      // Don't log full error details for content safety (avoid confusion)
      if (isProhibitedContent) {
        console.warn('[Chat] Prompt optimization blocked by content safety - user can retry');
      } else {
        console.error('[Chat] Prompt optimization failed:', promptResult.error);
      }

      let userFriendlyMessage: string;
      let errorType: string;

      if (isOverloadError) {
        userFriendlyMessage = '🔄 O serviço está temporariamente sobrecarregado. Por favor, aguarde alguns segundos e envie sua mensagem novamente. Não se preocupe, nenhum crédito foi cobrado!';
        errorType = 'service_overload';
      } else if (isProhibitedContent) {
        // Generic message - don't expose technical details
        userFriendlyMessage = 'Não foi possível processar esta solicitação no momento. Por favor, tente novamente com uma descrição diferente. Nenhum crédito foi cobrado.';
        errorType = 'content_restriction';
      } else {
        userFriendlyMessage = 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente. Nenhum crédito foi cobrado.';
        errorType = 'prompt_optimization_failed';
      }

      const { data: assistantMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: userFriendlyMessage,
          created_at: new Date().toISOString(),
          metadata: {
            error: isProhibitedContent ? 'content_restriction' : promptResult.error,
            errorType,
            retryable: true,
          },
        })
        .select()
        .single();

      return NextResponse.json({
        success: false,
        message: assistantMessage,
        error: isProhibitedContent ? 'content_restriction' : promptResult.error,
        retryable: true,
      });
    }

    const generationPrompt = promptResult.prompt;
    console.log('[Chat] Optimized prompt generated successfully');

    // STEP 1: Generate based on edit mode
    // For FULL_EDIT mode: Two-step process (garment swap first, then background)
    // For GARMENT_SWAP mode: Single-step garment swap
    // For BACKGROUND_CHANGE mode: Background is applied separately in STEP 2
    // For TEXT_EDIT mode: Standard improvement
    // For standard generation: Single-step virtual try-on
    const shouldApplyBackgroundSeparately = hasBackground && (
      editMode === 'FULL_EDIT' ||
      editMode === 'BACKGROUND_CHANGE' ||
      !editMode // Standard generation mode also uses two-step
    );

    const imagesForGeneration = shouldApplyBackgroundSeparately
      ? referenceImages.filter((_, idx) => {
          // Remove background image from first generation
          // Background is always last in referenceImages array
          return idx < referenceImages.length - 1;
        })
      : referenceImages;

    if (editMode === 'FULL_EDIT') {
      console.log(`[Chat] FULL_EDIT mode: Two-step process`);
      console.log(`[Chat]   STEP 1: Garment swap with ${imagesForGeneration.length} images (pose_ref + ${garmentSources.length} garments)`);
      console.log(`[Chat]   STEP 2: Will apply background`);
    } else if (editMode === 'GARMENT_SWAP') {
      console.log(`[Chat] GARMENT_SWAP mode: Single-step garment swap with ${imagesForGeneration.length} images`);
    } else if (editMode === 'BACKGROUND_CHANGE') {
      console.log(`[Chat] BACKGROUND_CHANGE mode: Will apply background in STEP 2`);
    } else {
      console.log(`[Chat] ${editMode || 'Standard'} mode: Generating with ${imagesForGeneration.length} images (background separate: ${shouldApplyBackgroundSeparately})`);
    }

    // Log the image structure for debugging
    console.log(`[Chat] Images for generation: ${imagesForGeneration.length} total`);
    imagesForGeneration.forEach((img, idx) => {
      console.log(`[Chat]   Image ${idx + 1}: ${img.mimeType}, size=${img.data.length} chars`);
    });
    console.log(`[Chat] Reference descriptions: ${referenceDescriptions.length}`);
    referenceDescriptions.forEach((desc, idx) => {
      console.log(`[Chat]   Desc ${idx + 1}: ${desc.substring(0, 80)}...`);
    });

    // CRITICAL CHECK: For GARMENT_SWAP, we need at least 2 images (pose + garment)
    if ((editMode === 'GARMENT_SWAP' || editMode === 'FULL_EDIT') && imagesForGeneration.length < 2) {
      console.error(`[Chat] CRITICAL: ${editMode} mode requires at least 2 images (pose_ref + garment), but only have ${imagesForGeneration.length}`);

      const { data: errorMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: 'Erro: faltam imagens para edição. Certifique-se de que a imagem de referência e a peça foram selecionadas corretamente.',
          credits_charged: 0,
          metadata: { error: 'insufficient_images_for_edit', editMode, imageCount: imagesForGeneration.length },
        })
        .select('id, content, created_at')
        .single();

      return NextResponse.json({
        success: false,
        error: 'Imagens insuficientes para edição',
        message: errorMessage,
        retryable: true,
      });
    }

    const imageResult = await generateWithImagen({
      prompt: generationPrompt,
      aspectRatio: '3:4', // Portrait for fashion
      images: imagesForGeneration,
    });

    if (!imageResult.success || !imageResult.imageData) {
      // Detect if it's a service overload/503 error
      const errorStr = (imageResult.error || '').toLowerCase();
      const isOverloadError = errorStr.includes('503') ||
        errorStr.includes('overload') ||
        errorStr.includes('service unavailable') ||
        errorStr.includes('temporarily unavailable') ||
        errorStr.includes('capacity');

      const isSafetyBlock = errorStr.includes('segurança') ||
        errorStr.includes('safety') ||
        errorStr.includes('bloqueou');

      let userFriendlyMessage: string;
      if (isOverloadError) {
        userFriendlyMessage = '🔄 O serviço de geração está temporariamente sobrecarregado. Por favor, aguarde alguns segundos e envie sua mensagem novamente. Não se preocupe, nenhum crédito foi cobrado!';
      } else if (isSafetyBlock) {
        userFriendlyMessage = '⚠️ A geração foi bloqueada por políticas de segurança. Tente com uma descrição ou imagem diferente. Nenhum crédito foi cobrado.';
      } else {
        userFriendlyMessage = 'Desculpe, ocorreu um erro ao gerar a imagem. Por favor, tente novamente. Nenhum crédito foi cobrado.';
      }

      const { data: assistantMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: userFriendlyMessage,
          credits_charged: 0,
          metadata: {
            error: imageResult.error,
            errorType: isOverloadError ? 'service_overload' : (isSafetyBlock ? 'safety_block' : 'generation_failed'),
            retryable: !isSafetyBlock,
          },
        })
        .select('id, content, created_at')
        .single();

      return NextResponse.json({
        success: false,
        error: imageResult.error,
        message: assistantMessage,
        retryable: !isSafetyBlock,
      }, { status: isOverloadError ? 503 : 500 });
    }

    // Fetch credit pricing for background change
    const pricingOverrides = await fetchCreditPricingOverrides(supabase, [
      CREDIT_ACTIONS.BACKGROUND_CHANGE,
    ]);
    const pricing = resolveCreditPricing(pricingOverrides);

    // STEP 2: Apply background if provided (separate generation call)
    // This applies to: FULL_EDIT, BACKGROUND_CHANGE, and standard generation with background
    let finalImageData = imageResult.imageData;
    let backgroundCreditsCharged = 0;

    if (shouldApplyBackgroundSeparately && latestBackgroundAttachment) {
      console.log(`[Chat] STEP 2: Applying custom background (edit mode: ${editMode || 'standard'})`);

      // Get background image data (already in referenceImages array as last item)
      const backgroundImage = referenceImages[referenceImages.length - 1];

      // Build background application prompt
      const backgroundPrompt = `Apply the provided background image behind this fashion model photo.

CRITICAL REQUIREMENTS:
1. Keep the model, garment(s), pose, and lighting EXACTLY as shown in the first image
2. Replace ONLY the background with the second reference image
3. Ensure smooth compositing with natural edge blending
4. Match lighting direction and color temperature between model and background
5. Preserve all details of the model and clothing - this is background replacement only
6. The model should look naturally placed in the new environment

Reference image 1 (MODEL): The generated fashion photo - preserve this completely except background
Reference image 2 (BACKGROUND): Apply this as the new background behind the model`;

      const backgroundResult = await generateWithImagen({
        prompt: backgroundPrompt,
        aspectRatio: '3:4',
        images: [
          { data: imageResult.imageData, mimeType: 'image/png' },
          backgroundImage,
        ],
      });

      if (backgroundResult.success && backgroundResult.imageData) {
        finalImageData = backgroundResult.imageData;
        backgroundCreditsCharged = pricing.BACKGROUND_CHANGE;
        console.log(`[Chat] Background applied successfully. Charged ${backgroundCreditsCharged} credits.`);
      } else {
        console.warn(`[Chat] Background application failed: ${backgroundResult.error}. Using image without custom background.`);
      }
    }

    // Watermark disabled - use final image
    const imageBuffer = base64ToBuffer(`data:image/png;base64,${finalImageData}`);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const imagePath = `${user.id}/chat/${conversationId}/${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image to storage:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao salvar imagem no storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(imagePath);

    const imageUrl = publicUrlData?.publicUrl || '';

    // Create generation record
    const { data: generation, error: genError } = await (supabase
      .from('generations') as any)
      .insert({
        user_id: user.id,
        tool_id: 'c16fed3d-877f-4d22-ada3-50ebb0ff88e6', // Chat - Geração Livre
        status: 'completed',
        input_data: {
          type: 'chat',
          conversationId,
          prompt: decision.prompt,
          modelSpecs: decision.modelSpecs,
          attachments,
        },
        output_data: {
          tokensUsed: imageResult.tokensUsed,
          model: imageResult.model,
        },
        credits_used: creditsRequired,
      })
      .select('id')
      .single();

    if (genError || !generation) {
      console.error('Error creating generation:', genError);
      return NextResponse.json(
        { error: 'Erro ao salvar geração' },
        { status: 500 }
      );
    }

    // Save image result with storage URL
    const { data: generationResult, error: resultError } = await (supabase
      .from('generation_results') as any)
      .insert({
        generation_id: generation.id,
        image_url: imageUrl,
        has_watermark: false,
        is_purchased: true,
      })
      .select('id, image_url')
      .single();

    if (resultError) {
      console.error('Error saving generation result:', resultError);
    }

    // Calculate total credits (generation + background if applied)
    const totalCreditsCharged = creditsRequired + backgroundCreditsCharged;

    // Deduct credits
    await (supabase
      .from('users') as any)
      .update({ credits: userData.credits - totalCreditsCharged })
      .eq('id', user.id);

    // Record credit transaction for generation
    await (supabase
      .from('credit_transactions') as any)
      .insert({
        user_id: user.id,
        amount: -creditsRequired,
        type: isImprovement ? 'chat_improvement' : (hasExistingGeneration ? 'chat_refinement' : 'chat_generation'),
        description: isImprovement ? 'Melhoria de Imagem via Chat IA' : (hasExistingGeneration ? 'Refinamento via Chat IA' : 'Geração via Chat IA'),
        metadata: {
          conversationId,
          generationId: generation.id,
          isImprovement,
          improveReferenceId: latestImproveReference?.referenceId,
        },
      });

    // Record separate transaction for background change if applied
    if (backgroundCreditsCharged > 0) {
      await (supabase
        .from('credit_transactions') as any)
        .insert({
          user_id: user.id,
          amount: -backgroundCreditsCharged,
          type: 'chat_background_change',
          description: 'Aplicação de Fundo Personalizado via Chat IA',
          metadata: {
            conversationId,
            generationId: generation.id,
          },
        });
    }

    // Save assistant message with generation
    const assistantContent = isImprovement
      ? 'Aqui está sua imagem melhorada:'
      : (hasExistingGeneration
        ? 'Aqui está a imagem refinada com base no seu feedback:'
        : 'Aqui está a imagem gerada:');

    const { data: assistantMessage } = await (supabase
      .from('chat_messages') as any)
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        generation_id: generation.id,
        credits_charged: totalCreditsCharged,
        metadata: {
          generationResultId: generationResult?.id,
          backgroundApplied: backgroundCreditsCharged > 0,
          backgroundCredits: backgroundCreditsCharged,
        },
      })
      .select(`
        id,
        content,
        created_at,
        generation_id,
        generations (
          id,
          generation_results (
            id,
            image_url
          )
        )
      `)
      .single();

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      ready: true,
      creditsCharged: totalCreditsCharged,
      creditsRemaining: userData.credits - totalCreditsCharged,
      backgroundApplied: backgroundCreditsCharged > 0,
      generation: {
        id: generation.id,
        imageUrl: generationResult?.image_url,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations/[id]/messages:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
