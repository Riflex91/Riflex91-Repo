import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {hasResolutionSuffix} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-plan.json"),"utf8"));
const hdManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));

test("Mainland entity plan covers 34 unique source sheets",()=>{
  assert.equal(plan.entries.length,34);
  assert.equal(new Set(plan.entries.map(entry=>entry.sourcePath)).size,34);
  assert.deepEqual(
    Object.fromEntries(["npc-cosmetic","npc-character","monster"].map(group=>[group,plan.entries.filter(entry=>entry.group===group).length])),
    {"npc-cosmetic":7,"npc-character":18,"monster":9}
  );
});

test("safe entity profile keeps Jubchan 8x and all remaining sheets 4x",()=>{
  for(const entry of plan.entries){
    const expected=entry.sourcePath==="images/tiles/characters/jubchan_1.png"?8:4;
    assert.equal(entry.scale,expected,entry.sourcePath);
    assert.equal(hasResolutionSuffix(entry.hdPath,entry.scale),true,entry.sourcePath);
  }
});

test("entity baseline stays below budget while full 8x does not",()=>{
  const bytesAt=scaleFor=>plan.entries.reduce((sum,entry)=>{
    const scale=scaleFor(entry);
    return sum+entry.originalPixels.width*entry.originalPixels.height*scale*scale*plan.decodedBytesPerPixel;
  },0);
  const baseline=bytesAt(entry=>entry.scale)/1024/1024;
  const all8=bytesAt(()=>8)/1024/1024;
  assert.equal(baseline,273.837890625);
  assert.equal(all8,1087.125);
  assert.ok(baseline<plan.decodedEntityBudgetMiB);
  assert.ok(all8>plan.decodedEntityBudgetMiB);
});

test("currently active Mainland entity entries match the planned scale",()=>{
  const bySource=new Map(plan.entries.map(entry=>[entry.sourcePath,entry]));
  const active=(hdManifest.replacements||[]).filter(item=>item.state==="active"&&bySource.has(item.sourcePath));
  assert.ok(active.some(item=>item.sourcePath==="images/tiles/characters/jubchan_1.png"));
  for(const item of active) assert.equal(item.scale,bySource.get(item.sourcePath).scale,item.sourcePath);
});
