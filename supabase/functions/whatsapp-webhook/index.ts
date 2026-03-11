import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log("Webhook payload received:", JSON.stringify(payload).slice(0, 500));

    // Parse Evolution API payload
    const message = parseEvolutionPayload(payload);
    if (!message) {
      return new Response(JSON.stringify({ status: "no_message" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get bot config
    const { data: config } = await supabase
      .from("bot_config")
      .select("*")
      .limit(1)
      .single();

    if (!config || !config.enabled) {
      return new Response(JSON.stringify({ status: "bot_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trigger = config.bot_trigger || "@bot";
    const timeoutMinutes = config.session_timeout_minutes || 5;
    const messageText = message.text || "";
    const hasTrigger = messageText.toLowerCase().includes(trigger.toLowerCase());

    // Check for active session
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    const { data: activeSession } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("is_active", true)
      .eq("group_id", message.groupId || config.group_id)
      .gte("last_activity_at", cutoff)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .single();

    let session = activeSession;

    if (hasTrigger) {
      // Trigger present: create or renew session
      if (session) {
        await supabase
          .from("bot_sessions")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", session.id);
      } else {
        const { data: newSession } = await supabase
          .from("bot_sessions")
          .insert({
            group_id: message.groupId || config.group_id,
            started_by_phone: message.phone,
            last_activity_at: new Date().toISOString(),
            is_active: true,
            context_messages: [],
          })
          .select()
          .single();
        session = newSession;
      }
    } else if (!session) {
      // No trigger, no active session → ignore
      await supabase.from("bot_message_logs").insert({
        direction: "ignored",
        phone: message.phone,
        message_type: message.type,
        message_text: messageText.slice(0, 500),
        status: "ignored",
      });
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (activeSession && new Date(activeSession.last_activity_at).getTime() + timeoutMinutes * 60 * 1000 < Date.now()) {
      // Session expired
      await supabase
        .from("bot_sessions")
        .update({ is_active: false })
        .eq("id", activeSession.id);
      await supabase.from("bot_message_logs").insert({
        direction: "ignored",
        phone: message.phone,
        message_type: message.type,
        message_text: messageText.slice(0, 500),
        status: "session_expired",
      });
      return new Response(JSON.stringify({ status: "session_expired" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!session) {
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch players for context
    const { data: players } = await supabase.from("players").select("id, name, pix_key");

    // Fetch ledger balances
    const { data: ledgerEntries } = await supabase.from("ledger_entries").select("player_id, amount");
    const balances: Record<string, number> = {};
    ledgerEntries?.forEach((e) => {
      balances[e.player_id] = (balances[e.player_id] || 0) + Number(e.amount);
    });

    const playerContext = players?.map((p) => ({
      name: p.name,
      id: p.id,
      pix_key: p.pix_key,
      balance: balances[p.id] || 0,
    })) || [];

    // Build context messages from session
    const contextMessages = (session.context_messages as any[]) || [];

    // Process content with LLM
    const userContent = await buildUserContent(message, config);

    const systemPrompt = `Você é o assistente de poker do grupo. Responda sempre em português brasileiro, de forma concisa e amigável.

Jogadores registrados:
${playerContext.map((p) => `- ${p.name}: saldo R$ ${p.balance.toFixed(2)}${p.pix_key ? `, Pix: ${p.pix_key}` : ""}`).join("\n")}

Você pode executar as seguintes ações:
- check_balance: consultar saldo de um jogador
- list_debts: listar quem deve para quem
- game_info: informações sobre jogos recentes
- general_answer: responder perguntas gerais sobre poker
- dismiss: quando o usuário agradece, se despede ou diz que não precisa mais de ajuda

Se o usuário está claramente se despedindo ou agradecendo (ex: "valeu", "obrigado", "é só isso", "não preciso mais"), use a ação dismiss.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...contextMessages.slice(-10),
      { role: "user", content: userContent },
    ];

    const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: llmMessages,
        tools: [
          {
            type: "function",
            function: {
              name: "poker_action",
              description: "Execute a poker management action",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["check_balance", "list_debts", "game_info", "general_answer", "dismiss"],
                  },
                  player_name: { type: "string" },
                  response_text: { type: "string", description: "The text response to send to the user" },
                },
                required: ["action", "response_text"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "poker_action" } },
      }),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error("LLM error:", llmResponse.status, errText);
      
      if (llmResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (llmResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`LLM error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    let action = "general_answer";
    let responseText = "Desculpe, não consegui processar sua mensagem.";

    try {
      const toolCall = llmData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        action = args.action || "general_answer";
        responseText = args.response_text || responseText;
      }
    } catch (e) {
      console.error("Error parsing LLM tool call:", e);
      // Try to use content directly
      const content = llmData.choices?.[0]?.message?.content;
      if (content) responseText = content;
    }

    // Handle dismiss intent
    if (action === "dismiss") {
      await supabase
        .from("bot_sessions")
        .update({ is_active: false })
        .eq("id", session.id);
    } else {
      // Update session context and activity
      const updatedContext = [
        ...contextMessages.slice(-8),
        { role: "user", content: userContent },
        { role: "assistant", content: responseText },
      ];
      await supabase
        .from("bot_sessions")
        .update({
          last_activity_at: new Date().toISOString(),
          context_messages: updatedContext,
        })
        .eq("id", session.id);
    }

    // Send response via Evolution API
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    if (EVOLUTION_API_KEY && config.api_url && config.instance_name) {
      try {
        const sendUrl = `${config.api_url}/message/sendText/${config.instance_name}`;
        const targetId = message.groupId || config.group_id;
        await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: targetId,
            text: responseText,
          }),
        });
      } catch (sendErr) {
        console.error("Error sending WhatsApp message:", sendErr);
      }
    }

    // Log the interaction
    await supabase.from("bot_message_logs").insert([
      {
        direction: "inbound",
        phone: message.phone,
        message_type: message.type,
        message_text: messageText.slice(0, 500),
        parsed_intent: action,
        session_id: session.id,
        status: "processed",
      },
      {
        direction: "outbound",
        phone: message.phone,
        message_type: "text",
        message_text: responseText.slice(0, 500),
        parsed_intent: action,
        session_id: session.id,
        status: "sent",
      },
    ]);

    return new Response(
      JSON.stringify({ status: "ok", action, response: responseText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ParsedMessage {
  text: string;
  type: "text" | "audio" | "image";
  phone: string;
  groupId?: string;
  mediaUrl?: string;
}

function parseEvolutionPayload(payload: any): ParsedMessage | null {
  try {
    // Evolution API v2 format
    const data = payload.data || payload;
    const key = data.key || {};
    const messageData = data.message || {};

    const phone = key.participant || key.remoteJid || "";
    const groupId = key.remoteJid?.includes("@g.us") ? key.remoteJid : undefined;

    if (messageData.conversation || messageData.extendedTextMessage) {
      return {
        text: messageData.conversation || messageData.extendedTextMessage?.text || "",
        type: "text",
        phone,
        groupId,
      };
    }

    if (messageData.audioMessage) {
      return {
        text: "[áudio]",
        type: "audio",
        phone,
        groupId,
        mediaUrl: messageData.audioMessage.url,
      };
    }

    if (messageData.imageMessage) {
      return {
        text: messageData.imageMessage.caption || "[imagem]",
        type: "image",
        phone,
        groupId,
        mediaUrl: messageData.imageMessage.url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function buildUserContent(message: ParsedMessage, config: any): Promise<string> {
  if (message.type === "text") {
    // Remove the trigger from the text for cleaner processing
    const trigger = config.bot_trigger || "@bot";
    return message.text.replace(new RegExp(trigger, "gi"), "").trim() || message.text;
  }

  if (message.type === "audio" && message.mediaUrl) {
    // For audio, we'd download and send to Gemini's native audio support
    // For now, indicate it's an audio message
    return `[O usuário enviou um áudio. URL: ${message.mediaUrl}]`;
  }

  if (message.type === "image" && message.mediaUrl) {
    return `[O usuário enviou uma imagem${message.text !== "[imagem]" ? ` com legenda: "${message.text}"` : ""}. URL: ${message.mediaUrl}]`;
  }

  return message.text;
}
