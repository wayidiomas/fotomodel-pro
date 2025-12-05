/**
 * POST /api/admin/reprocess-bubble-users
 * Reprocessa usuários existentes para detectar se são usuários Bubble
 * Use este endpoint DEPOIS de configurar BUBBLE_API_URL e BUBBLE_API_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkBubbleUserExists } from '@/lib/auth/bubble-detection';

/**
 * Creates a Supabase client with service role key
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Simple authentication - require a secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, userId } = body;

    // Validate inputs
    if (!phone && !userId) {
      return NextResponse.json(
        { error: 'Either phone or userId is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Get user by phone or userId
    let query = supabase
      .from('users')
      .select('id, phone, email, credits, migrated_from_bubble, bubble_user_id');

    if (userId) {
      query = query.eq('id', userId);
    } else if (phone) {
      // Try both with and without + prefix
      const phoneVariants = [phone, phone.replace(/^\+/, ''), `+${phone.replace(/^\+/, '')}`];
      query = query.in('phone', phoneVariants);
    }

    const { data: users, error: fetchError } = await query;

    if (fetchError) {
      console.error('[reprocess-bubble] Error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    console.log('[reprocess-bubble] Processing user:', {
      userId: user.id,
      phone: user.phone,
      currentCredits: user.credits,
      alreadyMigrated: user.migrated_from_bubble,
    });

    // Check if user already marked as Bubble user
    if (user.migrated_from_bubble) {
      return NextResponse.json({
        message: 'User already marked as Bubble user',
        user: {
          id: user.id,
          phone: user.phone,
          credits: user.credits,
          bubbleUserId: user.bubble_user_id,
        },
      });
    }

    // Try to detect user in Bubble
    // Use phone with + if available, otherwise add it
    const phoneToCheck = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;
    console.log('[reprocess-bubble] Checking Bubble with phone:', phoneToCheck);

    const bubbleCheck = await checkBubbleUserExists(phoneToCheck);
    console.log('[reprocess-bubble] Bubble check result:', bubbleCheck);

    if (!bubbleCheck.exists) {
      return NextResponse.json({
        message: 'User not found in Bubble database',
        phone: phoneToCheck,
        checked: true,
      });
    }

    // Update user with Bubble data
    console.log('[reprocess-bubble] 🎉 Bubble user detected! Updating...');

    const { error: updateError } = await supabase
      .from('users')
      .update({
        migrated_from_bubble: true,
        bubble_user_id: bubbleCheck.bubbleUserId,
        bubble_welcome_shown: false, // Will show welcome popup on next dashboard visit
        credits: 50, // Give 50 bonus credits
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[reprocess-bubble] Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    console.log('[reprocess-bubble] ✅ User updated successfully');

    return NextResponse.json({
      success: true,
      message: 'User successfully marked as Bubble user and credited',
      user: {
        id: user.id,
        phone: user.phone,
        previousCredits: user.credits,
        newCredits: 50,
        bubbleUserId: bubbleCheck.bubbleUserId,
        bubbleEmail: bubbleCheck.bubbleData?.['Email txt'],
        bubbleCredits: bubbleCheck.bubbleData?.['Créditos'] || 0,
      },
    });
  } catch (error) {
    console.error('[reprocess-bubble] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
