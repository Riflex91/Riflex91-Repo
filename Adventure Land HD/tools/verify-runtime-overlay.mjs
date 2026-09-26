import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream");
if(!upstreamArg){console.error("Usage: node tools/verify-runtime-overlay.mjs --upstream <overlay-checkout>");process.exit(2);}

const upstream=path.resolve(process.cwd(),upstreamArg);
const indexPath=path.join(upstream,"htmls","index.html");
const runtimeManifestPath=path.join(upstream,"js","adventure-land-hd-manifest.js");
const bootstrapPath=path.join(upstream,"js","adventure-land-hd-bootstrap.js");
const hdManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));

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
  for(const item of active){
    const local=path.join(root,"hd-assets",...item.hdPath.split("/"));
    const materialized=path.join(upstream,"images","alhd",...item.hdPath.split("/"));
    if(!fs.existsSync(materialized)){errors.push("active HD asset not materialized: "+item.hdPath);continue;}
    if(sha(local)!==sha(materialized)) errors.push("materialized asset differs: "+item.hdPath);
    const assetVersion=sha(local).slice(0,12);
    const runtimeUrl="/images/alhd/"+item.hdPath.replace(/^\/+/, "")+"?alhdv="+assetVersion;
    if(!runtimeManifest.includes(JSON.stringify(runtimeUrl))) errors.push("runtime manifest missing "+runtimeUrl);
  }
  if(active.length!==1) errors.push("Phase 4 smoke expects exactly one active pilot, found "+active.length);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Runtime overlay materialization verified: data.js -> manifest -> bootstrap, active asset copied byte-for-byte.");
