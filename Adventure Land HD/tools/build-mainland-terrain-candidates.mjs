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
const profile=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-runtime-profile.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);
if(profile.upstreamCommit!==lock.commit) throw new Error("Runtime profile upstream commit mismatch.");

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
function sha256(file){
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

fs.mkdirSync(outputDir,{recursive:true});
const results=[];
for(const entry of plan.tilesets||[]){
  const sourcePath=normalizeAssetPath(entry.sourcePath);
  if(!sourcePath) throw new Error(entry.id+": invalid sourcePath");
  const source=path.join(upstream,...sourcePath.split("/"));
  if(!fs.existsSync(source)) throw new Error(entry.id+": source missing");
  const actualBlob=execFileSync("git",["-C",upstream,"hash-object",sourcePath],{encoding:"utf8"}).trim();
  if(actualBlob!==entry.originalBlobSha) throw new Error(entry.id+": source blob mismatch; refusing false provenance");
  const scale=profile.scales?.[entry.id];
  if(!Number.isInteger(scale)||scale<2||scale>8) throw new Error(entry.id+": invalid runtime profile scale");
  const base=path.basename(sourcePath,path.extname(sourcePath));
  const hdPath="map/"+base+"@"+scale+"x.png";
  const output=path.join(outputDir,path.basename(hdPath));
  execFileSync(process.execPath,[
    path.join(root,"tools","build-nearest-png.mjs"),
    "--input",source,
    "--output",output,
    "--scale",String(scale)
  ],{stdio:"inherit"});
  const png=pngInfo(output);
  const expectedWidth=entry.originalPixels.width*scale;
  const expectedHeight=entry.originalPixels.height*scale;
  if(png.width!==expectedWidth||png.height!==expectedHeight) throw new Error(entry.id+": generated dimensions drifted");
  const row={
    id:entry.id,
    sourcePath,
    hdPath,
    scale,
    originalBlobSha:entry.originalBlobSha,
    pixels:{width:png.width,height:png.height},
    png:{bitDepth:png.bitDepth,colorType:png.colorType,interlace:png.interlace},
    decodedRgbaMiB:Math.round(png.width*png.height*profile.decodedBytesPerPixel/1024/1024*100000)/100000,
    bytes:fs.statSync(output).size,
    sha256:sha256(output)
  };
  results.push(row);
  console.log("ALHD_TERRAIN_CANDIDATE "+JSON.stringify(row));
}

const totalDecodedRgbaMiB=Math.round(results.reduce((sum,row)=>sum+row.pixels.width*row.pixels.height*profile.decodedBytesPerPixel,0)/1024/1024*100000)/100000;
if(totalDecodedRgbaMiB>profile.decodedTerrainBudgetMiB) throw new Error("Generated terrain candidates exceed decoded runtime budget");
const report={
  schemaVersion:1,
  upstreamCommit:lock.commit,
  decodedTerrainBudgetMiB:profile.decodedTerrainBudgetMiB,
  totalDecodedRgbaMiB,
  generatedAt:null,
  candidates:results
};
if(reportPath){
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("Mainland terrain candidates built:",results.length,"decodedRGBA="+totalDecodedRgbaMiB+" MiB");
