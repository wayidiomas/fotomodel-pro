import type { CreditPricing } from './credit-calculator';

export const CREDIT_ACTIONS = {
  BASE_GENERATION: 'base_generation',
  AI_EDIT: 'ai_edit',
  WATERMARK_REMOVAL: 'watermark_removal',
} as const;

export type CreditActionSlug = typeof CREDIT_ACTIONS[keyof typeof CREDIT_ACTIONS];

/**
 * Fetch active credit pricing overrides from Supabase
 * @param supabase - Supabase client (server or service role)
 * @param actions - Action slugs to fetch
 */
export async function fetchCreditPricingOverrides(
  supabase: any,
  actions: CreditActionSlug[] = Object.values(CREDIT_ACTIONS)
): Promise<Partial<CreditPricing>> {
  const overrides: Partial<CreditPricing> = {};

  try {
    const { data, error } = await (supabase
      .from('credit_pricing') as any)
      .select('action_type, credits_required')
      .in('action_type', actions)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching credit pricing:', error);
      return overrides;
    }

    data?.forEach((row: any) => {
      const value = Number(row.credits_required);
      if (!Number.isFinite(value)) return;

      switch (row.action_type) {
        case CREDIT_ACTIONS.BASE_GENERATION:
          overrides.BASE_GENERATION = value;
          break;
        case CREDIT_ACTIONS.AI_EDIT:
          overrides.AI_EDIT = value;
          break;
        case CREDIT_ACTIONS.WATERMARK_REMOVAL:
          overrides.WATERMARK_REMOVAL = value;
          break;
        default:
          break;
      }
    });
  } catch (error) {
    console.error('Unexpected error fetching credit pricing:', error);
  }

  return overrides;
}
