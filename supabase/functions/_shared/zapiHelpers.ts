// Z-API Helper Functions
import { createSupabaseClient } from "./createSupabaseClient.ts";

// ⛔ CRITICAL: Check if phone is a test number before calling Z-API
async function isTestNumber(phone: string): Promise<boolean> {
  // Quick pattern check first (avoids DB call for obvious test numbers)
  if (phone.startsWith('551199999999')) {
    return true;
  }

  try {
    const supabase = createSupabaseClient();
    const { data: config } = await supabase
      .from('system_configuration')
      .select('test_numbers, test_mode')
      .single();
    
    return config?.test_numbers?.includes(phone) || false;
  } catch (error) {
    console.error('Error checking test number:', error);
    return false;
  }
}

export async function sendTyping(phone: string, typing: boolean = true): Promise<void> {
  // ⛔ Block Z-API calls for test numbers
  if (await isTestNumber(phone)) {
    console.log(`⚠️ [Z-API] Typing indicator BLOCKED for test number: ${phone}`);
    return;
  }

  // NOTE: Z-API typing endpoint appears to be unavailable or discontinued
  // Disabling to avoid 404 errors in logs. Messages still work without typing indicator.
  console.log(`[Z-API] Typing indicator skipped (endpoint unavailable) - ${phone}`);
  return;

  /* DISABLED - Z-API typing endpoint not found
  const Z_API_INSTANCE_ID = Deno.env.get('Z_API_INSTANCE_ID');
  const Z_API_TOKEN = Deno.env.get('Z_API_TOKEN');
  const Z_API_CLIENT_TOKEN = Deno.env.get('Z_API_CLIENT_TOKEN');

  console.log(`[Z-API] Credentials check - Instance: ${Z_API_INSTANCE_ID ? 'OK' : 'MISSING'}, Token: ${Z_API_TOKEN ? 'OK' : 'MISSING'}, Client-Token: ${Z_API_CLIENT_TOKEN ? 'OK' : 'MISSING'}`);

  if (!Z_API_INSTANCE_ID || !Z_API_TOKEN || !Z_API_CLIENT_TOKEN) {
    console.error('❌ [Z-API] Credentials NOT configured - typing indicator skipped');
    return;
  }

  try {
    const url = `https://api.z-api.io/instances/${Z_API_INSTANCE_ID}/token/${Z_API_TOKEN}/typing`;
    console.log(`[Z-API] Sending typing=${typing} to ${phone} via ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Client-Token': Z_API_CLIENT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, typing })
    });

    const statusCode = response.status;
    const responseText = await response.text();
    
    console.log(`[Z-API] Typing response - Status: ${statusCode}, Body: ${responseText}`);

    if (!response.ok) {
      console.error(`❌ [Z-API] Failed to send typing indicator - Status: ${statusCode}, Response: ${responseText}`);
    } else {
      console.log(`✅ [Z-API] Typing indicator sent successfully to ${phone}`);
    }
  } catch (error) {
    console.error('❌ [Z-API] Error sending typing:', error);
  }
  */
}

export async function markAsRead(phone: string, messageId: string): Promise<void> {
  // ⛔ Block Z-API calls for test numbers
  if (await isTestNumber(phone)) {
    console.log(`⚠️ [BLOCKED] Read receipt blocked for test number: ${phone}`);
    return;
  }

  const Z_API_INSTANCE_ID = Deno.env.get('Z_API_INSTANCE_ID');
  const Z_API_TOKEN = Deno.env.get('Z_API_TOKEN');
  const Z_API_CLIENT_TOKEN = Deno.env.get('Z_API_CLIENT_TOKEN');

  if (!Z_API_INSTANCE_ID || !Z_API_TOKEN || !Z_API_CLIENT_TOKEN) {
    console.warn('Z-API credentials not configured, skipping read receipt');
    return;
  }

  try {
    const response = await fetch(
      `https://api.z-api.io/instances/${Z_API_INSTANCE_ID}/token/${Z_API_TOKEN}/read-message`,
      {
        method: 'POST',
        headers: {
          'Client-Token': Z_API_CLIENT_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, messageId })
      }
    );

    if (!response.ok) {
      console.error('Failed to mark message as read:', await response.text());
    }
  } catch (error) {
    console.error('Error marking as read:', error);
  }
}
