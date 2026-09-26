import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
function svgSize(file){
  const t=fs.readFileSync(file,"utf8");
  return {
    width:Number((t.match(/\bwidth=["'](\d+(?:\.\d+)?)["']/)||[])[1]||0),
    height:Number((t.match(/\bheight=["'](\d+(?:\.\d+)?)["']/)||[])[1]||0),
    viewBox:(t.match(/\bviewBox=["']([^"']+)["']/)||[])[1]||"",
    text:t
  };
}
test("8x is the project default",()=>{
  assert.equal(manifest.rules.defaultScale,8);
  assert.equal(manifest.rules.nonDefaultScaleRequiresExceptionReason,true);
});
test("Phase 4 has exactly one active 8x artistic pilot",()=>{
  assert.equal(manifest.replacements.length,1);
  const item=manifest.replacements[0];
  assert.equal(item.sourcePath,"images/tiles/characters/jubchan_1.png");
  assert.equal(item.hdPath,"characters/jubchan_1@8x.svg");
  assert.equal(item.scale,8);
  assert.equal(item.state,"active");
  assert.equal(item.preserveLogicalSize,true);
  assert.equal(item.originalFallback,true);
});
test("pilot is exactly 624x1152 with original logical sheet viewBox",()=>{
  const item=manifest.replacements[0];
  const file=path.join(root,"hd-assets",...item.hdPath.split("/"));
  assert.equal(fs.existsSync(file),true);
  const s=svgSize(file);
  assert.equal(s.width,624);
  assert.equal(s.height,1152);
  assert.equal(s.viewBox,"0 0 78 144");
  assert.match(s.text,/linearGradient id="hair"/);
  assert.match(s.text,/linearGradient id="robe"/);
  assert.deepEqual(item.originalPixels,{width:78,height:144});
  assert.deepEqual(item.hdPixels,{width:624,height:1152});
});
test("logical 3x4 frame geometry remains exactly 26x36",()=>{
  const item=manifest.replacements[0];
  assert.deepEqual(item.runtimeGrid,{columns:3,rows:4});
  assert.deepEqual(item.logicalCell,{width:26,height:36});
  assert.equal(item.hdPixels.width/item.scale/item.runtimeGrid.columns,26);
  assert.equal(item.hdPixels.height/item.scale/item.runtimeGrid.rows,36);
});
