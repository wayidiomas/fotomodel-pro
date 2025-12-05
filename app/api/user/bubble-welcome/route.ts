/**
 * GET /api/user/bubble-welcome
 * Checks if user should see the Bubble welcome modal
 *
 * POST /api/user/bubble-welcome
 * Marks the Bubble welcome modal as shown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user should see welcome modal
    const { data, error } = await (supabase
      .from('users') as any)
      .select('migrated_from_bubble, bubble_welcome_shown')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking bubble welcome status:', error);
      return NextResponse.json(
        { shouldShow: false },
        { status: 200 }
      );
    }

    const shouldShow = data?.migrated_from_bubble === true && data?.bubble_welcome_shown === false;

    return NextResponse.json({
      shouldShow,
    });
  } catch (error) {
    console.error('Error in bubble-welcome GET:', error);
    return NextResponse.json(
      { shouldShow: false },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user data
    const { data: userData, error: fetchError } = await (supabase
      .from('users') as any)
      .select('credits, bubble_welcome_shown')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Only add credits if welcome hasn't been shown yet
    if (!userData.bubble_welcome_shown) {
      const newCredits = userData.credits + 50;

      // Update user credits and mark welcome as shown
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({
          credits: newCredits,
          bubble_welcome_shown: true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }

      // Record credit transaction
      const { error: transactionError } = await (supabase
        .from('credit_transactions') as any)
        .insert({
          user_id: user.id,
          amount: 50,
          type: 'bonus',
          description: 'Bônus de boas-vindas - Usuário migrado do Bubble',
          created_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error('Error recording credit transaction:', transactionError);
        // Don't fail the request if transaction recording fails
      }

      console.log(`🎁 Added 50 welcome bonus credits to user ${user.id} (total: ${newCredits})`);

      return NextResponse.json({
        success: true,
        creditsAdded: 50,
        newTotal: newCredits,
      });
    } else {
      // Welcome already shown, just acknowledge
      return NextResponse.json({
        success: true,
        creditsAdded: 0,
        message: 'Welcome already shown',
      });
    }
  } catch (error) {
    console.error('Error in bubble-welcome POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
