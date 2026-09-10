#!/usr/bin/env python3
from pathlib import Path
import json,re

bot_path=Path('bot.js')
text=bot_path.read_text(encoding='utf-8')
if "var VERSION = '2.14.9';" not in text:
    raise SystemExit('expected 2.14.9 VERSION marker missing')
if '2.14.10 Active discovery route safety' in text:
    raise SystemExit('2.14.10 block already present')

text=text.replace('Adventure Land • AiO Bot 2.14.9 | 2026-09-10','Adventure Land • AiO Bot 2.14.10 | 2026-09-10',1)
text=text.replace("var VERSION = '2.14.9';","var VERSION = '2.14.10';",1)
marker='  // Preserve references so dispose can distinguish our CM handler on engines that support function identity.\n'
if marker not in text:
    raise SystemExit('final API marker missing')

block=r'''  // ---------------------------------------------------------------------------
  // 2.14.10 Active discovery route safety + full static world catalog caching.
  // ---------------------------------------------------------------------------
  if(FEATURE_CONTRACT.indexOf('merchant-discovery-safety')<0)FEATURE_CONTRACT.push('merchant-discovery-safety');

  function v21410CloneDiscoveryRows(rows){return (rows||[]).map(function(x){return Object.assign({},x,{definition:x&&x.definition?Object.assign({},x.definition):x&&x.definition,discoveryDanger:x&&x.discoveryDanger?Object.assign({},x.discoveryDanger,{hostile:(x.discoveryDanger.hostile||[]).slice()}):x&&x.discoveryDanger});});}
  function v21410TargetDanger(entry){
    var map=entry&&entry.map,m=GD.maps&&GD.maps[map]||{};
    if(!map||!GD.maps||!GD.maps[map])return {safe:false,reason:'unknown-map',hostile:[]};
    if(m.pvp===true)return {safe:false,reason:'pvp-map',hostile:[]};
    if(m.instance===true)return {safe:false,reason:'instance-map',hostile:[]};
    var ex=Number(entry&&entry.x),ey=Number(entry&&entry.y);if(!isFinite(ex)||!isFinite(ey))return {safe:false,reason:'no-safe-coordinate',hostile:[]};
    var hostile=[];
    (m.monsters||[]).forEach(function(sp){
      var type=String(sp&&sp.type||((Array.isArray(sp)&&typeof sp[0]==='string')?sp[0]:'')||''),md=GD.monsters&&GD.monsters[type]||{};
      if(!type||(Number(md.aggro)||0)<=0&&(Number(md.rage)||0)<=0)return;
      var b=sp&&sp.boundary,near=false,known=false,margin=Math.max(140,(Number(md.range)||0)+90);
      if(Array.isArray(b)&&b.length>=4&&[b[0],b[1],b[2],b[3]].every(function(n){return isFinite(Number(n));})){
        known=true;var x1=Math.min(Number(b[0]),Number(b[2]))-margin,x2=Math.max(Number(b[0]),Number(b[2]))+margin,y1=Math.min(Number(b[1]),Number(b[3]))-margin,y2=Math.max(Number(b[1]),Number(b[3]))+margin;near=ex>=x1&&ex<=x2&&ey>=y1&&ey<=y2;
      }else{
        var p=v2149Point(sp&&sp.position);if(p){known=true;near=Math.hypot(ex-p.x,ey-p.y)<=Math.max(320,margin*2);}
      }
      if(near||!known)hostile.push(type);
    });
    hostile=hostile.filter(function(x,i,a){return a.indexOf(x)===i;}).slice(0,12);
    return {safe:hostile.length===0,reason:hostile.length?'aggressive-monsters-near-target':'safe-target-area',hostile:hostile};
  }

  function v21410AdditionalDiscoveryRows(){
    var out=[];
    Object.keys(GD.maps||{}).sort().forEach(function(map){
      var m=GD.maps[map]||{},staticMap=m.pvp===true||m.instance===true;
      if(staticMap){
        (m.npcs||[]).forEach(function(n,ix){var id=String(n&&n.id||n&&n.npc||'');if(!id)return;var p=v2149Point(n.position)||v2149Point(n.positions&&n.positions[0]),def=v2149NpcDefinition(id);out.push({key:'npc|'+map+'|'+id,kind:'npc',id:id,map:map,x:p&&p.x,y:p&&p.y,definition:def,definitionHash:v2149TinyHash(def)});});
        (m.quirks||[]).forEach(function(q,ix){var p=Array.isArray(q)?v2149Point(q):v2149Point(q&&q.position),type=Array.isArray(q)?String(q[4]||'quirk'):String(q&&q.type||'quirk'),label=Array.isArray(q)?safeString(q[5]||'',120):safeString(q&&q.label||q&&q.name||'',120);if(p)out.push({key:'quirk|'+map+'|'+type+'|'+ix,kind:'quirk',id:type+':'+ix,type:type,label:label,map:map,x:p.x,y:p.y,definitionHash:v2149TinyHash([type,label])});});
        (m.machines||[]).forEach(function(q,ix){var p=v2149Point(q&&q.position)||v2149Point(q),type=String(q&&q.type||'machine');if(p)out.push({key:'machine|'+map+'|'+type+'|'+ix,kind:'machine',id:type+':'+ix,type:type,map:map,x:p.x,y:p.y,definitionHash:v2149TinyHash(q)});});
        (m.zones||[]).forEach(function(z,ix){var type=String(z&&z.type||''),p=v2149PolygonCenter(z&&z.polygon)||v2149Point(z&&z.position)||v2149Point(z);if(p&&type)out.push({key:'zone|'+map+'|'+type+'|'+ix,kind:'zone',id:type+':'+ix,type:type,map:map,x:p.x,y:p.y,drop:safeString(z&&z.drop||'',80),definitionHash:v2149TinyHash(z)});});
      }
      (m.doors||[]).forEach(function(d,ix){var p=v2149Point(d),dtype=String(Array.isArray(d)&&d[7]||'ordinary'),target=String(Array.isArray(d)&&d[4]||'');if(p)out.push({key:'door|'+map+'|'+ix,kind:'door',id:dtype+':'+ix,type:'door:'+dtype,label:target?('to:'+target):'',map:map,x:p.x,y:p.y,definitionHash:v2149TinyHash(d)});});
    });
    return out;
  }

  var v21410DiscoveryCatalogBase=v2149DiscoveryCatalog;
  v2149DiscoveryCatalog=function(){
    var gv=String(v273GameVersion()||''),now=clock(),cache=S.discoveryCatalogCache21410;
    if(cache&&cache.gameVersion===gv&&now-Number(cache.at||0)<60000&&Array.isArray(cache.rows))return v21410CloneDiscoveryRows(cache.rows);
    var rows=v21410DiscoveryCatalogBase().concat(v21410AdditionalDiscoveryRows()),seen={},out=[];
    rows.forEach(function(e){if(!e||!e.key||seen[e.key])return;seen[e.key]=1;var x=Object.assign({},e),danger=v21410TargetDanger(x);x.discoveryDanger=danger;if(!danger.safe){x.staticOnly=true;x.sourceX=isFinite(Number(x.x))?Number(x.x):null;x.sourceY=isFinite(Number(x.y))?Number(x.y):null;delete x.x;delete x.y;}out.push(x);});
    out=out.slice(0,480);S.discoveryCatalogCache21410={gameVersion:gv,at:now,rows:v21410CloneDiscoveryRows(out)};return v21410CloneDiscoveryRows(out);
  };

  var v21410RecordDiscoveryBase=v2149RecordDiscovery;
  v2149RecordDiscovery=function(entry,probe){if(entry&&entry.staticOnly&&!probe){var d=entry.discoveryDanger||{};probe={safe:true,ok:true,staticOnly:true,reason:d.reason||'travel-not-approved',hostile:(d.hostile||[]).slice(0,12),sourceX:entry.sourceX,sourceY:entry.sourceY};}return v21410RecordDiscoveryBase(entry,probe);};

  v2149GatherZones=function(){return v2149DiscoveryCatalog().filter(function(x){return x&&x.kind==='zone'&&(x.type==='fishing'||x.type==='mining')&&!x.staticOnly&&isFinite(Number(x.x))&&isFinite(Number(x.y));});};
  var v21410NpcSellerBase=v2149NpcSeller;
  v2149NpcSeller=function(itemName){var p=v21410NpcSellerBase(itemName);if(!p||!isFinite(Number(p.x))||!isFinite(Number(p.y)))return null;var d=v21410TargetDanger({map:p.map,x:p.x,y:p.y});return d.safe?p:null;};

  audit('feature_contract','2.14.10 Discovery-Sicherheitszonen + vollständiger statischer Weltkatalog + 60s Katalog-Cache geprüft',{features:FEATURE_CONTRACT,configHash:v282ConfigHash(C)});
'''
text=text.replace(marker,block+'\n\n'+marker,1)
bot_path.write_text(text,encoding='utf-8')

vp=Path('version.json')
v=json.loads(vp.read_text(encoding='utf-8'))
if v.get('version')!='2.14.9': raise SystemExit('version.json is not 2.14.9')
v['version']='2.14.10';v['build']='2026-09-10'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

for p in Path('scripts').glob('*.js'):
    s=p.read_text(encoding='utf-8')
    if '2.14.9' not in s and '2\\.14\\.9' not in s: continue
    s=s.replace('2.14.9','2.14.10').replace('2\\.14\\.9','2\\.14\\.10')
    p.write_text(s,encoding='utf-8')

vr=Path('scripts/verify-release.js')
s=vr.read_text(encoding='utf-8')
s=s.replace('prepared release must be 2.14.9','prepared release must be 2.14.10')
s=s.replace('version.version === "2.14.9"','version.version === "2.14.10"')
vr.write_text(s,encoding='utf-8')

smoke=r'''#!/usr/bin/env node
"use strict";
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const bot=fs.readFileSync('bot.js','utf8');
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(version.version,'2.14.10');
assert.equal(version.dashboardVersion,'2.14.5');
assert.match(bot,/var VERSION = ['"]2\.14\.10['"]/);
assert.doesNotThrow(()=>new vm.Script(bot), 'bot syntax');
assert.ok(bot.includes("FEATURE_CONTRACT.indexOf('merchant-discovery-safety')"),'discovery safety feature marker missing');
assert.ok(bot.includes('function v21410TargetDanger'),'target danger classifier missing');
assert.ok(bot.includes("m.pvp===true")&&bot.includes("reason:'pvp-map'"),'PvP maps must be static-only');
assert.ok(bot.includes("m.instance===true")&&bot.includes("reason:'instance-map'"),'instances must be static-only');
assert.ok(bot.includes('Number(md.aggro)')&&bot.includes('Number(md.rage)'),'nearby aggressive-monster checks missing');
assert.ok(bot.includes('aggressive-monsters-near-target'),'danger reason missing');
assert.ok(bot.includes('function v21410AdditionalDiscoveryRows'),'static skipped-map catalog missing');
assert.ok(bot.includes("(m.doors||[])")&&bot.includes("kind:'door'"),'doors must be part of interaction discovery');
assert.ok(bot.includes('staticMap=m.pvp===true||m.instance===true'),'PvP/instance NPCs and objects must still enter static world knowledge');
assert.ok(bot.includes('discoveryCatalogCache21410')&&bot.includes('<60000'),'discovery catalog 60s cache missing');
assert.ok(bot.includes('x.staticOnly=true')&&bot.includes('delete x.x;delete x.y'),'unsafe targets must lose routable coordinates');
assert.ok(bot.includes('staticOnly:true')&&bot.includes("reason:d.reason||'travel-not-approved'"),'static-only observations must explain why no physical probe occurred');
const tick=bot.slice(bot.indexOf('function v2149DiscoveryTick()'),bot.indexOf('function v2149GatherZones()'));
assert.ok(tick.indexOf('!isFinite(e.x)||!isFinite(e.y)')>=0,'discovery no-coordinate guard missing');
assert.ok(tick.indexOf('!isFinite(e.x)||!isFinite(e.y)')<tick.indexOf("moveToGoal({map:e.map,x:e.x,y:e.y}"),'static-only guard must happen before discovery travel');
assert.ok(bot.includes("v2149GatherZones=function()")&&bot.includes('!x.staticOnly'),'gathering must only use physically approved zones');
assert.ok(bot.includes('v2149NpcSeller=function(itemName)')&&bot.includes('v21410TargetDanger({map:p.map,x:p.x,y:p.y})'),'gathering tool vendor travel must respect safety classifier');
assert.ok(bot.includes("V2149_BANK_KEY='merchantBankSnapshot2149'"),'2.14.9 bank warehouse regressed');
assert.ok(bot.includes("v2149RequestBank('craft'")&&bot.includes("v2149RequestBank('compound'")&&bot.includes("v2149RequestBank('gear'"),'2.14.9 bank integration regressed');
assert.ok(bot.includes("interact('newyear_tree')")&&bot.includes("mainframe_command('hello')"),'safe discovery probes regressed');
assert.ok(!bot.slice(bot.indexOf('2.14.9 Merchant bank warehouse + active discovery'),bot.indexOf("audit('feature_contract','2.14.10")).includes("interact('the_lever')"),'disruptive lever probing must remain disabled');
console.log('2.14.10 discovery safety / full static catalog smoke OK');
'''
Path('scripts/smoke-21410-discovery-safety.js').write_text(smoke,encoding='utf-8')
print('patched 2.14.10')
