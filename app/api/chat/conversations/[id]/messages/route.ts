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
import { calculateChatCredits } from '@/lib/credits/credit-calculator';
import { base64ToBuffer, bufferToBase64 } from '@/lib/images/watermark';

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
  type: 'garment' | 'background';
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
            thumbnail_url,
            has_watermark
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
    const { content, attachments = [] } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

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
        content: content.trim(),
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
      const generatedTitle = await generateChatTitle(content.trim());
      await (supabase
        .from('chat_conversations') as any)
        .update({ title: generatedTitle })
        .eq('id', conversationId);
    }

    // Guardrails for chit-chat/off-topic
    const guardrail = detectGuardrailResponse(content);
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
    const latestBackgroundAttachment = backgroundSources[0];
    const totalGarments = garmentSources.length;
    const hasGarment = totalGarments > 0;
    const hasBackground = Boolean(latestBackgroundAttachment);
    const detectedGender = detectGenderFromConversation(chatHistory, content);

    // Analyze with Decision Agent
    let decision = await analyzeConversation({
      messages: chatHistory,
      currentMessage: content.trim(),
      attachments: attachments.map((att: any) => ({
        type: att.type,
        url: att.url,
        metadata: att,
      })),
    });

    if (!decision.ready && hasGarment && detectedGender) {
      const fallbackPrompt = buildSimplePrompt({
        userDescription: content.trim(),
        garmentCount: Math.max(1, totalGarments || 1),
        hasBackground,
      });

      decision = {
        ready: true,
        prompt: decision.prompt || fallbackPrompt,
        modelSpecs: {
          ...(decision.modelSpecs || {}),
          gender: detectedGender,
        },
        garmentIds: decision.garmentIds,
        backgroundId: decision.backgroundId,
      };
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

    // READY TO GENERATE - Check if it's a refinement
    const hasExistingGeneration = chatHistory.some((msg) => msg.role === 'assistant' && msg.content.includes('imagem gerada'));

    const creditsRequired = calculateChatCredits({
      isGeneration: true,
      isRefinement: hasExistingGeneration,
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
    const garmentImageData = garmentSources
      .map((att) => ({
        attachment: att,
        data: extractAttachmentData(att),
      }))
      .filter(({ data }) => Boolean(data.base64Data))
      .slice(-3);

    const backgroundImageData = latestBackgroundAttachment
      ? extractAttachmentData(latestBackgroundAttachment)
      : null;

    const referenceImages: Array<{ data: string; mimeType: string }> = [];
    const referenceDescriptions: string[] = [];
    let referenceIndex = 1;

    garmentImageData.forEach(({ data }, idx) => {
      if (!data.base64Data) {
        return;
      }

      referenceImages.push({
        data: data.base64Data,
        mimeType: data.mimeType,
      });

      referenceDescriptions.push(
        `Reference image ${referenceIndex}: garment ${idx + 1}. Match its silhouette, fabric texture, seams, patterns, and colors exactly on the model.`
      );

      referenceIndex += 1;
    });

    if (backgroundImageData?.base64Data) {
      referenceImages.push({
        data: backgroundImageData.base64Data,
        mimeType: backgroundImageData.mimeType,
      });

      referenceDescriptions.push(
        `Reference image ${referenceIndex}: use strictly as the background environment. Keep the model, garment, and pose unchanged while blending lighting and shadows to match this backdrop.`
      );

      referenceIndex += 1;
    }

    let generationPrompt = decision.prompt || content.trim();

    const garmentFocusRules: string[] = [];

    if (garmentSources.length > 0) {
      garmentFocusRules.push(
        'The uploaded garment references are mandatory. Reproduce their fabrics, trims, and silhouettes faithfully on the model.'
      );
      garmentFocusRules.push(
        'Align seams, waistlines, and hems naturally with the pose so the outfit looks tailored to the body.'
      );
    }

    if (hasExistingGeneration) {
      garmentFocusRules.push(
        'This is a refinement. Preserve the previously established model identity, pose, proportions, and styling; only adjust what the user described.'
      );
    }

    if (latestBackgroundAttachment) {
      garmentFocusRules.push(
        'Apply the provided background behind the dressed model after fitting the garment, ensuring smooth compositing and cohesive lighting.'
      );
    }

    if (garmentFocusRules.length > 0) {
      generationPrompt += `\n\nGARMENT & POSE RULES:\n${garmentFocusRules
        .map((rule, idx) => `${idx + 1}. ${rule}`)
        .join('\n')}`;
    }

    if (referenceDescriptions.length > 0) {
      generationPrompt += `\n\nREFERENCE IMAGES:\n${referenceDescriptions.join('\n')}`;
    }

    const imageResult = await generateWithImagen({
      prompt: generationPrompt,
      aspectRatio: '3:4', // Portrait for fashion
      images: referenceImages,
    });

    if (!imageResult.success || !imageResult.imageData) {
      const { data: assistantMessage } = await (supabase
        .from('chat_messages') as any)
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: `Desculpe, ocorreu um erro ao gerar a imagem: ${imageResult.error || 'Erro desconhecido'}. Por favor, tente novamente.`,
          credits_charged: 0,
          metadata: { error: imageResult.error },
        })
        .select('id, content, created_at')
        .single();

      return NextResponse.json({
        success: false,
        error: imageResult.error,
        message: assistantMessage,
      }, { status: 500 });
    }

    // Watermark disabled - use original image
    const imageBuffer = base64ToBuffer(`data:image/png;base64,${imageResult.imageData}`);
    const imageBase64 = bufferToBase64(imageBuffer, 'image/png');

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

    // Save image result (TODO: Upload to storage instead of storing base64)
    const { data: generationResult, error: resultError } = await (supabase
      .from('generation_results') as any)
      .insert({
        generation_id: generation.id,
        image_url: imageBase64, // TODO: Upload to Supabase Storage
        has_watermark: false,
        metadata: {
          cleanImageData: imageResult.imageData,
        },
      })
      .select('id, image_url')
      .single();

    if (resultError) {
      console.error('Error saving generation result:', resultError);
    }

    // Deduct credits
    await (supabase
      .from('users') as any)
      .update({ credits: userData.credits - creditsRequired })
      .eq('id', user.id);

    // Record credit transaction
    await (supabase
      .from('credit_transactions') as any)
      .insert({
        user_id: user.id,
        amount: -creditsRequired,
        type: hasExistingGeneration ? 'chat_refinement' : 'chat_generation',
        description: hasExistingGeneration ? 'Refinamento via Chat IA' : 'Geração via Chat IA',
        metadata: {
          conversationId,
          generationId: generation.id,
        },
      });

    // Save assistant message with generation
    const assistantContent = hasExistingGeneration
      ? 'Aqui está a imagem refinada com base no seu feedback:'
      : 'Aqui está a imagem gerada:';

    const { data: assistantMessage } = await (supabase
      .from('chat_messages') as any)
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        generation_id: generation.id,
        credits_charged: creditsRequired,
        metadata: {
          generationResultId: generationResult?.id,
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
            image_url,
            has_watermark
          )
        )
      `)
      .single();

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      ready: true,
      creditsCharged: creditsRequired,
      creditsRemaining: userData.credits - creditsRequired,
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
