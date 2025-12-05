/**
 * POST /api/auth/verify-otp
 * Verifies OTP code and creates user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatPhoneToE164, isValidE164Phone } from '@/lib/auth/whatsapp';
import { checkRateLimit, incrementRateLimit, getClientIP } from '@/lib/auth/rate-limit';
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
    const body = await request.json();
    const { phone: rawPhone, code } = body;

    // Validate inputs
    if (!rawPhone || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Format and validate phone number
    let phone: string;
    try {
      phone = formatPhoneToE164(rawPhone);
      if (!isValidE164Phone(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Must be 6 digits' },
        { status: 400 }
      );
    }

    // Check rate limit (5 verifications per 15 minutes)
    const clientIP = getClientIP(request);
    const rateLimitIdentifier = `${phone}:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitIdentifier, 'verify-otp');

    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many verification attempts. Please try again in ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const supabase = getServiceRoleClient();

    // Get verification code from database
    const { data: verificationCodes, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching verification code:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      );
    }

    if (!verificationCodes || verificationCodes.length === 0) {
      // Increment rate limit for failed attempt
      await incrementRateLimit(rateLimitIdentifier, 'verify-otp');

      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const verificationCode = verificationCodes[0];

    // Check if code has expired
    if (new Date(verificationCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one' },
        { status: 400 }
      );
    }

    // Check if max attempts reached (3 attempts)
    if (verificationCode.attempts >= 3) {
      return NextResponse.json(
        { error: 'Maximum verification attempts reached. Please request a new code' },
        { status: 400 }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({
        verified_at: new Date().toISOString(),
        attempts: verificationCode.attempts + 1,
      })
      .eq('id', verificationCode.id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      );
    }

    // Check if user already exists in public.users by phone (more reliable than auth.users)
    const { data: existingPublicUser, error: publicUserError } = await supabase
      .from('users')
      .select('id, phone, credits')
      .eq('phone', phone)
      .eq('is_deleted', false)
      .single();

    if (publicUserError && publicUserError.code !== 'PGRST116') {
      // PGRST116 = not found, which is ok for new users
      console.error('Error checking user existence:', publicUserError);
      return NextResponse.json(
        { error: 'Failed to check user existence' },
        { status: 500 }
      );
    }

    let userId: string;
    let isNewUser = false;

    if (!existingPublicUser) {
      // User doesn't exist - create new user in auth.users
      // The database trigger will automatically create the public.users record
      console.log('🆕'.repeat(40));
      console.log('[verify-otp] 🆕 CREATING NEW USER');
      console.log('[verify-otp] Phone:', phone);

      const { data: newAuthUser, error: createAuthUserError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true, // Auto-confirm phone since we verified OTP
        user_metadata: {
          phone,
        },
      });

      if (createAuthUserError || !newAuthUser.user) {
        console.error('[verify-otp] ❌ Error creating auth user:', createAuthUserError);
        console.error('[verify-otp] Full error details:', JSON.stringify(createAuthUserError, null, 2));
        console.log('🆕'.repeat(40));
        return NextResponse.json(
          {
            error: 'Failed to create user account',
            details: createAuthUserError?.message || 'Unknown error creating auth user'
          },
          { status: 500 }
        );
      }

      console.log('[verify-otp] ✅ Auth user created successfully:', newAuthUser.user.id);
      userId = newAuthUser.user.id;
      isNewUser = true;

      // Check if user exists in Bubble and update the public.users record
      // Bubble stores emails as {phone}@fotomodel.com
      console.log('[verify-otp] 🔍 Checking Bubble user existence for phone:', phone);
      const bubbleCheck = await checkBubbleUserExists(phone);
      console.log('[verify-otp] 📋 Bubble check result:', JSON.stringify(bubbleCheck, null, 2));

      // Update the public.users record (created by trigger) with Bubble info if applicable
      if (bubbleCheck.exists) {
        console.log('[verify-otp] 🎉🎉🎉 Bubble user detected! Granting 50 bonus credits...');
        console.log('[verify-otp] Bubble User ID:', bubbleCheck.bubbleUserId);
        console.log('[verify-otp] Updating user ID:', userId);

        // Give 50 bonus credits (10 initial + 40 bonus = 50 total)
        const { error: updateBubbleError } = await supabase
          .from('users')
          .update({
            migrated_from_bubble: true,
            bubble_user_id: bubbleCheck.bubbleUserId,
            bubble_welcome_shown: false, // Will show welcome popup on first dashboard visit
            credits: 50, // 50 bonus credits for Bubble users
          })
          .eq('id', userId);

        if (updateBubbleError) {
          console.error('[verify-otp] ❌❌❌ Error updating Bubble data:', updateBubbleError);
          console.error('[verify-otp] Update error details:', JSON.stringify(updateBubbleError, null, 2));
          // Don't fail the whole flow, just log the error
        } else {
          console.log(`[verify-otp] ✅✅✅ Bubble user setup complete:`, {
            userId,
            phone,
            bubbleId: bubbleCheck.bubbleUserId,
            credits: 50,
            bubble_welcome_shown: false
          });
        }
      } else {
        console.log('[verify-otp] ℹ️ User NOT found in Bubble - keeping default 10 credits');
      }
      console.log('🆕'.repeat(40));
    } else {
      // User exists - use existing user ID
      console.log('[verify-otp] ℹ️ Existing user - no Bubble check (popup only for new users)');
      console.log('[verify-otp] User ID:', existingPublicUser.id);
      console.log('[verify-otp] Current credits:', existingPublicUser.credits);
      userId = existingPublicUser.id;
      isNewUser = false;
    }

    // Create a session for the user using admin API
    // Set up user with a temporary password based on userId (secure and unique)
    const tempPassword = `${userId}-${phone}-verified`;
    const tempEmail = `${phone.replace(/\+/g, '')}@phone.fotomodel.app`;

    // Update user to set password, email and phone for sign in
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
      phone,
      email: tempEmail,
      password: tempPassword,
      phone_confirm: true,
      email_confirm: true,
    });

    if (updateUserError) {
      console.error('Error updating user for sign in:', updateUserError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Now sign in with the password to get session tokens
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword,
    });

    if (signInError || !signInData.session) {
      console.error('Error signing in user:', signInError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Increment rate limit counter
    await incrementRateLimit(rateLimitIdentifier, 'verify-otp');

    // Return session tokens
    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: userId,
        phone,
      },
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
