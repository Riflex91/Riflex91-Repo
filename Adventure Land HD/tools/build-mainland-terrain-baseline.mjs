import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
const outputRootArg=value("--output-root");
const idsArg=value("--ids");
if(!upstreamArg||!outputRootArg){
  console.error("Usage: node tools/build-mainland-terrain-baseline.mjs --upstream <checkout> --output-root <dir> [--ids id1,id2]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const outputRoot=path.resolve(process.cwd(),outputRootArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);
if(plan.upstreamCommit!==lock.commit) throw new Error("Terrain plan upstream commit mismatch.");

const requested=idsArg?new Set(idsArg.split(",").map(x=>x.trim()).filter(Boolean)):null;
const selected=(plan.tilesets||[]).filter(entry=>!requested||requested.has(entry.id));
if(requested&&selected.length!==requested.size){
  const found=new Set(selected.map(entry=>entry.id));
  const missing=[...requested].filter(id=>!found.has(id));
  throw new Error("Unknown Mainland terrain ids: "+missing.join(", "));
}

function pngSize(file){
  const b=fs.readFileSync(file);
  if(b.length<24||b.subarray(0,8).toString("hex")!=="89504e470d0a1a0a") throw new Error("Generated output is not a PNG: "+file);
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

const results=[];
for(const entry of selected){
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  if(!sourcePath) throw new Error(entry.id+": invalid sourcePath");
  const source=path.join(upstream,...sourcePath.split("/"));
  if(!fs.existsSync(source)) throw new Error(entry.id+": source missing");
  const blob=execFileSync("git",["-C",upstream,"hash-object",sourcePath],{encoding:"utf8"}).trim();
  if(blob!==entry.originalBlobSha) throw new Error(entry.id+": source blob mismatch");
  const output=path.join(outputRoot,...entry.hdPath.split("/"));
  execFileSync(process.execPath,[
    path.join(root,"tools","build-nearest-png.mjs"),
    "--input",source,
    "--output",output,
    "--scale",String(plan.targetScale)
  ],{stdio:"inherit"});
  const size=pngSize(output);
  if(size.width!==entry.hdPixels.width||size.height!==entry.hdPixels.height){
    throw new Error(entry.id+": generated dimensions mismatch");
  }
  const sha256=crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex");
  results.push({
    id:entry.id,
    sourcePath,
    hdPath:entry.hdPath,
    originalBlobSha:entry.originalBlobSha,
    hdPixels:entry.hdPixels,
    sha256,
    bytes:fs.statSync(output).size
  });
}

console.log("MAINLAND_TERRAIN_HASHES="+JSON.stringify(results));
