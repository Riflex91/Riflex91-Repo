import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
const reportArg=value("--report");
if(!upstreamArg){
  console.error("Usage: node tools/verify-mainland-runtime-coverage.mjs --upstream <checkout> [--report <json>]");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const terrain=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-terrain-activation-plan.json"),"utf8"));
const entities=JSON.parse(fs.readFileSync(path.join(root,"manifests","mainland-entity-activation-plan.json"),"utf8"));
const bootstrap=fs.readFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),"utf8");
const errors=[];

const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);
for(const [label,doc] of [["scope",scope],["terrain",terrain],["entities",entities]]){
  if(doc.upstreamCommit!==lock.commit) errors.push(label+" upstreamCommit must match UPSTREAM.lock.json");
}

const requireFromHere=createRequire(import.meta.url);
const {sprites,tilesets,imagesets}=requireFromHere(path.join(upstream,"design","sprites.js"));

function indexFamily(family){
  const index=new Map();
  for(const [key,def] of Object.entries(family||{})){
    if(!def||typeof def!=="object"||typeof def.file!=="string") continue;
    const sourcePath=normalizeAssetPath(def.file);
    if(!sourcePath) continue;
    if(!index.has(sourcePath)) index.set(sourcePath,[]);
    index.get(sourcePath).push(key);
  }
  for(const keys of index.values()) keys.sort();
  return index;
}

const spriteIndex=indexFamily(sprites);
const tilesetIndex=indexFamily(tilesets);
const imagesetIndex=indexFamily(imagesets);

for(const marker of [
  "applyFamily(gameData.sprites, lookup, stats);",
  "applyFamily(gameData.tilesets, lookup, stats);"
]){
  if(!bootstrap.includes(marker)) errors.push("runtime bootstrap coverage marker missing: "+marker);
}

const scopeSources=(scope.sourceFiles||[]).map(normalizeAssetPath).filter(Boolean).sort();
const terrainSources=(terrain.entries||[]).map(entry=>normalizeAssetPath(entry.sourcePath)).filter(Boolean).sort();
const entitySources=(entities.entries||[]).map(entry=>normalizeAssetPath(entry.sourcePath)).filter(Boolean).sort();
const union=[...new Set([...terrainSources,...entitySources])].sort();

if(scopeSources.length!==48) errors.push("Mainland scope must contain exactly 48 normalized sources");
if(terrainSources.length!==14) errors.push("terrain activation plan must contain exactly 14 normalized sources");
if(entitySources.length!==34) errors.push("entity activation plan must contain exactly 34 normalized sources");
if(union.length!==48) errors.push("combined activation plans must cover exactly 48 unique sources");
if(JSON.stringify(union)!==JSON.stringify(scopeSources)) errors.push("activation-plan source union must exactly match Mainland scope sources");

const terrainSet=new Set(terrainSources);
const rows=[];
for(const sourcePath of scopeSources){
  const expectedFamily=terrainSet.has(sourcePath)?"tilesets":"sprites";
  const expectedIndex=expectedFamily==="tilesets"?tilesetIndex:spriteIndex;
  const keys=expectedIndex.get(sourcePath)||[];
  const otherFamilies=[];
  if(spriteIndex.has(sourcePath)&&expectedFamily!=="sprites") otherFamilies.push("sprites");
  if(tilesetIndex.has(sourcePath)&&expectedFamily!=="tilesets") otherFamilies.push("tilesets");
  if(imagesetIndex.has(sourcePath)&&expectedFamily!=="imagesets") otherFamilies.push("imagesets");
  if(!keys.length) errors.push(sourcePath+": no runtime "+expectedFamily+" .file definition resolves to this source");
  rows.push({sourcePath,expectedFamily,definitionKeys:keys,otherFamilies});
}

const terrainRows=rows.filter(row=>row.expectedFamily==="tilesets");
const entityRows=rows.filter(row=>row.expectedFamily==="sprites");
if(terrainRows.length!==14) errors.push("runtime coverage report must contain 14 terrain rows");
if(entityRows.length!==34) errors.push("runtime coverage report must contain 34 entity rows");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

const report={
  schemaVersion:1,
  upstreamCommit:lock.commit,
  mapId:"main",
  counts:{sources:rows.length,tilesets:terrainRows.length,sprites:entityRows.length},
  rows
};
if(reportArg){
  const reportPath=path.resolve(process.cwd(),reportArg);
  fs.mkdirSync(path.dirname(reportPath),{recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("Mainland runtime coverage verified:",rows.length+"/48 sources reachable;",terrainRows.length+" via G.tilesets;",entityRows.length+" via G.sprites.");
