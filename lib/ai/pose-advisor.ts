import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PoseCompatibilityResult {
  score: number;
  summary: string;
  guidance: string;
  recommendPoseAdjustment: boolean;
}

const advisorModelId =
  process.env.GEMINI_ADVISOR_MODEL_ID || 'gemini-2.5-flash-lite';

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function buildFallbackAssessment(reason: string): PoseCompatibilityResult {
  return {
    score: 75,
    summary: `Compatibilidade moderada (análise limitada: ${reason}).`,
    guidance:
      'Priorize seguir a pose de referência. Ajustes leves só se a peça realmente exigir outra postura.',
    recommendPoseAdjustment: false,
  };
}

export async function assessGarmentPoseCompatibility(
  params: {
    garmentImageData: string;
    poseImageData: string;
    garmentCategory?: string;
    pieceType?: string;
    poseDescription?: string;
  },
  maxRetries = 2
): Promise<PoseCompatibilityResult | null> {
  if (!geminiClient) {
    return null;
  }

  const timeout = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: advisorModelId,
        systemInstruction:
          'You are a fashion stylist AI. Analyse how well a garment photo will fit a reference pose. Respond strictly in JSON with keys: score (0-100), summary (string), guidance (string), recommendPoseAdjustment (boolean). Score below 60 means difficult fit.',
      });

      const prompt = `
Garment category: ${params.garmentCategory || 'unknown'}
Garment piece type: ${params.pieceType || 'unspecified'}
Pose description: ${params.poseDescription || 'n/a'}

Evaluate how naturally the garment can be applied to the pose. Consider fabric flexibility, posture, arm placement, and how much distortion is required.`;

      // Add timeout using Promise.race
      const result: any = await Promise.race([
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: params.garmentImageData,
                    mimeType: 'image/png',
                  },
                },
                {
                  inlineData: {
                    data: params.poseImageData,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          ],
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]);

      const response = result.response;
      const primaryCandidate = response?.candidates?.[0];

      if (
        !primaryCandidate ||
        primaryCandidate.finishReason === 'SAFETY' ||
        response?.promptFeedback?.blockReason
      ) {
        console.warn('Pose advisor response blocked or empty.');
        return buildFallbackAssessment(
          response?.promptFeedback?.blockReason || primaryCandidate?.finishReason || 'sem detalhes'
        );
      }

      const fallbackText = typeof response?.text === 'function' ? response.text() : '';
      const textPart =
        primaryCandidate.content?.parts?.find((part: any) => part.text)?.text ||
        fallbackText ||
        '';

      if (!textPart) {
        console.warn('Pose advisor returned no text content.');
        return buildFallbackAssessment('sem conteúdo textual');
      }

      const text = textPart.trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        return buildFallbackAssessment('não retornou JSON válido');
      }

      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 70,
        summary: parsed.summary || 'Compatibilidade moderada.',
        guidance:
          parsed.guidance ||
          'Siga a pose de referência, ajustando ligeiramente apenas quando necessário.',
        recommendPoseAdjustment:
          typeof parsed.recommendPoseAdjustment === 'boolean'
            ? parsed.recommendPoseAdjustment
            : false,
      };
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const is503 =
        errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('Service Unavailable');
      const isTimeout = errorMessage.includes('timeout');

      // If it's a 503 error or timeout and we have retries left, retry
      if ((is503 || isTimeout) && attempt < maxRetries) {
        const delay = 1000 * attempt; // 1s, 2s
        console.warn(
          `Pose advisor attempt ${attempt} failed (${is503 ? '503' : 'timeout'}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed or non-retryable error
      console.error('Error assessing pose compatibility:', error);
      return buildFallbackAssessment('falha ao consultar assistente');
    }
  }

  // Should never reach here, but just in case
  return buildFallbackAssessment('todas tentativas falharam');
}
