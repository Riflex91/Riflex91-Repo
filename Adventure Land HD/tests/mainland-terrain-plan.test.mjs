import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {hasResolutionSuffix,validateUniformIntegerScale} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const plan=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-plan.json"),"utf8"));

test("Mainland terrain plan covers all 14 scoped tilesets",()=>{
  assert.equal(plan.mapId,"main");
  assert.equal(plan.targetScale,8);
  assert.equal(plan.tilesets.length,14);
  assert.equal(new Set(plan.tilesets.map(entry=>entry.id)).size,14);
});

test("every Mainland terrain target is exact 8x and remains awaiting art",()=>{
  for(const entry of plan.tilesets){
    assert.equal(entry.state,"awaiting-art");
    assert.equal(hasResolutionSuffix(entry.hdPath,8),true);
    assert.equal(validateUniformIntegerScale(entry.originalPixels,entry.hdPixels,8).ok,true);
  }
});

test("animated Mainland atlases retain native animation metadata",()=>{
  const byId=Object.fromEntries(plan.tilesets.map(entry=>[entry.id,entry]));
  assert.deepEqual({frames:byId.custom_a.frames,frameWidth:byId.custom_a.frameWidth},{frames:3,frameWidth:16});
  assert.deepEqual({frames:byId.puzzle.frames,frameWidth:byId.puzzle.frameWidth},{frames:3,frameWidth:16});
  assert.deepEqual({frames:byId.water.frames,frameWidth:byId.water.frameWidth},{frames:3,frameWidth:48});
  assert.equal(byId.lights.light,"yes");
});
