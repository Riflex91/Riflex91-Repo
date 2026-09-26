import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const m=JSON.parse(fs.readFileSync(path.join(root,"manifests","upstream-assets.json"),"utf8"));
const fail=x=>{throw new Error(x);};
if(m.schemaVersion!==1||lock.schemaVersion!==1) fail("Unsupported schema.");
if(m.source.repository!==lock.repository||m.source.commit!==lock.commit||m.source.tree!==lock.tree) fail("Pin mismatch.");
if(m.source.treeTruncated!==false) fail("Source tree is not complete.");
const f=m.files;
if(!Array.isArray(f)||!f.length) fail("Empty inventory.");
const paths=f.map(x=>x.path);
if(new Set(paths).size!==paths.length) fail("Duplicate paths.");
const sorted=[...paths].sort((a,b)=>a.localeCompare(b));
for(let i=0;i<paths.length;i++) if(paths[i]!==sorted[i]) fail("Inventory not sorted.");
const images=f.filter(x=>x.kind==="image").length;
const support=f.filter(x=>x.kind==="support").length;
if(f.length!==lock.expectedInventory.totalFiles||images!==lock.expectedInventory.imageFiles||support!==lock.expectedInventory.supportFiles) fail("Inventory count mismatch.");
if(m.stats.totalFiles!==f.length||m.stats.imageFiles!==images||m.stats.supportFiles!==support) fail("Stats mismatch.");
for(const x of f){
  if(!/^[0-9a-f]{40}$/.test(x.blobSha)) fail("Bad blob SHA: "+x.path);
  if(!Number.isInteger(x.bytes)||x.bytes<0) fail("Bad size: "+x.path);
  if(!["image","support"].includes(x.kind)) fail("Bad kind: "+x.path);
  if(!["low","medium","high"].includes(x.replacementRisk)) fail("Bad risk: "+x.path);
}
console.log("Adventure Land HD inventory verified");
console.log(lock.repository+"@"+lock.commit);
console.log("files="+f.length+" images="+images+" support="+support);
