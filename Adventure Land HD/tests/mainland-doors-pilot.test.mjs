import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateUniformIntegerScale} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const doors=manifest.replacements.find(item=>item.sourcePath==="images/tiles/map/doors.png");

test("Mainland doors technical pilot is active and generated deterministically",()=>{
  assert.ok(doors);
  assert.equal(doors.state,"active");
  assert.equal(doors.hdPath,"map/doors@8x.png");
  assert.equal(doors.scale,8);
  assert.equal(doors.preserveLogicalSize,true);
  assert.equal(doors.originalFallback,true);
  assert.deepEqual(doors.originalPixels,{width:192,height:256});
  assert.deepEqual(doors.hdPixels,{width:1536,height:2048});
  assert.equal(validateUniformIntegerScale(doors.originalPixels,doors.hdPixels,8).ok,true);
  assert.deepEqual(doors.generator,{
    method:"nearest-neighbor-png",
    expectedSha256:"66fef5c19149ac4cf8a625b0c1b19a5ca6a359f35e1c0ec9d4350bf69de2235f"
  });
});

test("doors pilot remains presentation-only",()=>{
  assert.match(doors.role,/terrain-technical-8x-pilot/);
  assert.match(doors.note,/Presentation-only/);
});
