import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));
const profile=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-runtime-profile.json"),"utf8"));

function decodedMiB(scales){
  const bytes=(plan.tilesets||[]).reduce((sum,entry)=>{
    const scale=scales[entry.id];
    return sum+entry.originalPixels.width*entry.originalPixels.height*scale*scale*profile.decodedBytesPerPixel;
  },0);
  return bytes/1024/1024;
}

test("Mainland runtime profile covers all scoped terrain atlases",()=>{
  assert.deepEqual(Object.keys(profile.scales).sort(),plan.tilesets.map(entry=>entry.id).sort());
  assert.equal(profile.decodedTerrainBudgetMiB,512);
  assert.equal(profile.decodedBytesPerPixel,4);
});

test("safe baseline keeps doors 8x and all other Mainland world atlases 4x",()=>{
  for(const entry of plan.tilesets){
    assert.equal(profile.scales[entry.id],entry.id==="doors"?8:4,entry.id);
  }
});

test("safe baseline stays within budget while full 8x does not",()=>{
  const baseline=decodedMiB(profile.scales);
  const all8=decodedMiB(Object.fromEntries(plan.tilesets.map(entry=>[entry.id,8])));
  assert.ok(baseline<profile.decodedTerrainBudgetMiB);
  assert.ok(all8>profile.decodedTerrainBudgetMiB);
  assert.ok(Math.abs(baseline-396.84375)<0.00001);
  assert.ok(Math.abs(all8-1551.375)<0.00001);
});
