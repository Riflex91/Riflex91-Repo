import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const reportArg=value("--report");
if(!reportArg){
  console.error("Usage: node tools/verify-mainland-entity-candidate-report.mjs --report <json>");
  process.exit(2);
}

const report=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),reportArg),"utf8"));
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-plan.json"),"utf8"));
const errors=[];

if(report.schemaVersion!==1) errors.push("entity candidate report schemaVersion must be 1");
if(report.upstreamCommit!==activation.upstreamCommit) errors.push("entity candidate report upstream commit mismatch");
if(report.decodedEntityBudgetMiB!==plan.decodedEntityBudgetMiB) errors.push("entity candidate report budget mismatch");
if(!Array.isArray(report.candidates)) errors.push("entity candidate report candidates must be an array");

const expectedBySource=new Map((activation.entries||[]).map(entry=>[entry.sourcePath,entry]));
const candidates=Array.isArray(report.candidates)?report.candidates:[];
const sources=candidates.map(row=>row?.sourcePath).filter(Boolean);
if(new Set(sources).size!==sources.length) errors.push("entity candidate report sourcePath values must be unique");
if(JSON.stringify([...sources].sort())!==JSON.stringify([...expectedBySource.keys()].sort())) errors.push("entity candidate report must cover exactly all 34 activation-plan sources");

let decodedBytes=0;
for(const row of candidates){
  const expected=expectedBySource.get(row.sourcePath);
  if(!expected) continue;
  if(row.group!==expected.group) errors.push(row.sourcePath+": group mismatch");
  if(row.originalBlobSha!==expected.originalBlobSha) errors.push(row.sourcePath+": originalBlobSha mismatch");
  if(row.scale!==expected.scale) errors.push(row.sourcePath+": scale mismatch");
  if(row.hdPath!==expected.hdPath) errors.push(row.sourcePath+": hdPath mismatch");
  if(row.pixels?.width!==expected.expectedPixels.width||row.pixels?.height!==expected.expectedPixels.height) errors.push(row.sourcePath+": pixel dimensions mismatch");
  if(!Number.isInteger(row.bytes)||row.bytes<=0) errors.push(row.sourcePath+": candidate bytes must be positive integer");
  if(typeof row.sha256!=="string"||!/^[a-f0-9]{64}$/.test(row.sha256)) errors.push(row.sourcePath+": candidate SHA256 invalid");
  if(expected.expectedSha256&&row.sha256!==expected.expectedSha256) errors.push(row.sourcePath+": pinned active SHA256 mismatch");
  decodedBytes+=expected.expectedPixels.width*expected.expectedPixels.height*plan.decodedBytesPerPixel;
}

const totalDecodedRgbaMiB=Math.round(decodedBytes/1024/1024*100000)/100000;
if(report.totalDecodedRgbaMiB!==totalDecodedRgbaMiB) errors.push("entity candidate report totalDecodedRgbaMiB mismatch");
if(totalDecodedRgbaMiB>plan.decodedEntityBudgetMiB) errors.push("entity candidate report exceeds runtime entity budget");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

const awaiting=activation.entries.filter(entry=>entry.state==="awaiting-ci-hash");
console.log("Mainland entity candidate report verified:",
  candidates.length+" candidates;",
  "decodedRGBA="+totalDecodedRgbaMiB+" MiB;",
  awaiting.length+" entries awaiting CI SHA promotion."
);
