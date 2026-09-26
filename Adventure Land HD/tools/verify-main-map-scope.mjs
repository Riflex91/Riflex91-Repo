import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
if(!upstreamArg){
  console.error("Usage: node tools/verify-main-map-scope.mjs --upstream <checkout>");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const scope=JSON.parse(fs.readFileSync(path.join(root,"manifests","main-map-scope.json"),"utf8"));
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
const errors=[];
if(head!==lock.commit) errors.push("wrong upstream commit: "+head);
if(scope.upstreamCommit!==lock.commit) errors.push("main-map scope upstreamCommit must match UPSTREAM.lock.json");

const requireFromHere=createRequire(import.meta.url);
const load=relative=>requireFromHere(path.join(upstream,...relative.split("/")));
const {maps}=load("design/maps.js");
const {npcs}=load("design/npcs.js");
const {monsters}=load("design/monsters.js");
const {sprites,tilesets}=load("design/sprites.js");
const {positions}=load("design/dimensions.js");
const {seedMaps}=load("scripts/seed_mongodb.js");

const main=maps[scope.mapId];
if(!main) errors.push("missing map definition: "+scope.mapId);

const normalize=file=>String(file||"").split("?")[0].replace(/^[/]+/, "");
const sort=a=>[...a].map(String).sort();
const spriteIndex=new Map();
function addSprite(name,file){
  if(!name||!file) return;
  if(!spriteIndex.has(name)) spriteIndex.set(name,new Set());
  spriteIndex.get(name).add(normalize(file));
}
function indexMatrix(value,file){
  if(Array.isArray(value)){
    for(const child of value) indexMatrix(child,file);
  }else if(typeof value==="string"){
    addSprite(value,file);
  }
}
for(const [id,def] of Object.entries(sprites||{})){
  if(!def?.file) continue;
  addSprite(id,def.file);
  indexMatrix(def.matrix,def.file);
}
const resolveSkin=skin=>sort(spriteIndex.get(skin)||[]);

const geometry=seedMaps.find(record=>record._id==="MP_"+main.key);
if(!geometry) errors.push("missing bundled geometry for "+main.key);

const runtimeSource=fs.readFileSync(path.join(upstream,"js","old_common_functions.js"),"utf8");
const runtimeMonsterPlacements=[];
const marker="G.maps.main.monsters.push(";
for(const line of runtimeSource.split("\n")){
  const at=line.indexOf(marker);
  if(at<0) continue;
  const close=line.indexOf(");",at+marker.length);
  if(close<0){errors.push("could not parse main monster runtime augmentation");continue;}
  try{runtimeMonsterPlacements.push({...JSON.parse(line.slice(at+marker.length,close)),source:"runtime-augmentation"});}
  catch{errors.push("could not parse main monster runtime augmentation");}
}

const npcPlacements=[
  ...(main?.npcs||[]).map(entry=>({...entry,seasonal:false})),
  ...(main?.seasonal_npcs||[]).map(entry=>({...entry,seasonal:true}))
];
const unresolvedBaseSkins=[];
const unresolvedCosmetics=[];
const sourceFiles=new Set();
for(const placement of npcPlacements){
  const def=npcs[placement.id];
  if(!def){errors.push("missing NPC definition: "+placement.id);continue;}
  const baseFiles=resolveSkin(def.skin);
  if(def.skin&&!baseFiles.length) unresolvedBaseSkins.push(placement.id+":"+def.skin);
  for(const file of baseFiles) sourceFiles.add(file);
  for(const [slot,skin] of Object.entries(def.cx||{})){
    if(typeof skin!=="string") continue;
    const files=resolveSkin(skin);
    if(!files.length) unresolvedCosmetics.push({npc:placement.id,slot,skin});
    for(const file of files) sourceFiles.add(file);
  }
}

const monsterPlacements=[
  ...(main?.monsters||[]).map(entry=>({...entry,source:"map"})),
  ...runtimeMonsterPlacements
];
const monsterTypes=sort(new Set(monsterPlacements.map(entry=>entry.type).filter(Boolean)));
const unresolvedMonsterSkins=[];
for(const type of monsterTypes){
  const def=monsters[type];
  if(!def){errors.push("missing monster definition: "+type);continue;}
  const skin=def.skin||type;
  const files=resolveSkin(skin);
  if(!files.length) unresolvedMonsterSkins.push(type+":"+skin);
  for(const file of files) sourceFiles.add(file);
}

const geometryTiles=geometry?.info?.data?.tiles||[];
const geometryPlacements=geometry?.info?.data?.placements||[];
const usedTilesets=new Set();
for(const tile of geometryTiles){
  if(Array.isArray(tile)&&typeof tile[0]==="string"&&tilesets[tile[0]]) usedTilesets.add(tile[0]);
}
function collectPositionTiles(value){
  if(!Array.isArray(value)) return;
  if(typeof value[0]==="string"&&tilesets[value[0]]) usedTilesets.add(value[0]);
  for(const child of value) if(Array.isArray(child)) collectPositionTiles(child);
}
for(const def of Object.values(main?.animatables||{})){
  if(def?.position&&positions[def.position]) collectPositionTiles(positions[def.position]);
}
for(const trap of main?.traps||[]){
  if(trap?.type&&positions[trap.type]) collectPositionTiles(positions[trap.type]);
}
for(const id of usedTilesets){
  const file=normalize(tilesets[id]?.file);
  if(!file) errors.push("tileset has no file: "+id);
  else sourceFiles.add(file);
}

const npcIds=sort(new Set(npcPlacements.map(entry=>entry.id)));
const seasonalNpcIds=sort(new Set(npcPlacements.filter(entry=>entry.seasonal).map(entry=>entry.id)));
const runtimeAugmentedMonsterTypes=sort(new Set(runtimeMonsterPlacements.map(entry=>entry.type)));
const actualSourceFiles=sort(sourceFiles);
const actualTilesets=sort(usedTilesets);

function same(label,actual,expected){
  if(JSON.stringify(actual)!==JSON.stringify(expected)) errors.push(label+" drifted\nactual="+JSON.stringify(actual)+"\nexpected="+JSON.stringify(expected));
}
function equal(label,actual,expected){
  if(actual!==expected) errors.push(label+" expected "+expected+" but found "+actual);
}

equal("map key",main?.key,scope.mapKey);
equal("map name",main?.name,scope.mapName);
equal("geometry id",geometry?._id,scope.geometryId);
equal("geometry tile definitions",geometryTiles.length,scope.expected.geometryTiles);
equal("geometry placements",geometryPlacements.length,scope.expected.geometryPlacements);
equal("NPC placements",npcPlacements.length,scope.expected.npcPlacements);
equal("seasonal NPC placements",npcPlacements.filter(entry=>entry.seasonal).length,scope.expected.seasonalNpcPlacements);
equal("monster types",monsterTypes.length,scope.expected.monsterTypes);
equal("monster placements",monsterPlacements.length,scope.expected.monsterPlacements);
equal("world tilesets",actualTilesets.length,scope.expected.worldTilesets);
equal("source files",actualSourceFiles.length,scope.expected.sourceFiles);

same("NPC ids",npcIds,scope.npcIds);
same("seasonal NPC ids",seasonalNpcIds,scope.seasonalNpcIds);
same("monster types",monsterTypes,scope.monsterTypes);
same("runtime-augmented monster types",runtimeAugmentedMonsterTypes,scope.runtimeAugmentedMonsterTypes);
same("tilesets",actualTilesets,scope.tilesets);
same("source files",actualSourceFiles,scope.sourceFiles);

if(unresolvedBaseSkins.length) errors.push("unresolved NPC base skins: "+unresolvedBaseSkins.join(", "));
if(unresolvedMonsterSkins.length) errors.push("unresolved monster skins: "+unresolvedMonsterSkins.join(", "));

const expectedUnresolved=(scope.knownUnresolvedCosmetics||[]).map(({npc,slot,skin})=>({npc,slot,skin}));
unresolvedCosmetics.sort((a,b)=>(a.npc+"."+a.slot).localeCompare(b.npc+"."+b.slot));
expectedUnresolved.sort((a,b)=>(a.npc+"."+a.slot).localeCompare(b.npc+"."+b.slot));
same("known unresolved cosmetics",unresolvedCosmetics,expectedUnresolved);

for(const file of actualSourceFiles){
  if(!fs.existsSync(path.join(upstream,...file.split("/")))) errors.push("scoped source file missing: "+file);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  "Mainland scope verified:",
  actualTilesets.length+" tilesets,",
  npcPlacements.length+" NPC placements,",
  monsterTypes.length+" monster types,",
  actualSourceFiles.length+" source files."
);
