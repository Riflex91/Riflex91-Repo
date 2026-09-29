import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const reportArg=value("--report");
if(!reportArg){
  console.error("Usage: node tools/verify-mainland-terrain-candidate-report.mjs --report <json>");
  process.exit(2);
}

const report=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),reportArg),"utf8"));
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const profile=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-runtime-profile.json"),"utf8"));
const errors=[];

if(report.schemaVersion!==1) errors.push("candidate report schemaVersion must be 1");
if(report.upstreamCommit!==activation.upstreamCommit) errors.push("candidate report upstream commit mismatch");
if(report.decodedTerrainBudgetMiB!==profile.decodedTerrainBudgetMiB) errors.push("candidate report budget mismatch");
if(!Array.isArray(report.candidates)) errors.push("candidate report candidates must be an array");

const expectedById=new Map((activation.entries||[]).map(entry=>[entry.id,entry]));
const candidates=Array.isArray(report.candidates)?report.candidates:[];
const ids=candidates.map(row=>row?.id).filter(Boolean);
if(new Set(ids).size!==ids.length) errors.push("candidate report ids must be unique");
if(JSON.stringify([...ids].sort())!==JSON.stringify([...expectedById.keys()].sort())) errors.push("candidate report must cover exactly the 14 activation-plan ids");

let decodedBytes=0;
for(const row of candidates){
  const expected=expectedById.get(row.id);
  if(!expected) continue;
  if(row.sourcePath!==expected.sourcePath) errors.push(row.id+": sourcePath mismatch");
  if(row.originalBlobSha!==expected.originalBlobSha) errors.push(row.id+": originalBlobSha mismatch");
  if(row.scale!==expected.scale) errors.push(row.id+": scale mismatch");
  if(row.hdPath!==expected.hdPath) errors.push(row.id+": hdPath mismatch");
  if(row.pixels?.width!==expected.expectedPixels.width||row.pixels?.height!==expected.expectedPixels.height) errors.push(row.id+": pixel dimensions mismatch");
  if(!Number.isInteger(row.bytes)||row.bytes<=0) errors.push(row.id+": candidate bytes must be positive integer");
  if(typeof row.sha256!=="string"||!/^[a-f0-9]{64}$/.test(row.sha256)) errors.push(row.id+": candidate SHA256 invalid");
  if(expected.expectedSha256&&row.sha256!==expected.expectedSha256) errors.push(row.id+": pinned SHA256 mismatch");
  decodedBytes+=expected.expectedPixels.width*expected.expectedPixels.height*profile.decodedBytesPerPixel;
}

const totalDecodedRgbaMiB=Math.round(decodedBytes/1024/1024*100000)/100000;
if(report.totalDecodedRgbaMiB!==totalDecodedRgbaMiB) errors.push("candidate report totalDecodedRgbaMiB mismatch");
if(totalDecodedRgbaMiB>profile.decodedTerrainBudgetMiB) errors.push("candidate report exceeds runtime terrain budget");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

const verified=(activation.entries||[]).filter(entry=>entry.state==="candidate-verified");
if(verified.length!==13) errors.push("terrain activation plan must retain exactly 13 candidate-verified inactive entries");
console.log("Mainland terrain candidate report verified:",
  candidates.length+" candidates;",
  "decodedRGBA="+totalDecodedRgbaMiB+" MiB;",
  verified.length+" evidence-pinned entries remain inactive."
);
