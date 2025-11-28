import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

serve(async (req) => {
  const cleanupId = crypto.randomUUID();
  console.log(`[Cleanup ${cleanupId}] Starting cleanup job`);

  try {
    const supabase = createSupabaseClient();

    // Get configurable timeouts from system_configuration
    const { data: config, error: configError } = await supabase
      .from('system_configuration')
      .select('eliana_inactivity_timeout_hours, client_inactivity_timeout_hours')
      .eq('id', 1)
      .single();

    if (configError) {
      console.error(`[Cleanup ${cleanupId}] Error fetching config:`, configError);
      // Log critical error alert
      await supabase.from('system_alerts').insert({
        type: 'cleanup_critical_error',
        details: `Failed to fetch system configuration: ${configError.message}`,
      });
    }

    const ELIANA_TIMEOUT_HOURS = config?.eliana_inactivity_timeout_hours || 2;
    const CLIENT_TIMEOUT_HOURS = config?.client_inactivity_timeout_hours || 24;

    const now = new Date();
    const elianaTimeoutThreshold = new Date(now.getTime() - ELIANA_TIMEOUT_HOURS * 60 * 60 * 1000);
    const clientTimeoutThreshold = new Date(now.getTime() - CLIENT_TIMEOUT_HOURS * 60 * 60 * 1000);

    console.log(`[Cleanup ${cleanupId}] Using timeouts: Eliana=${ELIANA_TIMEOUT_HOURS}h, Client=${CLIENT_TIMEOUT_HOURS}h`);

    let deactivatedEliana = 0;
    let finalizedClient = 0;
    let staleHandoffs = 0;
    const errors: string[] = [];

    // 1. Deactivate handoffs older than ELIANA_TIMEOUT_HOURS (Eliana inactivity)
    try {
      const { data: elianaInactive, error: elianaError } = await supabase
        .from('conversas')
        .select('id, phone')
        .eq('handoff_ativo', true)
        .lt('handoff_started_at', elianaTimeoutThreshold.toISOString());

      if (elianaError) {
        console.error(`[Cleanup ${cleanupId}] Error fetching Eliana inactive:`, elianaError);
        errors.push(`Eliana query: ${elianaError.message}`);
      } else if (elianaInactive && elianaInactive.length > 0) {
        const { error: updateError } = await supabase
          .from('conversas')
          .update({ handoff_ativo: false })
          .in('id', elianaInactive.map(c => c.id));

        if (updateError) {
          console.error(`[Cleanup ${cleanupId}] Error deactivating Eliana handoffs:`, updateError);
          errors.push(`Eliana update: ${updateError.message}`);
        } else {
          deactivatedEliana = elianaInactive.length;
          console.log(`[Cleanup ${cleanupId}] Deactivated ${deactivatedEliana} handoffs (${ELIANA_TIMEOUT_HOURS}h Eliana inactivity)`);

          // Log alert for each deactivated handoff
          for (const conv of elianaInactive) {
            await supabase.from('system_alerts').insert({
              type: 'eliana_timeout',
              phone: conv.phone,
              details: `Handoff deactivated after ${ELIANA_TIMEOUT_HOURS}h without Eliana activity`,
            });
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Eliana section: ${msg}`);
      console.error(`[Cleanup ${cleanupId}] Eliana section error:`, err);
    }

    // 2. Check for stale handoffs (active > 2h but NO human response)
    try {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const { data: staleHandoffData } = await supabase
        .from('conversas')
        .select('id, phone, handoff_started_at')
        .eq('handoff_ativo', true)
        .lt('last_message_at', twoHoursAgo.toISOString());

      if (staleHandoffData && staleHandoffData.length > 0) {
        for (const conv of staleHandoffData) {
          // Check if there was any human message since handoff started
          const { data: humanMessages } = await supabase
            .from('mensagens')
            .select('id')
            .eq('conversa_id', conv.id)
            .eq('sender', 'human')
            .gte('created_at', conv.handoff_started_at)
            .limit(1);

          if (!humanMessages || humanMessages.length === 0) {
            // No human response - deactivate and mark as lost
            console.log(`[Cleanup ${cleanupId}] Deactivating stale handoff: ${conv.phone} (no human response)`);

            const { error: updateError } = await supabase
              .from('conversas')
              .update({
                handoff_ativo: false,
                status: 'perdido',
              })
              .eq('id', conv.id);

            if (!updateError) {
              staleHandoffs++;
              await supabase.from('system_alerts').insert({
                type: 'stale_handoff',
                phone: conv.phone,
                details: `Handoff sem resposta de atendente por 2+ horas`,
              });
            } else {
              errors.push(`Stale update ${conv.phone}: ${updateError.message}`);
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Stale section: ${msg}`);
      console.error(`[Cleanup ${cleanupId}] Stale section error:`, err);
    }

    // 3. Finalize conversations with CLIENT_TIMEOUT_HOURS client inactivity
    try {
      const { data: clientInactive, error: clientError } = await supabase
        .from('conversas')
        .select('id, phone')
        .eq('handoff_ativo', true)
        .lt('last_message_at', clientTimeoutThreshold.toISOString());

      if (clientError) {
        console.error(`[Cleanup ${cleanupId}] Error fetching client inactive:`, clientError);
        errors.push(`Client query: ${clientError.message}`);
      } else if (clientInactive && clientInactive.length > 0) {
        const { error: updateError } = await supabase
          .from('conversas')
          .update({
            handoff_ativo: false,
            status: 'perdido'
          })
          .in('id', clientInactive.map(c => c.id));

        if (updateError) {
          console.error(`[Cleanup ${cleanupId}] Error finalizing client conversations:`, updateError);
          errors.push(`Client update: ${updateError.message}`);
        } else {
          finalizedClient = clientInactive.length;
          console.log(`[Cleanup ${cleanupId}] Finalized ${finalizedClient} conversations (${CLIENT_TIMEOUT_HOURS}h client inactivity)`);

          // Log alert for each finalized conversation
          for (const conv of clientInactive) {
            await supabase.from('system_alerts').insert({
              type: 'client_timeout',
              phone: conv.phone,
              details: `Conversation finalized after ${CLIENT_TIMEOUT_HOURS}h without client activity`,
            });
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Client section: ${msg}`);
      console.error(`[Cleanup ${cleanupId}] Client section error:`, err);
    }

    // Log any errors that occurred during cleanup
    if (errors.length > 0) {
      await supabase.from('system_alerts').insert({
        type: 'cleanup_error',
        details: `Cleanup ${cleanupId} completed with ${errors.length} errors: ${errors.join('; ')}`,
      });
    }

    console.log(`[Cleanup ${cleanupId}] Completed: eliana=${deactivatedEliana}, client=${finalizedClient}, stale=${staleHandoffs}, errors=${errors.length}`);

    return new Response(JSON.stringify({
      success: errors.length === 0,
      deactivated_eliana: deactivatedEliana,
      finalized_client: finalizedClient,
      stale_handoffs: staleHandoffs,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Cleanup ${cleanupId}] Critical error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log critical error alert
    try {
      const supabase = createSupabaseClient();
      await supabase.from('system_alerts').insert({
        type: 'cleanup_critical_error',
        details: `Cleanup ${cleanupId} failed: ${errorMessage}`,
      });
    } catch (alertError) {
      console.error(`[Cleanup ${cleanupId}] Failed to log alert:`, alertError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
