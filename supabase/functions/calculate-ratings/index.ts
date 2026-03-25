import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Weng-Lin (Plackett-Luce) math ──────────────────────────────────────
const BETA = 4.1665;
const KAPPA = 0.0001;
const BETA_SQ = BETA * BETA;

function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function cdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327;
  const poly =
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const result = 1 - d * Math.exp(-0.5 * x * x) * poly;
  return x >= 0 ? result : 1 - result;
}

interface Rating {
  mu: number;
  sigma: number;
}

function wengLinUpdate(
  ratings: Rating[],
  ranks: number[]
): Rating[] {
  const n = ratings.length;
  const newRatings: Rating[] = ratings.map((r) => ({ mu: r.mu, sigma: r.sigma }));

  for (let i = 0; i < n; i++) {
    let muDelta = 0;
    let sigmaDelta = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const sigmaI = ratings[i].sigma;
      const sigmaJ = ratings[j].sigma;
      const c = Math.sqrt(2 * BETA_SQ + sigmaI * sigmaI + sigmaJ * sigmaJ);
      const muDiff = (ratings[i].mu - ratings[j].mu) / c;

      if (ranks[i] < ranks[j]) {
        const v = pdf(muDiff) / cdf(muDiff);
        const w = v * (v + muDiff);
        muDelta += (sigmaI * sigmaI / c) * v;
        sigmaDelta += (sigmaI * sigmaI / (c * c)) * w;
      } else if (ranks[i] > ranks[j]) {
        const v = pdf(-muDiff) / cdf(-muDiff);
        const w = v * (v - muDiff);
        muDelta -= (sigmaI * sigmaI / c) * v;
        sigmaDelta += (sigmaI * sigmaI / (c * c)) * w;
      }
    }

    newRatings[i].mu = ratings[i].mu + muDelta / (n - 1);
    const newSigmaSq =
      ratings[i].sigma * ratings[i].sigma * (1 - sigmaDelta / (n - 1)) + KAPPA;
    newRatings[i].sigma = Math.sqrt(Math.max(newSigmaSq, 0.01));
  }

  return newRatings;
}

function skillScore(mu: number, sigma: number): number {
  return (mu - 3 * sigma) * 40;
}

// ── ATP Points Calculation ─────────────────────────────────────────────
function calculateBasePoints(position: number, totalPlayers: number): number {
  if (position === 1) return 100;
  if (position === 2) return 60;
  if (position === 3) return 40;
  return Math.max(0, 10 * (totalPlayers - position));
}

function calculateRoiFactor(roi: number): number {
  if (roi >= 0) {
    return Math.log(Math.E + roi / 100);
  }
  return 1 / (1 + 0.5 * Math.abs(roi / 100));
}

// ── Handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { game_id, action } = await req.json();

    if (action === "recalculate-all") {
      return await recalculateAll(supabase);
    }

    if (action === "recalculate-all-atp") {
      return await recalculateAllAtp(supabase);
    }

    if (!game_id) {
      return new Response(JSON.stringify({ error: "game_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "calculate") {
      return await calculateForGame(supabase, game_id);
    }

    if (action === "revert") {
      return await revertForGame(supabase, game_id);
    }

    if (action === "calculate-atp") {
      return await calculateAtpForGame(supabase, game_id);
    }

    if (action === "revert-atp") {
      return await revertAtpForGame(supabase, game_id);
    }

    return new Response(JSON.stringify({ error: "invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function calculateForGame(supabase: any, gameId: string) {
  const { data: gamePlayers, error: gpErr } = await supabase
    .from("game_players")
    .select("player_id, final_result")
    .eq("game_id", gameId)
    .not("final_result", "is", null);

  if (gpErr) throw gpErr;
  if (!gamePlayers || gamePlayers.length < 2) {
    return new Response(
      JSON.stringify({ message: "Not enough players", count: gamePlayers?.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sorted = [...gamePlayers].sort(
    (a: any, b: any) => b.final_result - a.final_result
  );
  const playerIds = sorted.map((p: any) => p.player_id);

  const ranks: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      ranks.push(1);
    } else if (sorted[i].final_result === sorted[i - 1].final_result) {
      ranks.push(ranks[i - 1]);
    } else {
      ranks.push(i + 1);
    }
  }

  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, mu, sigma, rating_games")
    .in("id", playerIds);

  if (pErr) throw pErr;

  const playerMap = new Map(players.map((p: any) => [p.id, p]));
  const ratings: Rating[] = playerIds.map((id: string) => {
    const p = playerMap.get(id);
    return { mu: Number(p?.mu ?? 25), sigma: Number(p?.sigma ?? 8.333) };
  });

  const newRatings = wengLinUpdate(ratings, ranks);

  const historyRows = playerIds.map((id: string, i: number) => ({
    player_id: id,
    game_id: gameId,
    mu_before: ratings[i].mu,
    sigma_before: ratings[i].sigma,
    mu_after: newRatings[i].mu,
    sigma_after: newRatings[i].sigma,
    skill_score_after: skillScore(newRatings[i].mu, newRatings[i].sigma),
  }));

  await supabase
    .from("player_rating_history")
    .delete()
    .eq("game_id", gameId);

  const { error: histErr } = await supabase
    .from("player_rating_history")
    .insert(historyRows);

  if (histErr) throw histErr;

  for (let i = 0; i < playerIds.length; i++) {
    const currentPlayer = playerMap.get(playerIds[i]);
    const { error: upErr } = await supabase
      .from("players")
      .update({
        mu: newRatings[i].mu,
        sigma: newRatings[i].sigma,
        skill_score: skillScore(newRatings[i].mu, newRatings[i].sigma),
        rating_games: (currentPlayer?.rating_games ?? 0) + 1,
      })
      .eq("id", playerIds[i]);
    if (upErr) throw upErr;
  }

  return new Response(
    JSON.stringify({ success: true, updated: playerIds.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function revertForGame(supabase: any, gameId: string) {
  const { data: snapshots, error: sErr } = await supabase
    .from("player_rating_history")
    .select("*")
    .eq("game_id", gameId);

  if (sErr) throw sErr;
  if (!snapshots || snapshots.length === 0) {
    return new Response(
      JSON.stringify({ message: "No snapshots to revert" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  for (const snap of snapshots) {
    const restoredScore = skillScore(snap.mu_before, snap.sigma_before);
    const { error: upErr } = await supabase
      .from("players")
      .update({
        mu: snap.mu_before,
        sigma: snap.sigma_before,
        skill_score: restoredScore,
        rating_games: Math.max(0, (snap.rating_games ?? 1) - 1),
      })
      .eq("id", snap.player_id);
    if (upErr) throw upErr;
  }

  const { error: delErr } = await supabase
    .from("player_rating_history")
    .delete()
    .eq("game_id", gameId);

  if (delErr) throw delErr;

  return new Response(
    JSON.stringify({ success: true, reverted: snapshots.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function recalculateAll(supabase: any) {
  console.log("Starting full recalculation...");

  const { error: resetErr } = await supabase
    .from("players")
    .update({ mu: 25, sigma: 8.333, skill_score: 0, rating_games: 0 })
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (resetErr) throw resetErr;

  const { error: delErr } = await supabase
    .from("player_rating_history")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (delErr) throw delErr;

  const { data: games, error: gErr } = await supabase
    .from("games")
    .select("id, date")
    .eq("status", "completed")
    .order("date", { ascending: true });

  if (gErr) throw gErr;

  let processed = 0;
  for (const game of games) {
    const response = await calculateForGame(supabase, game.id);
    const result = await response.json();
    if (result.success) processed++;
    console.log(`Processed game ${game.id}: ${JSON.stringify(result)}`);
  }

  return new Response(
    JSON.stringify({ success: true, games_processed: processed, total_games: games.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── ATP Functions ──────────────────────────────────────────────────────

async function calculateAtpForGame(supabase: any, gameId: string) {
  // 1. Get game players with results
  const { data: gamePlayers, error: gpErr } = await supabase
    .from("game_players")
    .select("player_id, final_result, initial_buyin, total_rebuys")
    .eq("game_id", gameId)
    .not("final_result", "is", null);

  if (gpErr) throw gpErr;
  if (!gamePlayers || gamePlayers.length < 2) {
    return new Response(
      JSON.stringify({ message: "Not enough players for ATP", count: gamePlayers?.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Get skill_scores of all participants for SoS
  const playerIds = gamePlayers.map((p: any) => p.player_id);
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, skill_score")
    .in("id", playerIds);

  if (pErr) throw pErr;
  const skillMap = new Map(players.map((p: any) => [p.id, Number(p.skill_score ?? 0)]));

  // 3. Sort by final_result DESC to derive positions
  const sorted = [...gamePlayers].sort(
    (a: any, b: any) => b.final_result - a.final_result
  );

  // Assign positions (handle ties)
  const positions: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      positions.push(1);
    } else if (sorted[i].final_result === sorted[i - 1].final_result) {
      positions.push(positions[i - 1]);
    } else {
      positions.push(i + 1);
    }
  }

  const totalPlayers = sorted.length;
  const atpRows: any[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const gp = sorted[i];
    const pid = gp.player_id;
    const position = positions[i];

    // ROI calculation
    const investment = gp.initial_buyin * (1 + gp.total_rebuys);
    const roi = investment > 0 ? ((gp.final_result - investment) / gp.initial_buyin) * 100 : 0;

    // Base points
    const basePoints = calculateBasePoints(position, totalPlayers);

    // SoS: average skill_score of OTHER players / 100, min 0.5
    const otherSkills = sorted
      .filter((_: any, j: number) => j !== i)
      .map((p: any) => skillMap.get(p.player_id) ?? 0);
    const avgSkill = otherSkills.length > 0
      ? otherSkills.reduce((a: number, b: number) => a + b, 0) / otherSkills.length
      : 0;
    const sos = Math.max(0.5, avgSkill / 100);

    // ROI factor
    const roiFactor = calculateRoiFactor(roi);

    // Raw points
    const rawPoints = basePoints * sos * roiFactor;

    atpRows.push({
      player_id: pid,
      game_id: gameId,
      raw_points: rawPoints,
      base_points: basePoints,
      sos_multiplier: sos,
      roi_factor: roiFactor,
      position,
      roi,
    });
  }

  // Delete existing (idempotent)
  await supabase.from("atp_points").delete().eq("game_id", gameId);

  const { error: insertErr } = await supabase.from("atp_points").insert(atpRows);
  if (insertErr) throw insertErr;

  return new Response(
    JSON.stringify({ success: true, atp_calculated: atpRows.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function revertAtpForGame(supabase: any, gameId: string) {
  const { error } = await supabase.from("atp_points").delete().eq("game_id", gameId);
  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: "ATP points reverted" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function recalculateAllAtp(supabase: any) {
  console.log("Starting full ATP recalculation...");

  // Delete all ATP points
  await supabase.from("atp_points").delete().gte("id", "00000000-0000-0000-0000-000000000000");

  // Get all completed games ordered chronologically
  const { data: games, error: gErr } = await supabase
    .from("games")
    .select("id, date")
    .eq("status", "completed")
    .order("date", { ascending: true });

  if (gErr) throw gErr;

  let processed = 0;
  for (const game of games) {
    const response = await calculateAtpForGame(supabase, game.id);
    const result = await response.json();
    if (result.success) processed++;
    console.log(`ATP processed game ${game.id}: ${JSON.stringify(result)}`);
  }

  return new Response(
    JSON.stringify({ success: true, games_processed: processed, total_games: games.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
