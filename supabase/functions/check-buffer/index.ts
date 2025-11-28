import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const supabase = createSupabaseClient();

    // Get configurable timeouts from system_configuration
    const { data: config } = await supabase
      .from('system_configuration')
      .select('buffer_lock_timeout_ms, stuck_buffer_threshold_ms, buffer_retry_delay_ms')
      .eq('id', 1)
      .single();

    const LOCK_TIMEOUT_MS = config?.buffer_lock_timeout_ms || 60000;
    const STUCK_BUFFER_THRESHOLD_MS = config?.stuck_buffer_threshold_ms || 300000;

    const { phone: forcePhone } = await req.json().catch(() => ({}));
    const callOrigin = forcePhone ? 'webhook-force' : 'cron';
    console.log(`[${requestId}] Check-buffer called from: ${callOrigin}${forcePhone ? ` for phone: ${forcePhone}` : ''}`);

    let expiredBuffers;
    let fetchError;

    if (forcePhone) {
      console.log(`[${requestId}] Force mode: processing ${forcePhone} immediately`);
      const result = await supabase
        .from('message_buffer')
        .select('*')
        .eq('phone', forcePhone)
        .eq('processing', false)
        .maybeSingle();
      expiredBuffers = result.data ? [result.data] : [];
      fetchError = result.error;
    } else {
      const now = new Date();
      const result = await supabase
        .from('message_buffer')
        .select('*')
        .lt('buffer_expires_at', now.toISOString())
        .eq('processing', false);
      expiredBuffers = result.data;
      fetchError = result.error;
    }

    if (fetchError) {
      console.error('Error fetching expired buffers:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for stuck buffers (processing=true but locked_at > threshold)
    const stuckThreshold = new Date(Date.now() - STUCK_BUFFER_THRESHOLD_MS).toISOString();
    const { data: stuckBuffers } = await supabase
      .from('message_buffer')
      .select('*')
      .eq('processing', true)
      .lt('locked_at', stuckThreshold);

    if (stuckBuffers && stuckBuffers.length > 0) {
      console.log(`[${requestId}] ⚠️ Found ${stuckBuffers.length} STUCK buffers older than ${STUCK_BUFFER_THRESHOLD_MS}ms`);

      for (const stuck of stuckBuffers) {
        console.log(`[${requestId}] Recovering stuck buffer for ${stuck.phone} (locked by ${stuck.locked_by} at ${stuck.locked_at})`);

        // Reset stuck buffer using CAS to prevent race conditions
        const { error: resetError } = await supabase
          .from('message_buffer')
          .update({
            processing: false,
            locked_at: null,
            locked_by: null,
            buffer_expires_at: new Date().toISOString()
          })
          .eq('phone', stuck.phone)
          .eq('locked_by', stuck.locked_by); // CAS: only if same lock owner

        if (!resetError) {
          // Log alert for stuck buffer recovery
          await supabase.from('system_alerts').insert({
            type: 'stuck_buffer_recovered',
            phone: stuck.phone,
            details: `Buffer was stuck since ${stuck.locked_at}, locked by ${stuck.locked_by}. Recovered for reprocessing.`,
          });
        }
      }
    }

    console.log(`Found ${expiredBuffers?.length || 0} expired buffers`);

    let processedCount = 0;
    let failedCount = 0;

    for (const buffer of expiredBuffers || []) {
      // Use atomic RPC to acquire buffer lock
      const { data: lockResult, error: lockError } = await supabase
        .rpc('acquire_buffer_lock', {
          p_phone: buffer.phone,
          p_request_id: requestId,
          p_force_mode: !!forcePhone
        });

      if (lockError) {
        console.error(`[${requestId}] Error calling acquire_buffer_lock:`, lockError);
        continue;
      }

      const lockData = lockResult?.[0];
      if (!lockData?.success) {
        console.log(`[${requestId}] ${buffer.phone}: ${lockData?.error_message || 'Failed to acquire lock'}`);
        continue;
      }

      console.log(`[${requestId}] Lock acquired for ${buffer.phone}, processing batch`);

      // Get all unprocessed messages for this phone
      const { data: messages, error: msgError } = await supabase
        .from('mensagens')
        .select('*')
        .eq('phone', buffer.phone)
        .eq('processed', false)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error(`[${requestId}] Error fetching messages for ${buffer.phone}:`, msgError);

        // Release lock using RPC
        await supabase.rpc('release_buffer_lock', {
          p_phone: buffer.phone,
          p_request_id: requestId
        });

        failedCount++;
        continue;
      }

      if (!messages || messages.length === 0) {
        console.log(`[${requestId}] No unprocessed messages for ${buffer.phone}, cleaning up buffer`);

        // Use atomic RPC to complete processing (with empty message array)
        await supabase.rpc('complete_buffer_processing', {
          p_phone: buffer.phone,
          p_request_id: requestId,
          p_message_ids: []
        });

        continue;
      }

      // Process messages
      const processUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-message`;
      let processSuccess = false;

      try {
        const response = await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ phone: buffer.phone, messages })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Process-message returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.success || result.message) {
          processSuccess = true;
          console.log(`[${requestId}] ✅ Process-message success for ${buffer.phone}`);
        } else if (result.error) {
          throw new Error(result.error);
        } else {
          // Assume success if no explicit error
          processSuccess = true;
        }
      } catch (processError) {
        console.error(`[${requestId}] ❌ Error in process-message for ${buffer.phone}:`, processError);

        // Log alert for failed processing
        await supabase.from('system_alerts').insert({
          type: 'process_message_failed',
          phone: buffer.phone,
          details: `Failed to process ${messages.length} messages: ${processError instanceof Error ? processError.message : 'Unknown error'}`,
        });
      }

      if (processSuccess) {
        // Use atomic RPC to mark messages as processed AND delete buffer
        const messageIds = messages.map(m => m.id);
        const { data: completeResult, error: completeError } = await supabase
          .rpc('complete_buffer_processing', {
            p_phone: buffer.phone,
            p_request_id: requestId,
            p_message_ids: messageIds
          });

        if (completeError) {
          console.error(`[${requestId}] Error completing buffer processing:`, completeError);
          failedCount++;
        } else {
          const completeData = completeResult?.[0];
          if (completeData?.success) {
            console.log(`[${requestId}] ✅ Completed: ${completeData.messages_marked} messages marked as processed`);
            processedCount++;
          } else {
            console.error(`[${requestId}] Failed to complete: ${completeData?.error_message}`);
            failedCount++;
          }
        }
      } else {
        // Release lock and set retry expiry using RPC
        const { error: releaseError } = await supabase
          .rpc('release_buffer_lock', {
            p_phone: buffer.phone,
            p_request_id: requestId
          });

        if (releaseError) {
          console.error(`[${requestId}] Error releasing lock:`, releaseError);
        }

        failedCount++;
        console.log(`[${requestId}] Buffer released for retry: ${buffer.phone}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      failed: failedCount,
      stuckRecovered: stuckBuffers?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Check buffer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
