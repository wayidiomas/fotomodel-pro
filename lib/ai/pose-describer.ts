/**
 * AI Pose Describer
 *
 * Uses Gemini 2.5 Flash Lite to dynamically analyze pose images and generate
 * detailed descriptions for the image generation prompt.
 *
 * This replaces static pose descriptions from the database with dynamic,
 * AI-generated descriptions that accurately describe what's in the image.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Use the same lightweight model as pose-advisor
const POSE_DESCRIBER_MODEL_ID =
  process.env.GEMINI_DESCRIBER_MODEL_ID || 'gemini-2.5-flash-lite';

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Structured pose description returned by the AI
 */
export interface PoseDescription {
  /** Full English description of the pose (2-3 sentences) */
  description: string;
  /** Body orientation: frontal, side, three-quarter, back */
  bodyOrientation: string;
  /** Head position and gaze direction */
  headPosition: string;
  /** Arm positions description */
  armPositions: string;
  /** Leg positions and stance */
  legPositions: string;
  /** Overall posture and weight distribution */
  overallPosture: string;
  /** Facial expression if visible (optional) */
  expressionHint?: string;
}

/**
 * System instruction for pose analysis
 */
const SYSTEM_INSTRUCTION = `You are a fashion photography pose analyst. Analyze the pose in the image and provide a detailed, technical description that will help an AI image generator replicate this EXACT pose precisely.

Your description must be extremely specific about body positioning so another AI can recreate it exactly. Focus on:

1. **Body orientation** - Is the model facing the camera directly (frontal), turned to the side (profile), at a three-quarter angle, or showing their back?

2. **Head position** - Which direction is the head turned? Where are the eyes looking? Is the chin raised, lowered, or neutral?

3. **Arm positions** - Describe EXACTLY where each arm is. Are they at the sides, raised, on hips, crossed, behind back? What are the hands doing?

4. **Leg positions** - Are legs together, apart, crossed? Which leg bears the weight? Is one foot forward?

5. **Overall posture** - Is the stance relaxed, confident, dynamic? How is weight distributed? Is there a hip tilt or lean?

Respond ONLY with valid JSON (no markdown, no code blocks) with these exact keys:
{
  "description": "Full English description in 2-3 sentences that captures the complete pose",
  "bodyOrientation": "frontal OR side OR three-quarter OR back",
  "headPosition": "brief description of head and gaze",
  "armPositions": "brief description of both arms",
  "legPositions": "brief description of legs and stance",
  "overallPosture": "brief description of posture and weight",
  "expressionHint": "facial expression if visible, or null"
}`;

/**
 * Build fallback description based on pose category
 */
function buildFallbackDescription(
  poseCategory?: string,
  reason?: string
): PoseDescription {
  const categoryDescriptions: Record<string, PoseDescription> = {
    standing: {
      description:
        'Model standing in a natural upright position with a relaxed, confident stance.',
      bodyOrientation: 'frontal',
      headPosition: 'facing forward with neutral gaze',
      armPositions: 'arms relaxed at sides',
      legPositions: 'feet shoulder-width apart, weight evenly distributed',
      overallPosture: 'upright and relaxed',
    },
    standing_straight: {
      description:
        'Model standing straight with formal posture, arms at sides, facing directly forward.',
      bodyOrientation: 'frontal',
      headPosition: 'facing forward, chin level',
      armPositions: 'arms straight down at sides',
      legPositions: 'feet together, standing straight',
      overallPosture: 'formal upright stance',
    },
    standing_casual: {
      description:
        'Model in a casual standing pose with relaxed body language and natural positioning.',
      bodyOrientation: 'three-quarter',
      headPosition: 'slightly turned, relaxed gaze',
      armPositions: 'one arm relaxed, other slightly bent',
      legPositions: 'weight on one leg, casual stance',
      overallPosture: 'relaxed and approachable',
    },
    standing_confident: {
      description:
        'Model in a confident power stance with strong posture and assertive positioning.',
      bodyOrientation: 'frontal',
      headPosition: 'chin slightly raised, direct gaze',
      armPositions: 'hands on hips or arms crossed',
      legPositions: 'feet apart, grounded stance',
      overallPosture: 'confident and powerful',
    },
    sitting: {
      description:
        'Model seated in a composed position with elegant posture.',
      bodyOrientation: 'three-quarter',
      headPosition: 'turned slightly toward camera',
      armPositions: 'hands resting naturally',
      legPositions: 'legs crossed or together',
      overallPosture: 'seated with good posture',
    },
    walking: {
      description:
        'Model captured mid-stride in a natural walking motion.',
      bodyOrientation: 'three-quarter',
      headPosition: 'looking forward in direction of movement',
      armPositions: 'arms in natural walking swing',
      legPositions: 'one leg forward, mid-step',
      overallPosture: 'dynamic walking movement',
    },
    leaning: {
      description:
        'Model leaning casually with relaxed, approachable body language.',
      bodyOrientation: 'three-quarter',
      headPosition: 'tilted slightly, casual gaze',
      armPositions: 'one arm supporting lean',
      legPositions: 'legs crossed or one bent',
      overallPosture: 'casual leaning pose',
    },
    dynamic: {
      description:
        'Model in an energetic, dynamic pose with movement and energy.',
      bodyOrientation: 'three-quarter',
      headPosition: 'following body movement',
      armPositions: 'arms in expressive position',
      legPositions: 'dynamic leg positioning',
      overallPosture: 'energetic and dynamic',
    },
    relaxed: {
      description:
        'Model in a relaxed, natural pose with comfortable body positioning.',
      bodyOrientation: 'three-quarter',
      headPosition: 'natural, relaxed angle',
      armPositions: 'arms in comfortable position',
      legPositions: 'natural, relaxed stance',
      overallPosture: 'comfortable and natural',
    },
    original_reference: {
      description:
        'Custom pose from user reference image. Follow the exact positioning shown in the reference.',
      bodyOrientation: 'as shown in reference',
      headPosition: 'as shown in reference',
      armPositions: 'as shown in reference',
      legPositions: 'as shown in reference',
      overallPosture: 'replicate reference exactly',
    },
  };

  const normalizedCategory = poseCategory?.toLowerCase().replace(/_/g, '_') || 'standing';
  const fallback = categoryDescriptions[normalizedCategory] || categoryDescriptions.standing;

  if (reason) {
    console.warn(`[PoseDescriber] Using fallback for "${poseCategory}": ${reason}`);
  }

  return fallback;
}

/**
 * Parse JSON response from Gemini, handling various response formats
 */
function parseJsonResponse(text: string): PoseDescription | null {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Analyze a pose image and generate a detailed description
 *
 * @param params - Pose image data and optional context
 * @param maxRetries - Maximum retry attempts (default: 2)
 * @returns Structured pose description or null on failure
 */
export async function describePose(
  params: {
    poseImageData: string;
    poseCategory?: string;
    gender?: string;
  },
  maxRetries = 2
): Promise<PoseDescription | null> {
  if (!geminiClient) {
    console.warn('[PoseDescriber] Gemini client not initialized (missing API key)');
    return buildFallbackDescription(params.poseCategory, 'missing API key');
  }

  const timeout = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: POSE_DESCRIBER_MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      // Build context prompt
      const contextHints: string[] = [];
      if (params.poseCategory) {
        contextHints.push(`Pose category hint: ${params.poseCategory}`);
      }
      if (params.gender) {
        contextHints.push(`Model gender: ${params.gender}`);
      }

      const userPrompt = contextHints.length > 0
        ? `Analyze this pose image. Context: ${contextHints.join(', ')}`
        : 'Analyze this pose image and describe it in detail.';

      // Call Gemini with timeout
      const result = await Promise.race([
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: userPrompt },
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
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]);

      const response = result.response;

      // Check for safety blocks
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        console.warn('[PoseDescriber] Response blocked by safety filter');
        return buildFallbackDescription(params.poseCategory, 'safety filter');
      }

      // Extract text response
      const textContent = response.text();
      if (!textContent) {
        console.warn('[PoseDescriber] Empty response from model');
        if (attempt < maxRetries) continue;
        return buildFallbackDescription(params.poseCategory, 'empty response');
      }

      // Parse JSON response
      const parsed = parseJsonResponse(textContent);
      if (!parsed || !parsed.description) {
        console.warn('[PoseDescriber] Failed to parse response:', textContent.substring(0, 200));
        if (attempt < maxRetries) continue;
        return buildFallbackDescription(params.poseCategory, 'parse error');
      }

      console.log(`[PoseDescriber] Success on attempt ${attempt}: ${parsed.description.substring(0, 100)}...`);
      return parsed;
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || '';
      const is503 = errorMessage.includes('503') || errorMessage.includes('overloaded');
      const isTimeout = errorMessage.includes('timeout');
      const isRetryable = is503 || isTimeout;

      console.warn(`[PoseDescriber] Attempt ${attempt} failed:`, error?.message);

      if (isRetryable && attempt < maxRetries) {
        const delay = 1000 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return buildFallbackDescription(params.poseCategory, error?.message);
    }
  }

  return buildFallbackDescription(params.poseCategory, 'all attempts failed');
}
