import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { CategorizationResponse } from '@/lib/generation-flow/garment-metadata-types';

// Zod schema for structured output - matches GarmentMetadata interface
const GarmentMetadataSchema = z.object({
  category: z.string().describe('Categoria da peça (ex: TSHIRT, JEANS)'),
  colors: z.array(z.string()).describe('Cores predominantes (ex: ["BLUE", "WHITE"])'),
  description: z.string().describe('Descrição detalhada em português'),
  occasions: z.array(z.string()).describe('Ocasiões de uso (ex: ["CASUAL", "EVERYDAY"])'),
  patterns: z.array(z.string()).describe('Padrões/estampas (ex: ["SOLID"])'),
  season: z.string().optional().describe('Estação do ano'),
  material: z.string().optional().describe('Material/tecido'),
  styleNotes: z.string().optional().describe('Notas de estilo adicionais'),
});

/**
 * POST /api/ai/categorize-garment
 * Categoriza peças de roupa usando Gemini Vision com LangChain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, pieceType } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'URL da imagem é obrigatória' } as CategorizationResponse,
        { status: 400 }
      );
    }

    // Get and validate environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const modelId = process.env.GEMINI_MODEL_ID;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('GEMINI_API_KEY não configurada ou vazia');
      return NextResponse.json(
        { success: false, error: 'Chave da API não configurada' } as CategorizationResponse,
        { status: 500 }
      );
    }

    // Prefer Gemini 2.5 Flash for JSON mode support
    const defaultModelId = 'gemini-2.0-flash-exp';
    const configuredModelId =
      modelId && typeof modelId === 'string' && modelId.trim()
        ? modelId.trim()
        : defaultModelId;

    const finalModelId = configuredModelId;
    let actualModel = finalModelId;
    const lowerModelId = actualModel.toLowerCase();

    // Gemini 2.0 Flash Exp has better JSON support
    if (!lowerModelId.includes('gemini-2') || lowerModelId.includes('image-preview')) {
      console.warn(
        `Modelo ${actualModel} pode não suportar JSON mode otimizado. Usando ${defaultModelId} para melhor categorização.`
      );
      actualModel = defaultModelId;
    }

    console.log('✓ API Key encontrada');
    console.log('✓ Modelo solicitado:', finalModelId);
    if (actualModel !== finalModelId) {
      console.log('⚠️  Modelo alterado para:', actualModel, '(JSON mode otimizado)');
    }

    // Initialize JsonOutputParser
    const parser = new JsonOutputParser();

    // Initialize LangChain with Gemini using native JSON mode
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey.trim(),
      model: actualModel,
      temperature: 0.1,
      maxOutputTokens: 1024,
      timeout: 30000, // 30 second timeout to prevent hanging
      safetySettings: [],
    });

    // Fetch image and convert to base64
    console.log('Fetching image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar imagem' } as CategorizationResponse,
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('Image converted to base64');

    const prompt = `Analise esta peça de roupa na imagem e retorne metadados estruturados em formato JSON.

Tipo da peça (${pieceType === 'upper' ? 'parte superior' : 'parte inferior'}):
- Identifique a categoria específica (ex: TSHIRT, JEANS, MIDI_DRESS, etc.)

Cores (até 3 predominantes):
- Liste as cores principais usando os códigos dos enums

Descrição:
- Descrição detalhada da peça em português (2-3 frases)
- Inclua detalhes sobre corte, estilo e características visuais

Ocasiões de uso (1-3 opções):
- Quando/onde esta peça seria apropriada

Padrões/Estampas (1-2 opções):
- Identifique padrões visuais

IMPORTANTE: Use os valores EXATOS dos enums fornecidos abaixo.

Categorias válidas para ${pieceType === 'upper' ? 'PARTE SUPERIOR' : 'PARTE INFERIOR'}:
${pieceType === 'upper'
  ? `TSHIRT, TANK_TOP, POLO, HENLEY, LONG_SLEEVE, DRESS_SHIRT, BLOUSE, BUTTON_DOWN, SWEATER, CARDIGAN, PULLOVER, TURTLENECK, HOODIE, SWEATSHIRT, TRACK_JACKET, BLAZER, SUIT_JACKET, BOMBER_JACKET, DENIM_JACKET, LEATHER_JACKET, TRENCH_COAT, PARKA, PEACOAT, PUFFER_JACKET, WINDBREAKER, VEST`
  : `JEANS, DRESS_PANTS, CHINOS, CARGO_PANTS, JOGGERS, SWEATPANTS, LEGGINGS, SHORTS, BERMUDA, CARGO_SHORTS, ATHLETIC_SHORTS, PENCIL_SKIRT, A_LINE_SKIRT, MIDI_SKIRT, MAXI_SKIRT, MINI_SKIRT, PLEATED_SKIRT, CASUAL_DRESS, COCKTAIL_DRESS, EVENING_GOWN, MIDI_DRESS, MAXI_DRESS, SHIRT_DRESS, WRAP_DRESS, SUNDRESS, JUMPSUIT, ROMPER, OVERALLS`
}

Cores válidas: WHITE, BLACK, GRAY, BEIGE, BROWN, RED, ORANGE, YELLOW, PINK, BURGUNDY, BLUE, NAVY, LIGHT_BLUE, TEAL, PURPLE, VIOLET, GREEN, OLIVE, MINT, GOLD, SILVER, BRONZE, CREAM, IVORY, KHAKI, TAN, MULTICOLOR

Ocasiões válidas: CASUAL, FORMAL, BUSINESS, BUSINESS_CASUAL, PARTY, COCKTAIL, WEDDING, SPORT, BEACH, HOME, OUTDOOR, NIGHT_OUT, DATE, EVERYDAY

Padrões válidos: SOLID, STRIPED, CHECKERED, PLAID, GINGHAM, FLORAL, PAISLEY, POLKA_DOT, GEOMETRIC, ABSTRACT, ANIMAL_PRINT, LEOPARD, ZEBRA, SNAKE, CAMOUFLAGE, TIE_DYE, OMBRE, COLOR_BLOCK, GRAPHIC, LOGO

Retorne APENAS um objeto JSON válido seguindo este formato exato:
{
  "category": "string",
  "colors": ["string"],
  "description": "string",
  "occasions": ["string"],
  "patterns": ["string"],
  "season": "string (opcional)",
  "material": "string (opcional)",
  "styleNotes": "string (opcional)"
}`;

    // Create message with image using HumanMessage and base64 data
    const message = new HumanMessage({
      content: [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: {
            url: base64DataUrl,
          },
        },
      ],
    });

    console.log('Invoking Gemini with JSON output...');

    const maxAttempts = 3;
    let parsedData: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxAttempts}...`);

        // Invoke model and parse JSON
        const result = await model.invoke([message]);
        const content = result.content;

        if (!content || typeof content !== 'string') {
          console.warn(`Resposta vazia ou inválida (tentativa ${attempt}/${maxAttempts})`);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error('Resposta vazia da IA');
        }

        console.log('Resposta recebida, fazendo parse do JSON...');

        // Parse JSON from response
        parsedData = await parser.parse(content);

        if (parsedData && typeof parsedData === 'object' && Object.keys(parsedData).length > 0) {
          console.log('✓ JSON parseado com sucesso');
          break;
        }

        console.warn(`JSON parseado mas vazio (tentativa ${attempt}/${maxAttempts})`);
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

      } catch (invokeError: any) {
        const status = invokeError?.status || invokeError?.response?.status;
        console.error(`Erro na invocação do Gemini (tentativa ${attempt}/${maxAttempts}):`, {
          message: invokeError?.message,
          status,
          name: invokeError?.name,
        });

        // Retry on 503 or timeout errors
        if ((status === 503 || invokeError?.name === 'TimeoutError') && attempt < maxAttempts) {
          const backoff = 1000 * attempt;
          console.log(`Aguardando ${backoff}ms antes de tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        // Return error on last attempt or non-retryable errors
        return NextResponse.json(
          {
            success: false,
            error: 'Falha ao categorizar a peça. Por favor, tente novamente.',
          } as CategorizationResponse,
          { status: 500 }
        );
      }
    }

    if (!parsedData) {
      console.error('Todas as tentativas falharam - resposta indefinida');
      return NextResponse.json(
        { success: false, error: 'Não foi possível obter resposta da IA após múltiplas tentativas' } as CategorizationResponse,
        { status: 500 }
      );
    }

    // Validate against Zod schema
    const parsedResult = GarmentMetadataSchema.safeParse(parsedData);
    if (!parsedResult.success) {
      console.error('Estrutura da resposta inválida:', parsedResult.error.flatten());
      return NextResponse.json(
        { success: false, error: 'Resposta da IA não está no formato esperado' } as CategorizationResponse,
        { status: 500 }
      );
    }

    console.log('✓ Categorização concluída com sucesso');
    return NextResponse.json({
      success: true,
      metadata: parsedResult.data,
    } as CategorizationResponse);

  } catch (error) {
    console.error('Erro inesperado em categorize-garment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao categorizar peça',
      } as CategorizationResponse,
      { status: 500 }
    );
  }
}
