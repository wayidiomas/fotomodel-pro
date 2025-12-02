/**
 * WhatsApp Business API Integration
 * Uses Meta Graph API v22.0 to send OTP codes via WhatsApp
 */

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

/**
 * Sends a WhatsApp OTP code using the auth_code template
 * @param phone - Phone number in E.164 format (e.g., +5511999999999)
 * @param code - 6-digit verification code
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function sendWhatsAppOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate environment variables
    if (!process.env.WHATSAPP_API_URL) {
      throw new Error('WHATSAPP_API_URL not configured');
    }
    if (!process.env.WHATSAPP_API_TOKEN) {
      throw new Error('WHATSAPP_API_TOKEN not configured');
    }
    if (!process.env.WHATSAPP_TEMPLATE_NAME) {
      throw new Error('WHATSAPP_TEMPLATE_NAME not configured');
    }

    // Validate phone format (E.164)
    if (!phone.match(/^\+\d{10,15}$/)) {
      return {
        success: false,
        error: 'Invalid phone number format. Must be in E.164 format (e.g., +5511999999999)',
      };
    }

    // Validate code format (6 digits)
    if (!code.match(/^\d{6}$/)) {
      return {
        success: false,
        error: 'Invalid code format. Must be 6 digits',
      };
    }

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: process.env.WHATSAPP_TEMPLATE_NAME,
          language: {
            code: 'pt_BR',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: code,
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: code,
                },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorData: WhatsAppError = await response.json();
      console.error('WhatsApp API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Failed to send WhatsApp message',
      };
    }

    const data: WhatsAppResponse = await response.json();
    console.log('WhatsApp message sent successfully:', data.messages[0].id);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validates if a phone number is in E.164 format
 * @param phone - Phone number to validate
 * @returns boolean
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone);
}

/**
 * Formats a Brazilian phone number to E.164 format
 * @param phone - Phone number (e.g., 11999999999 or (11) 99999-9999)
 * @returns Phone number in E.164 format (+5511999999999)
 */
export function formatPhoneToE164(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If already has country code (55 for Brazil)
  if (digits.startsWith('55')) {
    return `+${digits}`;
  }

  // Add Brazil country code
  return `+55${digits}`;
}
