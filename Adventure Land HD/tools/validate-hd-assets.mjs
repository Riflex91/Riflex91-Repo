import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateUniformIntegerScale,hasResolutionSuffix,replacementPolicyFor} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2), val=f=>{const i=args.indexOf(f);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream"), hdRootArg=val("--hd-root")||"hd-assets";
if(!upstreamArg){console.error("Usage: node tools/validate-hd-assets.mjs --upstream <checkout> [--hd-root <dir>]");process.exit(2);}
const upstream=path.resolve(process.cwd(),upstreamArg), hdRoot=path.resolve(root,hdRootArg);
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));

function imageSize(file){
  const b=fs.readFileSync(file), e=path.extname(file).toLowerCase();
  if(e===".png"&&b.length>=24&&b.subarray(1,4).toString("ascii")==="PNG") return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  const gh=b.subarray(0,6).toString("ascii");
  if(e===".gif"&&b.length>=10&&(gh==="GIF87a"||gh==="GIF89a")) return {width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  return null;
}

const defaultScale=Number.isInteger(manifest.rules?.defaultScale)?manifest.rules.defaultScale:8;
const errors=[];
for(const item of manifest.replacements||[]){
  if(!["prepared","active"].includes(item.state)) errors.push((item.sourcePath||"?")+": state must be prepared or active");
  if(typeof item.sourcePath!=="string"||typeof item.hdPath!=="string"){errors.push("replacement requires sourcePath and hdPath");continue;}
  if(item.scale!==defaultScale && !(typeof item.scaleExceptionReason==="string"&&item.scaleExceptionReason.trim())) errors.push(item.sourcePath+": non-default scale "+item.scale+" requires scaleExceptionReason; project default is "+defaultScale+"x");
  if(!hasResolutionSuffix(item.hdPath,item.scale)) errors.push(item.sourcePath+": hdPath must contain @"+item.scale+"x before extension");
  const source=path.join(upstream,...item.sourcePath.replace(/^\/+/, "").split("/"));
  const hd=path.join(hdRoot,...item.hdPath.replace(/^\/+/, "").split("/"));
  if(!fs.existsSync(source)){errors.push(item.sourcePath+": original missing");continue;}
  if(!fs.existsSync(hd)){errors.push(item.sourcePath+": HD missing");continue;}
  const original=imageSize(source), high=imageSize(hd);
  if(!original||!high){errors.push(item.sourcePath+": prepared runtime overrides currently require PNG/GIF dimension support");continue;}
  const s=validateUniformIntegerScale(original,high,item.scale);
  if(!s.ok) errors.push(...s.errors.map(e=>item.sourcePath+": "+e));
  const p=replacementPolicyFor(item.sourcePath);
  if(item.preserveLogicalSize!==true) errors.push(item.sourcePath+": preserveLogicalSize must be true");
  if(item.originalFallback!==true) errors.push(item.sourcePath+": originalFallback must be true");
  if(item.state==="active"&&!p.requiresResolutionAwareTexture&&p.kind==="other") errors.push(item.sourcePath+": unclassified assets cannot be activated yet");
}
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("HD asset manifest valid:",(manifest.replacements||[]).length,"replacements; default="+defaultScale+"x");
