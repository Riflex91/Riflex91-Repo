export const QUOTA_ROWS_FUNCTION = `function quotaRows(){
  const quota=overview&&overview.quotaUsage||{},chars=overview&&overview.characters||[];
  let localWorkerUsed=0,workerSeen=0;
  chars.forEach(row=>{const b=budgetFromStatus(row.status||{});if(b&&Number.isFinite(Number(b.used))){localWorkerUsed+=Number(b.used)||0;workerSeen++}});
  const trackedWorker=quota.worker&&Number.isFinite(Number(quota.worker.used))?Number(quota.worker.used):null;
  const workerUsed=trackedWorker==null?(workerSeen?localWorkerUsed:null):Math.max(trackedWorker,localWorkerUsed);
  const workerHard=Number(quota.worker&&quota.worker.limit)||Number(health&&health.cloudflareConfiguration&&health.cloudflareConfiguration.freeTierGuard&&health.cloudflareConfiguration.freeTierGuard.workers&&health.cloudflareConfiguration.freeTierGuard.workers.freeDailyRequests)||100000;
  const workerLimit=Number(quota.worker&&quota.worker.target)||Number(health&&health.cloudflareConfiguration&&health.cloudflareConfiguration.freeTierGuard&&health.cloudflareConfiguration.freeTierGuard.workers&&health.cloudflareConfiguration.freeTierGuard.workers.internalDailyTarget)||95000;
  const workerRemaining=workerUsed==null?null:Math.max(0,workerLimit-workerUsed);

  const d1=quota.d1||{},read=d1.rowsRead||{},write=d1.rowsWritten||{};
  const d1Metrics=[
    {name:'Reads',remaining:read.remaining,limit:read.limit,unit:'count'},
    {name:'Writes',remaining:write.remaining,limit:write.limit,unit:'count'}
  ].filter(x=>x.remaining!=null&&Number(x.limit)>0);
  d1Metrics.sort((a,b)=>(Number(a.remaining)/Number(a.limit))-(Number(b.remaining)/Number(b.limit)));
  const d1Worst=d1Metrics[0]||null,d1Blocked=overview&&overview.database&&overview.database.available===false&&overview.database.reason==='D1_DAILY_ROW_READ_LIMIT';

  const r2=quota.r2||{},a=r2.classA||{},b=r2.classB||{},storage=r2.storage||{};
  const r2Metrics=[
    {name:'Class A',remaining:a.remaining,limit:a.limit,unit:'count'},
    {name:'Class B',remaining:b.remaining,limit:b.limit,unit:'count'},
    {name:'Speicher',remaining:storage.remaining,limit:storage.limit,unit:'bytes'}
  ].filter(x=>x.remaining!=null&&Number(x.limit)>0);
  r2Metrics.sort((x,y)=>(Number(x.remaining)/Number(x.limit))-(Number(y.remaining)/Number(y.limit)));
  const r2Worst=r2Metrics[0]||null;

  const supa=quota.supabase||{},supaLimit=Number(supa.limit)||500000,supaUsed=supa.used!=null&&Number.isFinite(Number(supa.used))?Number(supa.used):null;
  const brainUsage=brain&&brain.usage||overview&&overview.brainUsage||{};
  const brainHard=Math.max(1,Number(settingValue('brain.dailyNeuronLimit',brainUsage.limit||10000))||10000);
  const brainTargetFraction=Math.max(.5,Math.min(1,Number(settingValue('brain.budgetTargetFraction',brainUsage.targetFraction||.995))||.995));
  const brainLimit=Math.max(1,Math.floor(brainHard*brainTargetFraction));
  const brainUsed=Number(brainUsage.neurons||brainUsage.usedToday||0);
  const teacherCalls=Number(brainUsage.requests||0);

  return [
    {icon:'☁',title:'Worker',note:'Requests heute · Sicherheitsziel 95%',remaining:workerRemaining,limit:workerLimit,unit:'count',source:workerUsed==null?'Live-Wert fehlt':humanCount(workerUsed)+' genutzt · Hard-Limit '+humanCount(workerHard)},
    {icon:'▦',title:'D1',note:d1Worst?(d1Blocked?'Tageslimit erreicht':('Reads '+humanCount(read.remaining)+' frei · Writes '+humanCount(write.remaining)+' frei')):'Row-Zugriffe · Bot-Zähler startet mit diesem Release',remaining:d1Blocked?0:(d1Worst&&d1Worst.remaining),limit:d1Blocked?1:(d1Worst&&d1Worst.limit),unit:'count',source:d1Worst?('engster Wert: '+d1Worst.name+(d1.approximate?' · Bot-Zähler':'')).replace('Bot-Zähler · Bot-Zähler','Bot-Zähler'):'Live-Wert fehlt'},
    {icon:'🗄',title:'R2',note:r2Worst?('A '+humanCount(a.remaining)+' frei · B '+humanCount(b.remaining)+' frei · '+humanBytes(storage.remaining)+' Speicher'):'Class A/B + Live-Speicher',remaining:r2Worst&&r2Worst.remaining,limit:r2Worst&&r2Worst.limit,unit:r2Worst&&r2Worst.unit||'count',source:r2Worst?'engster Wert: '+r2Worst.name+' · 95%-Guard':'Live-Wert fehlt'},
    {icon:'⚡',title:'Supabase',note:'Edge Functions · laufender Monat',remaining:supaUsed==null?null:Math.max(0,supaLimit-supaUsed),limit:supaLimit,unit:'count',source:supaUsed==null?'Live-Wert fehlt':humanCount(supaUsed)+' erfolgreiche Debug-Ingests'+(supa.approximate?' · Mindestverbrauch':'')+(supa.stale?' · veraltet':'')},
    {icon:'🧠',title:'Gehirn',note:'Neuron-Budget heute · '+humanCount(teacherCalls)+' Teacher Calls',remaining:Math.max(0,brainLimit-brainUsed),limit:brainLimit,unit:'count',source:humanCount(brainUsed)+' Neuronen genutzt · Hard-Limit '+humanCount(brainHard)}
  ]
}`;
