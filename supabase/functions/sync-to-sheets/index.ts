import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  patient_name: string;
  procedure: string;
  amount_paid: string;
  status: 'confirmada' | 'confirmado' | 'cancelada' | 'concluida' | 'reagendada';
}

// Get Google Sheets OAuth token from service account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimBase64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerBase64}.${claimBase64}`;
  
  const pemKey = serviceAccount.private_key;
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureBase64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Find the correct cell based on spreadsheet structure
function findCell(
  sheetData: any[][],
  appointmentData: AppointmentData
): { row: number; col: number } {
  
  const appointmentDate = new Date(appointmentData.date);
  const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  console.log('Looking for date:', formattedDate, 'time:', appointmentData.time);
  
  // Find the week header row by searching for the date (e.g., "24/11/2025")
  let weekHeaderRow = -1;
  let weekHeaderCol = -1;
  const foundDates: string[] = [];
  
  for (let row = 0; row < sheetData.length; row++) {
    const rowData = sheetData[row] || [];
    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').trim();
      // Collect all dates that look like dates (dd/mm/yyyy format)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(cell)) {
        foundDates.push(cell);
      }
      if (cell === formattedDate) {
        weekHeaderRow = row;
        weekHeaderCol = col;
        console.log('Found week header at row', row, 'col', col);
        break;
      }
    }
    if (weekHeaderRow >= 0) break;
  }
  
  if (weekHeaderRow < 0) {
    console.error('Available dates in sheet:', foundDates);
    throw new Error(`Could not find week header for date ${formattedDate}. Available dates: ${foundDates.join(', ')}`);
  }
  
  // Determine which week block this is (each block starts at columns A, F, K, P, U...)
  // Week blocks are 5 columns wide: 1 for time + 4 for data
  const weekBlockStartCol = Math.floor(weekHeaderCol / 5) * 5;
  const timeColumnIndex = weekBlockStartCol; // The first column of each block has the times
  
  console.log('Week block starts at column', weekBlockStartCol, '(time column:', timeColumnIndex, ')');
  
  // Find the time row (below the header) in the correct time column
  let timeRow = -1;
  const availableTimes: string[] = [];
  
  console.log('Searching for time in rows', weekHeaderRow + 1, 'to', Math.min(weekHeaderRow + 30, sheetData.length));
  
  for (let row = weekHeaderRow + 1; row < Math.min(weekHeaderRow + 30, sheetData.length); row++) {
    const rowData = sheetData[row] || [];
    const timeCell = String(rowData[timeColumnIndex] || '').trim();
    
    // Collect all time slots for error reporting
    if (timeCell && /^\d{1,2}:\d{2}/.test(timeCell)) {
      availableTimes.push(timeCell);
    }
    
    // Log first 10 rows for debugging
    if (row < weekHeaderRow + 10) {
      console.log('Row', row, 'column', String.fromCharCode(65 + timeColumnIndex), ':', timeCell);
    }
    
    // Try to match time - normalize both formats (remove seconds if present)
    const normalizedCellTime = timeCell.split(':').slice(0, 2).join(':');
    const normalizedTargetTime = appointmentData.time.split(':').slice(0, 2).join(':');
    
    if (normalizedCellTime === normalizedTargetTime) {
      timeRow = row;
      console.log('Found time', appointmentData.time, 'at row', row, 'column', String.fromCharCode(65 + timeColumnIndex), '(matched with', timeCell, ')');
      break;
    }
  }
  
  if (timeRow < 0) {
    console.error('Available time slots:', availableTimes);
    throw new Error(
      `Could not find time slot ${appointmentData.time} in week of ${formattedDate}. ` +
      `Available times: ${availableTimes.slice(0, 10).join(', ')}${availableTimes.length > 10 ? '...' : ''}`
    );
  }
  
  // Determine column based on day of week within the week block
  // Within each 5-column block: time col + 0=Time, +1=Monday, +2=Tuesday, +3=Wednesday, +4=Thursday, +5=Friday
  // But since blocks repeat, we need to calculate the offset within the block
  const dayOfWeek = appointmentDate.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // Map day to offset within the week block (relative to time column)
  const dayOffsetMap: Record<number, number> = {
    1: 1,  // Monday = time col + 1
    2: 1,  // Tuesday = time col + 1 (same column as Monday, different week block)
    3: 1,  // Wednesday = time col + 1
    4: 1,  // Thursday = time col + 1
    5: 1,  // Friday = time col + 1
  };
  
  const dayOffset = dayOffsetMap[dayOfWeek];
  
  if (dayOffset === undefined) {
    throw new Error(`Appointment is on weekend (day ${dayOfWeek}), not supported`);
  }
  
  // Calculate the final column as timeColumnIndex + 1 (data always starts 1 column after time)
  const appointmentCol = timeColumnIndex + dayOffset;
  
  console.log('Final cell: row', timeRow, 'col', appointmentCol, '(column', String.fromCharCode(65 + appointmentCol), ')');
  return { row: timeRow, col: appointmentCol };
}

// Get color for status
function getStatusColor(status: string): { red: number; green: number; blue: number } {
  const colors: Record<string, { red: number; green: number; blue: number }> = {
    confirmada: { red: 0.8, green: 1, blue: 0.8 }, // Light green
    cancelada: { red: 1, green: 0.8, blue: 0.8 }, // Light red
    concluida: { red: 0.8, green: 0.9, blue: 1 }, // Light blue
    reagendada: { red: 1, green: 1, blue: 0.8 }, // Light yellow
  };
  
  return colors[status] || { red: 1, green: 1, blue: 1 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appointmentData: AppointmentData = await req.json();
    console.log('Syncing appointment to Sheets:', appointmentData);

    const SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');
    if (!SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Get access token
    const accessToken = await getAccessToken();
    console.log('Got access token');

    // Determine sheet name from date (e.g., "NOVEMBRO/2025")
    const date = new Date(appointmentData.date);
    const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const sheetName = `${monthNames[date.getMonth()]}/${date.getFullYear()}`;
    console.log('Target sheet:', sheetName);

    // Get spreadsheet metadata to find sheetId
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
    const metadataResponse = await fetch(metadataUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.text();
      console.error('Failed to fetch metadata:', error);
      throw new Error(`Failed to fetch metadata: ${error}`);
    }

    const metadata = await metadataResponse.json();
    const targetSheet = metadata.sheets.find((s: any) => s.properties.title === sheetName);
    
    if (!targetSheet) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${metadata.sheets.map((s: any) => s.properties.title).join(', ')}`);
    }

    const sheetId = targetSheet.properties.sheetId;
    console.log('Found sheet with ID:', sheetId);

    // Fetch sheet data (expanded range to cover all weeks)
    const sheetDataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!A1:Z100`;
    const sheetResponse = await fetch(sheetDataUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!sheetResponse.ok) {
      const error = await sheetResponse.text();
      console.error('Failed to fetch sheet:', error);
      throw new Error(`Failed to fetch sheet: ${error}`);
    }

    const sheetData = await sheetResponse.json();
    const values = sheetData.values || [];
    console.log('Fetched sheet data, rows:', values.length);

    // Find cell
    const cell = findCell(values, appointmentData);

    // Convert to A1 notation for the range (4 columns: B-E)
    const colLetter = String.fromCharCode(65 + cell.col); // A=65, so B=66
    const endColLetter = String.fromCharCode(65 + cell.col + 3); // B-E = 4 columns
    const cellAddress = `${colLetter}${cell.row + 1}:${endColLetter}${cell.row + 1}`;
    const range = `${encodeURIComponent(sheetName)}!${cellAddress}`;
    console.log('Writing to range:', cellAddress);

    // Prepare data for 4 columns: [Status, Patient Name, Procedure, Amount Paid]
    const appointmentRow = [
      appointmentData.status,           // Column B/G/K/O/S: Status (confirmada/confirmado)
      appointmentData.patient_name,     // Column C/H/L/P/T: Nome do Paciente
      appointmentData.procedure,        // Column D/I/M/Q/U: Procedimento
      appointmentData.amount_paid       // Column E/J/N/R/V: Valor Pago
    ];

    // Write appointment data across 4 columns
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [appointmentRow]
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update cell:', error);
      throw new Error(`Failed to update cell: ${error}`);
    }

    console.log('Successfully wrote appointment data');

    // Apply formatting (color based on status) to all 4 columns
    const color = getStatusColor(appointmentData.status);
    const formatUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`;
    const formatResponse = await fetch(formatUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: cell.row,
              endRowIndex: cell.row + 1,
              startColumnIndex: cell.col,
              endColumnIndex: cell.col + 4, // 4 columns (B-E)
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: color,
              }
            },
            fields: 'userEnteredFormat.backgroundColor',
          }
        }]
      })
    });

    if (!formatResponse.ok) {
      const error = await formatResponse.text();
      console.warn('Failed to apply formatting:', error);
      // Don't throw - formatting is optional
    } else {
      console.log('Successfully applied formatting');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        range: cellAddress,
        sheet: sheetName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-to-sheets:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
