import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

/**
 * Edge Function: create-recalls
 *
 * Detecta automaticamente casos que precisam de recall e cria followups:
 * 1. Consultas concluídas sem agendamento de procedimento (2-5 dias)
 * 2. Procedimentos realizados (7-10 dias) - Chamado manualmente via PostAppointmentDialog
 * 3. Orçamentos enviados sem agendamento (7-15 dias) - Via trigger no banco
 *
 * Esta função roda via cron diariamente para catch-up de casos perdidos
 */

/**
 * Helper: Convert São Paulo hour to UTC
 * São Paulo is UTC-3, so 10 AM São Paulo = 13:00 UTC
 */
function saoPauloHourToUTC(date: Date, saoPauloHour: number): Date {
  const result = new Date(date);
  const utcHour = saoPauloHour + 3; // Convert São Paulo time to UTC
  result.setUTCHours(utcHour, 0, 0, 0);
  return result;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecallConfig {
  recall_type: string;
  enabled: boolean;
  delay_days_min: number;
  delay_days_max: number;
  send_hour: number;
  message_template: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Create-recalls started`);

  try {
    const supabase = createSupabaseClient();
    const stats = {
      post_consultation_created: 0,
      post_procedure_created: 0,
      budget_created: 0,
      skipped: 0,
      errors: 0
    };

    // Buscar configurações de recall
    const { data: configs, error: configError } = await supabase
      .from('recall_config')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      throw new Error(`Failed to fetch recall configs: ${configError.message}`);
    }

    const configMap = new Map<string, RecallConfig>();
    configs?.forEach(c => configMap.set(c.recall_type, c));

    // ============================================
    // 1. RECALL PÓS-CONSULTA
    // ============================================
    const postConsultationConfig = configMap.get('post_consultation');
    if (postConsultationConfig) {
      console.log(`[${requestId}] Processing post-consultation recalls...`);

      // Buscar consultas concluídas nos últimos X dias que não têm recall
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - postConsultationConfig.delay_days_max - 1);

      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() - postConsultationConfig.delay_days_min);

      const { data: completedConsultations, error: consultError } = await supabase
        .from('appointments')
        .select(`
          id,
          phone,
          appointment_date,
          procedure,
          cliente_id,
          status
        `)
        .eq('status', 'completed')
        .gte('appointment_date', minDate.toISOString().split('T')[0])
        .lte('appointment_date', maxDate.toISOString().split('T')[0]);

      if (consultError) {
        console.error(`[${requestId}] Error fetching consultations:`, consultError);
      } else {
        console.log(`[${requestId}] Found ${completedConsultations?.length || 0} completed consultations to check`);

        for (const consultation of completedConsultations || []) {
          try {
            // Verificar se já existe recall para esta consulta
            const { data: existingRecall } = await supabase
              .from('followups')
              .select('id')
              .eq('appointment_id', consultation.id)
              .eq('recall_type', 'post_consultation')
              .maybeSingle();

            if (existingRecall) {
              stats.skipped++;
              continue;
            }

            // Verificar se há agendamento futuro (procedimento agendado)
            const { data: futureAppointment } = await supabase
              .from('appointments')
              .select('id')
              .eq('phone', consultation.phone)
              .gt('appointment_date', consultation.appointment_date)
              .not('status', 'in', '("cancelada_paciente","no_show")')
              .maybeSingle();

            if (futureAppointment) {
              stats.skipped++;
              continue;
            }

            // Buscar dados do cliente
            const { data: client } = await supabase
              .from('clientes')
              .select('id, name, client_name')
              .eq('phone', consultation.phone)
              .maybeSingle();

            // Buscar conversa
            const { data: conversa } = await supabase
              .from('conversas')
              .select('id')
              .eq('phone', consultation.phone)
              .order('last_message_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Calcular data de envio com timezone São Paulo
            const delayDays = postConsultationConfig.delay_days_min +
              Math.floor(Math.random() * (postConsultationConfig.delay_days_max - postConsultationConfig.delay_days_min + 1));

            const consultationDate = new Date(consultation.appointment_date);
            const targetDate = new Date(consultationDate);
            targetDate.setDate(targetDate.getDate() + delayDays);
            
            // Convert São Paulo hour to UTC
            let scheduledFor = saoPauloHourToUTC(targetDate, postConsultationConfig.send_hour);

            // Se a data de envio já passou, agendar para amanhã no horário configurado (São Paulo time)
            const now = new Date();
            if (scheduledFor < now) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              scheduledFor = saoPauloHourToUTC(tomorrow, postConsultationConfig.send_hour);
            }

            // Montar mensagem
            let message = postConsultationConfig.message_template;
            const clientName = client?.name || client?.client_name || 'paciente';
            message = message.replace(/{nome}/g, clientName);
            message = message.replace(/{data_consulta}/g, consultationDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            message = message.replace(/{procedimento}/g, consultation.procedure || 'consulta');

            // Criar recall
            const { error: insertError } = await supabase
              .from('followups')
              .insert({
                phone: consultation.phone,
                cliente_id: client?.id || consultation.cliente_id,
                conversa_id: conversa?.id,
                appointment_id: consultation.id,
                type: 'recall',
                recall_type: 'post_consultation',
                trigger_event: 'consultation_completed',
                trigger_event_date: consultation.appointment_date,
                scheduled_for: scheduledFor.toISOString(),
                message: message,
                status: 'pendente',
                metadata: {
                  appointment_id: consultation.id,
                  consultation_date: consultation.appointment_date,
                  procedure: consultation.procedure,
                  delay_days: delayDays,
                  created_by: 'create-recalls-cron'
                }
              });

            if (insertError) {
              console.error(`[${requestId}] Error creating recall for ${consultation.phone}:`, insertError);
              stats.errors++;
            } else {
              console.log(`[${requestId}] Created post-consultation recall for ${consultation.phone}`);
              stats.post_consultation_created++;
            }
          } catch (err) {
            console.error(`[${requestId}] Error processing consultation ${consultation.id}:`, err);
            stats.errors++;
          }
        }
      }
    }

    // ============================================
    // 2. RECALL DE ORÇAMENTOS (catch-up)
    // ============================================
    const budgetConfig = configMap.get('budget_not_scheduled');
    if (budgetConfig) {
      console.log(`[${requestId}] Processing budget recalls (catch-up)...`);

      // Buscar orçamentos sem agendamento nos últimos X dias
      const minBudgetDate = new Date();
      minBudgetDate.setDate(minBudgetDate.getDate() - budgetConfig.delay_days_max - 1);

      const { data: pendingBudgets, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('appointment_scheduled', false)
        .eq('recall_sent', false)
        .gte('sent_at', minBudgetDate.toISOString());

      if (budgetError) {
        console.error(`[${requestId}] Error fetching budgets:`, budgetError);
      } else {
        console.log(`[${requestId}] Found ${pendingBudgets?.length || 0} pending budgets to check`);

        for (const budget of pendingBudgets || []) {
          try {
            // Verificar se já existe recall
            const { data: existingRecall } = await supabase
              .from('followups')
              .select('id')
              .eq('budget_id', budget.id)
              .eq('recall_type', 'budget_not_scheduled')
              .maybeSingle();

            if (existingRecall) {
              stats.skipped++;
              continue;
            }

            // Verificar se paciente agendou (pode ter agendado sem vincular ao orçamento)
            const { data: recentAppointment } = await supabase
              .from('appointments')
              .select('id')
              .eq('phone', budget.phone)
              .gt('created_at', budget.sent_at)
              .maybeSingle();

            if (recentAppointment) {
              // Atualizar orçamento como agendado
              await supabase
                .from('budgets')
                .update({ appointment_scheduled: true, appointment_id: recentAppointment.id })
                .eq('id', budget.id);
              stats.skipped++;
              continue;
            }

            // Calcular tempo desde o orçamento
            const budgetDate = new Date(budget.sent_at);
            const daysSinceBudget = Math.floor((Date.now() - budgetDate.getTime()) / (1000 * 60 * 60 * 24));

            // Se ainda não passou o tempo mínimo, pular
            if (daysSinceBudget < budgetConfig.delay_days_min) {
              stats.skipped++;
              continue;
            }

            // Buscar dados do cliente
            const { data: client } = await supabase
              .from('clientes')
              .select('id, name, client_name')
              .eq('phone', budget.phone)
              .maybeSingle();

            // Buscar conversa
            const { data: conversa } = await supabase
              .from('conversas')
              .select('id')
              .eq('phone', budget.phone)
              .order('last_message_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Calcular data de envio (amanhã no horário configurado em São Paulo)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const scheduledFor = saoPauloHourToUTC(tomorrow, budgetConfig.send_hour);

            // Montar mensagem
            let message = budgetConfig.message_template;
            const clientName = client?.name || client?.client_name || 'paciente';
            message = message.replace(/{nome}/g, clientName);
            message = message.replace(/{tratamento}/g, budget.treatment_name || 'seu tratamento');

            // Criar recall
            const { error: insertError } = await supabase
              .from('followups')
              .insert({
                phone: budget.phone,
                cliente_id: client?.id || budget.cliente_id,
                conversa_id: conversa?.id || budget.conversa_id,
                budget_id: budget.id,
                type: 'recall',
                recall_type: 'budget_not_scheduled',
                trigger_event: 'budget_sent',
                trigger_event_date: budget.sent_at,
                scheduled_for: scheduledFor.toISOString(),
                message: message,
                status: 'pendente',
                metadata: {
                  budget_id: budget.id,
                  treatment_name: budget.treatment_name,
                  budget_value: budget.budget_value,
                  days_since_budget: daysSinceBudget,
                  created_by: 'create-recalls-cron'
                }
              });

            if (insertError) {
              console.error(`[${requestId}] Error creating budget recall for ${budget.phone}:`, insertError);
              stats.errors++;
            } else {
              console.log(`[${requestId}] Created budget recall for ${budget.phone}`);
              stats.budget_created++;
            }
          } catch (err) {
            console.error(`[${requestId}] Error processing budget ${budget.id}:`, err);
            stats.errors++;
          }
        }
      }
    }

    // ============================================
    // 3. Limpar recalls antigos não enviados
    // ============================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldRecalls } = await supabase
      .from('followups')
      .update({
        status: 'expired',
        metadata: { expired_reason: 'Too old to send', expired_at: new Date().toISOString() }
      })
      .eq('status', 'pendente')
      .eq('type', 'recall')
      .lt('scheduled_for', thirtyDaysAgo.toISOString())
      .select('id');

    const expiredCount = oldRecalls?.length || 0;
    if (expiredCount > 0) {
      console.log(`[${requestId}] Expired ${expiredCount} old recalls`);
    }

    console.log(`[${requestId}] Create-recalls completed:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        expired: expiredCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${requestId}] Create-recalls error:`, error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
