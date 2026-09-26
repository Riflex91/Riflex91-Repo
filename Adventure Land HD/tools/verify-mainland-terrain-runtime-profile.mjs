import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
if(!upstreamArg){
  console.error("Usage: node tools/verify-mainland-terrain-runtime-profile.mjs --upstream <checkout>");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));
const profile=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-runtime-profile.json"),"utf8"));
const hdManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const errors=[];
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);
if(profile.upstreamCommit!==lock.commit) errors.push("runtime profile upstreamCommit must match UPSTREAM.lock.json");
if(profile.mapId!=="main") errors.push("runtime profile mapId must be main");
if(profile.decodedBytesPerPixel!==4) errors.push("decodedBytesPerPixel must be 4 for RGBA texture-memory accounting");
if(!Number.isInteger(profile.decodedTerrainBudgetMiB)||profile.decodedTerrainBudgetMiB<128) errors.push("decodedTerrainBudgetMiB must be an integer >= 128");

const gameSource=fs.readFileSync(path.join(upstream,"js","game.js"),"utf8");
const preloadEvidence=[
  "for (var name in G.tilesets)",
  "G.tilesets[name].file = url_factory(G.tilesets[name].file)",
  "loader.add(G.tilesets[name].file)"
];
for(const marker of preloadEvidence){
  if(!gameSource.includes(marker)) errors.push("pinned global tileset preload evidence missing: "+marker);
}

const entries=plan.tilesets||[];
const expectedIds=entries.map(entry=>entry.id).sort();
const actualIds=Object.keys(profile.scales||{}).sort();
if(JSON.stringify(actualIds)!==JSON.stringify(expectedIds)) errors.push("runtime profile scales must cover exactly the 14 Mainland terrain ids");

let totalBytes=0;
let all8Bytes=0;
let maxEdge=0;
for(const entry of entries){
  const scale=profile.scales?.[entry.id];
  if(!Number.isInteger(scale)||scale<2||scale>8){errors.push(entry.id+": runtime scale must be integer 2..8");continue;}
  if(entry.id==="doors"&&scale!==8) errors.push("doors must retain the validated 8x terrain pilot");
  if(entry.id!=="doors"&&scale!==4) errors.push(entry.id+": initial Mainland world-atlas baseline must be 4x");
  const w=entry.originalPixels?.width;
  const h=entry.originalPixels?.height;
  if(!Number.isInteger(w)||!Number.isInteger(h)){errors.push(entry.id+": original pixels missing");continue;}
  totalBytes+=w*h*scale*scale*profile.decodedBytesPerPixel;
  all8Bytes+=w*h*8*8*profile.decodedBytesPerPixel;
  maxEdge=Math.max(maxEdge,w*scale,h*scale);
}

const terrainBySource=new Map(entries.map(entry=>[String(entry.sourcePath||"").replace(/^\\/+/, ""),entry]));
const activeTerrain=(hdManifest.replacements||[]).filter(item=>item?.state==="active"&&terrainBySource.has(String(item.sourcePath||"").replace(/^\\/+/, "")));
let activeTerrainBytes=0;
for(const item of activeTerrain){
  const sourcePath=String(item.sourcePath||"").replace(/^\\/+/, "");
  const entry=terrainBySource.get(sourcePath);
  const expectedScale=profile.scales?.[entry.id];
  if(item.scale!==expectedScale) errors.push(entry.id+": active HD manifest scale "+item.scale+" does not match runtime profile scale "+expectedScale);
  activeTerrainBytes+=entry.originalPixels.width*entry.originalPixels.height*item.scale*item.scale*profile.decodedBytesPerPixel;
}

const budgetBytes=profile.decodedTerrainBudgetMiB*1024*1024;
if(totalBytes>budgetBytes) errors.push("runtime profile exceeds decoded terrain budget: "+totalBytes+" > "+budgetBytes);
if(activeTerrainBytes>budgetBytes) errors.push("active Mainland terrain replacements exceed decoded terrain budget");
if(all8Bytes<=budgetBytes) errors.push("all-8x comparison unexpectedly fits the budget; review the budget rationale");
if(profile.exceptionPolicy?.projectDefaultScale!==8) errors.push("projectDefaultScale must remain 8");
if(profile.exceptionPolicy?.worldAtlasBaselineScale!==4) errors.push("worldAtlasBaselineScale must be 4");
if(profile.exceptionPolicy?.higherScaleRequiresLiveEvidence!==true) errors.push("higherScaleRequiresLiveEvidence must be true");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
const mib=bytes=>Math.round(bytes/1024/1024*100)/100;
console.log("Mainland terrain runtime profile verified:",
  entries.length+" atlases;",
  "baseline="+mib(totalBytes)+" MiB;",
  "all8x="+mib(all8Bytes)+" MiB;",
  "budget="+profile.decodedTerrainBudgetMiB+" MiB;",
  "maxEdge="+maxEdge+"px;",
  "activeTerrain="+activeTerrain.length+";",
  "activeTerrain="+mib(activeTerrainBytes)+" MiB;",
  "global G.tilesets preload confirmed."
);
