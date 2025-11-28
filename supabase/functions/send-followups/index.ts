import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();

    const Z_API_INSTANCE_ID = Deno.env.get('Z_API_INSTANCE_ID');
    const Z_API_TOKEN = Deno.env.get('Z_API_TOKEN');
    const Z_API_CLIENT_TOKEN = Deno.env.get('Z_API_CLIENT_TOKEN');

    if (!Z_API_INSTANCE_ID || !Z_API_TOKEN || !Z_API_CLIENT_TOKEN) {
      throw new Error('Z-API credentials not configured');
    }

    const now = new Date();
    const nowUTC = now.toISOString();
    const nowSaoPaulo = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`[Send Followups] Starting cron job at ${nowUTC} (São Paulo: ${nowSaoPaulo})`);

    // Buscar follow-ups pendentes que já passaram do horário
    const { data: followups, error } = await supabase
      .from('followups')
      .select('*')
      .eq('status', 'pendente')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50); // Processar até 50 por execução

    if (error) {
      throw error;
    }

    if (!followups || followups.length === 0) {
      console.log('[Send Followups] No pending followups to send');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No pending followups' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Send Followups] Found ${followups.length} followups to send`);

    let sentCount = 0;
    let failedCount = 0;

    // Processar cada follow-up with retry logic
    for (const followup of followups) {
      try {
        console.log(`[Send Followups] Sending to ${followup.phone}`);

        // Get conversa_id for this phone to link messages properly
        const { data: conversa } = await supabase
          .from('conversas')
          .select('id')
          .eq('phone', followup.phone)
          .maybeSingle();

        const conversaId = conversa?.id || null;

        // Retry logic with exponential backoff (3 attempts: 0s, 2s, 4s)
        const maxRetries = 3;
        const currentAttempts = followup.attempt_number || 0;
        let sendSuccess = false;
        let lastError = '';

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Enviar via Z-API
            const response = await fetch(
              `https://api.z-api.io/instances/${Z_API_INSTANCE_ID}/token/${Z_API_TOKEN}/send-text`,
              {
                method: 'POST',
                headers: {
                  'Client-Token': Z_API_CLIENT_TOKEN,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  phone: followup.phone,
                  message: followup.message
                })
              }
            );

            if (response.ok) {
              sendSuccess = true;
              break;
            } else {
              lastError = await response.text();
              console.warn(`[Send Followups] Attempt ${attempt}/${maxRetries} failed for ${followup.phone}: ${lastError}`);
            }
          } catch (fetchError) {
            lastError = fetchError instanceof Error ? fetchError.message : 'Unknown error';
            console.warn(`[Send Followups] Attempt ${attempt}/${maxRetries} exception for ${followup.phone}: ${lastError}`);
          }

          // Exponential backoff before retry (2^attempt seconds)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }

        if (sendSuccess) {
          // Atualizar status para enviado
          await supabase
            .from('followups')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', followup.id);

          // Registrar mensagem enviada with conversa_id link
          await supabase.from('mensagens').insert({
            phone: followup.phone,
            conversa_id: conversaId, // Link to conversation for proper history
            sender: 'bot',
            message: followup.message,
            message_type: followup.type === 'recall' ? `recall_${followup.recall_type}` : 'followup',
            processed: true
          });

          // Update recall flags in conversas based on recall_type
          if (followup.type === 'recall' && conversaId) {
            const recallFlagUpdates: Record<string, boolean> = {};

            switch (followup.recall_type) {
              case 'post_consultation':
                recallFlagUpdates.post_consultation_recall_sent = true;
                break;
              case 'post_procedure':
                recallFlagUpdates.post_procedure_recall_sent = true;
                break;
              case 'budget_not_scheduled':
                recallFlagUpdates.budget_recall_sent = true;
                break;
            }

            if (Object.keys(recallFlagUpdates).length > 0) {
              await supabase
                .from('conversas')
                .update(recallFlagUpdates)
                .eq('id', conversaId);

              console.log(`[Send Followups] Updated recall flag for ${followup.recall_type}`);
            }
          }

          // Update budget recall_sent flag if applicable
          if (followup.budget_id) {
            await supabase
              .from('budgets')
              .update({ recall_sent: true })
              .eq('id', followup.budget_id);
          }

          sentCount++;
          console.log(`[Send Followups] ✓ Sent ${followup.type}${followup.recall_type ? ` (${followup.recall_type})` : ''} to ${followup.phone}`);
        } else {
          throw new Error(`Z-API failed after ${maxRetries} attempts: ${lastError}`);
        }

        // Delay de 1 segundo entre envios para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[Send Followups] Failed to send to ${followup.phone}:`, error);

        // Increment attempts counter instead of immediately failing
        const newAttempts = (followup.attempt_number || 0) + 1;

        if (newAttempts >= 3) {
          // Mark as failed after max retries across cron runs
          await supabase
            .from('followups')
            .update({
              status: 'failed',
              attempt_number: newAttempts
            })
            .eq('id', followup.id);

          // Create alert for failed followup
          await supabase.from('system_alerts').insert({
            type: 'followup_failed',
            phone: followup.phone,
            details: `Follow-up failed after ${newAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        } else {
          // Keep as pending but increment attempts for next cron run
          await supabase
            .from('followups')
            .update({
              attempt_number: newAttempts,
              scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 min
            })
            .eq('id', followup.id);

          console.log(`[Send Followups] Will retry ${followup.phone} (attempt ${newAttempts}/3)`);
        }
        const currentAttempts = (followup.attempts || 0) + 1;
        const maxAttempts = 3;

        if (currentAttempts >= maxAttempts) {
          // Mark as failed after max retries
          await supabase
            .from('followups')
            .update({
              status: 'failed',
              attempts: currentAttempts,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', followup.id);

          failedCount++;
          console.log(`[Send Followups] Marked as FAILED after ${currentAttempts} attempts`);
        } else {
          // Just update attempts and keep status as 'pendente' (or 'retry')
          // We can optionally set a 'next_attempt_at' if we want exponential backoff, 
          // but for now just keeping it pending will make it be picked up in the next run (hourly)
          // Ideally we should have a 'next_attempt_at' column to avoid immediate retry loop if we ran more frequently.
          // Assuming hourly cron, immediate retry is fine.

          await supabase
            .from('followups')
            .update({
              attempts: currentAttempts,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', followup.id);

          console.log(`[Send Followups] Scheduled for retry (Attempt ${currentAttempts}/${maxAttempts})`);
        }
      }
    }

    console.log(`[Send Followups] Completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: followups.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Send Followups] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
