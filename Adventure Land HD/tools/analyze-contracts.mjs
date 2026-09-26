import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath,spriteRuntimeGrid,classifyContractPath,replacementPolicyFor} from "../lib/hd-contracts.mjs";
const args=process.argv.slice(2), val=f=>{const i=args.indexOf(f);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream"), outputArg=val("--output"), checkOnly=args.includes("--check-only");
if(!upstreamArg){console.error("Usage: node tools/analyze-contracts.mjs --upstream <checkout> [--output <json>] [--check-only]");process.exit(2);}
const upstream=path.resolve(process.cwd(),upstreamArg);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);
const req=createRequire(path.join(upstream,"package.json"));
const s=req(path.join(upstream,"design","sprites.js"));
const a=req(path.join(upstream,"design","animations.js"));
function imageSize(file){
  const b=fs.readFileSync(file), e=path.extname(file).toLowerCase();
  if(e===".png"&&b.length>=24&&b.subarray(1,4).toString("ascii")==="PNG") return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  const gh=b.subarray(0,6).toString("ascii"); if(e===".gif"&&b.length>=10&&(gh==="GIF87a"||gh==="GIF89a")) return {width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  if((e===".jpg"||e===".jpeg")&&b.length>=4&&b[0]===255&&b[1]===216){let o=2;const sof=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);while(o+9<b.length){if(b[o]!==255){o++;continue;}while(o<b.length&&b[o]===255)o++;const m=b[o++];if(m===217||m===218)break;if((m>=208&&m<=215)||m===1)continue;if(o+2>b.length)break;const len=b.readUInt16BE(o);if(len<2||o+len>b.length)break;if(sof.has(m)&&len>=7)return{width:b.readUInt16BE(o+5),height:b.readUInt16BE(o+3)};o+=len;}}
  return null;
}
const failures=[], sprites=[], spriteFiles=new Set();
for(const [id,d] of Object.entries(s.sprites||{})){
  if(!d||d.skip||typeof d.file!=="string") continue;
  const sourcePath=normalizeAssetPath(d.file), full=sourcePath&&path.join(upstream,...sourcePath.split("/"));
  if(!sourcePath||!fs.existsSync(full)){failures.push("missing sprite "+id+" "+sourcePath);continue;}
  const pixels=imageSize(full), grid=spriteRuntimeGrid(d);
  if(pixels&&pixels.width%grid.totalColumns!==0) failures.push("sprite width/grid mismatch "+id+" "+sourcePath);
  if(pixels&&pixels.height%grid.totalRows!==0) failures.push("sprite height/grid mismatch "+id+" "+sourcePath);
  sprites.push({id,sourcePath,contractKind:classifyContractPath(sourcePath),type:d.type||"full",size:d.size||null,frames:Number.isInteger(d.frames)?d.frames:null,runtimeGrid:grid,originalPixels:pixels,logicalCell:pixels?{width:pixels.width/grid.totalColumns,height:pixels.height/grid.totalRows}:null,policy:replacementPolicyFor(sourcePath)});
  spriteFiles.add(sourcePath);
}
const animations=[];
for(const [id,d] of Object.entries(a.animations||{})){
  if(!d||typeof d.file!=="string") continue;
  const sourcePath=normalizeAssetPath(d.file), full=sourcePath&&path.join(upstream,...sourcePath.split("/"));
  if(!sourcePath||!fs.existsSync(full)){failures.push("missing animation "+id+" "+sourcePath);continue;}
  animations.push({id,sourcePath,frames:Number.isInteger(d.frames)&&d.frames>0?d.frames:1,directional:!!d.directional,continuous:!!d.continuous,framefps:Number.isFinite(d.framefps)?d.framefps:null,originalPixels:imageSize(full),policy:replacementPolicyFor(sourcePath)});
}
const tilesets=[];
for(const [id,d] of Object.entries(s.tilesets||{})){
  if(!d||typeof d.file!=="string") continue;
  const sourcePath=normalizeAssetPath(d.file), full=sourcePath&&path.join(upstream,...sourcePath.split("/"));
  if(!sourcePath||!fs.existsSync(full)){failures.push("missing tileset "+id+" "+sourcePath);continue;}
  tilesets.push({id,sourcePath,frames:Number.isInteger(d.frames)&&d.frames>0?d.frames:1,frameWidth:Number.isFinite(d.frame_width)?d.frame_width:null,originalPixels:imageSize(full),policy:replacementPolicyFor(sourcePath)});
}
const fonts=[];
for(const name of ["m5x7.fnt","m5x7.xml"]){
  const file=path.join(upstream,"css","fonts",name); if(!fs.existsSync(file)) continue;
  const t=fs.readFileSync(file,"utf8"), page=(t.match(/file=["']([^"']+)["']/)||[])[1]||null, sw=Number((t.match(/scaleW=["']?(\d+)/)||[])[1]||0), sh=Number((t.match(/scaleH=["']?(\d+)/)||[])[1]||0);
  const atlas=page?path.join(upstream,"css","fonts",page):null, pixels=atlas&&fs.existsSync(atlas)?imageSize(atlas):null;
  if(page&&!pixels) failures.push("font page missing "+page);
  if(pixels&&sw&&sh&&(pixels.width!==sw||pixels.height!==sh)) failures.push("font descriptor/atlas mismatch "+name);
  fonts.push({descriptor:"css/fonts/"+name,page:page?"css/fonts/"+page:null,scaleW:sw,scaleH:sh,originalPixels:pixels});
}
if(!sprites.length||!animations.length||!tilesets.length) failures.push("contract family discovery incomplete");
if(failures.length){console.error(failures.slice(0,100).join("\n"));process.exit(1);}
const report={schemaVersion:1,source:{repository:lock.repository,commit:lock.commit,tree:lock.tree},rendererFacts:{entityAnchor:[0.5,1],spriteSizing:"loaded sheet dimensions divided by source grid and runtime frame multipliers",tileSlicing:"explicit rectangle coordinates plus frame_width",hdImplication:"larger assets require a presentation-only logical-size scale bridge"},stats:{spriteDefinitions:sprites.length,spriteFiles:spriteFiles.size,animationDefinitions:animations.length,animationFiles:new Set(animations.map(x=>x.sourcePath)).size,tilesets:tilesets.length,fontDescriptors:fonts.length},sprites,animations,tilesets,fonts};
console.log("Adventure Land HD contract audit passed"); console.log(JSON.stringify(report.stats));
if(!checkOnly){const out=path.resolve(process.cwd(),outputArg||path.join("manifests","local-contract-audit.json"));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log("Wrote:",out);}
