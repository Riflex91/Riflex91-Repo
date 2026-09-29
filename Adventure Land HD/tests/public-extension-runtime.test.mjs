import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const bootstrap=fs.readFileSync(path.join(root,"public-extension","src","page-bootstrap.js"),"utf8");

function manifest(replacements){
  return {schemaVersion:1,mode:"ASSET_ONLY",buildId:"test-build",assetBaseUrl:"https://cdn.example.invalid/alhd",replacements};
}

function entry(overrides={}){
  return {
    sourcePath:"images/tiles/map/doors.png",
    runtimeUrl:"https://cdn.example.invalid/alhd/map/doors@8x.png?alhdv=123456789abc",
    scale:8,
    hdPixels:{width:1536,height:2048},
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true,
    ...overrides
  };
}

async function start(options={}){
  const store=new Map(Object.entries(options.storage||{}));
  const window={
    location:{search:options.search||""},
    localStorage:{
      getItem(key){return store.has(key)?store.get(key):null;},
      setItem(key,value){store.set(key,String(value));}
    },
    __ALHD_PUBLIC_MANIFEST__:options.manifest||manifest([entry()]),
    setTimeout(fn){queueMicrotask(fn);},
    queueMicrotask
  };
  if(options.document) window.document=options.document;
  const context=vm.createContext({window,globalThis:window,Object,Array,Number,RegExp,Set,Promise,URL,queueMicrotask});
  vm.runInContext(bootstrap,context,{filename:"page-bootstrap.js"});
  return {window,store};
}

async function settle(){
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve=>setImmediate(resolve));
}

test("document_start hook applies HD after official G is assigned and restores normal G property",async()=>{
  const {window}=await start();
  const original={file:"/images/tiles/map/doors.png?v=3",frames:3,gameplayMarker:{x:1}};
  window.G={sprites:{},animations:{},tilesets:{doors:original},imagesets:{}};
  await settle();
  assert.equal(original.file,"https://cdn.example.invalid/alhd/map/doors@8x.png?alhdv=123456789abc");
  assert.equal(original.frames,3);
  assert.equal(original.gameplayMarker.x,1);
  assert.equal(window.ALHD.mode,"HD");
  assert.equal(window.ALHD.reason,"READY");
  assert.equal(window.ALHD.applied,1);
  assert.equal(window.ALHD.available,1);
  assert.equal(window.ALHD.eligible,1);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
  const descriptor=Object.getOwnPropertyDescriptor(window,"G");
  assert.equal("value" in descriptor,true);
  assert.equal(descriptor.writable,true);
});

test("extension toggle off leaves official G definitions untouched",async()=>{
  const {window}=await start({storage:{"alhd.public.enabled":"off"}});
  const original={file:"/images/tiles/map/doors.png?v=3",frames:3};
  window.G={sprites:{},animations:{},tilesets:{doors:original},imagesets:{}};
  await settle();
  assert.equal(original.file,"/images/tiles/map/doors.png?v=3");
  assert.equal(window.ALHD.mode,"ORIGINAL");
  assert.equal(window.ALHD.applied,0);
  assert.equal(window.ALHD.available,1);
});

test("query alhd=off overrides stored enabled state",async()=>{
  const {window}=await start({search:"?server=EU&alhd=off",storage:{"alhd.public.enabled":"on"}});
  const original={file:"/images/tiles/map/doors.png"};
  window.G={sprites:{},animations:{},tilesets:{doors:original},imagesets:{}};
  await settle();
  assert.equal(original.file,"/images/tiles/map/doors.png");
  assert.equal(window.ALHD.reason,"ORIGINAL_MODE");
});

test("hardware guard leaves oversized public texture on original fallback",async()=>{
  const gl={
    MAX_TEXTURE_SIZE:123,
    getParameter(value){return value===123?1024:null;},
    getExtension(){return null;}
  };
  const document={createElement(){return {getContext(name){return name==="webgl"?gl:null;}};}};
  const {window}=await start({document});
  const original={file:"/images/tiles/map/doors.png"};
  window.G={sprites:{},animations:{},tilesets:{doors:original},imagesets:{}};
  await settle();
  assert.equal(original.file,"/images/tiles/map/doors.png");
  assert.equal(window.ALHD.maxTextureSize,1024);
  assert.equal(window.ALHD.available,1);
  assert.equal(window.ALHD.eligible,0);
  assert.deepEqual(Array.from(window.ALHD.blocked),["images/tiles/map/doors.png"]);
  assert.deepEqual(Array.from(window.ALHD.missing),[]);
});

test("changed official file path fails closed and is visible as missing",async()=>{
  const {window}=await start();
  const current={file:"/images/tiles/map/doors_v2.png",frames:3};
  window.G={sprites:{},animations:{},tilesets:{doors:current},imagesets:{}};
  await settle();
  assert.equal(current.file,"/images/tiles/map/doors_v2.png");
  assert.equal(window.ALHD.applied,0);
  assert.deepEqual(Array.from(window.ALHD.missing),["images/tiles/map/doors.png"]);
});
