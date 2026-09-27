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
  console.error("Usage: node tools/build-mainland-terrain-promotion.mjs --report <json> --output <json>");
  process.exit(2);
}

const reportPath=path.resolve(process.cwd(),reportArg);
const outputPath=path.resolve(process.cwd(),outputArg);
execFileSync(process.execPath,[
  path.join(root,"tools","verify-mainland-terrain-candidate-report.mjs"),
  "--report",reportPath
],{stdio:"inherit"});

const report=JSON.parse(fs.readFileSync(reportPath,"utf8"));
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const byId=new Map(report.candidates.map(row=>[row.id,row]));

const replacements=[];
for(const entry of activation.entries){
  const row=byId.get(entry.id);
  if(!row) throw new Error(entry.id+": candidate missing after report verification");
  replacements.push({
    sourcePath:entry.sourcePath,
    hdPath:entry.hdPath,
    scale:entry.scale,
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true,
    role:entry.id==="doors"?"mainland-terrain-technical-8x-pilot":"mainland-terrain-technical-safe-baseline",
    originalBlobSha:entry.originalBlobSha,
    originalPixels:{
      width:entry.expectedPixels.width/entry.scale,
      height:entry.expectedPixels.height/entry.scale
    },
    hdPixels:entry.expectedPixels,
    generator:{
      method:"nearest-neighbor-png",
      expectedSha256:row.sha256
    },
    note:entry.id==="doors"
      ?"Existing deterministic Mainland doors pilot retained."
      :"Presentation-only deterministic Mainland terrain baseline generated from the pinned original. Runtime scale follows the verified global-tileset memory profile; no gameplay or map geometry changes."
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
console.log("Mainland terrain promotion generated:",replacements.length,"active replacements ->",outputPath);
