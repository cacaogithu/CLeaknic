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
  console.log(`[${requestId}] Reprocess-conversations called`);

  try {
    const supabase = createSupabaseClient();
    
    // Get all conversations that need reprocessing (sentiment is NULL or empty)
    const { data: conversas, error: conversasError } = await supabase
      .from('conversas')
      .select('id, phone, sentiment, intent, summary')
      .or('sentiment.is.null,intent.is.null,summary.is.null');

    if (conversasError) {
      console.error('Error fetching conversations:', conversasError);
      throw conversasError;
    }

    console.log(`[${requestId}] Found ${conversas?.length || 0} conversations to reprocess`);

    const results = {
      total: conversas?.length || 0,
      processed: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const conversa of conversas || []) {
      try {
        console.log(`[${requestId}] Processing conversation ${conversa.id} for ${conversa.phone}`);

        // Get messages for this conversation
        const { data: messages, error: messagesError } = await supabase
          .from('mensagens')
          .select('sender, message, created_at')
          .eq('conversa_id', conversa.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        if (!messages || messages.length === 0) {
          console.log(`[${requestId}] No messages found for conversation ${conversa.id}`);
          continue;
        }

        // Format conversation history
        const conversationHistory = messages.map(msg => ({
          sender: msg.sender,
          message: msg.message || ''
        }));

        // Call supabase-updater to analyze
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('supabase-updater', {
          body: {
            phone: conversa.phone,
            conversationHistory
          }
        });

        if (analysisError) {
          throw analysisError;
        }

        console.log(`[${requestId}] Successfully processed conversation ${conversa.id}`);
        results.processed++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[${requestId}] Failed to process conversation ${conversa.id}:`, error.message);
        results.failed++;
        results.errors.push({
          conversationId: conversa.id,
          phone: conversa.phone,
          error: error.message
        });
      }
    }

    console.log(`[${requestId}] Reprocessing complete:`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Reprocess error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
