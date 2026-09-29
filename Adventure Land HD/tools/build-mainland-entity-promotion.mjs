import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const reportArg=value("--report");
const outputArg=value("--output");
if(!reportArg||!outputArg){
  console.error("Usage: node tools/build-mainland-entity-promotion.mjs --report <json> --output <json>");
  process.exit(2);
}

const reportPath=path.resolve(process.cwd(),reportArg);
const outputPath=path.resolve(process.cwd(),outputArg);
execFileSync(process.execPath,[
  path.join(root,"tools","verify-mainland-entity-candidate-report.mjs"),
  "--report",reportPath
],{stdio:"inherit"});

const report=JSON.parse(fs.readFileSync(reportPath,"utf8"));
const baseManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const existingBySource=new Map((baseManifest.replacements||[]).map(item=>[item.sourcePath,item]));
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const bySource=new Map(report.candidates.map(row=>[row.sourcePath,row]));

const replacements=[];
for(const entry of activation.entries){
  const row=bySource.get(entry.sourcePath);
  if(entry.sourcePath==="images/tiles/characters/jubchan_1.png"){
    const existing=existingBySource.get(entry.sourcePath);
    if(!existing||existing.state!=="active") throw new Error(entry.sourcePath+": active pilot missing from base hd-assets.json");
    if(existing.scale!==entry.scale||existing.hdPath!==entry.hdPath) throw new Error(entry.sourcePath+": active pilot contract drifted");
    replacements.push(existing);
    continue;
  }
  if(!row) throw new Error(entry.sourcePath+": candidate missing after report verification");
  replacements.push({
    sourcePath:entry.sourcePath,
    hdPath:entry.hdPath,
    scale:entry.scale,
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true,
    ...(entry.scale!==8?{scaleExceptionReason:entry.scaleExceptionReason}:{}),
    role:"mainland-entity-technical-safe-baseline",
    originalBlobSha:entry.originalBlobSha,
    originalPixels:{
      width:entry.expectedPixels.width/entry.scale,
      height:entry.expectedPixels.height/entry.scale
    },
    hdPixels:entry.expectedPixels,
    generator:{method:"nearest-neighbor-png",expectedSha256:row.sha256},
    note:"Presentation-only deterministic Mainland entity baseline generated from the pinned original. Runtime scale follows the verified global-sprite memory profile; no gameplay semantics are changed."
  });
}

const output={
  schemaVersion:1,
  upstreamCommit:activation.upstreamCommit,
  sourceReportSha256:crypto.createHash("sha256").update(fs.readFileSync(reportPath)).digest("hex"),
  totalDecodedRgbaMiB:report.totalDecodedRgbaMiB,
  replacements
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+"\n","utf8");
console.log("Mainland entity promotion generated:",replacements.length,"active replacements ->",outputPath);
