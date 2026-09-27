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
  console.error("Usage: node tools/build-mainland-entity-candidates.mjs --upstream <checkout> --output-dir <dir> [--report <json>]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const outputDir=path.resolve(process.cwd(),outputArg);
const reportPath=reportArg?path.resolve(process.cwd(),reportArg):null;
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-plan.json"),"utf8"));
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);
if(plan.upstreamCommit!==lock.commit||activation.upstreamCommit!==lock.commit) throw new Error("Entity plan upstream commit mismatch.");

function sha256(file){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function pngInfo(file){
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

const planBySource=new Map((plan.entries||[]).map(entry=>[normalizeAssetPath(entry.sourcePath),entry]));
const activationBySource=new Map((activation.entries||[]).map(entry=>[normalizeAssetPath(entry.sourcePath),entry]));
if(planBySource.size!==34||activationBySource.size!==34) throw new Error("Entity candidate builder requires exactly 34 unique source sheets.");

fs.mkdirSync(outputDir,{recursive:true});
const results=[];
for(const [sourcePath,entry] of planBySource){
  const activationEntry=activationBySource.get(sourcePath);
  if(!activationEntry) throw new Error(sourcePath+": activation entry missing");
  if(entry.scale!==activationEntry.scale||entry.hdPath!==activationEntry.hdPath) throw new Error(sourcePath+": plan/activation drift");

  const source=path.join(upstream,...sourcePath.split("/"));
  if(!fs.existsSync(source)) throw new Error(sourcePath+": source missing");
  const actualBlob=execFileSync("git",["-C",upstream,"hash-object",sourcePath],{encoding:"utf8"}).trim();
  if(actualBlob!==entry.originalBlobSha||actualBlob!==activationEntry.originalBlobSha) throw new Error(sourcePath+": source blob mismatch; refusing false provenance");

  const output=path.join(outputDir,...entry.hdPath.split("/"));
  fs.mkdirSync(path.dirname(output),{recursive:true});

  const artistic=sourcePath==="images/tiles/characters/jubchan_1.png";
  if(artistic){
    const existing=path.join(root,"hd-assets","characters","jubchan_1@8x.png");
    if(!fs.existsSync(existing)) throw new Error("Jubchan artistic HD asset missing");
    const actual=sha256(existing);
    if(actual!==activationEntry.expectedSha256) throw new Error("Jubchan artistic HD SHA256 drifted");
    fs.copyFileSync(existing,output);
  }else{
    execFileSync(process.execPath,[
      path.join(root,"tools","build-nearest-png.mjs"),
      "--input",source,
      "--output",output,
      "--scale",String(entry.scale)
    ],{stdio:"inherit"});
  }

  const png=pngInfo(output);
  if(png.width!==entry.hdPixels.width||png.height!==entry.hdPixels.height) throw new Error(sourcePath+": generated dimensions drifted");
  const row={
    group:entry.group,
    sourcePath,
    hdPath:entry.hdPath,
    scale:entry.scale,
    originalBlobSha:entry.originalBlobSha,
    pixels:{width:png.width,height:png.height},
    png:{bitDepth:png.bitDepth,colorType:png.colorType,interlace:png.interlace},
    mode:artistic?"existing-artistic":"nearest-neighbor-png",
    decodedRgbaMiB:Math.round(png.width*png.height*plan.decodedBytesPerPixel/1024/1024*100000)/100000,
    bytes:fs.statSync(output).size,
    sha256:sha256(output)
  };
  if(activationEntry.expectedSha256&&row.sha256!==activationEntry.expectedSha256) throw new Error(sourcePath+": pinned active SHA256 mismatch");
  results.push(row);
  console.log("ALHD_ENTITY_CANDIDATE "+JSON.stringify(row));
}

results.sort((a,b)=>a.sourcePath<b.sourcePath?-1:a.sourcePath>b.sourcePath?1:0);
const totalDecodedRgbaMiB=Math.round(results.reduce((sum,row)=>sum+row.pixels.width*row.pixels.height*plan.decodedBytesPerPixel,0)/1024/1024*100000)/100000;
if(totalDecodedRgbaMiB>plan.decodedEntityBudgetMiB) throw new Error("Generated entity candidates exceed decoded runtime budget");
const report={
  schemaVersion:1,
  upstreamCommit:lock.commit,
  decodedEntityBudgetMiB:plan.decodedEntityBudgetMiB,
  totalDecodedRgbaMiB,
  generatedAt:null,
  candidates:results
};
if(reportPath){
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("Mainland entity candidates built:",results.length,"decodedRGBA="+totalDecodedRgbaMiB+" MiB");
