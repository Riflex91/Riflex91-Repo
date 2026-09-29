import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {hasResolutionSuffix} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const profile=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-runtime-profile.json"),"utf8"));

test("Mainland terrain activation plan covers all 14 atlases exactly once",()=>{
  assert.equal(activation.entries.length,14);
  assert.equal(new Set(activation.entries.map(entry=>entry.id)).size,14);
  assert.equal(new Set(activation.entries.map(entry=>entry.sourcePath)).size,14);
  assert.equal(new Set(activation.entries.map(entry=>entry.hdPath)).size,14);
});

test("activation plan uses the budgeted runtime scale and resolution suffix",()=>{
  for(const entry of activation.entries){
    assert.equal(entry.scale,profile.scales[entry.id],entry.id);
    assert.equal(hasResolutionSuffix(entry.hdPath,entry.scale),true,entry.id);
  }
});

test("only doors is active; remaining 13 are CI-verified but inactive",()=>{
  const active=activation.entries.filter(entry=>entry.state==="active");
  const verified=activation.entries.filter(entry=>entry.state==="candidate-verified");
  assert.deepEqual(active.map(entry=>entry.id),["doors"]);
  assert.equal(verified.length,13);
  for(const entry of activation.entries) assert.match(entry.expectedSha256,/^[a-f0-9]{64}$/,entry.id);
  assert.equal(activation.candidateEvidence?.conclusion,"success");
  assert.equal(activation.candidateEvidence?.workflowRunId,36308809900);
});

test("activation plan decoded footprint equals the safe runtime profile",()=>{
  const bytes=activation.entries.reduce((sum,entry)=>
    sum+entry.expectedPixels.width*entry.expectedPixels.height*profile.decodedBytesPerPixel,0);
  assert.equal(bytes/1024/1024,396.84375);
  assert.ok(bytes<profile.decodedTerrainBudgetMiB*1024*1024);
});

test("non-default terrain activation entries explain their scale exception",()=>{
  for(const entry of activation.entries){
    if(entry.scale===8) continue;
    assert.equal(typeof entry.scaleExceptionReason,"string",entry.id);
    assert.ok(entry.scaleExceptionReason.trim().length>0,entry.id);
  }
});
