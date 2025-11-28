import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
      throw new Error('No AI API keys configured');
    }

    const { imageUrl } = await req.json();
    console.log('Processing image from:', imageUrl);

    // Caso 6: Retry logic para processar imagem
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Image] Attempt ${attempt}/${maxRetries}`);

        let response: Response;
        let usedFallback = false;

        // Try OpenAI first if available
        if (OPENAI_API_KEY) {
          console.log('[Image] Trying OpenAI (primary)...');
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Descreva esta imagem em português, focando em detalhes relevantes para uma clínica de estética (ex: condição da pele, área de interesse para tratamento, fotos antes/depois, etc.)'
                    },
                    {
                      type: 'image_url',
                      image_url: { url: imageUrl }
                    }
                  ]
                }
              ],
              max_tokens: 300
            })
          });

          if (!response.ok) {
            console.warn(`[Image] OpenAI failed: ${response.status}, trying fallback...`);
            usedFallback = true;
          }
        } else {
          usedFallback = true;
        }

        // Try OpenRouter fallback if primary failed or not available
        if (usedFallback && OPENROUTER_API_KEY) {
          console.log('[Image] Trying OpenRouter (fallback)...');
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://evidens.app',
              'X-Title': 'Evidens Image Analysis'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-exp:free',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Descreva esta imagem em português, focando em detalhes relevantes para uma clínica de estética (ex: condição da pele, área de interesse para tratamento, fotos antes/depois, etc.)'
                    },
                    {
                      type: 'image_url',
                      image_url: { url: imageUrl }
                    }
                  ]
                }
              ],
              max_tokens: 300
            })
          });
        }

        if (!response!.ok) {
          const error = await response!.text();
          console.error('Vision API error:', error);
          throw new Error(`Vision API error: ${response!.status}`);
        }

        const result = await response!.json();
        const description = result.choices[0].message.content;
        console.log('Image description:', description);

        return new Response(JSON.stringify({ description }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Image] Attempt ${attempt} failed:`, lastError);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    // Se chegou aqui, todas tentativas falharam
    throw lastError || new Error('Failed to process image');

  } catch (error) {
    console.error('Process image error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Caso 6: Fallback message para imagem não processada
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      description: '[Cliente enviou uma imagem que não pôde ser processada. Se for relevante para o atendimento, peça ao cliente para descrever ou enviar novamente.]' 
    }), {
      status: 200, // Don't fail the request
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
