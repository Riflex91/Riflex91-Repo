import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {hasResolutionSuffix} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const activation=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));

test("Mainland entity activation plan covers 34 unique source sheets",()=>{
  assert.equal(activation.entries.length,34);
  assert.equal(new Set(activation.entries.map(entry=>entry.sourcePath)).size,34);
  assert.equal(new Set(activation.entries.map(entry=>entry.hdPath)).size,34);
});

test("only live-validated Jubchan is active; remaining 33 are CI-verified but inactive",()=>{
  const active=activation.entries.filter(entry=>entry.state==="active");
  const verified=activation.entries.filter(entry=>entry.state==="candidate-verified");
  assert.deepEqual(active.map(entry=>entry.sourcePath),["images/tiles/characters/jubchan_1.png"]);
  assert.equal(verified.length,33);
  for(const entry of activation.entries) assert.match(entry.expectedSha256,/^[a-f0-9]{64}$/,entry.sourcePath);
  assert.equal(activation.candidateEvidence?.conclusion,"success");
  assert.equal(activation.candidateEvidence?.workflowRunId,36308809900);
});

test("every entity activation target uses a matching resolution suffix",()=>{
  for(const entry of activation.entries){
    assert.equal(hasResolutionSuffix(entry.hdPath,entry.scale),true,entry.sourcePath);
  }
});

test("non-default entity activation entries explain their scale exception",()=>{
  for(const entry of activation.entries){
    if(entry.scale===8) continue;
    assert.equal(typeof entry.scaleExceptionReason,"string",entry.sourcePath);
    assert.ok(entry.scaleExceptionReason.trim().length>0,entry.sourcePath);
  }
});
