import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createSupabaseClient();

  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      throw new Error('Phone and message are required');
    }

    console.log(`[TEST] Processing test message from ${phone}: ${message}`);

    // Get conversation history for this test phone
    const { data: conversaData } = await supabase
      .from('conversas')
      .select('id')
      .eq('phone', phone)
      .single();

    let conversaId = conversaData?.id;

    // Create conversation if it doesn't exist
    if (!conversaId) {
      const { data: newConversa } = await supabase
        .from('conversas')
        .insert({ phone, status: 'ativa' })
        .select('id')
        .single();
      conversaId = newConversa?.id;
    }

    // Insert user message (marked as unprocessed initially)
    const { data: insertedMessage } = await supabase.from('mensagens').insert({
      conversa_id: conversaId,
      phone,
      sender: 'user',
      message,
      message_type: 'text',
      processed: false,
    }).select().single();

    // Update message buffer (15-second sliding window) - same as whatsapp-webhook
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15000); // 15 seconds

    await supabase.from('message_buffer').upsert({
      phone: phone,
      last_message_at: now.toISOString(),
      buffer_expires_at: expiresAt.toISOString(),
      processing: false
    });

    console.log(`[TEST] Message buffered. Will be processed after 15s by cron job.`);

    // Return immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message received and buffered. Will be processed by check-buffer cron.',
        buffered_until: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[TEST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
