import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/createSupabaseClient.ts";

// Declare EdgeRuntime type for background task handling
declare const EdgeRuntime:
  | {
      waitUntil: (promise: Promise<any>) => void;
    }
  | undefined;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Helper: Process audio using the robust edge function with fallback
async function processAudio(audioUrl: string): Promise<string> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    // Call the robust process-audio edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-audio`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Process audio function error: ${error}`);
    }

    const result = await response.json();
    return result.transcription || "[Áudio não pôde ser processado]";
  } catch (error) {
    console.error("Audio processing error:", error);
    // Return fallback message instead of throwing
    return "[Cliente enviou um áudio que não pôde ser processado. Se for relevante, peça ao cliente para enviar mensagem de texto ou tentar novamente.]";
  }
}

// Helper: Process image with GPT-4 Vision
async function processImage(imageUrl: string): Promise<string> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Descreva esta imagem em detalhes em português. Se houver texto, transcreva-o. Se for um documento médico ou exame, extraia as informações principais.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!visionResponse.ok) {
      const error = await visionResponse.text();
      throw new Error(`Vision API error: ${error}`);
    }

    const result = await visionResponse.json();
    // CRITICAL FIX: Validate response structure before accessing
    if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
      throw new Error('Vision API returned invalid response structure - no choices');
    }
    const content = result.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Vision API returned empty content');
    }
    return content;
  } catch (error) {
    console.error("Image processing error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  console.log(`[Webhook ${webhookId}] Received at ${receivedAt}`);

  // CRITICAL: Parse JSON BEFORE responding to avoid stream consumption issues
  let webhookData;
  try {
    webhookData = await req.json();
  } catch (parseError) {
    console.error(`[Webhook ${webhookId}] JSON parse error:`, parseError);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Respond IMMEDIATELY to Z-API to avoid timeout and retries
  const immediateResponse = new Response(JSON.stringify({ success: true, webhookId, receivedAt }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  // Process in background with parsed data (no stream consumption needed)
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(
      processWebhookAsync(webhookData, webhookId).catch((err) => {
        console.error(`[Webhook ${webhookId}] Background processing FAILED:`, err);
      }),
    );
  } else {
    // Fallback for local dev or environments without EdgeRuntime
    processWebhookAsync(webhookData, webhookId).catch((err) => {
      console.error(`[Webhook ${webhookId}] Background processing FAILED:`, err);
    });
  }

  return immediateResponse;
});

async function processWebhookAsync(webhook: any, webhookId: string) {
  try {
    const supabase = createSupabaseClient();

    console.log("Webhook received:", JSON.stringify(webhook, null, 2));

    // Z-API can send data in two formats
    const data = webhook.body || webhook;

    // Extract Z-API message ID for deduplication
    const zapiMessageId = data.messageId || data.id?.id || data.zapiMessageId || null;

    // Log webhook for debugging
    await supabase.from("webhook_logs").insert({
      phone: data.phone,
      payload: webhook,
      processed: false,
    });

    // Filter status updates (SENT, DELIVERED, READ)
    if (data.status && !data.text && !data.audio && !data.image && !data.document) {
      console.log(`[Webhook ${webhookId}] Filtered: Status update (${data.status})`);
      return;
    }

    // Filter groups
    if (data.isGroup === true) {
      console.log(`[Webhook ${webhookId}] Filtered: Group message`);
      return;
    }

    // Filter test numbers
    const testNumbers = ["5511999999999", "5511888888888"];
    if (testNumbers.includes(data.phone)) {
      console.log(`[Webhook ${webhookId}] Filtered: Test number`);
      return;
    }

    const phone = data.phone;
    const fromMe = data.fromMe === true;
    let messageText = data.text?.message || "";
    const messageType = data.messageType || "text";
    const mediaUrl = data.image?.imageUrl || data.audio?.audioUrl || data.document?.documentUrl || null;

    // =====================================================
    // DEDUPLICATION: Check if message already exists
    // =====================================================
    if (zapiMessageId) {
      const { data: existingMsg } = await supabase
        .from("mensagens")
        .select("id")
        .eq("zapi_message_id", zapiMessageId)
        .maybeSingle();

      if (existingMsg) {
        console.log(
          `[Webhook ${webhookId}] ⚠️ DUPLICATE detected - messageId ${zapiMessageId} already exists, skipping`,
        );
        return;
      }
    }

    // Process audio if present
    if (data.audio?.audioUrl && !fromMe) {
      console.log(`[Webhook ${webhookId}] Audio detected, processing...`);
      const transcription = await processAudio(data.audio.audioUrl);
      const duration = data.audio.seconds || "unknown";
      messageText = `[Áudio transcrito: ${duration}s]\n\n${transcription}`;
      console.log(`[Webhook ${webhookId}] Audio transcribed successfully`);
    }

    // Process image if present
    if (data.image?.imageUrl && !fromMe) {
      console.log(`[Webhook ${webhookId}] Image detected, processing...`);
      try {
        const description = await processImage(data.image.imageUrl);
        const caption = data.image.caption ? `\n\nLegenda: ${data.image.caption}` : "";
        messageText = `[Imagem enviada]${caption}\n\nDescrição: ${description}`;
        console.log(`[Webhook ${webhookId}] Image analyzed successfully`);
      } catch (error) {
        console.error(`[Webhook ${webhookId}] Image processing failed:`, error);
        messageText = `[Imagem enviada - falha na análise]`;
      }
    }

    // Get message timestamp from Z-API
    // CRITICAL FIX: Safe timestamp parsing to prevent Invalid Date crashes
    let messageTimestamp: string;
    try {
      const rawTimestamp = data.messageTimestamp || data.momment;
      if (rawTimestamp && typeof rawTimestamp === 'number' && !isNaN(rawTimestamp)) {
        // momment is in milliseconds, messageTimestamp is in seconds
        const multiplier = data.momment ? 1 : 1000;
        const date = new Date(rawTimestamp * multiplier);
        // Validate the date is valid before converting to ISO string
        if (!isNaN(date.getTime())) {
          messageTimestamp = date.toISOString();
        } else {
          console.warn(`[Webhook ${webhookId}] Invalid timestamp value: ${rawTimestamp}, using current time`);
          messageTimestamp = new Date().toISOString();
        }
      } else {
        messageTimestamp = new Date().toISOString();
      }
    } catch (timestampError) {
      console.warn(`[Webhook ${webhookId}] Timestamp parsing error:`, timestampError);
      messageTimestamp = new Date().toISOString();
    }

    if (!phone) {
      throw new Error("Phone number missing");
    }

    // Whitelist: Only allow these numbers
    const allowedNumbers = [
      "14079897162", // Rafael Almeida
      "14079897155",
      "14077280505",
      "14072677301",
      "14078859150",
      "16562042569",
      "5511987662764",
      "5511964604988",
      "5521992420891",
      "13213331224",
      "5521989732007",
      "14345690531",
    ];
    if (!allowedNumbers.includes(phone)) {
      console.log(`[Webhook ${webhookId}] Filtered: Number not in whitelist`, phone);
      return;
    }

    // Get or create conversation
    let conversaId: number;

    const { data: existingConv } = await supabase.from("conversas").select("id").eq("phone", phone).maybeSingle();

    if (existingConv) {
      conversaId = existingConv.id;
      console.log(`[Webhook ${webhookId}] Using existing conversation id: ${conversaId}`);

      // Update last_message_at to keep conversation active
      await supabase.from("conversas").update({ last_message_at: messageTimestamp }).eq("id", conversaId);
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversas")
        .insert({
          phone,
          status: "ativa",
          last_message_at: messageTimestamp,
        })
        .select("id")
        .single();

      if (convError || !newConv) {
        console.error(`[Webhook ${webhookId}] Failed to create conversation:`, convError);
        throw convError;
      }

      conversaId = newConv.id;
      console.log(`[Webhook ${webhookId}] Created new conversation id: ${conversaId}`);
    }

    // Save message to database with Z-API message ID for deduplication
    const { error: insertError } = await supabase.from("mensagens").insert({
      phone,
      conversa_id: conversaId,
      sender: fromMe ? "human" : "user",
      message: messageText,
      message_type: messageType,
      media_url: mediaUrl,
      processed: false,
      created_at: messageTimestamp,
      zapi_message_id: zapiMessageId, // For deduplication
    });

    if (insertError) {
      // Check if it's a duplicate key error
      if (insertError.code === "23505" && zapiMessageId) {
        console.log(`[Webhook ${webhookId}] ⚠️ DUPLICATE (constraint) - messageId ${zapiMessageId} already exists`);
        return;
      }
      throw insertError;
    }

    // FromMe messages are logged but don't trigger AI processing
    if (fromMe) {
      console.log(`[Webhook ${webhookId}] FromMe message logged, skipping buffer update`);
      return;
    }

    // =====================================================
    // SAFE BUFFER UPDATE: Use atomic RPC to prevent overwriting processing=true
    // =====================================================
    const { data: bufferResult, error: bufferError } = await supabase.rpc("safe_buffer_upsert", {
      p_phone: phone,
      p_buffer_time_seconds: 5, // 5 second buffer
    });

    if (bufferError) {
      console.error(`[Webhook ${webhookId}] Buffer upsert error:`, bufferError);
    } else {
      const result = bufferResult?.[0];
      if (result?.success) {
        console.log(`[Webhook ${webhookId}] Buffer ${result.action} for ${phone}`);
      } else {
        console.error(`[Webhook ${webhookId}] Buffer operation failed: ${result?.error_message}`);
      }
    }

    // Mark webhook as processed
    await supabase
      .from("webhook_logs")
      .update({ processed: true })
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    console.log(`[Webhook ${webhookId}] ✅ Message saved, buffer updated`);
  } catch (error) {
    console.error(`[Webhook ${webhookId}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    try {
      const supabase = createSupabaseClient();

      await supabase.from("system_alerts").insert({
        type: "webhook_error",
        details: `Webhook ${webhookId} failed: ${errorMessage}`,
      });
    } catch (alertError) {
      console.error(`[Webhook ${webhookId}] Failed to log error alert:`, alertError);
    }
  }
}
