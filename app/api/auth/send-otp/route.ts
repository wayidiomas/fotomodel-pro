/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit OTP code via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppOTP, formatPhoneToE164, isValidE164Phone } from '@/lib/auth/whatsapp';
import { checkRateLimit, incrementRateLimit, getClientIP } from '@/lib/auth/rate-limit';

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

/**
 * Generates a random 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone: rawPhone } = body;

    // Validate phone number presence
    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
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

    // Check rate limit (3 requests per hour per phone)
    const clientIP = getClientIP(request);
    const rateLimitIdentifier = `${phone}:${clientIP}`;
    const rateLimit = await checkRateLimit(rateLimitIdentifier, 'send-otp');

    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Generate OTP code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to database
    const supabase = getServiceRoleClient();

    // Invalidate any existing codes for this phone
    await supabase
      .from('verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('phone', phone)
      .is('verified_at', null);

    // Insert new verification code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (insertError) {
      console.error('Error saving verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send WhatsApp message
    const whatsappResult = await sendWhatsAppOTP(phone, code);

    if (!whatsappResult.success) {
      console.error('WhatsApp send failed:', whatsappResult.error);
      return NextResponse.json(
        {
          error: 'Failed to send verification code',
          message: whatsappResult.error || 'WhatsApp service unavailable',
        },
        { status: 500 }
      );
    }

    // Increment rate limit counter
    await incrementRateLimit(rateLimitIdentifier, 'send-otp');

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Verification code sent via WhatsApp',
      expiresAt: expiresAt.toISOString(),
      remaining: rateLimit.remaining - 1,
    });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
