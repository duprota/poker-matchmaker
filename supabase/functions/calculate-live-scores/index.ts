import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Timing factor table: [rb_num][phase]
const TIMING: Record<string, Record<string, number>> = {
  "0": { early: 1.0, mid: 1.0, late: 1.0 },
  "1": { early: 0.537, mid: 0.462, late: 0.693 },
  "2": { early: 0.185, mid: 0.277, late: 0.0 },
  "3": { early: 0.0, mid: 0.0, late: 0.092 },
  "4": { early: 0.0, mid: 0.0, late: 0.065 },
};

const FALLBACK_DELTA: Record<string, number> = {
  "0": 0.05,
  "1_2": 0.004,
  "3_4": -0.011,
  "5plus": -0.03,
};

function rbBucket(rebuys: number): string {
  if (rebuys === 0) return "0";
  if (rebuys <= 2) return "1_2";
  if (rebuys <= 4) return "3_4";
  return "5plus";
}

function getPhase(totalRebuys: number): string {
  if (totalRebuys < 5) return "early";
  if (totalRebuys < 11) return "mid";
  return "late";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { game_id, action } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Handle recalibration on game completion
    if (action === "recalibrate") {
      return await handleRecalibrate(supabase, game_id, corsHeaders);
    }

    if (!game_id) {
      return new Response(
        JSON.stringify({ error: "game_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check game exists and is not completed
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, status")
      .eq("id", game_id)
      .single();

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: "Game not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (game.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Game already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 1 — Fetch current state
    const { data: gamePlayers, error: gpError } = await supabase
      .from("game_players")
      .select("player_id, total_rebuys")
      .eq("game_id", game_id);

    if (gpError) throw gpError;
    if (!gamePlayers || gamePlayers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No players in game" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const playerIds = gamePlayers.map((gp) => gp.player_id);

    // Fetch player info
    const { data: players, error: pError } = await supabase
      .from("players")
      .select("id, name, skill_score")
      .in("id", playerIds);

    if (pError) throw pError;

    const playerMap = new Map(players!.map((p) => [p.id, p]));

    // Fetch live params
    const { data: liveParams } = await supabase
      .from("player_live_params")
      .select("player_id, rb_bucket, delta")
      .in("player_id", playerIds);

    const deltaMap = new Map<string, Map<string, number>>();
    (liveParams || []).forEach((lp) => {
      if (!deltaMap.has(lp.player_id)) deltaMap.set(lp.player_id, new Map());
      deltaMap.get(lp.player_id)!.set(lp.rb_bucket, Number(lp.delta));
    });

    // STEP 2 — Determine phase
    const totalRebuysGame = gamePlayers.reduce(
      (s, gp) => s + Number(gp.total_rebuys),
      0
    );
    const phase = getPhase(totalRebuysGame);

    // STEP 3 — Calculate score_vivo for each player
    const DEFAULT_SKILL = 800;
    const skillScores = gamePlayers.map((gp) => {
      const p = playerMap.get(gp.player_id);
      return Number(p?.skill_score) || DEFAULT_SKILL;
    });
    const totalSkill = skillScores.reduce((a, b) => a + b, 0);

    const rawScores: { player_id: string; name: string; personal_rebuys: number; score_vivo: number }[] = [];

    gamePlayers.forEach((gp, i) => {
      const p = playerMap.get(gp.player_id);
      const personalRebuys = Number(gp.total_rebuys);
      const skillShare = skillScores[i] / totalSkill;

      // Timing factor
      const rbKey = String(Math.min(personalRebuys, 4));
      const timingRow = TIMING[rbKey];
      const timingFactor = timingRow[phase];

      // Delta
      const bucket = rbBucket(personalRebuys);
      const playerDeltas = deltaMap.get(gp.player_id);
      const delta = playerDeltas?.get(bucket) ?? FALLBACK_DELTA[bucket] ?? 0;

      const scoreVivo = Math.max(skillShare * timingFactor * (1 + delta), 0.001);

      rawScores.push({
        player_id: gp.player_id,
        name: p?.name || "Unknown",
        personal_rebuys: personalRebuys,
        score_vivo: scoreVivo,
      });
    });

    // STEP 4 — Normalize
    const totalRaw = rawScores.reduce((s, r) => s + r.score_vivo, 0);
    const results = rawScores.map((r) => ({
      ...r,
      score_normalizado: r.score_vivo / totalRaw,
    }));

    // STEP 5 — Rank
    results.sort((a, b) => b.score_normalizado - a.score_normalizado);
    results.forEach((r, i) => {
      (r as any).posicao_esperada = i + 1;
    });

    // STEP 6 — Insert snapshot
    const snapshotRows = results.map((r) => ({
      game_id,
      player_id: r.player_id,
      total_rebuys_game: totalRebuysGame,
      personal_rebuys: r.personal_rebuys,
      score_normalizado: r.score_normalizado,
      posicao_esperada: (r as any).posicao_esperada,
    }));

    const { error: insertError } = await supabase
      .from("live_game_scores")
      .insert(snapshotRows);

    if (insertError) {
      console.error("Error inserting snapshot:", insertError);
    }

    // STEP 7 — Return
    const response = results.map((r) => ({
      player_id: r.player_id,
      name: r.name,
      personal_rebuys: r.personal_rebuys,
      score_normalizado: Math.round(r.score_normalizado * 10000) / 10000,
      posicao_esperada: (r as any).posicao_esperada,
      phase,
    }));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleRecalibrate(
  supabase: any,
  game_id: string,
  corsHeaders: Record<string, string>
) {
  if (!game_id) {
    return new Response(
      JSON.stringify({ error: "game_id required for recalibration" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get game players with final results
  const { data: gamePlayers, error: gpErr } = await supabase
    .from("game_players")
    .select("player_id, total_rebuys, final_result")
    .eq("game_id", game_id)
    .not("final_result", "is", null);

  if (gpErr) throw gpErr;
  if (!gamePlayers || gamePlayers.length === 0) {
    return new Response(
      JSON.stringify({ error: "No finalized players" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const playerIds = gamePlayers.map((gp: any) => gp.player_id);

  const { data: players } = await supabase
    .from("players")
    .select("id, skill_score")
    .in("id", playerIds);

  const skillMap = new Map(
    (players || []).map((p: any) => [p.id, Number(p.skill_score) || 800])
  );

  const totalFinal = gamePlayers.reduce(
    (s: number, gp: any) => s + Number(gp.final_result),
    0
  );
  const totalSkill = Array.from(skillMap.values()).reduce(
    (a: number, b: number) => a + b,
    0
  );

  // Get existing live params
  const { data: existingParams } = await supabase
    .from("player_live_params")
    .select("player_id, rb_bucket, delta, sample_size")
    .in("player_id", playerIds);

  const paramMap = new Map<string, any>();
  (existingParams || []).forEach((lp: any) => {
    paramMap.set(`${lp.player_id}_${lp.rb_bucket}`, lp);
  });

  const upserts: any[] = [];

  for (const gp of gamePlayers) {
    const bucket = rbBucket(Number(gp.total_rebuys));
    const actualShare =
      totalFinal > 0 ? Number(gp.final_result) / totalFinal : 0;
    const expectedShare =
      totalSkill > 0 ? (skillMap.get(gp.player_id) || 800) / totalSkill : 0;
    const novoDelta = actualShare - expectedShare;

    const key = `${gp.player_id}_${bucket}`;
    const existing = paramMap.get(key);
    const oldDelta = existing ? Number(existing.delta) : 0;
    const oldN = existing ? Number(existing.sample_size) : 0;

    const newDelta = (oldDelta * oldN + novoDelta) / (oldN + 1);

    upserts.push({
      player_id: gp.player_id,
      rb_bucket: bucket,
      delta: Math.round(newDelta * 10000) / 10000,
      sample_size: oldN + 1,
      updated_at: new Date().toISOString(),
    });
  }

  const { error: upsertErr } = await supabase
    .from("player_live_params")
    .upsert(upserts, { onConflict: "player_id,rb_bucket" });

  if (upsertErr) throw upsertErr;

  return new Response(
    JSON.stringify({ success: true, updated: upserts.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
