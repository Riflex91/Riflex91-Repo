import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),"utf8");

function run(manifest){
  const original={file:"/images/all_characters/mchar16.png?v=7",rows:2,columns:4,gameplayMarker:{hp:123}};
  const window={
    G:{
      sprites:{hero:original},
      animations:{fx:{file:"/images/sprites/animations/Fire0.png"}},
      tilesets:{main:{file:"/images/tiles/map/main.png"}},
      imagesets:{}
    },
    __ALHD_MANIFEST__:manifest
  };
  const context={window,globalThis:window,Object,Array,Number,RegExp,Set};
  vm.createContext(context);
  vm.runInContext(source,context);
  return {window,original};
}

test("active 4x override changes only matching visual file reference",()=>{
  const {window,original}=run({schemaVersion:1,replacements:[{sourcePath:"images/all_characters/mchar16.png",runtimeUrl:"/images/alhd/characters/mchar16@4x.png",scale:4,state:"active",preserveLogicalSize:true,originalFallback:true}]});
  assert.equal(original.file,"/images/alhd/characters/mchar16@4x.png");
  assert.equal(original.rows,2);
  assert.equal(original.columns,4);
  assert.equal(original.gameplayMarker.hp,123);
  assert.equal(window.ALHD.applied,1);
});

test("prepared entry is not activated",()=>{
  const {original,window}=run({schemaVersion:1,replacements:[{sourcePath:"images/all_characters/mchar16.png",runtimeUrl:"/images/alhd/characters/mchar16@4x.png",scale:4,state:"prepared",preserveLogicalSize:true,originalFallback:true}]});
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
  assert.equal(window.ALHD.applied,0);
});

test("wrong resolution suffix fails closed to original",()=>{
  const {original}=run({schemaVersion:1,replacements:[{sourcePath:"images/all_characters/mchar16.png",runtimeUrl:"/images/alhd/characters/mchar16@2x.png",scale:4,state:"active",preserveLogicalSize:true,originalFallback:true}]});
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
});

test("missing manifest leaves original definitions unchanged",()=>{
  const {original,window}=run(null);
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
  assert.equal(window.ALHD.reason,"MANIFEST_UNAVAILABLE");
});

test("bootstrap contains no gameplay transport authority",()=>{
  assert.equal(/socket\.emit|api_call|attack\(|smart_move|use_skill/.test(source),false);
});
