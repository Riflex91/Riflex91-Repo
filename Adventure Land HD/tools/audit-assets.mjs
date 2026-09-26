import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream");
const outputArg=val("--output");
const checkOnly=args.includes("--check-only");
if(!upstreamArg){console.error("Usage: node tools/audit-assets.mjs --upstream <checkout> [--output <json>] [--check-only]");process.exit(2);}
const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(projectRoot,"UPSTREAM.lock.json"),"utf8"));
const manifest=JSON.parse(fs.readFileSync(path.join(projectRoot,"manifests","upstream-assets.json"),"utf8"));
const git=(...a)=>execFileSync("git",["-C",upstream,...a],{encoding:"utf8"}).trim();
if(!fs.existsSync(upstream)) throw new Error("Upstream checkout not found: "+upstream);
const head=git("rev-parse","HEAD");
if(head!==lock.commit) throw new Error("Wrong upstream commit. Expected "+lock.commit+", got "+head);
if(git("status","--porcelain")) throw new Error("Upstream checkout must be clean.");
const blobSha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
function size(ext,b){
  if(ext===".png"&&b.length>=24&&b.subarray(1,4).toString("ascii")==="PNG") return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  const gh=b.subarray(0,6).toString("ascii");
  if(ext===".gif"&&b.length>=10&&(gh==="GIF87a"||gh==="GIF89a")) return {width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  if(ext===".ico"&&b.length>=8&&b.readUInt16LE(0)===0&&b.readUInt16LE(2)===1) return {width:b[6]||256,height:b[7]||256};
  if((ext===".jpg"||ext===".jpeg")&&b.length>=4&&b[0]===0xff&&b[1]===0xd8){
    let o=2; const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
    while(o+9<b.length){if(b[o]!==0xff){o++;continue;}while(o<b.length&&b[o]===0xff)o++;const marker=b[o++];if(marker===0xd9||marker===0xda)break;if((marker>=0xd0&&marker<=0xd7)||marker===1)continue;if(o+2>b.length)break;const len=b.readUInt16BE(o);if(len<2||o+len>b.length)break;if(sof.has(marker)&&len>=7)return {width:b.readUInt16BE(o+5),height:b.readUInt16BE(o+3)};o+=len;}
  }
  return null;
}
const audited=[]; const failures=[];
for(const item of manifest.files){
  const full=path.join(upstream,...item.path.split("/"));
  if(!fs.existsSync(full)){failures.push("MISSING "+item.path);continue;}
  const b=fs.readFileSync(full);
  if(b.length!==item.bytes) failures.push("SIZE "+item.path);
  if(blobSha(b)!==item.blobSha) failures.push("BLOB "+item.path);
  const d=item.kind==="image"?size(item.extension,b):null;
  audited.push({...item,width:d?.width??null,height:d?.height??null});
}
if(failures.length){console.error(failures.slice(0,50).join("\n"));process.exit(1);}
const report={schemaVersion:1,source:{repository:lock.repository,commit:lock.commit,tree:lock.tree},auditedFiles:audited.length,imagesWithDimensions:audited.filter(x=>x.kind==="image"&&x.width&&x.height).length,files:audited};
console.log("Deep asset audit passed:",audited.length,"files; dimensions:",report.imagesWithDimensions);
if(!checkOnly){const out=path.resolve(process.cwd(),outputArg||path.join("manifests","local-asset-audit.json"));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log("Wrote:",out);}
