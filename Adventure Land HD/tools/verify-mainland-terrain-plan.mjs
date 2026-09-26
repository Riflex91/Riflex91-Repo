import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {hasResolutionSuffix,normalizeAssetPath,validateUniformIntegerScale} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
if(!upstreamArg){
  console.error("Usage: node tools/verify-mainland-terrain-plan.mjs --upstream <checkout>");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));
const errors=[];
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);
if(plan.upstreamCommit!==lock.commit) errors.push("terrain plan upstreamCommit must match UPSTREAM.lock.json");
if(plan.mapId!=="main") errors.push("terrain plan mapId must be main");
if(plan.targetScale!==8) errors.push("terrain plan targetScale must be 8");
if(plan.preserveLogicalSize!==true) errors.push("terrain plan must preserve logical size");
if(plan.originalFallback!==true) errors.push("terrain plan must require original fallback");

const requireFromHere=createRequire(import.meta.url);
const {tilesets}=requireFromHere(path.join(upstream,"design","sprites.js"));
const sort=a=>[...a].sort((x,y)=>String(x).localeCompare(String(y)));
const entries=Array.isArray(plan.tilesets)?plan.tilesets:[];
const ids=entries.map(entry=>entry?.id).filter(Boolean);
if(new Set(ids).size!==ids.length) errors.push("terrain plan tileset ids must be unique");
const sourceKeys=entries.map(entry=>normalizeAssetPath(entry?.sourcePath)).filter(Boolean);
if(new Set(sourceKeys).size!==sourceKeys.length) errors.push("terrain plan sourcePath values must be unique after normalization");
const hdKeys=entries.map(entry=>normalizeAssetPath(entry?.hdPath)).filter(Boolean);
if(new Set(hdKeys).size!==hdKeys.length) errors.push("terrain plan hdPath values must be unique after normalization");
if(JSON.stringify(sort(ids))!==JSON.stringify(sort(scope.tilesets||[]))) errors.push("terrain plan ids must exactly match Mainland scope tilesets");

function pngSize(file){
  const b=fs.readFileSync(file);
  if(b.length<24||b.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||b.subarray(12,16).toString("ascii")!=="IHDR") return null;
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

for(const entry of entries){
  const def=tilesets?.[entry.id];
  if(!def){errors.push("missing upstream tileset: "+entry.id);continue;}
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  const upstreamSource=normalizeAssetPath(def.file);
  if(sourcePath!==upstreamSource) errors.push(entry.id+": sourcePath mismatch: "+sourcePath+" != "+upstreamSource);
  if(entry.state!=="awaiting-art") errors.push(entry.id+": production plan entries must remain awaiting-art");
  if(!hasResolutionSuffix(entry.hdPath,8)) errors.push(entry.id+": hdPath must contain @8x");
  if(!String(entry.hdPath).startsWith("map/")) errors.push(entry.id+": hdPath must stay under map/");
  const source=sourcePath&&path.join(upstream,...sourcePath.split("/"));
  if(!source||!fs.existsSync(source)){errors.push(entry.id+": source file missing");continue;}
  const size=pngSize(source);
  if(!size){errors.push(entry.id+": source must be a PNG with readable IHDR");continue;}
  if(JSON.stringify(size)!==JSON.stringify(entry.originalPixels)) errors.push(entry.id+": originalPixels drifted");
  const scale=validateUniformIntegerScale(size,entry.hdPixels,8);
  if(!scale.ok) errors.push(...scale.errors.map(error=>entry.id+": "+error));
  const blobSha=execFileSync("git",["-C",upstream,"hash-object",sourcePath],{encoding:"utf8"}).trim();
  if(blobSha!==entry.originalBlobSha) errors.push(entry.id+": originalBlobSha drifted");
  const expectedFrames=Number.isInteger(def.frames)&&def.frames>0?def.frames:1;
  const expectedFrameWidth=Number.isInteger(def.frame_width)&&def.frame_width>0?def.frame_width:null;
  if(entry.frames!==expectedFrames) errors.push(entry.id+": frames drifted");
  if(entry.frameWidth!==expectedFrameWidth) errors.push(entry.id+": frameWidth drifted");
  if((entry.light||null)!==(def.light||null)) errors.push(entry.id+": light metadata drifted");
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Mainland terrain plan verified:",entries.length,"tilesets at exact 8x target dimensions.");
