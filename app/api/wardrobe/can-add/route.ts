/**
 * GET /api/wardrobe/can-add
 *
 * Verifica se o usuário pode adicionar mais peças ao vestuário
 * baseado no limite do plano atual
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's plan and wardrobe count in parallel
    const [userData, wardrobeCount] = await Promise.all([
      (supabase
        .from('users') as any)
        .select(`
          current_plan_id,
          subscription_plans:current_plan_id (
            slug,
            name_pt,
            max_wardrobe_items
          )
        `)
        .eq('id', user.id)
        .single(),

      (supabase
        .from('wardrobe_items') as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false)
    ]);

    if (userData.error) {
      console.error('Error fetching user data:', userData.error);
      return NextResponse.json(
        { error: 'Failed to fetch user plan' },
        { status: 500 }
      );
    }

    const planSlug = userData.data?.subscription_plans?.slug || 'free';
    const planName = userData.data?.subscription_plans?.name_pt || 'Gratuito';
    const maxItems = userData.data?.subscription_plans?.max_wardrobe_items ?? 5;
    const currentCount = wardrobeCount.count || 0;
    const isUnlimited = maxItems === -1;
    const canAddMore = isUnlimited || currentCount < maxItems;
    const remaining = isUnlimited ? -1 : Math.max(0, maxItems - currentCount);

    return NextResponse.json({
      canAddMore,
      isAtLimit: !canAddMore,
      planSlug,
      planName,
      maxItems,
      currentCount,
      remaining,
      isUnlimited,
    });
  } catch (error) {
    console.error('Error in can-add endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
