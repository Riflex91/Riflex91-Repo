import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const terrain=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const entities=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const bootstrap=fs.readFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),"utf8");

test("Mainland activation plans cover the exact 48-source runtime scope",()=>{
  const scoped=(scope.sourceFiles||[]).map(normalizeAssetPath).sort();
  const promoted=[
    ...(terrain.entries||[]).map(entry=>normalizeAssetPath(entry.sourcePath)),
    ...(entities.entries||[]).map(entry=>normalizeAssetPath(entry.sourcePath))
  ].sort();
  assert.equal(scoped.length,48);
  assert.equal(promoted.length,48);
  assert.deepEqual(promoted,scoped);
});

test("Mainland terrain and entity source families remain separated",()=>{
  assert.equal(terrain.entries.length,14);
  assert.equal(entities.entries.length,34);
  for(const entry of terrain.entries) assert.match(normalizeAssetPath(entry.sourcePath),/^images\/tiles\/map\//);
  for(const entry of entities.entries) assert.doesNotMatch(normalizeAssetPath(entry.sourcePath),/^images\/tiles\/map\//);
});

test("runtime bootstrap still applies the two required Mainland source families",()=>{
  assert.match(bootstrap,/applyFamily\(gameData\.sprites, lookup, stats\);/);
  assert.match(bootstrap,/applyFamily\(gameData\.tilesets, lookup, stats\);/);
});
