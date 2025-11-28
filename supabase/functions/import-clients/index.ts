import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportClient {
  name: string;
  phone: string;
  cpf?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clients } = await req.json() as { clients: ImportClient[] };

    if (!clients || !Array.isArray(clients)) {
      throw new Error("Invalid clients data");
    }

    const supabase = createSupabaseClient();
    let imported = 0;
    let updated = 0;

    for (const client of clients) {
      if (!client.phone) continue;

      // Check if client exists by phone or CPF
      const { data: existing } = await supabase
        .from("clientes")
        .select("id, phone, cpf")
        .or(`phone.eq.${client.phone}${client.cpf ? `,cpf.eq.${client.cpf}` : ""}`)
        .single();

      if (existing) {
        // Update existing client
        await supabase
          .from("clientes")
          .update({
            name: client.name || existing.phone,
            client_name: client.name || existing.phone,
            cpf: client.cpf || existing.cpf,
            is_existing_patient: true,
            lead_source: "planilha_eliana",
            status: "cliente",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        
        updated++;
      } else {
        // Create new client
        await supabase
          .from("clientes")
          .insert({
            phone: client.phone,
            name: client.name || client.phone,
            client_name: client.name || client.phone,
            cpf: client.cpf,
            is_existing_patient: true,
            lead_source: "planilha_eliana",
            status: "cliente",
            stage: "conexao",
            first_contact_at: new Date().toISOString(),
          });
        
        imported++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported, 
        updated,
        total: clients.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
