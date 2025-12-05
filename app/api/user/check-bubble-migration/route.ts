/**
 * POST /api/user/check-bubble-migration
 * Verifica se o usuário é migrado do Bubble e atualiza os dados
 * Deve ser chamado no primeiro acesso ao dashboard
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkBubbleUserExists } from '@/lib/auth/bubble-detection';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from public.users
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('id, email, phone, migrated_from_bubble, bubble_welcome_shown, bubble_user_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[check-bubble] Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    // If already checked or already migrated, skip
    if (userData.migrated_from_bubble === true) {
      console.log('[check-bubble] User already marked as Bubble user:', user.id);
      return NextResponse.json({
        isBubbleUser: true,
        shouldShowWelcome: !userData.bubble_welcome_shown,
      });
    }

    // Try to detect Bubble user by email
    const email = user.email || userData.email;

    console.log('[check-bubble] Checking Bubble for user:', user.id, email);
    const bubbleCheck = await checkBubbleUserExists(email);

    if (bubbleCheck.exists) {
      console.log('[check-bubble] Bubble user detected!', bubbleCheck.bubbleUserId);

      // Update user record with Bubble data
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({
          migrated_from_bubble: true,
          bubble_user_id: bubbleCheck.bubbleUserId,
          bubble_welcome_shown: false,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[check-bubble] Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }

      console.log('[check-bubble] User updated successfully');

      return NextResponse.json({
        isBubbleUser: true,
        shouldShowWelcome: true,
        bubbleData: {
          userId: bubbleCheck.bubbleUserId,
          email: bubbleCheck.bubbleData?.['Email txt'],
          credits: bubbleCheck.bubbleData?.['Créditos'] || 0,
        },
      });
    }

    // Not a Bubble user - mark as checked to avoid future API calls
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({
        migrated_from_bubble: false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[check-bubble] Error marking as non-Bubble:', updateError);
    }

    return NextResponse.json({
      isBubbleUser: false,
      shouldShowWelcome: false,
    });
  } catch (error) {
    console.error('[check-bubble] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
