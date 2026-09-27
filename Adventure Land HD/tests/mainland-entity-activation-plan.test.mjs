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

test("only live-validated Jubchan is already active",()=>{
  const active=activation.entries.filter(entry=>entry.state==="active");
  const awaiting=activation.entries.filter(entry=>entry.state==="awaiting-ci-hash");
  assert.deepEqual(active.map(entry=>entry.sourcePath),["images/tiles/characters/jubchan_1.png"]);
  assert.equal(awaiting.length,33);
  assert.match(active[0].expectedSha256,/^[a-f0-9]{64}$/);
  for(const entry of awaiting) assert.equal(entry.expectedSha256,null,entry.sourcePath);
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
