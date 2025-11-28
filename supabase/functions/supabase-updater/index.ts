import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYZER_PROMPT = `Você é um assistente que analisa conversas de WhatsApp de uma clínica de estética.

Analise o histórico da conversa e extraia as seguintes informações:

1. SENTIMENTO: positive, neutral, ou negative
2. INTENÇÃO: agendamento, informacao, reclamacao, duvida, ou outro
3. TRATAMENTO MENCIONADO: Qual procedimento estético foi mencionado? (botox, preenchimento, skinbooster, etc.)
4. ESTÁGIO DO LEAD:
   - conexao: Primeiro contato, ainda conhecendo
   - qualificacao: Demonstrou interesse, fazendo perguntas
   - consulta: Quer agendar ou já agendou consulta
   - conversao: Realizou procedimento ou está prestes a realizar
5. RESUMO: Um resumo breve da conversa (máximo 100 palavras)

Retorne APENAS um JSON válido com esta estrutura:
{
  "sentiment": "positive|neutral|negative",
  "intent": "agendamento|informacao|reclamacao|duvida|outro",
  "treatment_mentioned": "nome do tratamento ou null",
  "stage": "conexao|qualificacao|consulta|conversao",
  "summary": "resumo da conversa"
}`;

async function analyzeWithAI(conversationHistory: any[], retryCount = 0): Promise<any> {
  const MAX_RETRIES = 3;
  const MODELS = ['gpt-4', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  const currentModel = MODELS[Math.min(retryCount, MODELS.length - 1)];

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  console.log(`[Attempt ${retryCount + 1}/${MAX_RETRIES}] Using model: ${currentModel}`);

  const formattedConv = conversationHistory
    .map((msg: any) => `${msg.sender === 'user' ? 'Cliente' : 'Bot'}: ${msg.message}`)
    .join('\n');

  try {
    // Try OpenAI first
    if (OPENAI_API_KEY && retryCount < 2) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: 'system', content: ANALYZER_PROMPT },
            { role: 'user', content: formattedConv }
          ],
          temperature: 0.3
        })
      });

      if (response.status === 429) {
        console.warn('OpenAI rate limit hit, will retry...');
        throw new Error('Rate limit');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error:', response.status, errorText);
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const aiResult = await response.json();
      const content = aiResult.choices[0].message.content;
      
      // Try to parse JSON, handle markdown code blocks
      const jsonMatch = content.match(/```json\n?(.*?)\n?```/s) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      
      return JSON.parse(jsonStr.trim());
    }

    // Fallback to Lovable AI (Gemini)
    if (LOVABLE_API_KEY) {
      console.log('Falling back to Lovable AI (Gemini)...');
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: ANALYZER_PROMPT },
            { role: 'user', content: formattedConv }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Lovable AI error: ${response.status}`);
      }

      const aiResult = await response.json();
      const content = aiResult.choices[0].message.content;
      const jsonMatch = content.match(/```json\n?(.*?)\n?```/s) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      
      return JSON.parse(jsonStr.trim());
    }

    throw new Error('No API keys configured');

  } catch (error: any) {
    console.error(`Analysis attempt ${retryCount + 1} failed:`, error.message);
    
    if (retryCount < MAX_RETRIES - 1) {
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return analyzeWithAI(conversationHistory, retryCount + 1);
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Supabase-updater called`);

  try {
    const supabase = createSupabaseClient();
    const { phone, conversationHistory } = await req.json();
    
    console.log(`[${requestId}] Analyzing conversation for: ${phone} (${conversationHistory.length} messages)`);

    // Analyze with retry and fallback
    const analysis = await analyzeWithAI(conversationHistory);
    console.log(`[${requestId}] Analysis result:`, JSON.stringify(analysis));

    // Update conversas table using atomic upsert to prevent race conditions
    const { data: upsertedConv } = await supabase
      .from('conversas')
      .upsert({
        phone,
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        treatment_mentioned: analysis.treatment_mentioned,
        summary: analysis.summary,
        status: 'ativa',
        last_message_at: new Date().toISOString()
      }, {
        onConflict: 'phone',
        ignoreDuplicates: false
      })
      .select('id')
      .single();

    console.log('Conversation upserted:', upsertedConv?.id);

    // Update or create client using atomic upsert to prevent race conditions
    const { data: upsertedClient } = await supabase
      .from('clientes')
      .upsert({
        phone,
        stage: analysis.stage,
        treatment_interest: analysis.treatment_mentioned || null,
        status: 'lead',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone',
        ignoreDuplicates: false
      })
      .select('id')
      .single();

    console.log('Client upserted:', upsertedClient?.id);

    // Log interest if treatment mentioned
    if (analysis.treatment_mentioned && upsertedClient) {
      await supabase
        .from('interesses')
        .insert({
          cliente_id: upsertedClient.id,
          treatment_name: analysis.treatment_mentioned,
          interest_level: 3,
          detected_at: new Date().toISOString()
        });
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Supabase updater error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
