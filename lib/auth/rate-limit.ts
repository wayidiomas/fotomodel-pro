/**
 * Rate Limiting for Authentication Operations
 * Prevents abuse by limiting requests based on identifier (phone/IP) and action type
 */

import { createClient } from '@supabase/supabase-js';

// Rate limit configurations
export const RATE_LIMITS = {
  'send-otp': {
    maxAttempts: 3,
    windowMinutes: 1, // 1 minute between retry attempts
  },
  'verify-otp': {
    maxAttempts: 5,
    windowMinutes: 15,
  },
  'resend-otp': {
    maxAttempts: 2,
    windowMinutes: 30,
  },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Creates a Supabase client with service role key for rate limit operations
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
 * Checks if a request is within rate limits
 * @param identifier - Unique identifier (phone number or IP address)
 * @param action - The action being rate limited
 * @returns Promise<RateLimitResult>
 */
export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  try {
    const supabase = getServiceRoleClient();
    const config = RATE_LIMITS[action];
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

    // Clean up old entries first
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

    // Get current count within the time window
    const { data: existingLimits, error: fetchError } = await supabase
      .from('rate_limits')
      .select('count, window_start')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching rate limits:', fetchError);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        error: 'Failed to check rate limit',
      };
    }

    const currentCount = existingLimits?.[0]?.count || 0;
    const remaining = Math.max(0, config.maxAttempts - currentCount);
    const resetAt = existingLimits?.[0]?.window_start
      ? new Date(
          new Date(existingLimits[0].window_start).getTime() +
            config.windowMinutes * 60 * 1000
        )
      : new Date(Date.now() + config.windowMinutes * 60 * 1000);

    return {
      allowed: currentCount < config.maxAttempts,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + RATE_LIMITS[action].windowMinutes * 60 * 1000),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Increments the rate limit counter for an identifier and action
 * @param identifier - Unique identifier (phone number or IP address)
 * @param action - The action being rate limited
 * @returns Promise<boolean> - Returns true if successfully incremented
 */
export async function incrementRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    const config = RATE_LIMITS[action];
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

    // Check if there's an existing entry within the time window
    const { data: existingLimits, error: fetchError } = await supabase
      .from('rate_limits')
      .select('id, count, window_start')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching rate limits for increment:', fetchError);
      return false;
    }

    if (existingLimits && existingLimits.length > 0) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ count: existingLimits[0].count + 1 })
        .eq('id', existingLimits[0].id);

      if (updateError) {
        console.error('Error updating rate limit:', updateError);
        return false;
      }
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          action,
          count: 1,
          window_start: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting rate limit:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in incrementRateLimit:', error);
    return false;
  }
}

/**
 * Resets rate limit for a specific identifier and action
 * Useful for testing or administrative purposes
 * @param identifier - Unique identifier (phone number or IP address)
 * @param action - The action to reset
 * @returns Promise<boolean>
 */
export async function resetRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('action', action);

    if (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetRateLimit:', error);
    return false;
  }
}

/**
 * Gets the client IP address from a request
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (depending on your hosting platform)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}
