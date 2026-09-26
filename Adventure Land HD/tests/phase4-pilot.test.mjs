import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));

function pngSize(file){
  const b=fs.readFileSync(file);
  assert.equal(b.subarray(1,4).toString("ascii"),"PNG");
  return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
}

test("8x is the project default",()=>{
  assert.equal(manifest.rules.defaultScale,8);
  assert.equal(manifest.rules.nonDefaultScaleRequiresExceptionReason,true);
});

test("Phase 4 has exactly one active artistic 8x pilot",()=>{
  assert.equal(manifest.replacements.length,1);
  const item=manifest.replacements[0];
  assert.equal(item.sourcePath,"images/tiles/characters/jubchan_1.png");
  assert.equal(item.hdPath,"characters/jubchan_1@8x.png");
  assert.equal(item.scale,8);
  assert.equal(item.state,"active");
  assert.equal(item.role,"phase4-artistic-pilot");
  assert.equal(item.preserveLogicalSize,true);
  assert.equal(item.originalFallback,true);
});

test("pilot PNG is the declared 8x sheet",()=>{
  const item=manifest.replacements[0];
  const file=path.join(root,"hd-assets",...item.hdPath.split("/"));
  assert.equal(fs.existsSync(file),true);
  assert.deepEqual(pngSize(file),{width:624,height:1152});
  assert.deepEqual(item.originalPixels,{width:78,height:144});
  assert.deepEqual(item.hdPixels,{width:624,height:1152});
  const sha=crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  assert.equal(sha,item.assetSha256);
});

test("logical character frame geometry remains 26x36",()=>{
  const item=manifest.replacements[0];
  assert.deepEqual(item.runtimeGrid,{columns:3,rows:4});
  assert.deepEqual(item.logicalCell,{width:26,height:36});
  assert.equal(item.hdPixels.width/item.scale/item.runtimeGrid.columns,26);
  assert.equal(item.hdPixels.height/item.scale/item.runtimeGrid.rows,36);
});
