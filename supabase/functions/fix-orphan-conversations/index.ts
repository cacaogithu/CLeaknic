import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Fix-orphan-conversations called`);

  try {
    const supabase = createSupabaseClient();
    
    // Get all conversations without cliente_id
    const { data: orphans, error: orphansError } = await supabase
      .from('conversas')
      .select('id, phone')
      .is('cliente_id', null);

    if (orphansError) {
      console.error('Error fetching orphan conversations:', orphansError);
      throw orphansError;
    }

    console.log(`[${requestId}] Found ${orphans?.length || 0} orphan conversations`);

    const results = {
      total: orphans?.length || 0,
      fixed: 0,
      created: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const orphan of orphans || []) {
      try {
        console.log(`[${requestId}] Processing orphan conversation ${orphan.id} for ${orphan.phone}`);

        // Try to find existing client
        const { data: existingClient, error: clientError } = await supabase
          .from('clientes')
          .select('id')
          .eq('phone', orphan.phone)
          .single();

        let clienteId: number;

        if (existingClient) {
          // Client exists, link it
          clienteId = existingClient.id;
          console.log(`[${requestId}] Found existing client ${clienteId} for ${orphan.phone}`);
        } else {
          // Client doesn't exist, create one
          const { data: newClient, error: createError } = await supabase
            .from('clientes')
            .insert({
              phone: orphan.phone,
              status: 'lead',
              stage: 'conexao',
              first_contact_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (createError) throw createError;

          clienteId = newClient.id;
          results.created++;
          console.log(`[${requestId}] Created new client ${clienteId} for ${orphan.phone}`);
        }

        // Update conversation with cliente_id
        const { error: updateError } = await supabase
          .from('conversas')
          .update({ cliente_id: clienteId })
          .eq('id', orphan.id);

        if (updateError) throw updateError;

        results.fixed++;
        console.log(`[${requestId}] Fixed conversation ${orphan.id} -> cliente ${clienteId}`);

      } catch (error: any) {
        console.error(`[${requestId}] Failed to fix conversation ${orphan.id}:`, error.message);
        results.failed++;
        results.errors.push({
          conversationId: orphan.id,
          phone: orphan.phone,
          error: error.message
        });
      }
    }

    console.log(`[${requestId}] Fix complete:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Fix orphans error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
