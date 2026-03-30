import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { game_id } = await req.json();
    if (!game_id) {
      return new Response(JSON.stringify({ error: "game_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newlyConquered: any[] = [];

    // Get game players with details
    const { data: gamePlayers, error: gpErr } = await supabase
      .from("game_players")
      .select("id, player_id, game_id, initial_buyin, total_rebuys, final_result")
      .eq("game_id", game_id)
      .not("final_result", "is", null);

    if (gpErr) throw gpErr;
    if (!gamePlayers || gamePlayers.length < 2) {
      return new Response(JSON.stringify({ newly_conquered: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort by final_result DESC to get positions
    const sorted = [...gamePlayers].sort((a: any, b: any) => b.final_result - a.final_result);
    const positions = new Map<string, number>();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) positions.set(sorted[i].player_id, 1);
      else if (sorted[i].final_result === sorted[i - 1].final_result)
        positions.set(sorted[i].player_id, positions.get(sorted[i - 1].player_id)!);
      else positions.set(sorted[i].player_id, i + 1);
    }

    const participantIds = gamePlayers.map((gp: any) => gp.player_id);

    // Get player skill scores
    const { data: players } = await supabase
      .from("players")
      .select("id, name, skill_score, rebuy_tendency, recovery_rate, archetype, rating_games")
      .in("id", participantIds);
    const playerMap = new Map((players || []).map((p: any) => [p.id, p]));

    // Get all players (for behavior/elite badges)
    const { data: allPlayers } = await supabase.from("players").select("id, name, skill_score, rebuy_tendency, recovery_rate, archetype, rating_games");
    const allPlayerMap = new Map((allPlayers || []).map((p: any) => [p.id, p]));

    // Badge definitions lookup
    const { data: badgeDefs } = await supabase.from("badge_definitions").select("*");
    const badgeMap = new Map((badgeDefs || []).map((b: any) => [b.code, b]));

    // Helper to insert badge and track
    async function awardBadge(playerId: string, badgeCode: string, gameId: string | null, metadata: any = {}) {
      // Check for existing
      const query = supabase
        .from("player_badges")
        .select("id")
        .eq("player_id", playerId)
        .eq("badge_code", badgeCode);

      if (gameId) query.eq("game_id", gameId);

      const { data: existing } = await query;
      if (existing && existing.length > 0) return;

      const { error } = await supabase.from("player_badges").insert({
        player_id: playerId,
        badge_code: badgeCode,
        game_id: gameId,
        metadata,
        is_active: true,
      });

      if (!error) {
        const def = badgeMap.get(badgeCode);
        const player = allPlayerMap.get(playerId);
        newlyConquered.push({
          player_id: playerId,
          player_name: player?.name || "Unknown",
          badge_code: badgeCode,
          badge_name: def?.name || badgeCode,
          emoji: def?.emoji || "🏅",
          description: def?.description || "",
          metadata,
        });
      }
    }

    // ── ETAPA A — Partida Única ──
    for (const gp of gamePlayers) {
      const pos = positions.get(gp.player_id)!;
      const invested = gp.initial_buyin * (1 + gp.total_rebuys);
      const saldo = gp.final_result - invested;
      const player = playerMap.get(gp.player_id);

      // SNIPER: 1st with 0 rebuys
      if (pos === 1 && gp.total_rebuys === 0) {
        await awardBadge(gp.player_id, "sniper", game_id);
      }

      // FÊNIX: positive balance + last score_normalizado < 0.15
      if (saldo > 0) {
        const { data: liveScores } = await supabase
          .from("live_game_scores")
          .select("score_normalizado")
          .eq("game_id", game_id)
          .eq("player_id", gp.player_id)
          .order("snapshot_at", { ascending: false })
          .limit(1);

        if (liveScores && liveScores.length > 0 && Number(liveScores[0].score_normalizado) < 0.15) {
          await awardBadge(gp.player_id, "fenix", game_id, {
            score_normalizado: liveScores[0].score_normalizado,
            saldo,
          });
        }
      }

      // ÚLTIMO DE PÉ: 0 rebuys + all others > 0
      if (gp.total_rebuys === 0) {
        const othersRebuys = gamePlayers
          .filter((p: any) => p.player_id !== gp.player_id)
          .map((p: any) => p.total_rebuys);
        if (othersRebuys.length > 0 && othersRebuys.every((r: number) => r > 0)) {
          await awardBadge(gp.player_id, "ultimo_pe", game_id);
        }
      }
    }

    // ZEBRA: winner has min skill_score
    const winner = sorted[0];
    const winnerPos = positions.get(winner.player_id)!;
    if (winnerPos === 1) {
      const winnerSkill = Number(playerMap.get(winner.player_id)?.skill_score ?? 0);
      const minSkill = Math.min(...participantIds.map((pid: string) => Number(playerMap.get(pid)?.skill_score ?? 0)));
      if (winnerSkill === minSkill && participantIds.length > 1) {
        // Only if winner truly has the lowest (not tied with everyone)
        const skillCounts = participantIds.filter((pid: string) => Number(playerMap.get(pid)?.skill_score ?? 0) === minSkill);
        if (skillCounts.length < participantIds.length) {
          await awardBadge(winner.player_id, "zebra", game_id, { skill_score: winnerSkill });
        }
      }
    }

    // AGIOTA: max ROI
    const rois = gamePlayers.map((gp: any) => {
      const invested = gp.initial_buyin * (1 + gp.total_rebuys);
      return { player_id: gp.player_id, roi: invested > 0 ? (gp.final_result - invested) / invested : 0 };
    });
    const maxRoi = Math.max(...rois.map((r: any) => r.roi));
    if (maxRoi > 0) {
      const maxRoiPlayer = rois.find((r: any) => r.roi === maxRoi);
      if (maxRoiPlayer) {
        await awardBadge(maxRoiPlayer.player_id, "agiota", game_id, { roi: maxRoi });
      }
    }

    // REGICIDA: winner != highest skill_score player
    if (winnerPos === 1) {
      const maxSkill = Math.max(...participantIds.map((pid: string) => Number(playerMap.get(pid)?.skill_score ?? 0)));
      const favoritoId = participantIds.find((pid: string) => Number(playerMap.get(pid)?.skill_score ?? 0) === maxSkill);
      if (favoritoId && favoritoId !== winner.player_id) {
        await awardBadge(winner.player_id, "regicida", game_id, { favorito_derrotado: favoritoId });
      }
    }

    // ── ETAPA B — Sequências ──
    for (const pid of participantIds) {
      // Get player's recent game history
      const { data: recentGames } = await supabase
        .from("game_players")
        .select("player_id, total_rebuys, final_result, initial_buyin, game_id, games!inner(date, status)")
        .eq("player_id", pid)
        .eq("games.status", "completed")
        .not("final_result", "is", null)
        .order("games(date)", { ascending: false })
        .limit(5);

      if (!recentGames || recentGames.length === 0) continue;

      // Sort by date desc
      const sortedRecent = recentGames.sort((a: any, b: any) =>
        new Date(b.games.date).getTime() - new Date(a.games.date).getTime()
      );

      // For each recent game, determine position
      for (const rg of sortedRecent) {
        const { data: gamePlayersSorted } = await supabase
          .from("game_players")
          .select("player_id, final_result")
          .eq("game_id", rg.game_id)
          .not("final_result", "is", null)
          .order("final_result", { ascending: false });

        if (gamePlayersSorted) {
          let pos = 1;
          for (let i = 0; i < gamePlayersSorted.length; i++) {
            if (i > 0 && gamePlayersSorted[i].final_result < gamePlayersSorted[i - 1].final_result) pos = i + 1;
            if (gamePlayersSorted[i].player_id === pid) { (rg as any)._position = pos; break; }
          }
          const invested = rg.initial_buyin * (1 + rg.total_rebuys);
          (rg as any)._saldo = rg.final_result - invested;
        }
      }

      const last3 = sortedRecent.slice(0, 3);
      const last5 = sortedRecent.slice(0, 5);

      // TREM-BALA: 3 consecutive 1st place
      if (last3.length === 3 && last3.every((g: any) => g._position === 1)) {
        await activateDynamic(supabase, pid, "trem_bala", newlyConquered, badgeMap, allPlayerMap);
      } else {
        await deactivateDynamic(supabase, pid, "trem_bala");
      }

      // INTRATÁVEL: top 3 in last 5
      if (last5.length === 5 && last5.every((g: any) => g._position <= 3)) {
        await activateDynamic(supabase, pid, "intratavel", newlyConquered, badgeMap, allPlayerMap);
      } else {
        await deactivateDynamic(supabase, pid, "intratavel");
      }

      // METRÔNOMO: positive balance in last 5
      if (last5.length === 5 && last5.every((g: any) => g._saldo > 0)) {
        await activateDynamic(supabase, pid, "metronomo", newlyConquered, badgeMap, allPlayerMap);
      } else {
        await deactivateDynamic(supabase, pid, "metronomo");
      }

      // ESPIRAL: negative balance + rebuys in last 3
      if (last3.length === 3 && last3.every((g: any) => g._saldo < 0 && g.total_rebuys > 0)) {
        await activateDynamic(supabase, pid, "espiral", newlyConquered, badgeMap, allPlayerMap);
      } else {
        await deactivateDynamic(supabase, pid, "espiral");
      }

      // FOGUETE: ATP score ascending in last 3 games
      const { data: atpPoints } = await supabase
        .from("atp_points")
        .select("raw_points, game_id, games!inner(date)")
        .eq("player_id", pid)
        .order("games(date)", { ascending: false })
        .limit(3);

      if (atpPoints && atpPoints.length === 3) {
        const scores = atpPoints.map((a: any) => Number(a.raw_points)).reverse();
        if (scores[0] < scores[1] && scores[1] < scores[2]) {
          await activateDynamic(supabase, pid, "foguete", newlyConquered, badgeMap, allPlayerMap);
        } else {
          await deactivateDynamic(supabase, pid, "foguete");
        }
      } else {
        await deactivateDynamic(supabase, pid, "foguete");
      }

      // AVE DAS CINZAS: won after 3+ consecutive losses
      // First deactivate all existing
      await supabase
        .from("player_badges")
        .update({ is_active: false, lost_at: new Date().toISOString() })
        .eq("badge_code", "ave_cinzas")
        .eq("is_active", true)
        .eq("player_id", pid);

      const currentPos = positions.get(pid);
      if (currentPos === 1 && sortedRecent.length >= 4) {
        const previous3 = sortedRecent.slice(1, 4);
        if (previous3.length === 3 && previous3.every((g: any) => g._position > 1)) {
          await awardBadge(pid, "ave_cinzas", game_id);
        }
      }
    }

    // ── ETAPA C — Marcos ──
    const { data: completedGames } = await supabase
      .from("games")
      .select("id")
      .eq("status", "completed");
    const totalGrupo = completedGames?.length || 0;

    for (const pid of participantIds) {
      const { data: playerGames } = await supabase
        .from("game_players")
        .select("game_id, total_rebuys, final_result, initial_buyin, games!inner(status)")
        .eq("player_id", pid)
        .eq("games.status", "completed")
        .not("final_result", "is", null);

      const nJogos = playerGames?.length || 0;

      // NOVATO
      if (nJogos === 1) await awardMarco(supabase, pid, "novato", newlyConquered, badgeMap, allPlayerMap);

      // FREQUENTADOR (20%)
      if (totalGrupo > 0 && nJogos >= totalGrupo * 0.20)
        await awardMarco(supabase, pid, "frequentador", newlyConquered, badgeMap, allPlayerMap);

      // DA CASA (40%)
      if (totalGrupo > 0 && nJogos >= totalGrupo * 0.40)
        await awardMarco(supabase, pid, "da_casa", newlyConquered, badgeMap, allPlayerMap);

      // LENDA (80%)
      if (totalGrupo > 0 && nJogos >= totalGrupo * 0.80)
        await awardMarco(supabase, pid, "lenda", newlyConquered, badgeMap, allPlayerMap);

      // BATISMO DE FOGO
      const currentGp = gamePlayers.find((gp: any) => gp.player_id === pid);
      if (currentGp && currentGp.total_rebuys > 0) {
        const previousRebuys = playerGames?.filter((g: any) => g.game_id !== game_id && g.total_rebuys > 0);
        if (!previousRebuys || previousRebuys.length === 0) {
          await awardMarco(supabase, pid, "batismo_fogo", newlyConquered, badgeMap, allPlayerMap, game_id);
        }
      }
    }

    // RECORDISTA DO TOMBO (global check)
    const { data: allGamePlayers } = await supabase
      .from("game_players")
      .select("player_id, final_result, initial_buyin, total_rebuys")
      .not("final_result", "is", null);

    if (allGamePlayers && allGamePlayers.length > 0) {
      let worstSaldo = Infinity;
      let worstPlayerId = "";
      for (const gp of allGamePlayers) {
        const invested = gp.initial_buyin * (1 + gp.total_rebuys);
        const saldo = gp.final_result - invested;
        if (saldo < worstSaldo) {
          worstSaldo = saldo;
          worstPlayerId = gp.player_id;
        }
      }
      if (worstPlayerId && participantIds.includes(worstPlayerId)) {
        await awardMarco(supabase, worstPlayerId, "tombo", newlyConquered, badgeMap, allPlayerMap, null, { saldo: worstSaldo });
      }
    }

    // MILIONÁRIO
    const playerSaldos = new Map<string, number>();
    for (const gp of (allGamePlayers || [])) {
      const invested = gp.initial_buyin * (1 + gp.total_rebuys);
      const saldo = gp.final_result - invested;
      playerSaldos.set(gp.player_id, (playerSaldos.get(gp.player_id) || 0) + saldo);
    }
    const saldoValues = Array.from(playerSaldos.values());
    const avgSaldo = saldoValues.length > 0 ? saldoValues.reduce((a, b) => a + b, 0) / saldoValues.length : 0;
    for (const pid of participantIds) {
      const totalSaldo = playerSaldos.get(pid) || 0;
      if (totalSaldo >= avgSaldo * 10 && avgSaldo > 0) {
        await awardMarco(supabase, pid, "milionario", newlyConquered, badgeMap, allPlayerMap, null, { total_saldo: totalSaldo });
      }
    }

    // ── ETAPA D — Comportamento (ALL players) ──
    const allPlayersList = allPlayers || [];
    const playersWithGames = allPlayersList.filter((p: any) => (p.rating_games ?? 0) >= 5);

    if (playersWithGames.length > 0) {
      const rts = playersWithGames
        .map((p: any) => Number(p.rebuy_tendency ?? 0))
        .sort((a: number, b: number) => a - b);

      const p25 = rts[Math.floor(rts.length * 0.25)] ?? 0;
      const p75 = rts[Math.floor(rts.length * 0.75)] ?? 999;

      for (const p of allPlayersList) {
        if ((p.rating_games ?? 0) < 5) continue;
        const rt = Number(p.rebuy_tendency ?? 0);

        // CIRURGIÃO
        if (rt < p25) {
          await activateDynamic(supabase, p.id, "cirurgiao", newlyConquered, badgeMap, allPlayerMap, { rt, p25 });
        } else {
          await deactivateDynamic(supabase, p.id, "cirurgiao");
        }

        // PISTOLEIRO
        if (rt > p75) {
          await activateDynamic(supabase, p.id, "pistoleiro", newlyConquered, badgeMap, allPlayerMap, { rt, p75 });
        } else {
          await deactivateDynamic(supabase, p.id, "pistoleiro");
        }
      }
    }

    // ASSOMBRAÇÃO
    const { data: last3GroupGames } = await supabase
      .from("games")
      .select("id")
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(3);

    if (last3GroupGames && last3GroupGames.length === 3) {
      const last3Ids = last3GroupGames.map((g: any) => g.id);
      const { data: participatedPlayers } = await supabase
        .from("game_players")
        .select("player_id")
        .in("game_id", last3Ids);

      const participatedSet = new Set((participatedPlayers || []).map((p: any) => p.player_id));

      for (const p of allPlayersList) {
        if ((p.rating_games ?? 0) < 1) continue;
        if (!participatedSet.has(p.id)) {
          await activateDynamic(supabase, p.id, "assombracao", newlyConquered, badgeMap, allPlayerMap);
        } else {
          await deactivateDynamic(supabase, p.id, "assombracao");
        }
      }
    }

    // ── ETAPA E — Elite ──
    // CABEÇA DE CHAVE & PÓDIO
    const { data: atpRanking } = await supabase
      .from("atp_ranking")
      .select("id, score_atp")
      .order("score_atp", { ascending: false })
      .limit(5);

    if (atpRanking && atpRanking.length > 0) {
      const leaderId = atpRanking[0].id;
      // Deactivate previous leader
      await supabase
        .from("player_badges")
        .update({ is_active: false, lost_at: new Date().toISOString() })
        .eq("badge_code", "cabeca_chave")
        .eq("is_active", true)
        .neq("player_id", leaderId);

      await activateDynamic(supabase, leaderId, "cabeca_chave", newlyConquered, badgeMap, allPlayerMap);

      // PÓDIO (top 3)
      const top3Ids = atpRanking.slice(0, 3).map((r: any) => r.id);
      // Deactivate non-top-3
      const { data: activePodio } = await supabase
        .from("player_badges")
        .select("id, player_id")
        .eq("badge_code", "podio")
        .eq("is_active", true);

      for (const pb of (activePodio || [])) {
        if (!top3Ids.includes(pb.player_id)) {
          await supabase
            .from("player_badges")
            .update({ is_active: false, lost_at: new Date().toISOString() })
            .eq("id", pb.id);
        }
      }

      for (const id of top3Ids) {
        await activateDynamic(supabase, id, "podio", newlyConquered, badgeMap, allPlayerMap);
      }
    }

    // CRAQUE DA RODADA
    await supabase
      .from("player_badges")
      .update({ is_active: false, lost_at: new Date().toISOString() })
      .eq("badge_code", "craque_rodada")
      .eq("is_active", true);

    const { data: gameAtpPoints } = await supabase
      .from("atp_points")
      .select("player_id, raw_points")
      .eq("game_id", game_id)
      .order("raw_points", { ascending: false })
      .limit(1);

    if (gameAtpPoints && gameAtpPoints.length > 0) {
      await awardBadge(gameAtpPoints[0].player_id, "craque_rodada", game_id, {
        raw_points: gameAtpPoints[0].raw_points,
      });
    }

    // EFICIÊNCIA MÁXIMA
    await supabase
      .from("player_badges")
      .update({ is_active: false, lost_at: new Date().toISOString() })
      .eq("badge_code", "eficiencia")
      .eq("is_active", true);

    // Calculate avg ROI per player with ≥5 games
    const roiByPlayer = new Map<string, { totalRoi: number; count: number }>();
    for (const gp of (allGamePlayers || [])) {
      const invested = gp.initial_buyin * (1 + gp.total_rebuys);
      const roi = invested > 0 ? (gp.final_result - invested) / invested : 0;
      const existing = roiByPlayer.get(gp.player_id) || { totalRoi: 0, count: 0 };
      roiByPlayer.set(gp.player_id, { totalRoi: existing.totalRoi + roi, count: existing.count + 1 });
    }

    let bestRoiPlayer = "";
    let bestAvgRoi = -Infinity;
    for (const [pid, data] of roiByPlayer) {
      if (data.count >= 5) {
        const avgRoi = data.totalRoi / data.count;
        if (avgRoi > bestAvgRoi) {
          bestAvgRoi = avgRoi;
          bestRoiPlayer = pid;
        }
      }
    }
    if (bestRoiPlayer && bestAvgRoi > 0) {
      await activateDynamic(supabase, bestRoiPlayer, "eficiencia", newlyConquered, badgeMap, allPlayerMap, { avg_roi: bestAvgRoi });
    }

    // FAVORITO DO MOMENTO
    await supabase
      .from("player_badges")
      .update({ is_active: false, lost_at: new Date().toISOString() })
      .eq("badge_code", "favorito")
      .eq("is_active", true);

    const maxSkillPlayer = participantIds.reduce((best: string, pid: string) => {
      const skill = Number(playerMap.get(pid)?.skill_score ?? 0);
      const bestSkill = Number(playerMap.get(best)?.skill_score ?? 0);
      return skill > bestSkill ? pid : best;
    }, participantIds[0]);

    if (maxSkillPlayer) {
      await awardBadge(maxSkillPlayer, "favorito", game_id, {
        skill_score: playerMap.get(maxSkillPlayer)?.skill_score,
      });
    }

    console.log(`Badges evaluated for game ${game_id}: ${newlyConquered.length} newly conquered`);

    return new Response(
      JSON.stringify({ newly_conquered: newlyConquered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error evaluating badges:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function activateDynamic(
  supabase: any,
  playerId: string,
  badgeCode: string,
  newlyConquered: any[],
  badgeMap: Map<string, any>,
  playerMap: Map<string, any>,
  metadata: any = {}
) {
  const { data: existing } = await supabase
    .from("player_badges")
    .select("id")
    .eq("player_id", playerId)
    .eq("badge_code", badgeCode)
    .eq("is_active", true);

  if (existing && existing.length > 0) return;

  const { error } = await supabase.from("player_badges").insert({
    player_id: playerId,
    badge_code: badgeCode,
    is_active: true,
    metadata,
  });

  if (!error) {
    const def = badgeMap.get(badgeCode);
    const player = playerMap.get(playerId);
    newlyConquered.push({
      player_id: playerId,
      player_name: player?.name || "Unknown",
      badge_code: badgeCode,
      badge_name: def?.name || badgeCode,
      emoji: def?.emoji || "🏅",
      description: def?.description || "",
      metadata,
    });
  }
}

async function deactivateDynamic(supabase: any, playerId: string, badgeCode: string) {
  await supabase
    .from("player_badges")
    .update({ is_active: false, lost_at: new Date().toISOString() })
    .eq("player_id", playerId)
    .eq("badge_code", badgeCode)
    .eq("is_active", true);
}

async function awardMarco(
  supabase: any,
  playerId: string,
  badgeCode: string,
  newlyConquered: any[],
  badgeMap: Map<string, any>,
  playerMap: Map<string, any>,
  gameId: string | null = null,
  metadata: any = {}
) {
  const { data: existing } = await supabase
    .from("player_badges")
    .select("id")
    .eq("player_id", playerId)
    .eq("badge_code", badgeCode);

  if (existing && existing.length > 0) return;

  const insertData: any = {
    player_id: playerId,
    badge_code: badgeCode,
    is_active: true,
    metadata,
  };
  if (gameId) insertData.game_id = gameId;

  const { error } = await supabase.from("player_badges").insert(insertData);

  if (!error) {
    const def = badgeMap.get(badgeCode);
    const player = playerMap.get(playerId);
    newlyConquered.push({
      player_id: playerId,
      player_name: player?.name || "Unknown",
      badge_code: badgeCode,
      badge_name: def?.name || badgeCode,
      emoji: def?.emoji || "🏅",
      description: def?.description || "",
      metadata,
    });
  }
}
