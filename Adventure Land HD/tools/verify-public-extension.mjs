import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const distArg=value("--dist");
if(!distArg){
  console.error("Usage: node tools/verify-public-extension.mjs --dist <public-dist>");
  process.exit(2);
}

const dist=path.resolve(process.cwd(),distArg);
const info=JSON.parse(fs.readFileSync(path.join(dist,"build-info.json"),"utf8"));
const cdn=JSON.parse(fs.readFileSync(path.join(dist,"cdn-manifest.json"),"utf8"));
const errors=[];
const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

if(info.remoteCode!==false) errors.push("public distribution must declare remoteCode=false");
if(info.remoteAssets!=="images-only") errors.push("public distribution may use remote images only");
if(info.assetCount!==48||cdn.assetCount!==48) errors.push("public distribution must contain exactly 48 image assets");
if(!String(info.assetBaseUrl||"").startsWith("https://")) errors.push("public assetBaseUrl must use HTTPS");

for(const row of cdn.assets||[]){
  const file=path.join(dist,"cdn",...row.hdPath.split("/"));
  if(!fs.existsSync(file)){errors.push(row.hdPath+": missing CDN asset");continue;}
  if(sha256(file)!==row.sha256) errors.push(row.hdPath+": CDN asset SHA256 mismatch");
}

function parsePageManifest(file){
  const text=fs.readFileSync(file,"utf8");
  const prefix="window.__ALHD_PUBLIC_MANIFEST__ = Object.freeze(";
  if(!text.startsWith(prefix)||!text.trimEnd().endsWith(");")) throw new Error(file+": invalid generated page manifest wrapper");
  return JSON.parse(text.slice(prefix.length,text.lastIndexOf(");")));
}

for(const browser of ["chromium","firefox"]){
  const dir=path.join(dist,browser);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
  if(manifest.manifest_version!==3) errors.push(browser+": Manifest V3 required");
  const scripts=manifest.content_scripts||[];
  if(scripts.length!==1) errors.push(browser+": exactly one public content script declaration required");
  const script=scripts[0]||{};
  if(script.run_at!=="document_start") errors.push(browser+": content script must run at document_start");
  if(script.world!=="MAIN") errors.push(browser+": content script must run in MAIN world");
  if(JSON.stringify(script.js)!==JSON.stringify(["page-manifest.js","page-bootstrap.js"])) errors.push(browser+": generated manifest must execute before bootstrap");
  const allowedHosts=["https://adventure.land/*","https://www.adventure.land/*"].sort();
  if(JSON.stringify([...(manifest.host_permissions||[])].sort())!==JSON.stringify(allowedHosts)) errors.push(browser+": host permissions must be limited to official Adventure Land pages");
  if((manifest.permissions||[]).some(p=>!["scripting"].includes(p))) errors.push(browser+": unexpected extension permission");
  const pageManifest=parsePageManifest(path.join(dir,"page-manifest.js"));
  if(pageManifest.replacements?.length!==48) errors.push(browser+": page manifest must contain 48 active replacements");
  if(pageManifest.assetBaseUrl!==info.assetBaseUrl) errors.push(browser+": page asset base differs from build info");
  for(const entry of pageManifest.replacements||[]){
    if(entry.state!=="active") errors.push(browser+": non-active generated public replacement");
    if(!String(entry.runtimeUrl||"").startsWith(info.assetBaseUrl+"/")) errors.push(browser+": runtime asset leaves configured asset base");
    if(!/^https:\/\//.test(entry.runtimeUrl||"")) errors.push(browser+": non-HTTPS public runtime asset");
  }
  const bootstrap=fs.readFileSync(path.join(dir,"page-bootstrap.js"),"utf8");
  if(/socket\.emit|api_call\(|smart_move\(|use_skill\(|attack\(/.test(bootstrap)) errors.push(browser+": gameplay/network authority found in public bootstrap");
  if(!bootstrap.includes('def.file = entry.runtimeUrl;')) errors.push(browser+": public bootstrap lacks presentation file override");
  const popup=fs.readFileSync(path.join(dir,"popup.js"),"utf8");
  if(!popup.includes('localStorage.setItem("alhd.public.enabled"')) errors.push(browser+": popup does not persist HD toggle on official origin");
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Adventure Land HD public distribution verified:",info.buildId,"48 static images; Chromium + Firefox; no remote code.");
