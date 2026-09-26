import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));

test("main map scope is pinned to the Adventure Land HD upstream",()=>{
  assert.equal(scope.upstreamCommit,"90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(scope.mapId,"main");
  assert.equal(scope.mapKey,"jayson_ALMap2_v2");
  assert.equal(scope.geometryId,"MP_jayson_ALMap2_v2");
});

test("main map scope covers the complete pinned Mainland visual set",()=>{
  assert.equal(scope.expected.geometryTiles,1002);
  assert.equal(scope.expected.geometryPlacements,10791);
  assert.equal(scope.expected.npcPlacements,30);
  assert.equal(scope.expected.seasonalNpcPlacements,1);
  assert.equal(scope.expected.monsterTypes,38);
  assert.equal(scope.expected.monsterPlacements,42);
  assert.equal(scope.expected.worldTilesets,14);
  assert.equal(scope.expected.sourceFiles,48);
  assert.equal(new Set(scope.npcIds).size,scope.npcIds.length);
  assert.equal(new Set(scope.monsterTypes).size,scope.monsterTypes.length);
  assert.equal(new Set(scope.tilesets).size,scope.tilesets.length);
  assert.equal(new Set(scope.sourceFiles).size,scope.sourceFiles.length);
});

test("Mira pilot and runtime-added Wabbit stay inside the full main scope",()=>{
  assert.ok(scope.npcIds.includes("anniversary_baker"));
  assert.ok(scope.sourceFiles.includes("images/tiles/characters/jubchan_1.png"));
  assert.deepEqual(scope.runtimeAugmentedMonsterTypes,["wabbit"]);
  assert.ok(scope.monsterTypes.includes("wabbit"));
  assert.ok(scope.sourceFiles.includes("images/tiles/monsters/custom2.png"));
});

test("known upstream cosmetic anomaly is explicit instead of synthesized",()=>{
  assert.deepEqual(scope.knownUnresolvedCosmetics,[{
    npc:"dreamkeeper",
    slot:"back",
    skin:"backpacks202",
    reason:"Pinned upstream references a cosmetic key that is not present in the exported sprite matrices. Preserve upstream behavior; do not synthesize a replacement."
  }]);
});
