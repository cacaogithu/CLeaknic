import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Transcription providers in priority order
enum TranscriptionProvider {
  OPENAI_WHISPER = 'openai_whisper',
  LOVABLE_AI = 'lovable_ai',
  OPENROUTER = 'openrouter'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!OPENAI_API_KEY && !OPENROUTER_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI API keys configured');
    }

    const { audioUrl } = await req.json();
    console.log('Processing audio from:', audioUrl);

    // Validate audio URL
    if (!audioUrl || typeof audioUrl !== 'string') {
      throw new Error('Missing or invalid audioUrl parameter');
    }

    try {
      new URL(audioUrl);
    } catch {
      throw new Error(`Invalid audio URL format: ${audioUrl}`);
    }

    // Download audio file once for all providers
    console.log(`[Audio] Downloading audio from: ${audioUrl}`);
    const audioController = new AbortController();
    const audioTimeout = setTimeout(() => audioController.abort(), 15000);
    
    const audioResponse = await fetch(audioUrl, {
      signal: audioController.signal
    });
    clearTimeout(audioTimeout);

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`[Audio] Downloaded ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Try providers in order with proper fallback chain
    const providers = [
      { name: TranscriptionProvider.OPENAI_WHISPER, available: !!OPENAI_API_KEY },
      { name: TranscriptionProvider.LOVABLE_AI, available: !!LOVABLE_API_KEY },
      { name: TranscriptionProvider.OPENROUTER, available: !!OPENROUTER_API_KEY }
    ].filter(p => p.available);

    if (providers.length === 0) {
      throw new Error('No transcription providers available');
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        console.log(`[Audio] Trying provider: ${provider.name}`);
        
        let transcription: string;

        switch (provider.name) {
          case TranscriptionProvider.OPENAI_WHISPER: {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.ogg');
            formData.append('model', 'whisper-1');
            formData.append('language', 'pt');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Whisper failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            transcription = result.text;
            break;
          }

          case TranscriptionProvider.LOVABLE_AI: {
            // Convert audio to base64 for Lovable AI
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
            const mimeType = audioBlob.type || 'audio/ogg';

            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Transcreva este áudio em português. O áudio é de um cliente falando sobre tratamentos estéticos. Retorne APENAS a transcrição literal do que foi dito, sem adicionar comentários, análises ou interpretações.'
                      },
                      {
                        type: 'input_audio',
                        input_audio: {
                          data: base64Audio,
                          format: mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp3') ? 'mp3' : 'wav'
                        }
                      }
                    ]
                  }
                ],
                max_tokens: 1000
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Lovable AI failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            // CRITICAL FIX: Validate response structure before accessing
            if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
              throw new Error('Lovable AI returned invalid response structure - no choices');
            }
            transcription = result.choices[0]?.message?.content || '[Transcrição não disponível]';
            break;
          }

          case TranscriptionProvider.OPENROUTER: {
            // Convert audio to base64 for OpenRouter
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
            const mimeType = audioBlob.type || 'audio/ogg';

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://evidens.app',
                'X-Title': 'Evidens Audio Transcription'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Transcreva este áudio em português. O áudio é de um cliente falando sobre tratamentos estéticos. Retorne apenas a transcrição do que foi dito, sem comentários adicionais.'
                      },
                      {
                        type: 'input_audio',
                        input_audio: {
                          data: base64Audio,
                          format: mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp3') ? 'mp3' : 'wav'
                        }
                      }
                    ]
                  }
                ],
                max_tokens: 1000
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`OpenRouter failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            // CRITICAL FIX: Validate response structure before accessing
            if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
              throw new Error('OpenRouter returned invalid response structure - no choices');
            }
            transcription = result.choices[0]?.message?.content || '[Transcrição não disponível]';
            break;
          }

          default:
            throw new Error(`Unknown provider: ${provider.name}`);
        }

        console.log(`[Audio] ✅ Success with ${provider.name}: ${transcription?.substring(0, 50)}...`);

        return new Response(JSON.stringify({ transcription }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Audio] ❌ ${provider.name} failed:`, lastError.message);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    console.error('[Audio] All transcription providers failed');
    throw lastError || new Error('All transcription providers failed');

  } catch (error) {
    console.error('Process audio error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Caso 6: Fallback message para audio não processado
    return new Response(JSON.stringify({ 
      error: errorMessage, 
      transcription: '[Cliente enviou um áudio que não pôde ser processado. Se for relevante, peça ao cliente para enviar mensagem de texto ou tentar novamente.]' 
    }), {
      status: 200, // Don't fail the request
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
