import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { rebuild } from './replay.ts';

const fixtures = () => ({
  games: [
    { id: 'g1', date: '2026-01-01T00:00:00Z', status: 'completed' },
    { id: 'g2', date: '2026-01-02T00:00:00Z', status: 'ongoing' },
    { id: 'g3', date: '2026-01-03T00:00:00Z', status: 'completed' },
  ],
  players: [{ id: 'a', name: 'A', mu: 999, rating_games: 90 }, { id: 'b', name: 'B', mu: 888, rating_games: 90 }],
  game_players: [
    ...['g1','g2','g3'].flatMap(game_id => [
      { game_id, player_id:'a', initial_buyin:100,total_rebuys:1,final_result: game_id==='g3'?0:300 },
      { game_id, player_id:'b', initial_buyin:100,total_rebuys:0,final_result: game_id==='g3'?300:0 },
    ]),
  ],
  atp_config: [{window_size:20}], badge_definitions:[],live_game_scores:[],player_badges:[],
});
Deno.test('reopened game is excluded from ratings and recalibration samples',async()=>{
  const result=await rebuild(fixtures(),async()=>{});
  assertEquals(result.player_rating_history.length,4);
  assertEquals(result.players.map(p=>p.rating_games),[2,2]);
  assert(!result.atp_points.some(p=>p.game_id==='g2'));
  assertEquals(result.player_live_params.map(p=>p.sample_size),[2,2]);
});
Deno.test('rebuild is idempotent and never changes source tables',async()=>{
  const source=fixtures(); const original=structuredClone(source);
  const a=await rebuild(source,async()=>{}), b=await rebuild(source,async()=>{});
  assertEquals(a.players,b.players);
  const params = (rows: any[]) => rows.map(p => ({ player_id: p.player_id, rb_bucket: p.rb_bucket, delta: p.delta, sample_size: p.sample_size }));
  assertEquals(params(a.player_live_params),params(b.player_live_params));
  assertEquals(source,original);
});
Deno.test('later game consumes the previous rating instead of current corrupt values',async()=>{
  const result=await rebuild(fixtures(),async()=>{});
  for(const id of ['a','b']){
    const first=result.player_rating_history.find(r=>r.game_id==='g1'&&r.player_id===id);
    const later=result.player_rating_history.find(r=>r.game_id==='g3'&&r.player_id===id);
    assertEquals(first.mu_before,25);
    assertEquals(later.mu_before,first.mu_after);
  }
});
Deno.test('failures prevent a result from being returned for publication',async()=>{
  let failed=false;
  try { await rebuild(fixtures(),async()=>{throw new Error('write failed');}); }
  catch(e) { failed=e instanceof Error&&e.message==='write failed'; }
  assert(failed);
});