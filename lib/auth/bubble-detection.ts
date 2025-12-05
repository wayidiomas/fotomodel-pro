/**
 * Bubble User Detection Service
 * Detects if a user exists in Bubble.io based on phone number
 */

interface BubbleUser {
  _id: string;
  'Created Date': string;
  'Modified Date': string;
  Telefone?: string;
  Email?: string;
  [key: string]: any;
}

interface BubbleResponse {
  cursor: number;
  results: BubbleUser[];
  remaining: number;
  count: number;
}

/**
 * Checks if a user exists in Bubble's database
 * Bubble stores users with "Email txt" in format: {phone}@fotomodel.com
 * Example: +5521980390959 → 5521980390959@fotomodel.com
 *
 * @param phoneOrEmail - Phone number (E.164 format) or email address
 * @returns Promise<{ exists: boolean; bubbleUserId?: string; bubbleData?: BubbleUser }>
 */
export async function checkBubbleUserExists(
  phoneOrEmail: string | null
): Promise<{ exists: boolean; bubbleUserId?: string; bubbleData?: BubbleUser }> {
  try {
    console.log('='.repeat(80));
    console.log('[Bubble] 🔍 Starting Bubble user detection...');
    console.log('[Bubble] Input phoneOrEmail:', phoneOrEmail);

    if (!phoneOrEmail) {
      console.log('[Bubble] ❌ No phone or email provided - skipping Bubble detection');
      console.log('='.repeat(80));
      return { exists: false };
    }

    const bubbleApiUrl = process.env.BUBBLE_API_URL;
    const bubbleApiToken = process.env.BUBBLE_API_TOKEN;

    console.log('[Bubble] Environment check:');
    console.log('[Bubble] - BUBBLE_API_URL:', bubbleApiUrl ? '✓ SET' : '✗ MISSING');
    console.log('[Bubble] - BUBBLE_API_TOKEN:', bubbleApiToken ? '✓ SET (length: ' + bubbleApiToken.length + ')' : '✗ MISSING');

    if (!bubbleApiUrl || !bubbleApiToken) {
      console.warn('[Bubble] ❌ API credentials not configured - skipping Bubble user detection');
      console.log('='.repeat(80));
      return { exists: false };
    }

    // Construct Bubble email from phone or use email directly
    let bubbleEmail: string;

    if (phoneOrEmail.startsWith('+')) {
      // Phone number - construct Bubble email format
      const cleanPhone = phoneOrEmail.replace(/\+/g, '');
      bubbleEmail = `${cleanPhone}@fotomodel.com`;
      console.log('[Bubble] Constructed email from phone:', bubbleEmail);
    } else if (phoneOrEmail.includes('@')) {
      // Already an email
      bubbleEmail = phoneOrEmail;
      console.log('[Bubble] Using provided email:', bubbleEmail);
    } else {
      // Plain phone number without +
      bubbleEmail = `${phoneOrEmail}@fotomodel.com`;
      console.log('[Bubble] Constructed email from clean phone:', bubbleEmail);
    }

    console.log('[Bubble] 🎯 Checking for user with email:', bubbleEmail);

    // Query Bubble API for user with matching email (using "Email txt" field)
    const constraints = JSON.stringify([
      { key: 'Email txt', constraint_type: 'equals', value: bubbleEmail }
    ]);

    const url = `${bubbleApiUrl}/obj/user?constraints=${encodeURIComponent(constraints)}&limit=1`;
    console.log('[Bubble] 📡 API Request URL:', url);
    console.log('[Bubble] 📡 Constraints:', constraints);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_key_fotomodel': `Bearer ${bubbleApiToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Bubble] 📡 API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[Bubble] ❌ API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[Bubble] ❌ Error details:', errorText);
      console.log('='.repeat(80));
      return { exists: false };
    }

    const data: BubbleResponse = await response.json();
    console.log('[Bubble] 📦 API Response Data:', JSON.stringify(data, null, 2));

    if (data.results && data.results.length > 0) {
      const bubbleUser = data.results[0];
      console.log('[Bubble] ✅✅✅ User found in Bubble!', {
        bubbleId: bubbleUser._id,
        email: bubbleUser['Email txt'],
        credits: bubbleUser['Créditos'],
        name: bubbleUser['Nome']
      });
      console.log('='.repeat(80));
      return {
        exists: true,
        bubbleUserId: bubbleUser._id,
        bubbleData: bubbleUser,
      };
    }

    console.log('[Bubble] ❌ No user found with email:', bubbleEmail);
    console.log('[Bubble] Response had', data.results?.length || 0, 'results');
    console.log('='.repeat(80));
    return { exists: false };
  } catch (error) {
    console.error('[Bubble] ❌❌❌ Error checking user existence:', error);
    console.error('[Bubble] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.log('='.repeat(80));
    // Don't fail the authentication if Bubble check fails
    return { exists: false };
  }
}

/**
 * Checks if a user should see the welcome popup
 * User should see it if:
 * 1. They are migrated from Bubble (migrated_from_bubble = true)
 * 2. They haven't seen the welcome popup yet (bubble_welcome_shown = false)
 *
 * @param userId - User ID in Supabase
 * @returns Promise<boolean>
 */
export async function shouldShowBubbleWelcome(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from('users')
      .select('migrated_from_bubble, bubble_welcome_shown')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.migrated_from_bubble === true && data.bubble_welcome_shown === false;
  } catch (error) {
    console.error('Error checking if should show Bubble welcome:', error);
    return false;
  }
}

/**
 * Marks the welcome popup as shown for a user
 * @param userId - User ID in Supabase
 * @returns Promise<boolean> - true if successful
 */
export async function markBubbleWelcomeShown(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase
      .from('users')
      .update({ bubble_welcome_shown: true })
      .eq('id', userId);

    if (error) {
      console.error('Error marking Bubble welcome as shown:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking Bubble welcome as shown:', error);
    return false;
  }
}
