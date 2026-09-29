import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const activeManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const terrain=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const entities=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));

const active=(activeManifest.replacements||[]).filter(item=>item.state==="active");
const activeBySource=new Map(active.map(item=>[normalizeAssetPath(item.sourcePath),item]));
const expectedActive=[
  "images/tiles/characters/jubchan_1.png",
  "images/tiles/map/doors.png"
].sort();

test("development keeps repository runtime activation limited to validated pilots",()=>{
  assert.deepEqual([...activeBySource.keys()].sort(),expectedActive);
});

test("all 46 newly verified Mainland candidates remain inactive in repository manifest",()=>{
  const candidates=[
    ...terrain.entries.filter(entry=>entry.state==="candidate-verified"),
    ...entities.entries.filter(entry=>entry.state==="candidate-verified")
  ];
  assert.equal(candidates.length,46);
  for(const entry of candidates){
    assert.match(entry.expectedSha256,/^[a-f0-9]{64}$/,entry.sourcePath);
    assert.equal(activeBySource.has(normalizeAssetPath(entry.sourcePath)),false,entry.sourcePath);
  }
});

test("activation plans retain exactly one active pilot each",()=>{
  const terrainActive=terrain.entries.filter(entry=>entry.state==="active");
  const entityActive=entities.entries.filter(entry=>entry.state==="active");
  assert.deepEqual(terrainActive.map(entry=>entry.id),["doors"]);
  assert.deepEqual(entityActive.map(entry=>entry.sourcePath),["images/tiles/characters/jubchan_1.png"]);
});

test("candidate evidence is tied to a successful immutable CI head",()=>{
  for(const plan of [terrain,entities]){
    assert.equal(plan.candidateEvidence?.conclusion,"success");
    assert.equal(plan.candidateEvidence?.workflowRunId,36308809900);
    assert.equal(plan.candidateEvidence?.jobId,108590610508);
    assert.equal(plan.candidateEvidence?.headSha,"61e3d4f69deceb4bcb1772f670968f27416243db");
  }
});
