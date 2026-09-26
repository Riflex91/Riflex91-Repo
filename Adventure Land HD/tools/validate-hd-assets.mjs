import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateUniformIntegerScale,replacementPolicyFor} from "../lib/hd-contracts.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2), val=f=>{const i=args.indexOf(f);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream"), hdRootArg=val("--hd-root")||"hd-assets";
if(!upstreamArg){console.error("Usage: node tools/validate-hd-assets.mjs --upstream <checkout> [--hd-root <dir>]");process.exit(2);}
const upstream=path.resolve(process.cwd(),upstreamArg), hdRoot=path.resolve(root,hdRootArg);
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
function imageSize(file){
  const b=fs.readFileSync(file), e=path.extname(file).toLowerCase();
  if(e===".png"&&b.length>=24&&b.subarray(1,4).toString("ascii")==="PNG") return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  const gh=b.subarray(0,6).toString("ascii");if(e===".gif"&&b.length>=10&&(gh==="GIF87a"||gh==="GIF89a")) return {width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  return null;
}
const errors=[];
for(const item of manifest.replacements||[]){
  if(item.state!=="prepared") errors.push((item.sourcePath||"?")+": state must be prepared until Phase 3");
  if(typeof item.sourcePath!=="string"||typeof item.hdPath!=="string"){errors.push("replacement requires sourcePath and hdPath");continue;}
  const source=path.join(upstream,...item.sourcePath.split("/")), hd=path.join(hdRoot,...item.hdPath.split("/"));
  if(!fs.existsSync(source)){errors.push(item.sourcePath+": original missing");continue;}
  if(!fs.existsSync(hd)){errors.push(item.sourcePath+": HD missing");continue;}
  const original=imageSize(source), high=imageSize(hd);
  if(!original||!high){errors.push(item.sourcePath+": only PNG/GIF dimension validation is enabled for prepared overrides");continue;}
  const s=validateUniformIntegerScale(original,high,item.scale); if(!s.ok) errors.push(...s.errors.map(e=>item.sourcePath+": "+e));
  const p=replacementPolicyFor(item.sourcePath);
  if(item.preserveLogicalSize!==true) errors.push(item.sourcePath+": preserveLogicalSize must be true");
  if(item.originalFallback!==true) errors.push(item.sourcePath+": originalFallback must be true");
  if(p.requiresScaledRectMapping&&item.requiresScaledRectMapping!==true) errors.push(item.sourcePath+": world atlas requires scaled rectangle mapping");
}
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("HD asset manifest valid:",(manifest.replacements||[]).length,"prepared replacements");
