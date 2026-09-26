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
const outputArg=value("--output-dir");
const reportArg=value("--report");
if(!upstreamArg||!outputArg){
  console.error("Usage: node tools/build-mainland-terrain-candidates.mjs --upstream <checkout> --output-dir <dir> [--report <json>]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const outputDir=path.resolve(process.cwd(),outputArg);
const reportPath=reportArg?path.resolve(process.cwd(),reportArg):null;
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);

function pngSize(file){
  const b=fs.readFileSync(file);
  if(b.length<29||b.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||b.subarray(12,16).toString("ascii")!=="IHDR") throw new Error("Invalid PNG: "+file);
  return {
    width:b.readUInt32BE(16),
    height:b.readUInt32BE(20),
    bitDepth:b[24],
    colorType:b[25],
    interlace:b[28]
  };
}
function sha256(file){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

fs.mkdirSync(outputDir,{recursive:true});
const results=[];
for(const entry of plan.tilesets||[]){
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  if(!sourcePath) throw new Error(entry.id+": invalid sourcePath");
  const source=path.join(upstream,...sourcePath.split("/"));
  const filename=path.basename(entry.hdPath);
  const output=path.join(outputDir,filename);
  execFileSync(process.execPath,[
    path.join(root,"tools","build-nearest-png.mjs"),
    "--input",source,
    "--output",output,
    "--scale",String(entry.scale)
  ],{stdio:"inherit"});
  const png=pngSize(output);
  if(png.width!==entry.hdPixels.width||png.height!==entry.hdPixels.height) throw new Error(entry.id+": generated dimensions drifted");
  const row={
    id:entry.id,
    sourcePath,
    hdPath:entry.hdPath,
    scale:entry.scale,
    pixels:{width:png.width,height:png.height},
    png:{bitDepth:png.bitDepth,colorType:png.colorType,interlace:png.interlace},
    bytes:fs.statSync(output).size,
    sha256:sha256(output)
  };
  results.push(row);
  console.log("ALHD_TERRAIN_CANDIDATE "+JSON.stringify(row));
}

const report={
  schemaVersion:1,
  upstreamCommit:lock.commit,
  compatibilityMaxTextureEdge:plan.compatibilityMaxTextureEdge,
  generatedAt:null,
  candidates:results
};
if(reportPath){
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("Mainland terrain candidates built:",results.length);
