import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath,validateUniformIntegerScale,hasResolutionSuffix} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
if(!upstreamArg){
  console.error("Usage: node tools/verify-mainland-entity-plan.mjs --upstream <checkout>");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-plan.json"),"utf8"));
const hdManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const errors=[];
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);
if(plan.upstreamCommit!==lock.commit) errors.push("entity plan upstreamCommit must match UPSTREAM.lock.json");
if(plan.mapId!=="main") errors.push("entity plan mapId must be main");
if(plan.projectDefaultScale!==8) errors.push("projectDefaultScale must remain 8");
if(plan.entityBaselineScale!==4) errors.push("entityBaselineScale must be 4");
if(plan.decodedBytesPerPixel!==4) errors.push("decodedBytesPerPixel must be 4");
if(!Number.isInteger(plan.decodedEntityBudgetMiB)||plan.decodedEntityBudgetMiB<128) errors.push("decodedEntityBudgetMiB must be an integer >= 128");

const gameSource=fs.readFileSync(path.join(upstream,"js","game.js"),"utf8");
for(const marker of [
  "for (var name in G.sprites)",
  "if (s_def.skip) continue",
  "s_def.file = url_factory(s_def.file)",
  "loader.add(s_def.file)"
]){
  if(!gameSource.includes(marker)) errors.push("pinned global G.sprites preload evidence missing: "+marker);
}

const scopedEntityFiles=(scope.sourceFiles||[]).map(normalizeAssetPath).filter(p=>p&&!p.startsWith("images/tiles/map/")).sort();
const entries=plan.entries||[];
const plannedFiles=entries.map(entry=>normalizeAssetPath(entry.sourcePath)).sort();
if(entries.length!==34) errors.push("Mainland entity plan must contain 34 source sheets");
if(new Set(plannedFiles).size!==plannedFiles.length) errors.push("entity sourcePath values must be unique");
if(JSON.stringify(plannedFiles)!==JSON.stringify(scopedEntityFiles)) errors.push("entity plan source files must exactly match non-terrain Mainland scope files");

function pngSize(file){
  const b=fs.readFileSync(file);
  if(b.length<24||b.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||b.subarray(12,16).toString("ascii")!=="IHDR") return null;
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

let baselineBytes=0;
let all8Bytes=0;
const groupCounts={};
for(const entry of entries){
  groupCounts[entry.group]=(groupCounts[entry.group]||0)+1;
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  const source=sourcePath&&path.join(upstream,...sourcePath.split("/"));
  if(!source||!fs.existsSync(source)){errors.push(entry.sourcePath+": source missing");continue;}
  const blob=execFileSync("git",["-C",upstream,"hash-object",sourcePath],{encoding:"utf8"}).trim();
  if(blob!==entry.originalBlobSha) errors.push(entry.sourcePath+": originalBlobSha drifted");
  const original=pngSize(source);
  if(!original) errors.push(entry.sourcePath+": source PNG unreadable");
  else if(JSON.stringify(original)!==JSON.stringify(entry.originalPixels)) errors.push(entry.sourcePath+": originalPixels drifted");
  const expectedScale=sourcePath==="images/tiles/characters/jubchan_1.png"?8:4;
  if(entry.scale!==expectedScale) errors.push(entry.sourcePath+": expected baseline scale "+expectedScale);
  if(!hasResolutionSuffix(entry.hdPath,entry.scale)) errors.push(entry.sourcePath+": hdPath suffix mismatch");
  const scaled=validateUniformIntegerScale(entry.originalPixels,entry.hdPixels,entry.scale);
  if(!scaled.ok) errors.push(...scaled.errors.map(error=>entry.sourcePath+": "+error));
  baselineBytes+=entry.originalPixels.width*entry.originalPixels.height*entry.scale*entry.scale*plan.decodedBytesPerPixel;
  all8Bytes+=entry.originalPixels.width*entry.originalPixels.height*64*plan.decodedBytesPerPixel;
}

if(JSON.stringify(groupCounts)!==JSON.stringify({"npc-cosmetic":7,"npc-character":18,"monster":9})) errors.push("entity group counts drifted: "+JSON.stringify(groupCounts));
const budgetBytes=plan.decodedEntityBudgetMiB*1024*1024;
if(baselineBytes>budgetBytes) errors.push("entity baseline exceeds decoded memory budget");
if(all8Bytes<=budgetBytes) errors.push("all-8x entity comparison unexpectedly fits the budget");

const plannedBySource=new Map(entries.map(entry=>[normalizeAssetPath(entry.sourcePath),entry]));
const activeEntities=(hdManifest.replacements||[]).filter(item=>item?.state==="active"&&plannedBySource.has(normalizeAssetPath(item.sourcePath)));
let activeBytes=0;
for(const item of activeEntities){
  const entry=plannedBySource.get(normalizeAssetPath(item.sourcePath));
  if(item.scale!==entry.scale) errors.push(entry.sourcePath+": active manifest scale "+item.scale+" does not match entity plan scale "+entry.scale);
  activeBytes+=entry.originalPixels.width*entry.originalPixels.height*item.scale*item.scale*plan.decodedBytesPerPixel;
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
const mib=bytes=>Math.round(bytes/1024/1024*100)/100;
console.log("Mainland entity plan verified:",
  entries.length+" source sheets;",
  "groups="+JSON.stringify(groupCounts)+";",
  "baseline="+mib(baselineBytes)+" MiB;",
  "all8x="+mib(all8Bytes)+" MiB;",
  "budget="+plan.decodedEntityBudgetMiB+" MiB;",
  "active="+activeEntities.length+" / "+mib(activeBytes)+" MiB;",
  "global G.sprites preload confirmed."
);
