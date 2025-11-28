import { createSupabaseClient } from '../_shared/createSupabaseClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  phone: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  status: string;
}

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not found');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  // Create JWT for Google OAuth
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign JWT
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const jwt = `${signatureInput}.${base64UrlEncode(signature)}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;

  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    const binary = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    base64 = btoa(binary);
  }

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function updateSheetRow(
  accessToken: string,
  sheetId: string,
  phone: string,
  date: string,
  time: string,
  newStatus: string
): Promise<boolean> {
  // Read all rows to find the matching one
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:H`;

  const readResponse = await fetch(readUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!readResponse.ok) {
    throw new Error(`Failed to read sheet: ${await readResponse.text()}`);
  }

  const readData = await readResponse.json();
  const rows = readData.values || [];

  // Find matching row (skip header row 0)
  const normalizedPhone = phone.replace(/\D/g, '');
  let targetRowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowDate = row[0]; // Column A
    const rowTime = row[1]; // Column B
    const rowPhone = row[3] ? row[3].replace(/\D/g, '') : ''; // Column D

    if (rowDate === date && rowTime === time && rowPhone === normalizedPhone) {
      targetRowIndex = i;
      break;
    }
  }

  if (targetRowIndex === -1) {
    console.log(`Row not found for phone: ${phone}, date: ${date}, time: ${time}`);
    return false;
  }

  // Update the status column (E - 5th column, index 4)
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/E${targetRowIndex + 1}?valueInputOption=RAW`;

  const updateResponse = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newStatus]],
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to update sheet: ${await updateResponse.text()}`);
  }

  // Apply background color based on status
  const colorMap: Record<string, any> = {
    'pendente_confirmacao': { red: 1, green: 1, blue: 0.8 }, // Amarelo claro
    'confirmada_paciente': { red: 0.7, green: 1, blue: 0.7 }, // Verde
    'cancelada_paciente': { red: 1, green: 0.7, blue: 0.7 }, // Vermelho
    'no_show': { red: 0.9, green: 0.9, blue: 0.9 } // Cinza
  };

  const backgroundColor = colorMap[newStatus] || { red: 1, green: 1, blue: 1 }; // Default white

  try {
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
    await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0, // Assuming first sheet
              startRowIndex: targetRowIndex,
              endRowIndex: targetRowIndex + 1,
              startColumnIndex: 4, // Column E
              endColumnIndex: 5
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: backgroundColor
              }
            },
            fields: 'userEnteredFormat.backgroundColor'
          }
        }]
      })
    });
    console.log(`Applied color for status ${newStatus}`);
  } catch (colorError) {
    console.error('Failed to update cell color:', colorError);
    // Non-blocking
  }

  console.log(`Updated row ${targetRowIndex + 1} with status: ${newStatus}`);


  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, appointmentDate, appointmentTime, status }: UpdateRequest = await req.json();

    console.log('[Sheets Update] Request:', { phone, appointmentDate, appointmentTime, status });

    if (!phone || !appointmentDate || !appointmentTime || !status) {
      throw new Error('Missing required fields: phone, appointmentDate, appointmentTime, or status');
    }

    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    const accessToken = await getGoogleAccessToken();
    const updated = await updateSheetRow(
      accessToken,
      sheetId,
      phone,
      appointmentDate,
      appointmentTime,
      status
    );

    return new Response(
      JSON.stringify({
        success: true,
        updated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Sheets Update] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
