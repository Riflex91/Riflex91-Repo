import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream");
const manifestArg=val("--manifest");
const hdRootArg=val("--hd-root");
if(!upstreamArg){console.error("Usage: node tools/verify-runtime-overlay.mjs --upstream <overlay-checkout> [--manifest <json>] [--hd-root <dir>]");process.exit(2);}
if((manifestArg&&!hdRootArg)||(!manifestArg&&hdRootArg)) throw new Error("--manifest and --hd-root must be supplied together for a custom overlay.");

const upstream=path.resolve(process.cwd(),upstreamArg);
const manifestPath=manifestArg?path.resolve(process.cwd(),manifestArg):path.join(root,"manifests","hd-assets.json");
const hdRoot=hdRootArg?path.resolve(process.cwd(),hdRootArg):path.join(root,"hd-assets");
const indexPath=path.join(upstream,"htmls","index.html");
const runtimeManifestPath=path.join(upstream,"js","adventure-land-hd-manifest.js");
const bootstrapPath=path.join(upstream,"js","adventure-land-hd-bootstrap.js");
const hdManifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));

const errors=[];
for(const file of [indexPath,runtimeManifestPath,bootstrapPath]){
  if(!fs.existsSync(file)) errors.push("missing overlay file: "+file);
}

if(!errors.length){
  const html=fs.readFileSync(indexPath,"utf8");
  const dataPos=html.indexOf('<script src="/data.js?v={{domain.v}}&amp;cache=1"></script>');
  const manifestMatch=html.match(/<script src="\/js\/adventure-land-hd-manifest\.js\?alhdv=([a-f0-9]{12})"><\/script>/);
  const manifestPos=manifestMatch?html.indexOf(manifestMatch[0]):-1;
  const bootstrapPos=html.indexOf('<script src="/js/adventure-land-hd-bootstrap.js"></script>');
  if(dataPos<0||manifestPos<0||bootstrapPos<0) errors.push("overlay script tags missing");
  else if(!(dataPos<manifestPos&&manifestPos<bootstrapPos)) errors.push("overlay script order must be data.js -> manifest -> bootstrap");

  const runtimeManifest=fs.readFileSync(runtimeManifestPath,"utf8");
  const sha=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const expectedManifestVersion=sha(runtimeManifestPath).slice(0,12);
  if(manifestMatch&&manifestMatch[1]!==expectedManifestVersion) errors.push("runtime manifest script cache version mismatch");
  const bootstrap=fs.readFileSync(bootstrapPath,"utf8");
  if(/socket\.emit|api_call\(|smart_move\(|use_skill\(|attack\(/.test(bootstrap)) errors.push("gameplay transport found in bootstrap");

  const active=(hdManifest.replacements||[]).filter(x=>x.state==="active");
  if(!active.length) errors.push("runtime overlay requires at least one active HD asset");
  const sourcePaths=active.map(item=>normalizeAssetPath(item.sourcePath));
  if(new Set(sourcePaths).size!==sourcePaths.length) errors.push("active HD sourcePath values must be unique after normalization");
  for(const item of active){
    const local=path.join(hdRoot,...item.hdPath.split("/"));
    const materialized=path.join(upstream,"images","alhd",...item.hdPath.split("/"));
    if(!fs.existsSync(materialized)){errors.push("active HD asset not materialized: "+item.hdPath);continue;}
    if(sha(local)!==sha(materialized)) errors.push("materialized asset differs: "+item.hdPath);
    const assetVersion=sha(local).slice(0,12);
    const runtimeUrl="/images/alhd/"+item.hdPath.replace(/^\/+/, "")+"?alhdv="+assetVersion;
    if(!runtimeManifest.includes(JSON.stringify(runtimeUrl))) errors.push("runtime manifest missing "+runtimeUrl);
  }
  const runtimeEntryCount=(runtimeManifest.match(/"state": "active"/g)||[]).length;
  if(runtimeEntryCount!==active.length) errors.push("runtime manifest active count mismatch: expected "+active.length+", found "+runtimeEntryCount);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
const activeCount=(hdManifest.replacements||[]).filter(x=>x.state==="active").length;
console.log("Runtime overlay materialization verified: data.js -> manifest -> bootstrap,",activeCount,"active assets copied byte-for-byte.");
