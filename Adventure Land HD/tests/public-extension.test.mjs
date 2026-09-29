import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const src=path.join(root,"public-extension","src");
const chromium=JSON.parse(fs.readFileSync(path.join(src,"manifest.chromium.json"),"utf8"));
const firefox=JSON.parse(fs.readFileSync(path.join(src,"manifest.firefox.json"),"utf8"));
const bootstrap=fs.readFileSync(path.join(src,"page-bootstrap.js"),"utf8");
const popup=fs.readFileSync(path.join(src,"popup.js"),"utf8");

for(const [name,manifest] of [["chromium",chromium],["firefox",firefox]]){
  test(name+" public extension uses MV3 MAIN-world document_start only on official Adventure Land",()=>{
    assert.equal(manifest.manifest_version,3);
    assert.deepEqual(manifest.host_permissions.sort(),["https://adventure.land/*","https://www.adventure.land/*"].sort());
    assert.equal(manifest.content_scripts.length,1);
    assert.equal(manifest.content_scripts[0].run_at,"document_start");
    assert.equal(manifest.content_scripts[0].world,"MAIN");
    assert.deepEqual(manifest.content_scripts[0].js,["page-manifest.js","page-bootstrap.js"]);
    assert.deepEqual(manifest.permissions,["scripting"]);
  });
}

test("public page bootstrap hooks G before loader and restores a normal global property",()=>{
  assert.match(bootstrap,/Object\.defineProperty\(root, "G"/);
  assert.match(bootstrap,/queueMicrotask/);
  assert.match(bootstrap,/restoreGlobalG/);
  assert.match(bootstrap,/def\.file = entry\.runtimeUrl/);
});

test("public page bootstrap contains no gameplay or server authority",()=>{
  assert.equal(/socket\.emit|api_call\(|smart_move\(|use_skill\(|attack\(/.test(bootstrap),false);
  assert.equal(/fetch\(|XMLHttpRequest|WebSocket/.test(bootstrap),false);
});

test("public extension uses external resources only as generated image URLs",()=>{
  assert.doesNotMatch(bootstrap,/https?:\/\//);
  assert.match(popup,/alhd\.public\.enabled/);
  assert.match(popup,/api\.scripting\.executeScript/);
});

test("public toggle reloads the official page rather than hot-mutating game state",()=>{
  assert.match(popup,/localStorage\.setItem\("alhd\.public\.enabled"/);
  assert.match(popup,/api\.tabs\.reload/);
});
