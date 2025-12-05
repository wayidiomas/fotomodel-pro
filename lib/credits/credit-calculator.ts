import type { AIToolsSelection } from '@/components/generation-flow/ai-tools-panel';

/**
 * Credit costs for different actions
 * These should match the values in the database (credit_pricing table)
 */
export interface CreditPricing {
  BASE_GENERATION: number;
  AI_EDIT: number;
  BACKGROUND_CHANGE: number;
  CHAT_GENERATION: number;
  CHAT_REFINEMENT: number;
  CHAT_CONVERSATION: number;
}

export const CREDIT_COSTS: CreditPricing = {
  BASE_GENERATION: 2, // Base cost for generating model + garment (guided flow)
  AI_EDIT: 1, // Cost per AI editing tool
  BACKGROUND_CHANGE: 1, // Cost for applying background change
  CHAT_GENERATION: 2, // Base cost for chat generation (first image)
  CHAT_REFINEMENT: 1, // Cost for refining/editing chat generated image
  CHAT_CONVERSATION: 0, // Free conversational messages (no generation)
};

export function resolveCreditPricing(
  overrides: Partial<CreditPricing> = {}
): CreditPricing {
  return {
    BASE_GENERATION: overrides.BASE_GENERATION ?? CREDIT_COSTS.BASE_GENERATION,
    AI_EDIT: overrides.AI_EDIT ?? CREDIT_COSTS.AI_EDIT,
    BACKGROUND_CHANGE: overrides.BACKGROUND_CHANGE ?? CREDIT_COSTS.BACKGROUND_CHANGE,
    CHAT_GENERATION: overrides.CHAT_GENERATION ?? CREDIT_COSTS.CHAT_GENERATION,
    CHAT_REFINEMENT: overrides.CHAT_REFINEMENT ?? CREDIT_COSTS.CHAT_REFINEMENT,
    CHAT_CONVERSATION: overrides.CHAT_CONVERSATION ?? CREDIT_COSTS.CHAT_CONVERSATION,
  };
}

export interface GenerationCreditBreakdown {
  baseGeneration: number;
  aiEdits: {
    removeBackground: number;
    changeBackground: number;
    addLogo: number;
  };
  total: number;
}

/**
 * Calculate total credits required for a generation
 * @param aiTools - Selected AI tools configuration
 * @returns Breakdown of credit costs
 */
export function calculateGenerationCredits(
  aiTools: AIToolsSelection,
  pricing: CreditPricing = CREDIT_COSTS
): GenerationCreditBreakdown {
  const hasChargeableBackground =
    aiTools.changeBackground.enabled &&
    aiTools.changeBackground.selection &&
    aiTools.changeBackground.selection.type !== 'original';

  const breakdown: GenerationCreditBreakdown = {
    baseGeneration: pricing.BASE_GENERATION,
    aiEdits: {
      removeBackground: 0,
      changeBackground: 0,
      addLogo: 0,
    },
    total: pricing.BASE_GENERATION,
  };

  // AI Edit: Remove Background
  if (aiTools.removeBackground) {
    breakdown.aiEdits.removeBackground = pricing.AI_EDIT;
    breakdown.total += pricing.AI_EDIT;
  }

  // AI Edit: Change Background
  if (hasChargeableBackground) {
    breakdown.aiEdits.changeBackground = pricing.AI_EDIT;
    breakdown.total += pricing.AI_EDIT;
  }

  // AI Edit: Add Logo
  if (aiTools.addLogo.enabled && aiTools.addLogo.logo) {
    breakdown.aiEdits.addLogo = pricing.AI_EDIT;
    breakdown.total += pricing.AI_EDIT;
  }

  return breakdown;
}

/**
 * Count total AI edits being used
 * @param aiTools - Selected AI tools configuration
 * @returns Number of AI edits
 */
export function countAIEdits(aiTools: AIToolsSelection): number {
  let count = 0;

  if (aiTools.removeBackground) count++;
  if (
    aiTools.changeBackground.enabled &&
    aiTools.changeBackground.selection &&
    aiTools.changeBackground.selection.type !== 'original'
  ) {
    count++;
  }
  if (aiTools.addLogo.enabled && aiTools.addLogo.logo) count++;

  return count;
}

/**
 * Check if user has sufficient credits for generation
 * @param userCredits - User's current credit balance
 * @param requiredCredits - Credits required for the operation
 * @returns Whether user has enough credits
 */
export function hasSufficientCredits(
  userCredits: number,
  requiredCredits: number
): boolean {
  return userCredits >= requiredCredits;
}

/**
 * Calculate credits remaining after generation
 * @param userCredits - User's current credit balance
 * @param requiredCredits - Credits required for the operation
 * @returns Remaining credits (or negative if insufficient)
 */
export function calculateRemainingCredits(
  userCredits: number,
  requiredCredits: number
): number {
  return userCredits - requiredCredits;
}

/**
 * Format credit cost for display
 * @param credits - Number of credits
 * @returns Formatted string (e.g., "1 crédito", "5 créditos")
 */
export function formatCreditCost(credits: number): string {
  return credits === 1 ? '1 crédito' : `${credits} créditos`;
}

/**
 * Get list of enabled AI tools
 * @param aiTools - Selected AI tools configuration
 * @returns Array of enabled tool names
 */
export function getEnabledAITools(aiTools: AIToolsSelection): string[] {
  const enabled: string[] = [];

  if (aiTools.removeBackground) {
    enabled.push('Remover Fundo');
  }

  if (
    aiTools.changeBackground.enabled &&
    aiTools.changeBackground.selection &&
    aiTools.changeBackground.selection.type !== 'original'
  ) {
    enabled.push('Alterar Fundo');
  }

  if (aiTools.addLogo.enabled && aiTools.addLogo.logo) {
    enabled.push('Inserir Logo');
  }

  return enabled;
}

/**
 * Validate that AI tool selections are complete
 * (e.g., background change is enabled but no background selected)
 * @param aiTools - Selected AI tools configuration
 * @returns Validation result with any error messages
 */
export function validateAIToolsSelection(aiTools: AIToolsSelection): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for incomplete selections
  if (aiTools.changeBackground.enabled && !aiTools.changeBackground.selection) {
    errors.push('Selecione um fundo para alterar ou desative a opção');
  }

  if (aiTools.addLogo.enabled && !aiTools.addLogo.logo) {
    errors.push('Faça upload do logo ou desative a opção');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate credits required for a chat message
 * @param params - Chat message parameters
 * @param pricing - Credit pricing (defaults to CREDIT_COSTS)
 * @returns Number of credits required
 */
export interface ChatMessageCreditParams {
  isGeneration: boolean; // true if generating an image
  isRefinement: boolean; // true if refining existing generation
  hasBackgroundChange?: boolean; // true if changing background (future: might cost extra)
}

export function calculateChatCredits(
  params: ChatMessageCreditParams,
  pricing: CreditPricing = CREDIT_COSTS
): number {
  // Conversational messages are free
  if (!params.isGeneration) {
    return pricing.CHAT_CONVERSATION;
  }

  // Refinement/editing costs less
  if (params.isRefinement) {
    return pricing.CHAT_REFINEMENT;
  }

  // Base generation cost
  return pricing.CHAT_GENERATION;
}
