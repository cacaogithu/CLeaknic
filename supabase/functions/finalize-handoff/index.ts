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
    const supabase = createSupabaseClient();

    const { phone, reason } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Finalize Handoff] Processing for ${phone}, reason: ${reason}`);

    // 1. Buscar cliente e última conversa
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, name, stage, payment_status')
      .eq('phone', phone)
      .single();

    if (!cliente) {
      console.log(`[Finalize Handoff] Cliente not found for ${phone}`);
      return new Response(
        JSON.stringify({ error: 'Cliente not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar último appointment confirmado
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, procedure, doctor_id, doctors(name)')
      .eq('cliente_id', cliente.id)
      .eq('status', 'confirmada')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();


    // 4. Atualizar stage do cliente se necessário
    const oldStage = cliente.stage;
    let newStage = oldStage;
    const updates: Record<string, string> = {};

    if (reason === 'completed' && appointment) {
      // Se tem appointment e foi completado, mover para consulta
      if (oldStage === 'conexao' || oldStage === 'qualificacao') {
        newStage = 'consulta';
        updates.stage = newStage;
      }

      // Atualizar payment_status se foi completado
      if (cliente.payment_status !== 'pago') {
        updates.payment_status = 'pago';
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('clientes')
        .update(updates)
        .eq('id', cliente.id);

      console.log(`[Finalize Handoff] Cliente updated:`, updates);
    }

    // 5. Registrar evento na pipeline se mudou de stage
    if (newStage !== oldStage) {
      await supabase.from('pipeline_events').insert({
        cliente_id: cliente.id,
        old_stage: oldStage,
        new_stage: newStage,
        changed_by: 'Eliana (handoff)',
        changed_at: new Date().toISOString()
      });

      console.log(`[Finalize Handoff] Pipeline event: ${oldStage} -> ${newStage}`);
    }

    // 6. Desativar handoff na conversa
    await supabase
      .from('conversas')
      .update({
        handoff_ativo: false,
        handoff_block_until: null,
        status: reason === 'completed' ? 'finalizada' : 'cancelada',
        updated_at: new Date().toISOString()
      })
      .eq('phone', phone);

    console.log(`[Finalize Handoff] Handoff desativado para ${phone}`);

    return new Response(
      JSON.stringify({
        success: true,
        stageChanged: newStage !== oldStage,
        oldStage,
        newStage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Finalize Handoff] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
