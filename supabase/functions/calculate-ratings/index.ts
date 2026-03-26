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

// ── ATP Tier Points ───────────────────────────────────────────────────
const TIER_POINTS: Record<string, number[]> = {
  "250":        [250, 150, 100, 60, 30],
  "500":        [500, 300, 200, 120, 60],
  "1000":       [1000, 600, 400, 240, 120],
  "grand_slam": [2000, 1200, 800, 480, 240],
};

function getTierPointsForPosition(tier: string, position: number): number {
  const points = TIER_POINTS[tier] || TIER_POINTS["250"];
  if (position < 1 || position > 5) return 0;
  return points[position - 1];
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

  // Recalculate behavioral profiles for all participants
  await calculateBehavioralProfiles(supabase, playerIds);

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

// ── ATP Functions (Tier-based) ────────────────────────────────────────

async function determineTier(supabase: any, gameId: string, avgSkill: number): Promise<string> {
  // Check if game is marked as Grand Slam
  const { data: game } = await supabase
    .from("games")
    .select("is_grand_slam")
    .eq("id", gameId)
    .single();

  if (game?.is_grand_slam) return "grand_slam";

  // Get avg skill_score of all completed games to compute percentiles
  const { data: allGames } = await supabase
    .from("games")
    .select("id")
    .eq("status", "completed");

  if (!allGames || allGames.length < 3) {
    // Not enough history — default to 250
    return "250";
  }

  // Get avg skill per game
  const gameIds = allGames.map((g: any) => g.id);
  const { data: allGamePlayers } = await supabase
    .from("game_players")
    .select("game_id, player_id")
    .in("game_id", gameIds)
    .not("final_result", "is", null);

  if (!allGamePlayers) return "250";

  // Get all player skill scores
  const allPlayerIds = [...new Set(allGamePlayers.map((gp: any) => gp.player_id))];
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, skill_score")
    .in("id", allPlayerIds);

  const skillMap = new Map((allPlayers || []).map((p: any) => [p.id, Number(p.skill_score ?? 0)]));

  // Compute avg skill per game
  const gameSkillAvgs: number[] = [];
  const gameGrouped = new Map<string, string[]>();
  for (const gp of allGamePlayers) {
    if (!gameGrouped.has(gp.game_id)) gameGrouped.set(gp.game_id, []);
    gameGrouped.get(gp.game_id)!.push(gp.player_id);
  }

  for (const [, playerIds] of gameGrouped) {
    const skills = playerIds.map((pid: string) => skillMap.get(pid) ?? 0);
    const avg = skills.reduce((a: number, b: number) => a + b, 0) / skills.length;
    gameSkillAvgs.push(avg);
  }

  gameSkillAvgs.sort((a, b) => a - b);
  // Distribution: ~50% ATP 250, ~35% ATP 500, ~15% ATP 1000
  const p50 = gameSkillAvgs[Math.floor(gameSkillAvgs.length * 0.50)];
  const p85 = gameSkillAvgs[Math.floor(gameSkillAvgs.length * 0.85)];

  if (avgSkill <= p50) return "250";
  if (avgSkill <= p85) return "500";
  return "1000";
}

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

  // 2. Get skill_scores of all participants
  const playerIds = gamePlayers.map((p: any) => p.player_id);
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, skill_score")
    .in("id", playerIds);

  if (pErr) throw pErr;
  const skillMap = new Map(players.map((p: any) => [p.id, Number(p.skill_score ?? 0)]));

  // 3. Calculate avg skill of this game
  const skills = playerIds.map((pid: string) => skillMap.get(pid) ?? 0);
  const avgSkill = skills.reduce((a: number, b: number) => a + b, 0) / skills.length;

  // 4. Determine tier
  const tier = await determineTier(supabase, gameId, avgSkill);
  console.log(`Game ${gameId}: avgSkill=${avgSkill.toFixed(1)}, tier=${tier}`);

  // 5. Sort by final_result DESC to derive positions
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

  const atpRows: any[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const gp = sorted[i];
    const pid = gp.player_id;
    const position = positions[i];

    // Points based on tier and position (top 5 only)
    const rawPoints = getTierPointsForPosition(tier, position);

    // ROI for reference
    const investment = gp.initial_buyin * (1 + gp.total_rebuys);
    const roi = investment > 0 ? ((gp.final_result - investment) / gp.initial_buyin) * 100 : 0;

    atpRows.push({
      player_id: pid,
      game_id: gameId,
      raw_points: rawPoints,
      base_points: rawPoints,
      sos_multiplier: 1,
      roi_factor: 1,
      position,
      roi,
      tier,
    });
  }

  // Delete existing (idempotent)
  await supabase.from("atp_points").delete().eq("game_id", gameId);

  const { error: insertErr } = await supabase.from("atp_points").insert(atpRows);
  if (insertErr) throw insertErr;

  return new Response(
    JSON.stringify({ success: true, atp_calculated: atpRows.length, tier }),
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

// ── Behavioral Profile (RT/RR/Archetype) ────────────────────────────
async function calculateBehavioralProfiles(supabase: any, playerIds: string[]) {
  for (const pid of playerIds) {
    const { data: gps, error } = await supabase
      .from("game_players")
      .select("total_rebuys, final_result, initial_buyin, game_id, games!inner(status)")
      .eq("player_id", pid)
      .eq("games.status", "completed")
      .not("final_result", "is", null);

    if (error) { console.error(`Behavioral calc error for ${pid}:`, error); continue; }
    if (!gps || gps.length < 5) {
      await supabase.from("players").update({ rebuy_tendency: null, recovery_rate: null, archetype: null }).eq("id", pid);
      continue;
    }

    const totalRebuys = gps.reduce((s: number, g: any) => s + Number(g.total_rebuys), 0);
    const rt = totalRebuys / gps.length;

    const gamesWithRebuy = gps.filter((g: any) => g.total_rebuys > 0);
    let rr: number | null = null;
    if (gamesWithRebuy.length > 0) {
      const recovered = gamesWithRebuy.filter((g: any) => {
        const invested = g.initial_buyin * (1 + g.total_rebuys);
        return g.final_result > invested;
      }).length;
      rr = (recovered / gamesWithRebuy.length) * 100;
    } else {
      rr = 0;
    }

    let archetype: string;
    if (rt < 0.5) {
      archetype = rr !== null && rr >= 50 ? "rocha" : "sniper";
    } else {
      archetype = rr !== null && rr >= 50 ? "fenix" : "sangrador";
    }

    await supabase.from("players").update({
      rebuy_tendency: Math.round(rt * 100) / 100,
      recovery_rate: rr !== null ? Math.round(rr * 10) / 10 : null,
      archetype,
    }).eq("id", pid);
  }
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