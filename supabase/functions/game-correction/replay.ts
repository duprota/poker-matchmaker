import { ReplayStore } from './memory.ts';
import { calculateForGame, calculateAtpForGame } from '../calculate-ratings/index.ts';
import { evaluateBadges } from '../evaluate-badges/index.ts';
import { handleRecalibrate } from '../calculate-live-scores/index.ts';

export async function rebuild(tables: Record<string, any[]>, progress: (n:number)=>Promise<void>) {
  const games=tables.games.filter(g=>g.status==='completed').sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const allParticipants=tables.game_players;
  const store=new ReplayStore({...tables,games:[],game_players:[],player_rating_history:[],atp_points:[],player_badges:[],player_live_params:[]});
  store.tables.players.forEach(p=>Object.assign(p,{mu:25,sigma:8.333,skill_score:0,rating_games:0,rebuy_tendency:null,recovery_rate:null,archetype:null}));
  for(let i=0;i<games.length;i++) {
    const game=games[i];
    store.now=game.date;
    store.tables.games.push(game);
    store.tables.game_players.push(...allParticipants.filter(p=>p.game_id===game.id));
    for(const response of [await calculateForGame(store,game.id),await calculateAtpForGame(store,game.id),await handleRecalibrate(store,game.id,{})]) {
      const body=await response.json();
      if(!response.ok||body.error) throw new Error(body.error??'Calculation failed');
    }
    const response=await evaluateBadges(new Request('http://replay',{method:'POST',body:JSON.stringify({game_id:game.id})}),store);
    const result=await response.json();
    if(!response.ok||result.error) throw new Error(result.error??'Badge replay failed');
    await progress(i+1);
  }
  return {
    players:store.tables.players,
    player_rating_history:store.tables.player_rating_history,
    atp_points:store.tables.atp_points,
    player_live_params:store.tables.player_live_params,
    player_badges:store.tables.player_badges,
  };
}