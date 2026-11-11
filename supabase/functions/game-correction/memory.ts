// Isolated replay: reads and writes never touch live tables until the final RPC.
export class ReplayStore {
  tables: Record<string, any[]>;
  now = new Date().toISOString();
  constructor(tables: Record<string, any[]>) { this.tables = structuredClone(tables); }
  from(table: string) { return new ReplayQuery(this, table); }
  rows(table: string): any[] {
    if (table !== 'atp_ranking') return this.tables[table] ?? [];
    const window = this.tables.atp_config[0]?.window_size ?? 20;
    const ids = this.tables.games.filter(g => g.status === 'completed').sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, window).map(g => g.id);
    return this.tables.players.map(p => ({ ...p, score_atp: this.tables.atp_points.filter(a => a.player_id === p.id && ids.includes(a.game_id)).reduce((sum,a) => sum + a.raw_points,0) })).filter(p => this.tables.atp_points.some(a => a.player_id===p.id && ids.includes(a.game_id)));
  }
}
class ReplayQuery implements PromiseLike<any> {
  filters: ((r:any)=>boolean)[]=[];
  orders: {key:string; ascending:boolean}[]=[];
  cap=Infinity; columns='*'; operation='select'; values:any; singleton=false;
  constructor(public store:ReplayStore,public table:string) {}
  select(columns='*') { this.columns=columns; return this; }
  eq(key:string,v:any) { this.filters.push(r=>this.value(r,key)===v); return this; }
  neq(key:string,v:any) { this.filters.push(r=>this.value(r,key)!==v); return this; }
  in(key:string,v:any[]) { this.filters.push(r=>v.includes(this.value(r,key))); return this; }
  not(key:string,_operator:string,v:any) { this.filters.push(r=>v===null ? this.value(r,key)!=null : this.value(r,key)!==v); return this; }
  gte(key:string,v:any) { this.filters.push(r=>this.value(r,key)>=v); return this; }
  order(key:string,options:any={}) { this.orders.push({key:key.replace('games(date)','games.date'),ascending:options.ascending!==false}); return this; }
  limit(n:number) { this.cap=n; return this; }
  single() { this.singleton=true; return this; }
  maybeSingle() { this.singleton=true; return this; }
  insert(values:any) { this.operation='insert'; this.values=Array.isArray(values)?values:[values]; return this; }
  update(values:any) { this.operation='update'; this.values=values; return this; }
  delete() { this.operation='delete'; return this; }
  upsert(values:any,_options?:any) { this.operation='upsert'; this.values=values; return this; }
  value(r:any,key:string):any {
    if(key.startsWith('games.')) return this.store.tables.games.find(g=>g.id===r.game_id)?.[key.split('.')[1]];
    return r[key];
  }
  then<TResult1=any,TResult2=never>(resolve?:((v:any)=>TResult1|PromiseLike<TResult1>)|null,reject?:((r:any)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2> {
    return Promise.resolve().then(()=>this.execute()).then(resolve,reject);
  }
  execute() {
    let rows=this.store.rows(this.table);
    const matches=(r:any)=>this.filters.every(f=>f(r)) && (!this.columns.includes('games!inner') || !!this.store.tables.games.find(g=>g.id===r.game_id));
    if(this.operation==='delete') { this.store.tables[this.table]=rows.filter(r=>!matches(r)); return {data:null,error:null}; }
    if(this.operation==='update') { rows.filter(matches).forEach(r=>Object.assign(r,this.values)); return {data:null,error:null}; }
    if(this.operation==='insert'||this.operation==='upsert') {
      for(const value of this.values) {
        const existing=this.operation==='upsert'?rows.find(r=>r.player_id===value.player_id && r.rb_bucket===value.rb_bucket):undefined;
        if(existing) Object.assign(existing,value);
        else rows.push({id:crypto.randomUUID(),created_at:this.store.now,conquered_at:this.store.now,is_active:true,lost_at:null,...value});
      }
      this.store.tables[this.table]=rows;
      return {data:this.values,error:null};
    }
    rows=rows.filter(matches);
    rows.sort((a,b)=>{for(const o of this.orders){const av=this.value(a,o.key),bv=this.value(b,o.key);if(av<bv)return o.ascending?-1:1;if(av>bv)return o.ascending?1:-1;}return (a.id??'').localeCompare(b.id??'');});
    const result=rows.slice(0,this.cap).map(r=>({...r,...(this.columns.includes('games')?{games:this.store.tables.games.find(g=>g.id===r.game_id)}:{})}));
    return {data:this.singleton?(result[0]??null):result,error:null};
  }
}