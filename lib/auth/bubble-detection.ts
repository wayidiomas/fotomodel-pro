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
 * Checks if a phone number exists in Bubble's database
 * @param phone - Phone number in E.164 format (e.g., +5511999999999)
 * @returns Promise<{ exists: boolean; bubbleUserId?: string; bubbleData?: BubbleUser }>
 */
export async function checkBubbleUserExists(
  phone: string
): Promise<{ exists: boolean; bubbleUserId?: string; bubbleData?: BubbleUser }> {
  try {
    const bubbleApiUrl = process.env.BUBBLE_API_URL;
    const bubbleApiToken = process.env.BUBBLE_API_TOKEN;

    if (!bubbleApiUrl || !bubbleApiToken) {
      console.warn('Bubble API credentials not configured - skipping Bubble user detection');
      return { exists: false };
    }

    // Remove '+' and format for Bubble comparison
    // Bubble stores phones without '+' prefix
    const cleanPhone = phone.replace(/\+/g, '');

    // Query Bubble API for user with matching phone
    const response = await fetch(
      `${bubbleApiUrl}/obj/user?constraints=[{"key":"Telefone","constraint_type":"equals","value":"${cleanPhone}"}]&limit=1`,
      {
        method: 'GET',
        headers: {
          'api_key_fotomodel': `Bearer ${bubbleApiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Bubble API error:', response.status, response.statusText);
      return { exists: false };
    }

    const data: BubbleResponse = await response.json();

    if (data.results && data.results.length > 0) {
      const bubbleUser = data.results[0];
      return {
        exists: true,
        bubbleUserId: bubbleUser._id,
        bubbleData: bubbleUser,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking Bubble user existence:', error);
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
