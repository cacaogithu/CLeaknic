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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { phone, conversationHistory } = await req.json();
    console.log('Analyzing handoff status for:', phone);

    // Format conversation history
    const formattedHistory = conversationHistory
      .slice(-10) // Last 10 messages only
      .map((msg: any) => `${msg.sender === 'user' ? 'Cliente' : msg.sender === 'human' ? 'Atendente' : 'Bot'}: ${msg.message}`)
      .join('\n');

    // Use Lovable AI (Gemini) to detect handoff
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Você é um analisador de status de atendimento.

Analise o histórico de chat abaixo e determine se o BOT deve responder ou não.

REGRAS:
1. Se um humano (Eliana, atendente, Sil) assumiu o atendimento RECENTEMENTE → Responda: BLOCK
2. Se NÃO houve transferência para humano → Responda: ALLOW
3. Se a última mensagem é do HUMANO atendendo → Responda: BLOCK
4. Se o atendente disse que vai chamar alguém ou passou para humano → Responda: BLOCK

Pense cuidadosamente.

IMPORTANTE: Responda APENAS uma palavra: BLOCK ou ALLOW`
          },
          {
            role: 'user',
            content: formattedHistory
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Lovable AI error:', response.status, await response.text());
      // Default to ALLOW on error
      return new Response(JSON.stringify({ shouldBlock: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const decision = result.choices[0].message.content.trim().toUpperCase();
    const shouldBlock = decision === 'BLOCK';

    console.log('Handoff analysis decision:', decision);

    // If blocked, update conversation status
    if (shouldBlock) {
      const supabase = createSupabaseClient();

      await supabase
        .from('conversas')
        .update({ handoff_ativo: true })
        .eq('phone', phone);
    }

    return new Response(JSON.stringify({ shouldBlock }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analyze handoff error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ shouldBlock: false, error: errorMessage }), {
      status: 200, // Don't fail the request
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
