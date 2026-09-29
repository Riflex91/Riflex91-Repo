import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
const reportArg=value("--report");
if(!upstreamArg){
  console.error("Usage: node tools/verify-mainland-runtime-application.mjs --upstream <checkout> [--report <json>]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const terrain=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const entities=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const bootstrap=fs.readFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),"utf8");
const errors=[];

const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);

const requireFromHere=createRequire(import.meta.url);
const upstreamSprites=requireFromHere(path.join(upstream,"design","sprites.js"));
const deepClone=value=>JSON.parse(JSON.stringify(value));
const baseFamilies={
  sprites:deepClone(upstreamSprites.sprites||{}),
  animations:{},
  tilesets:deepClone(upstreamSprites.tilesets||{}),
  imagesets:deepClone(upstreamSprites.imagesets||{})
};

const activationEntries=[...(terrain.entries||[]),...(entities.entries||[])];
const manifestEntries=[];
const bySource=new Map();
for(const entry of activationEntries){
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  if(!sourcePath){errors.push("invalid activation sourcePath");continue;}
  if(bySource.has(sourcePath)){errors.push(sourcePath+": duplicate activation source");continue;}
  const runtimeUrl="/images/alhd/"+String(entry.hdPath||"").replace(/^\/+/, "")+"?alhdv=000000000000";
  const runtimeEntry={
    sourcePath,
    runtimeUrl,
    scale:entry.scale,
    hdPixels:{width:entry.expectedPixels.width,height:entry.expectedPixels.height},
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true
  };
  bySource.set(sourcePath,runtimeEntry);
  manifestEntries.push(runtimeEntry);
}
manifestEntries.sort((a,b)=>a.sourcePath<b.sourcePath?-1:a.sourcePath>b.sourcePath?1:0);

const scopeSources=(scope.sourceFiles||[]).map(normalizeAssetPath).filter(Boolean).sort();
if(manifestEntries.length!==48) errors.push("runtime simulation manifest must contain exactly 48 entries");
if(JSON.stringify(manifestEntries.map(entry=>entry.sourcePath))!==JSON.stringify(scopeSources)) errors.push("runtime simulation sources must exactly match Mainland scope");

function run(search){
  const G=deepClone(baseFamilies);
  const rootObject={
    location:{search},
    __ALHD_MANIFEST__:{schemaVersion:1,mode:"ASSET_ONLY",upstreamCommit:lock.commit,replacements:manifestEntries},
    G
  };
  const context=vm.createContext({window:rootObject,globalThis:rootObject});
  vm.runInContext(bootstrap,context,{filename:"adventure-land-hd-bootstrap.js"});
  return {G,status:rootObject.ALHD.status()};
}

function withoutFile(def){
  if(!def||typeof def!=="object") return def;
  const clone=deepClone(def);
  delete clone.file;
  return clone;
}

function inspectFamily(name,before,after,changed,seen){
  const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
  for(const key of keys){
    const original=before?.[key];
    const current=after?.[key];
    if(!original||typeof original!=="object"||typeof original.file!=="string"){
      if(JSON.stringify(original)!==JSON.stringify(current)) errors.push(name+"."+key+": non-file definition changed");
      continue;
    }
    const sourcePath=normalizeAssetPath(original.file);
    const expected=sourcePath&&bySource.get(sourcePath);
    if(!expected){
      if(JSON.stringify(original)!==JSON.stringify(current)) errors.push(name+"."+key+": out-of-scope definition changed");
      continue;
    }
    if(current?.file!==expected.runtimeUrl) errors.push(name+"."+key+": runtime file override mismatch for "+sourcePath);
    if(JSON.stringify(withoutFile(original))!==JSON.stringify(withoutFile(current))) errors.push(name+"."+key+": non-file metadata changed for "+sourcePath);
    changed.push({family:name,key,sourcePath,runtimeUrl:current?.file});
    seen.add(sourcePath);
  }
}

const hd=run("?alhd=on");
const changed=[];
const seen=new Set();
inspectFamily("sprites",baseFamilies.sprites,hd.G.sprites,changed,seen);
inspectFamily("animations",baseFamilies.animations,hd.G.animations,changed,seen);
inspectFamily("tilesets",baseFamilies.tilesets,hd.G.tilesets,changed,seen);
inspectFamily("imagesets",baseFamilies.imagesets,hd.G.imagesets,changed,seen);

if(hd.status.reason!=="READY") errors.push("HD runtime status reason must be READY");
if(hd.status.mode!=="HD") errors.push("HD runtime status mode must be HD");
if(hd.status.applied!==changed.length) errors.push("HD runtime applied count does not match changed definition count");
if(hd.status.available!==48) errors.push("HD runtime available count must be 48");
if(hd.status.eligible!==48) errors.push("HD runtime eligible count must be 48 when no WebGL limit is injected");
if(hd.status.blocked.length!==0) errors.push("HD runtime blocked list must be empty when no WebGL limit is injected");
if(hd.status.missing.length!==0) errors.push("HD runtime missing list must be empty");
if(JSON.stringify([...hd.status.paths].sort())!==JSON.stringify(scopeSources)) errors.push("ALHD.status().paths must contain exactly all 48 Mainland sources");
if(JSON.stringify([...seen].sort())!==JSON.stringify(scopeSources)) errors.push("runtime bootstrap did not apply every Mainland source at least once");

const original=run("?alhd=off");
if(original.status.reason!=="ORIGINAL_MODE") errors.push("original runtime status reason must be ORIGINAL_MODE");
if(original.status.mode!=="ORIGINAL") errors.push("original runtime status mode must be ORIGINAL");
if(original.status.applied!==0) errors.push("original runtime mode must apply zero replacements");
if(original.status.available!==48) errors.push("original runtime mode must still report 48 available manifest paths");
if(original.status.eligible!==48) errors.push("original runtime mode must still report 48 eligible paths without an injected WebGL limit");
if(original.status.blocked.length!==0) errors.push("original runtime mode blocked list must be empty without an injected WebGL limit");
if(original.status.paths.length!==0) errors.push("original runtime mode must report zero replacement paths");
if(original.status.missing.length!==0) errors.push("original runtime mode must not report intentionally bypassed paths as missing");
if(JSON.stringify(original.G)!==JSON.stringify(baseFamilies)) errors.push("original runtime mode changed pinned presentation definitions");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

const counts={
  changedDefinitions:changed.length,
  uniqueSources:seen.size,
  sprites:changed.filter(row=>row.family==="sprites").length,
  tilesets:changed.filter(row=>row.family==="tilesets").length,
  animations:changed.filter(row=>row.family==="animations").length,
  imagesets:changed.filter(row=>row.family==="imagesets").length
};
const report={
  schemaVersion:1,
  upstreamCommit:lock.commit,
  mapId:"main",
  counts,
  hdStatus:hd.status,
  originalStatus:original.status,
  changed
};
if(reportArg){
  const reportPath=path.resolve(process.cwd(),reportArg);
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("Mainland runtime application verified:",seen.size+"/48 unique sources applied across",changed.length,"definitions; ORIGINAL mode unchanged.");
