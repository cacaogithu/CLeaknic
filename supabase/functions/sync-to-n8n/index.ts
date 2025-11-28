import { createSupabaseClient } from '../_shared/createSupabaseClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentPayload {
  type: string;
  table: string;
  record: {
    id: number;
    phone: string;
    appointment_date: string;
    appointment_time: string;
    procedure: string;
    status: string;
    cliente_id: number;
    doctor_id?: number;
    notes?: string;
    created_at?: string;
  };
  old_record?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();
    const payload: AppointmentPayload = await req.json();

    console.log('[sync-to-n8n] Received payload:', JSON.stringify(payload, null, 2));

    const { record } = payload;

    // Buscar dados do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, name, phone, email, cpf, birth_date')
      .eq('id', record.cliente_id)
      .single();

    if (clienteError) {
      console.error('[sync-to-n8n] Error fetching cliente:', clienteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch client data',
          details: clienteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar dados do médico (se tiver)
    let doctor = null;
    if (record.doctor_id) {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('id, name, specialty')
        .eq('id', record.doctor_id)
        .single();

      if (!doctorError && doctorData) {
        doctor = doctorData;
      }
    }

    // Montar payload completo para N8n
    const n8nPayload = {
      type: payload.type,
      table: payload.table,
      appointment: {
        id: record.id,
        phone: record.phone,
        appointment_date: record.appointment_date,
        appointment_time: record.appointment_time,
        procedure: record.procedure,
        status: record.status,
        notes: record.notes || '',
        created_at: record.created_at,
      },
      client: {
        id: cliente.id,
        name: cliente.name || 'Cliente',
        phone: cliente.phone,
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        birth_date: cliente.birth_date || '',
      },
      doctor: doctor ? {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty || '',
      } : null,
      timestamp: new Date().toISOString(),
    };

    console.log('[sync-to-n8n] Sending to N8n:', JSON.stringify(n8nPayload, null, 2));

    // Obter URLs dos webhooks
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const googleSheetsWebhookUrl = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');
    
    if (!n8nWebhookUrl && !googleSheetsWebhookUrl) {
      console.error('[sync-to-n8n] Neither N8N_WEBHOOK_URL nor GOOGLE_SHEETS_WEBHOOK_URL configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No webhook URLs configured in secrets' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar payload para Google Sheets (formato simplificado)
    const sheetsPayload = {
      appointmentDate: record.appointment_date,
      appointmentTime: record.appointment_time,
      doctor: doctor ? doctor.name : 'N/A',
      name: cliente.name || 'Cliente',
      procedure: record.procedure,
      phone: cliente.phone,
      status: record.status,
      cpf: cliente.cpf || '',
      email: cliente.email || '',
      birthDate: cliente.birth_date || '',
    };

    const startTime = Date.now();
    const results: any = {};

    // Enviar para N8n se configurado
    if (n8nWebhookUrl) {
      try {
        console.log('[sync-to-n8n] Sending to N8n...');
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload),
        });

        const n8nResponseData = await n8nResponse.text();
        const n8nResponseTime = Date.now() - startTime;

        console.log('[sync-to-n8n] N8n response:', {
          status: n8nResponse.status,
          responseTime: n8nResponseTime,
          body: n8nResponseData,
        });

        // Log N8n webhook
        await supabase.from('n8n_webhook_logs').insert({
          endpoint: 'n8n-webhook',
          request_params: n8nPayload,
          response_data: n8nResponseData ? JSON.parse(n8nResponseData) : null,
          status_code: n8nResponse.status,
          response_time_ms: n8nResponseTime,
          success: n8nResponse.ok,
          error_message: n8nResponse.ok ? null : `HTTP ${n8nResponse.status}: ${n8nResponseData}`,
        });

        results.n8n = {
          success: n8nResponse.ok,
          status: n8nResponse.status,
          data: n8nResponseData,
        };
      } catch (error: any) {
        console.error('[sync-to-n8n] N8n error:', error);
        results.n8n = {
          success: false,
          error: error.message,
        };
      }
    }

    // Enviar para Google Sheets se configurado
    if (googleSheetsWebhookUrl) {
      try {
        console.log('[sync-to-n8n] Sending to Google Sheets...');
        const sheetsResponse = await fetch(googleSheetsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sheetsPayload),
        });

        const sheetsResponseData = await sheetsResponse.text();
        const sheetsResponseTime = Date.now() - startTime;

        console.log('[sync-to-n8n] Google Sheets response:', {
          status: sheetsResponse.status,
          responseTime: sheetsResponseTime,
          body: sheetsResponseData,
        });

        // Log Google Sheets webhook
        await supabase.from('n8n_webhook_logs').insert({
          endpoint: 'google-sheets-webhook',
          request_params: sheetsPayload,
          response_data: sheetsResponseData ? JSON.parse(sheetsResponseData) : null,
          status_code: sheetsResponse.status,
          response_time_ms: sheetsResponseTime,
          success: sheetsResponse.ok,
          error_message: sheetsResponse.ok ? null : `HTTP ${sheetsResponse.status}: ${sheetsResponseData}`,
        });

        results.sheets = {
          success: sheetsResponse.ok,
          status: sheetsResponse.status,
          data: sheetsResponseData,
        };
      } catch (error: any) {
        console.error('[sync-to-n8n] Google Sheets error:', error);
        results.sheets = {
          success: false,
          error: error.message,
        };
      }
    }

    const totalResponseTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sync completed',
        results,
        responseTime: totalResponseTime,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[sync-to-n8n] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
