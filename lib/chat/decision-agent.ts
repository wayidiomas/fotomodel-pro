/**
 * Chat Decision Agent
 *
 * Uses Gemini 2.5 Flash Lite to analyze user messages and determine:
 * 1. If we have enough information to generate an image
 * 2. What questions to ask the user if not ready
 * 3. How to construct the final prompt for image generation
 *
 * Flow:
 * - User sends message with or without attachments
 * - Agent analyzes conversation history + attachments
 * - Returns either: questions to ask OR ready-to-generate prompt
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatAttachment {
  type: 'garment' | 'background';
  url: string;
  metadata?: Record<string, any>;
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
  questions?: string[]; // Questions to ask user
  missingInfo?: string[]; // List of missing information

  // If ready:
  prompt?: string; // Optimized prompt for image generation
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

const SYSTEM_INSTRUCTION = `Você é um assistente especializado em geração de imagens de moda com IA.

Seu objetivo é coletar informações do usuário para gerar uma modelo virtual vestindo roupas específicas.

INFORMAÇÕES NECESSÁRIAS PARA GERAR:
1. **Vestuário** (obrigatório): Pelo menos 1 peça de roupa anexada ou descrita
2. **Gênero da modelo** (obrigatório): Masculino, Feminino ou Não-binário
3. **Características físicas** (opcional mas recomendado):
   - Altura (em cm ou descrição: baixa, média, alta)
   - Peso/tipo corporal (em kg ou descrição: magra, atlética, curvilínea, etc)
4. **Detalhes da modelo** (opcional):
   - Cor de cabelo
   - Expressão facial (sorrindo, séria, etc)
   - Faixa etária
5. **Pose** (opcional): Como a modelo deve estar posicionada
6. **Background/Cenário** (opcional): Fundo da imagem

REGRAS:
- Faça perguntas naturais, conversacionais e objetivas
- Uma pergunta por vez se possível
- Priorize as informações OBRIGATÓRIAS primeiro
- Seja amigável e útil
- Quando o usuário anexar roupas, reconheça isso explicitamente
- Se o usuário já forneceu uma informação, não pergunte novamente
- Pose e cenário são opcionais e serão escolhidos automaticamente pelo sistema com base no vestuário. NÃO peça pose/cenário a menos que o usuário solicite explicitamente.
- Se o usuário já informou o gênero e forneceu as roupas (ou descrição clara delas), considere que temos o mínimo necessário mesmo sem pose/cenário.

FORMATO DE RESPOSTA:
Você DEVE responder apenas com JSON válido no seguinte formato:

Se NÃO estiver pronto para gerar:
{
  "ready": false,
  "questions": ["Qual o gênero da modelo que você deseja?"],
  "missingInfo": ["gênero"]
}

Se estiver PRONTO para gerar:
{
  "ready": true,
  "prompt": "Prompt otimizado em inglês para geração de imagem",
  "modelSpecs": {
    "gender": "FEMALE",
    "heightCm": 170,
    "weightKg": 60,
    "hairColor": "castanho",
    "facialExpression": "sorrindo levemente"
  },
  "garmentIds": ["id1", "id2"],
  "backgroundId": "bg1"
}

IMPORTANTE: Retorne APENAS o JSON, sem explicações adicionais.`;

/**
 * Analyze conversation and decide if ready to generate or what to ask
 */
export async function analyzeConversation(
  input: DecisionAgentInput
): Promise<DecisionAgentResponse> {
  try {
    // Build context from conversation history
    const conversationContext = input.messages
      .map((msg) => {
        const attachInfo = msg.attachments && msg.attachments.length > 0
          ? ` [Anexos: ${msg.attachments.map(a => a.type).join(', ')}]`
          : '';
        return `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}${attachInfo}`;
      })
      .join('\n');

    const currentAttachInfo = input.attachments.length > 0
      ? `\n[Anexos na mensagem atual: ${input.attachments.map(a => `${a.type}: ${a.url}`).join(', ')}]`
      : '';

    const fullContext = `HISTÓRICO DA CONVERSA:
${conversationContext}

MENSAGEM ATUAL DO USUÁRIO:
${input.currentMessage}${currentAttachInfo}

Analise a conversa e decida se temos informações suficientes para gerar a imagem. Retorne JSON conforme as instruções.`;

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

    // Fallback: ask for gender if we have garments
    if (input.attachments.some(a => a.type === 'garment')) {
      return {
        ready: false,
        questions: ['Qual o gênero da modelo que você deseja criar?'],
        missingInfo: ['gênero'],
      };
    }

    return {
      ready: false,
      questions: ['Por favor, me conte o que você gostaria de criar. Você pode anexar fotos das roupas ou descrevê-las.'],
      missingInfo: ['vestuário', 'gênero'],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build simplified prompt from user description (fallback)
 */
export function buildSimplePrompt(params: {
  userDescription: string;
  garmentCount: number;
  hasBackground: boolean;
}): string {
  let prompt = `Create a photorealistic fashion model image. ${params.userDescription}.`;

  if (params.garmentCount > 0) {
    prompt += ` The model is wearing the provided garment${params.garmentCount > 1 ? 's' : ''}.`;
  }

  if (params.hasBackground) {
    prompt += ` Use the provided background.`;
  }

  prompt += ` Professional photography, studio lighting, sharp focus on clothing details.`;

  return prompt;
}
