import { createSupabaseClient } from '../_shared/createSupabaseClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetUpdate {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  patientName: string;
  patientPhone: string;
  status: string;
  doctor: string;
  procedure: string;
  sheetName: string;
  rowNumber: number;
  appointmentId?: string; // Optional Stable ID
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createSupabaseClient();

  try {
    const update: SheetUpdate = await req.json();
    console.log('[Sheets] Received update:', update);

    // Validar dados obrigatórios
    if (!update.date || !update.time || !update.patientPhone || !update.doctor) {
      throw new Error('Missing required fields: date, time, patientPhone, or doctor');
    }

    // Normalizar telefone (remover espaços, caracteres especiais)
    const phone = update.patientPhone.replace(/\D/g, '');
    if (phone.length < 10) {
      throw new Error('Invalid phone number');
    }

    // Buscar ou criar cliente
    const { data: initialCliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, phone, name, total_appointments')
      .eq('phone', phone)
      .maybeSingle();

    let cliente = initialCliente;

    if (clienteError) throw clienteError;

    if (!cliente) {
      console.log('[Sheets] Creating new client:', phone);
      const { data: newCliente, error: insertError } = await supabase
        .from('clientes')
        .insert({
          phone,
          name: update.patientName || 'Paciente',
          status: 'lead',
          stage: 'agendamento',
          first_contact_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      cliente = newCliente;
    } else if (update.patientName && cliente.name !== update.patientName) {
      // Atualizar nome se fornecido e diferente
      await supabase
        .from('clientes')
        .update({ name: update.patientName })
        .eq('id', cliente.id);
    }

    // Buscar doctor_id
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, name')
      .ilike('name', `%${update.doctor}%`)
      .maybeSingle();

    if (doctorError) throw doctorError;

    const doctor_id = doctor?.id || null;
    if (!doctor_id) {
      console.warn('[Sheets] Doctor not found:', update.doctor);
    }

    // Criar datetime combinando date e time
    const datetime = `${update.date}T${update.time}:00`;

    // ---------------------------------------------------------
    // STABLE ID LOGIC
    // ---------------------------------------------------------
    let existingAppt = null;

    // 1. Try to find by ID if provided
    if (update.appointmentId) {
      const { data: apptById } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('id', update.appointmentId)
        .maybeSingle();

      if (apptById) {
        console.log('[Sheets] Found appointment by ID:', apptById.id);
        existingAppt = apptById;
      } else {
        console.warn('[Sheets] Provided ID not found in DB:', update.appointmentId);
        // Fallback to search by content? Or treat as new?
        // Let's fallback to content search to be safe against bad IDs
      }
    }

    // 2. Fallback: Find by content (phone + date + time)
    // Only if not found by ID yet
    if (!existingAppt) {
      const { data: apptByContent } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('phone', phone)
        .eq('appointment_date', update.date)
        .eq('appointment_time', update.time)
        .maybeSingle();

      if (apptByContent) {
        console.log('[Sheets] Found appointment by Content (Legacy):', apptByContent.id);
        existingAppt = apptByContent;
      }
    }

    if (!cliente) {
      throw new Error('Failed to create or fetch client');
    }

    if (existingAppt) {
      // Atualizar appointment existente
      console.log('[Sheets] Updating existing appointment:', existingAppt.id);
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: update.status || 'confirmada',
          doctor_id,
          procedure: update.procedure || null,
          datetime, // Update datetime in case it changed
          appointment_date: update.date, // Update date
          appointment_time: update.time, // Update time
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAppt.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          action: 'updated',
          appointmentId: existingAppt.id,
          clienteId: cliente.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Criar novo appointment
      console.log('[Sheets] Creating new appointment for:', phone);
      const { data: newAppt, error: insertError } = await supabase
        .from('appointments')
        .insert({
          phone,
          cliente_id: cliente.id,
          appointment_date: update.date,
          appointment_time: update.time,
          datetime,
          status: update.status || 'confirmada',
          doctor_id,
          procedure: update.procedure || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar cliente
      await supabase
        .from('clientes')
        .update({
          stage: 'agendamento',
          total_appointments: (cliente.total_appointments || 0) + 1,
          last_appointment_date: update.date,
        })
        .eq('id', cliente.id);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'created',
          appointmentId: newAppt.id,
          clienteId: cliente.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('[Sheets] Error processing update:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
