import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";
import { sendTyping, markAsRead } from '../_shared/zapiHelpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createSupabaseClient();

    const startTime = Date.now(); // Track performance

    // Get configurable timeouts from system_configuration
    // CRITICAL FIX: Use maybeSingle() instead of single() to prevent crash if config is missing
    const { data: systemConfig, error: configError } = await supabase
      .from('system_configuration')
      .select('eliana_response_timeout_minutes, slow_processing_threshold_ms, client_inactivity_timeout_hours')
      .eq('id', 1)
      .maybeSingle();

    if (configError) {
      console.warn('Warning: Could not fetch system_configuration:', configError.message);
    }

    // Use defaults if config is missing - prevents crash
    const ELIANA_RESPONSE_TIMEOUT_MINUTES = systemConfig?.eliana_response_timeout_minutes || 30;
    const SLOW_PROCESSING_THRESHOLD_MS = systemConfig?.slow_processing_threshold_ms || 30000;
    const CLIENT_INACTIVITY_TIMEOUT_HOURS = systemConfig?.client_inactivity_timeout_hours || 24;

    const { phone, messages: batchedMessages } = await req.json();
    console.log('Processing batched messages for:', phone, 'Count:', batchedMessages?.length || 0);

    // Send typing indicator immediately
    console.log(`[${phone}] Sending typing indicator...`);
    const typingResult = await sendTyping(phone, true);
    console.log(`[${phone}] Typing result:`, typingResult);

    // Combine all messages into a single text (for batched messages)
    const messageText = batchedMessages?.map((m: any) => m.message).filter(Boolean).join('\n') || '';
    const lastMessage = batchedMessages?.[batchedMessages.length - 1];
    const messageType = lastMessage?.message_type || 'text';
    const mediaUrl = lastMessage?.media_url || null;
    const messageId = lastMessage?.id || null;

    // OPTIMIZATION: Fetch both conversation and client data
    const { data: conversa } = await supabase
      .from('conversas')
      .select('id, handoff_ativo, handoff_started_at, handoff_block_until, last_message_at')
      .eq('phone', phone)
      .maybeSingle();

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, name, client_name, cpf, email, birth_date, is_existing_patient, total_appointments, last_appointment_date')
      .eq('phone', phone)
      .maybeSingle();

    // Track if handoff was deactivated due to expiry
    let handoffDeactivatedByExpiry = false;

    // Caso 3: Check for expired handoffs BEFORE processing
    if (conversa?.handoff_ativo) {
      const now = new Date();
      const handoffStart = new Date(conversa.handoff_started_at || conversa.last_message_at);
      const hoursSinceHandoff = (now.getTime() - handoffStart.getTime()) / (1000 * 60 * 60);

      // Se > CLIENT_INACTIVITY_TIMEOUT_HOURS, desativar handoff automaticamente
      if (hoursSinceHandoff > CLIENT_INACTIVITY_TIMEOUT_HOURS) {
        console.log(`[Cleanup] Auto-deactivating expired handoff for ${phone} (${hoursSinceHandoff.toFixed(1)}h > ${CLIENT_INACTIVITY_TIMEOUT_HOURS}h)`);

        await supabase
          .from('conversas')
          .update({
            handoff_ativo: false,
            status: 'perdido',
          })
          .eq('phone', phone);

        // Criar alerta
        await supabase.from('system_alerts').insert({
          type: 'handoff_expired',
          phone: phone,
          details: `Handoff expired after ${hoursSinceHandoff.toFixed(1)} hours`,
        });

        // Mark as deactivated so we skip the reactivation check below
        handoffDeactivatedByExpiry = true;
      }
    }

    // Check if handoff block is active and evaluate reactivation conditions
    // Skip if handoff was already deactivated due to expiry above
    if (!handoffDeactivatedByExpiry && conversa?.handoff_ativo && conversa?.handoff_started_at) {
      console.log(`[HANDOFF] Handoff active for ${phone}, checking reactivation...`);

      const now = new Date();
      let shouldReactivateAI = false;

      // CONDITION 1: Check if Eliana responded within configured timeout
      const handoffStarted = new Date(conversa.handoff_started_at);
      const responseTimeoutThreshold = new Date(now.getTime() - ELIANA_RESPONSE_TIMEOUT_MINUTES * 60 * 1000);

      console.log(`[HANDOFF] Handoff started: ${handoffStarted.toISOString()}, ${ELIANA_RESPONSE_TIMEOUT_MINUTES}min threshold: ${responseTimeoutThreshold.toISOString()}`);

      // Check for Eliana's messages (sender = 'human')
      const { data: elianaMessages, error: msgError } = await supabase
        .from("mensagens")
        .select("id, created_at")
        .eq("conversa_id", conversa.id)
        .eq("sender", "human")
        .gte("created_at", handoffStarted.toISOString())
        .limit(1);

      console.log(`[HANDOFF] Eliana messages found: ${elianaMessages?.length || 0}`);

      if (!msgError && (!elianaMessages || elianaMessages.length === 0)) {
        // No messages from Eliana since handoff started
        if (handoffStarted < responseTimeoutThreshold) {
          const minutesSince = Math.floor((now.getTime() - handoffStarted.getTime()) / 60000);
          console.log(`[HANDOFF] ⏰ Eliana didn't respond in ${ELIANA_RESPONSE_TIMEOUT_MINUTES} minutes (${minutesSince} min elapsed). Reactivating AI.`);
          shouldReactivateAI = true;
        } else {
          const minutesSince = Math.floor((now.getTime() - handoffStarted.getTime()) / 60000);
          console.log(`[HANDOFF] Only ${minutesSince} minutes since handoff (timeout: ${ELIANA_RESPONSE_TIMEOUT_MINUTES}). Waiting for Eliana...`);
        }
      } else {
        console.log(`[HANDOFF] ✅ Eliana has responded. Keeping handoff active.`);
      }

      // CONDITION 2: After hours check (10 PM - 6 AM São Paulo time)
      if (!shouldReactivateAI) {
        const saoPauloOffset = -3 * 60; // UTC-3
        const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60 * 1000);
        const hour = saoPauloTime.getUTCHours();

        if (hour >= 22 || hour < 6) {
          console.log(`[HANDOFF] 🌙 After hours (${hour}h São Paulo time). Reactivating AI.`);
          shouldReactivateAI = true;
        }
      }

      // Reactivate AI if conditions met
      if (shouldReactivateAI) {
        console.log(`[HANDOFF] 🔄 Reactivating AI for ${phone}`);
        await supabase
          .from("conversas")
          .update({
            handoff_ativo: false,
            handoff_block_until: null
          })
          .eq("phone", phone);

        // Continue to process with AI (don't block)
        console.log(`[HANDOFF] AI reactivated, continuing to process message...`);
      } else {
        // Block message - handoff still active
        console.log(`[HANDOFF] 🚫 Blocking message - handoff still active, conditions not met`);
        await sendTyping(phone, false); // Stop typing

        // Mark message as read by human
        if (messageId) {
          console.log(`[${phone}] Marking message as read (human block)...`);
          const readResult = await markAsRead(phone, messageId);
          console.log(`[${phone}] Read result:`, readResult);
        }

        return new Response(JSON.stringify({ success: true, message: 'Blocked - Human active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get conversation history (increased to 100 messages for better context)
    // Only get processed messages to avoid reprocessing
    const { data: messages } = await supabase
      .from('mensagens')
      .select('*')
      .eq('phone', phone)
      .eq('processed', true)  // Só mensagens já processadas
      .order('created_at', { ascending: false })
      .limit(100);

    const conversationHistory = (messages || []).reverse();

    // Handoff is controlled ONLY by the handoff_ativo flag in conversas table
    // Which is set when handoff_to_human tool is explicitly called
    // No AI interpretation needed - trust the explicit handoff flag

    // Process media if needed
    let processedText = messageText;
    if (messageType === 'audio' && mediaUrl) {
      const audioUrl = `${supabaseUrl}/functions/v1/process-audio`;
      const audioResponse = await fetch(audioUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ audioUrl: mediaUrl })
      });
      const { transcription } = await audioResponse.json();
      processedText = transcription || messageText;
    } else if (messageType === 'image' && mediaUrl) {
      const imageUrl = `${supabaseUrl}/functions/v1/process-image`;
      const imageResponse = await fetch(imageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ imageUrl: mediaUrl })
      });
      const { description } = await imageResponse.json();
      processedText = description || messageText;
    }

    // Call AI agent
    const aiAgentUrl = `${supabaseUrl}/functions/v1/ai-chat-agent`;
    const aiResponse = await fetch(aiAgentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        phone,
        userMessage: processedText,
        conversationHistory,
        clientContext: {
          isExistingPatient: cliente?.is_existing_patient || false,
          clientName: cliente?.client_name || cliente?.name,
          lastAppointmentDate: cliente?.last_appointment_date,
          totalAppointments: cliente?.total_appointments || 0
        }
      })
    });

    const aiResult = await aiResponse.json();

    // Check if handoff was triggered (n8n tool already sent message to Eliana)
    if (aiResult.handoffTriggered) {
      console.log('Handoff triggered - updating conversation and running analysis');

      // CRITICAL: Do NOT mark messages as processed here
      // Let check-buffer do it atomically via complete_buffer_processing RPC

      // Update conversation with handoff info
      await supabase
        .from('conversas')
        .update({
          handoff_ativo: true,
          handoff_started_at: new Date().toISOString(),
          status: 'aguardando_atendente'
        })
        .eq('phone', phone);

      // Trigger conversation analysis AFTER handoff
      const analyzeUrl = `${supabaseUrl}/functions/v1/supabase-updater`;
      fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ phone, conversationHistory })
      }).catch(err => console.error('Error analyzing conversation:', err));

      return new Response(JSON.stringify({ success: true, message: 'Handoff processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For normal flow (no handoff), run analysis AFTER sending message
    // This ensures client data is created/updated with conversation context

    // Send AI response via WhatsApp
    if (aiResult.response) {
      const sendUrl = `${supabaseUrl}/functions/v1/send-whatsapp`;

      // Mark message as read before responding
      if (messageId) {
        await markAsRead(phone, messageId);
      }

      // CRITICAL: Do NOT mark messages as processed here
      // Let check-buffer do it atomically via complete_buffer_processing RPC

      await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ phone, message: aiResult.response })
      });

      // Stop typing after sending message

      // Trigger conversation analysis AFTER sending message
      const analyzeUrl = `${supabaseUrl}/functions/v1/supabase-updater`;
      fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ phone, conversationHistory })
      }).catch(err => console.error('Error analyzing conversation:', err));
    }

    // Performance monitoring with configurable threshold
    const duration = Date.now() - startTime;
    console.log(`[Performance] Processing took ${duration}ms`);

    if (duration > SLOW_PROCESSING_THRESHOLD_MS) {
      console.warn(`⚠️ SLOW: Processing took ${duration}ms (threshold: ${SLOW_PROCESSING_THRESHOLD_MS}ms)`);

      await supabase.from('system_alerts').insert({
        type: 'slow_processing',
        phone: phone,
        details: `Processing took ${duration}ms (threshold: ${SLOW_PROCESSING_THRESHOLD_MS}ms)`,
      });
    }

    return new Response(JSON.stringify({ success: true, duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Process message error:', error);

    // Stop typing on error
    try {
      const { phone } = await req.clone().json();
      if (phone) await sendTyping(phone, false);
    } catch (err) {
      console.warn("Failed to stop typing indicator:", err);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
