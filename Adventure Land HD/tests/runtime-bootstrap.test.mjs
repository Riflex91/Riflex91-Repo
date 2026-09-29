import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),"utf8");

function run(manifest, search="", options={}) {
  const original={file:"/images/all_characters/mchar16.png?v=7",rows:2,columns:4,gameplayMarker:{hp:123}};
  const window={
    location:{search},
    G:{
      sprites:{hero:original},
      animations:{fx:{file:"/images/sprites/animations/Fire0.png"}},
      tilesets:{main:{file:"/images/tiles/map/main.png"}},
      imagesets:{}
    },
    __ALHD_MANIFEST__:manifest
  };
  if(options.document) window.document=options.document;
  const context={window,globalThis:window,Object,Array,Number,RegExp,Set};
  vm.createContext(context);
  vm.runInContext(source,context);
  return {window,original};
}

const active={schemaVersion:1,replacements:[{
  sourcePath:"images/all_characters/mchar16.png",
  runtimeUrl:"/images/alhd/characters/mchar16@4x.png?alhdv=abc123def456",
  scale:4,
  hdPixels:{width:400,height:400},
  state:"active",
  preserveLogicalSize:true,
  originalFallback:true
}]};

test("HD mode applies matching active visual override only",()=>{
  const {window,original}=run(active,"?alhd=on");
  assert.equal(original.file,"/images/alhd/characters/mchar16@4x.png?alhdv=abc123def456");
  assert.equal(original.rows,2);
  assert.equal(original.columns,4);
  assert.equal(original.gameplayMarker.hp,123);
  assert.equal(window.ALHD.applied,1);
  assert.equal(window.ALHD.available,1);
  assert.equal(window.ALHD.eligible,1);
  assert.deepEqual(Array.from(window.ALHD.blocked),[]);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
  assert.equal(window.ALHD.mode,"HD");
});

test("HD mode applies multiple active families in one pass",()=>{
  const multi={schemaVersion:1,replacements:[
    active.replacements[0],
    {
      sourcePath:"images/tiles/map/main.png",
      runtimeUrl:"/images/alhd/map/main@8x.png?alhdv=111122223333",
      scale:8,
      hdPixels:{width:800,height:800},
      state:"active",
      preserveLogicalSize:true,
      originalFallback:true
    }
  ]};
  const {window,original}=run(multi,"?alhd=on");
  assert.equal(original.file,"/images/alhd/characters/mchar16@4x.png?alhdv=abc123def456");
  assert.equal(window.G.tilesets.main.file,"/images/alhd/map/main@8x.png?alhdv=111122223333");
  assert.equal(window.ALHD.applied,2);
  assert.equal(window.ALHD.available,2);
  assert.equal(window.ALHD.eligible,2);
  assert.deepEqual(Array.from(window.ALHD.blocked),[]);
  assert.deepEqual(Array.from(window.ALHD.paths),["images/all_characters/mchar16.png","images/tiles/map/main.png"]);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
});

test("default mode is HD when no override flag is present",()=>{
  const {window,original}=run(active,"?server=EU");
  assert.equal(window.ALHD.mode,"HD");
  assert.equal(original.file,"/images/alhd/characters/mchar16@4x.png?alhdv=abc123def456");
});

test("alhd=off provides a pure original A/B control",()=>{
  const {window,original}=run(active,"?server=EU&alhd=off");
  assert.equal(window.ALHD.mode,"ORIGINAL");
  assert.equal(window.ALHD.reason,"ORIGINAL_MODE");
  assert.equal(window.ALHD.applied,0);
  assert.equal(window.ALHD.available,1);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
});

test("prepared entry is not activated",()=>{
  const prepared={schemaVersion:1,replacements:[{...active.replacements[0],state:"prepared"}]};
  const {original,window}=run(prepared);
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
  assert.equal(window.ALHD.applied,0);
  assert.equal(window.ALHD.available,0);
  assert.equal(window.ALHD.eligible,0);
  assert.deepEqual(Array.from(window.ALHD.blocked),[]);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
});

test("wrong resolution suffix fails closed to original",()=>{
  const bad={schemaVersion:1,replacements:[{...active.replacements[0],runtimeUrl:"/images/alhd/characters/mchar16@2x.png"}]};
  const {original}=run(bad);
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
});

test("missing manifest leaves original definitions unchanged",()=>{
  const {original,window}=run(null);
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
  assert.equal(window.ALHD.reason,"MANIFEST_UNAVAILABLE");
  assert.equal(window.ALHD.available,0);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
});


test("HD status reports valid manifest paths that did not match a runtime definition",()=>{
  const unmatched={schemaVersion:1,replacements:[{
    sourcePath:"images/tiles/monsters/not_loaded_here.png",
    runtimeUrl:"/images/alhd/monsters/not_loaded_here@4x.png?alhdv=123456789abc",
    scale:4,
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true
  }]};
  const {window}=run(unmatched,"?alhd=on");
  assert.equal(window.ALHD.reason,"READY");
  assert.equal(window.ALHD.available,1);
  assert.equal(window.ALHD.applied,0);
  assert.deepEqual(Array.from(window.ALHD.paths),[]);
  assert.deepEqual(Array.from(window.ALHD.missing),["images/tiles/monsters/not_loaded_here.png"]);
});

test("HD mode blocks oversized textures using the detected WebGL texture limit",()=>{
  let lost=false;
  const gl={
    MAX_TEXTURE_SIZE:3379,
    getParameter(value){return value===3379?4096:null;},
    getExtension(name){return name==="WEBGL_lose_context"?{loseContext(){lost=true;}}:null;}
  };
  const document={createElement(){return {getContext(name){return name==="webgl"?gl:null;}};}};
  const oversized={schemaVersion:1,replacements:[{
    ...active.replacements[0],
    hdPixels:{width:5000,height:1000}
  }]};
  const {window,original}=run(oversized,"?alhd=on",{document});
  assert.equal(original.file,"/images/all_characters/mchar16.png?v=7");
  assert.equal(window.ALHD.maxTextureSize,4096);
  assert.equal(window.ALHD.available,1);
  assert.equal(window.ALHD.eligible,0);
  assert.equal(window.ALHD.applied,0);
  assert.deepEqual(Array.from(window.ALHD.blocked),["images/all_characters/mchar16.png"]);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
  assert.equal(lost,true);
});

test("bootstrap contains no gameplay transport authority",()=>{
  assert.equal(/socket\.emit|api_call|attack\(|smart_move|use_skill/.test(source),false);
});
