import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rebuild } from './replay.ts';
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const cors={ 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Content-Type':'application/json' };
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

async function runJob(db:any,id:string) {
  const token=crypto.randomUUID();
  const {data:claimed,error:claimError}=await db.rpc('claim_reconciliation',{p_job_id:id,p_token:token});
  if(claimError) throw claimError;
  if(!claimed) return;
  try {
    const tables:Record<string,any[]>={};
    for(const table of ['games','game_players','players','badge_definitions','atp_config','live_game_scores','player_badges']) {
      tables[table]=[];
      for(let offset=0;;offset+=1000) {
        const {data,error}=await db.from(table).select('*').order('id').range(offset,offset+999);
        if(error) throw error;
        tables[table].push(...data);
        if(data.length<1000) break;
      }
    }
    const output=await rebuild(tables,async n=>{
      const {error}=await db.from('game_reconciliation_jobs').update({stage:'replaying',cursor:n}).eq('id',id).eq('worker_token',token);
      if(error) throw error;
    });
    const {error}=await db.rpc('commit_game_reconciliation',{p_job_id:id,p_token:token,p_data:output});
    if(error) throw error;
  } catch(error) {
    const message=error instanceof Error?error.message:String(error);
    await db.from('game_reconciliation_jobs').update({status:'error',error:message,worker_token:null}).eq('id',id).eq('worker_token',token);
    console.error('Reconciliation failed',id,message);
  }
}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return reply({});
  try {
    const url=Deno.env.get('SUPABASE_URL');
    const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!key) throw new Error('Service not configured');
    const db=createClient(url,key);
    const authorization=req.headers.get('Authorization')??'';
    const {data:auth,error:authError}=await db.auth.getUser(authorization.replace(/^Bearer\s+/i,''));
    if(authError||!auth.user)return reply({error:'Faça login para continuar.'},401);
    const {action,...payload}=await req.json();
    if(!['reopen','finalize','retry','edit-expense','resume'].includes(action))return reply({error:'Ação inválida'},400);
    let id:string;
    if(action==='resume') {
      const {data:job,error}=await db.from('game_reconciliation_jobs').select('id,requested_by').eq('id',payload.job_id).single();
      if(error||job.requested_by!==auth.user.id)return reply({error:'Sem permissão'},403);
      id=job.id;
    } else {
      const {data,error}=await db.rpc('perform_game_correction',{p_user_id:auth.user.id,p_action:action,p_payload:payload});
      if(error)return reply({error:error.message},400);
      id=data.id;
    }
    if(action!=='edit-expense') EdgeRuntime.waitUntil(runJob(db,id));
    return reply({id,success:true});
  }catch(error){return reply({error:error instanceof Error?error.message:String(error)},500);}
});