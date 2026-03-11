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
    const { action } = await req.json();

    // Get bot config
    const { data: config } = await supabase
      .from("bot_config")
      .select("*")
      .limit(1)
      .single();

    if (!config) {
      throw new Error("Bot não configurado");
    }

    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    if (!EVOLUTION_API_KEY || !config.api_url || !config.instance_name || !config.group_id) {
      throw new Error("Configuração incompleta: API URL, instance name, group ID e EVOLUTION_API_KEY são necessários");
    }

    if (action === "send_reminders") {
      // Get all players with balances
      const { data: players } = await supabase.from("players").select("id, name, pix_key");
      const { data: ledgerEntries } = await supabase.from("ledger_entries").select("player_id, amount");

      const balances: Record<string, number> = {};
      ledgerEntries?.forEach((e) => {
        balances[e.player_id] = (balances[e.player_id] || 0) + Number(e.amount);
      });

      // Find debtors (negative balance)
      const debtors = players
        ?.filter((p) => (balances[p.id] || 0) < -0.01)
        .map((p) => ({
          name: p.name,
          amount: Math.abs(balances[p.id] || 0),
        })) || [];

      // Find creditors (positive balance) with Pix keys
      const creditors = players
        ?.filter((p) => (balances[p.id] || 0) > 0.01)
        .map((p) => ({
          name: p.name,
          amount: balances[p.id] || 0,
          pix_key: p.pix_key,
        })) || [];

      if (debtors.length === 0) {
        const message = "✅ Nenhuma dívida pendente! Todos os saldos estão zerados.";
        await sendWhatsApp(config, EVOLUTION_API_KEY, config.group_id, message);

        await supabase.from("bot_message_logs").insert({
          direction: "outbound",
          message_type: "text",
          message_text: message,
          parsed_intent: "send_reminders",
          status: "sent",
        });

        return new Response(JSON.stringify({ status: "ok", message: "No debts" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let message = "🎰 *Lembrete de Pagamento - Poker* 🎰\n\n";
      message += "📛 *Devedores:*\n";
      debtors.forEach((d) => {
        message += `• ${d.name}: R$ ${d.amount.toFixed(2)}\n`;
      });

      if (creditors.length > 0) {
        message += "\n💰 *Credores (para receber):*\n";
        creditors.forEach((c) => {
          message += `• ${c.name}: R$ ${c.amount.toFixed(2)}`;
          if (c.pix_key) message += ` | Pix: ${c.pix_key}`;
          message += "\n";
        });
      }

      message += "\n⏰ Paguem suas dívidas para mantermos o jogo em dia!";

      await sendWhatsApp(config, EVOLUTION_API_KEY, config.group_id, message);

      await supabase.from("bot_message_logs").insert({
        direction: "outbound",
        message_type: "text",
        message_text: message.slice(0, 500),
        parsed_intent: "send_reminders",
        status: "sent",
      });

      return new Response(
        JSON.stringify({ status: "ok", debtors: debtors.length, creditors: creditors.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("whatsapp-send error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWhatsApp(config: any, apiKey: string, number: string, text: string) {
  const url = `${config.api_url}/message/sendText/${config.instance_name}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ number, text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Evolution API error [${response.status}]: ${errText}`);
  }

  return response.json();
}
