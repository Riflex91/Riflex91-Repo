import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const terrainArg=value("--terrain-promotion");
const entityArg=value("--entity-promotion");
const outputArg=value("--output");
if(!terrainArg||!entityArg||!outputArg){
  console.error("Usage: node tools/build-mainland-staged-manifest.mjs --terrain-promotion <json> --entity-promotion <json> --output <json>");
  process.exit(2);
}

const base=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const terrain=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),terrainArg),"utf8"));
const entity=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),entityArg),"utf8"));
const outputPath=path.resolve(process.cwd(),outputArg);
const upstreamCommit="90052162eb3ebda36c893e1eb4af643913c8f984";

for(const [name,promotion,expectedCount] of [["terrain",terrain,14],["entity",entity,34]]){
  if(promotion.schemaVersion!==1) throw new Error(name+" promotion schemaVersion must be 1");
  if(promotion.upstreamCommit!==upstreamCommit) throw new Error(name+" promotion upstream commit mismatch");
  if(!Array.isArray(promotion.replacements)||promotion.replacements.length!==expectedCount) throw new Error(name+" promotion must contain exactly "+expectedCount+" replacements");
  for(const item of promotion.replacements){
    if(item?.state!=="active") throw new Error(name+" promotion contains a non-active replacement");
  }
}

const bySource=new Map((base.replacements||[]).map(item=>[normalizeAssetPath(item.sourcePath),item]));
const promotedSources=new Set();
for(const promotion of [terrain,entity]){
  for(const item of promotion.replacements){
    const key=normalizeAssetPath(item.sourcePath);
    if(!key) throw new Error("Promotion replacement has invalid sourcePath");
    if(promotedSources.has(key)) throw new Error(key+": duplicate sourcePath across Mainland promotions");
    promotedSources.add(key);
    bySource.set(key,item);
  }
}
if(promotedSources.size!==48) throw new Error("Combined Mainland promotions must cover exactly 48 unique source files");

for(const sourcePath of ["images/tiles/map/doors.png","images/tiles/characters/jubchan_1.png"]){
  const original=(base.replacements||[]).find(item=>normalizeAssetPath(item.sourcePath)===sourcePath);
  const stagedItem=bySource.get(sourcePath);
  if(!original||!stagedItem) throw new Error(sourcePath+": validated active pilot missing");
  if(JSON.stringify(original)!==JSON.stringify(stagedItem)) throw new Error(sourcePath+": staged promotion changed the validated pilot");
}

const replacements=[...bySource.values()].sort((a,b)=>{
  const aa=normalizeAssetPath(a.sourcePath)||"";
  const bb=normalizeAssetPath(b.sourcePath)||"";
  return aa<bb?-1:aa>bb?1:0;
});
const stagedManifest={...base,phase:"4-mainland-staged",replacements};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(stagedManifest,null,2)+"\n","utf8");
console.log("Mainland staged HD manifest:",replacements.length,"replacements;",promotedSources.size,"Mainland sources promoted ->",outputPath);
