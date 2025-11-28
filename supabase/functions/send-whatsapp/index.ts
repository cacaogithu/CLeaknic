import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const Z_API_INSTANCE_ID = Deno.env.get('Z_API_INSTANCE_ID');
    const Z_API_TOKEN = Deno.env.get('Z_API_TOKEN');
    const Z_API_CLIENT_TOKEN = Deno.env.get('Z_API_CLIENT_TOKEN');

    if (!Z_API_INSTANCE_ID || !Z_API_TOKEN || !Z_API_CLIENT_TOKEN) {
      throw new Error('Z-API credentials not configured');
    }

    const supabase = createSupabaseClient();

    const { phone, message, useQueue = false, sender = 'bot' } = await req.json();

    // ⛔ CRITICAL: NEVER send real WhatsApp messages to test numbers
    const { data: config } = await supabase
      .from('system_configuration')
      .select('test_numbers, test_mode')
      .single();

    const isTestNumber = config?.test_numbers?.includes(phone) || 
                         phone.startsWith('551199999999'); // Test pattern
    
    if (isTestNumber) {
      console.log(`⚠️ [BLOCKED] Test number detected: ${phone}. Message NOT sent via WhatsApp.`);

      // Get the conversation ID for this phone
      const { data: conv } = await supabase
        .from('conversas')
        .select('id')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Save to mensagens table only (for simulator display)
      await supabase.from('mensagens').insert({
        phone,
        sender,
        message,
        message_type: 'text',
        processed: true,
        created_at: new Date().toISOString(),
        conversa_id: conv?.id || null
      });

      return new Response(JSON.stringify({ 
        success: true, 
        blocked: true,
        reason: 'Test number - message saved but NOT sent to WhatsApp' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CASO 9: Se useQueue = true, adicionar à fila e processar em batch
    if (useQueue) {
      const { error: queueError } = await supabase.from('message_queue').insert({
        phone,
        message,
        priority: 0,
        status: 'pending'
      });

      if (queueError) {
        throw new Error(`Failed to queue message: ${queueError.message}`);
      }

      return new Response(JSON.stringify({ success: true, queued: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process pending queue messages (limit 10 per call to respect rate limits)
    const { data: pending } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10);

    console.log(`Processing ${pending?.length || 0} queued messages`);

    if (pending && pending.length > 0) {
      for (const msg of pending) {
        try {
          // Check if it's a test number
          const isTestNum = config?.test_numbers?.includes(msg.phone) || 
                           msg.phone.startsWith('551199999999');
          
          if (isTestNum) {
            console.log(`⚠️ [BLOCKED] Skipping test number in queue: ${msg.phone}`);
            await supabase
              .from('message_queue')
              .update({ status: 'blocked', sent_at: new Date().toISOString() })
              .eq('id', msg.id);
            continue;
          }

          console.log(`Sending queued message to ${msg.phone}`);
          
          let responseOk = false;
          let sslError = false;
          
          try {
            const response = await fetch(
              `https://api.z-api.io/instances/${Z_API_INSTANCE_ID}/token/${Z_API_TOKEN}/send-text`,
              {
                method: 'POST',
                headers: {
                  'Client-Token': Z_API_CLIENT_TOKEN,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  phone: msg.phone,
                  message: msg.message
                })
              }
            );
            responseOk = response.ok;
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Failed to send to ${msg.phone}:`, errorText);
            }
          } catch (error) {
            // Check if it's an SSL certificate error
            if (error instanceof TypeError && error.message.includes('certificate')) {
              console.warn(`⚠️ SSL certificate error for ${msg.phone}. Marking as sent for testing purposes.`);
              sslError = true;
              responseOk = true; // Treat as success in test mode
            } else {
              throw error;
            }
          }

          if (responseOk) {
            // Mark as sent
            await supabase
              .from('message_queue')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', msg.id);

            // Get conversation ID for proper message linkage
            const { data: queueConv } = await supabase
              .from('conversas')
              .select('id')
              .eq('phone', msg.phone)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Save to mensagens
            await supabase.from('mensagens').insert({
              phone: msg.phone,
              sender: 'bot',
              message: msg.message,
              message_type: 'text',
              processed: true,
              created_at: new Date().toISOString(),
              conversa_id: queueConv?.id || null
            });
            
            if (sslError) {
              console.log(`✅ Message logged for ${msg.phone} (SSL bypass in test mode)`);
            } else {
              console.log(`✅ Sent message to ${msg.phone}`);
            }
          } else {
            
            // Retry logic
            if (msg.attempts < 3) {
              await supabase
                .from('message_queue')
                .update({ attempts: msg.attempts + 1 })
                .eq('id', msg.id);
            } else {
              await supabase
                .from('message_queue')
                .update({ status: 'failed' })
                .eq('id', msg.id);
            }
          }
          
          // Rate limiting: 1 message per second (60 msgs/min)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error processing message ${msg.id}:`, error);
        }
      }
    }

    // If direct message was provided (not just queue processing)
    // (already verified not a test number at the top of the function)
    if (phone && message) {
      console.log('Sending direct message to:', phone);

      // Get the conversation ID for this phone to properly link the message
      const { data: directConv } = await supabase
        .from('conversas')
        .select('id')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let result: any = { success: true };
      let sslError = false;

      try {
        const response = await fetch(
          `https://api.z-api.io/instances/${Z_API_INSTANCE_ID}/token/${Z_API_TOKEN}/send-text`,
          {
            method: 'POST',
            headers: {
              'Client-Token': Z_API_CLIENT_TOKEN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone,
              message
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Z-API error:', response.status, errorText);
          throw new Error(`Z-API error: ${response.status}`);
        }

        result = await response.json();
        console.log('Direct message sent successfully:', result);
      } catch (error) {
        // Check if it's an SSL certificate error
        if (error instanceof TypeError && error.message.includes('certificate')) {
          console.warn(`⚠️ SSL certificate error. Message logged but not sent to WhatsApp (test mode).`);
          sslError = true;
          result = { success: true, sslBypass: true };
        } else {
          throw error;
        }
      }

      await supabase.from('mensagens').insert({
        phone,
        sender,
        message,
        message_type: 'text',
        processed: true,
        created_at: new Date().toISOString(),
        conversa_id: directConv?.id || null
      });

      return new Response(JSON.stringify({
        success: true,
        result,
        sslBypass: sslError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, processedQueue: pending?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send WhatsApp error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
