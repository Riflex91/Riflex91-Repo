import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sourceDir=path.join(root,"public-extension","src");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};

const manifestArg=value("--manifest");
const hdRootArg=value("--hd-root");
const assetBaseArg=value("--asset-base-url");
const outputArg=value("--output");
const version=value("--version")||"0.1.0";
const buildLabel=value("--build-label")||"public-preview";
const expectedCount=Number(value("--expected-count")||48);

if(!manifestArg||!hdRootArg||!assetBaseArg||!outputArg){
  console.error("Usage: node tools/build-public-extension.mjs --manifest <staged-json> --hd-root <dir> --asset-base-url <https://host/path> --output <dir> [--version 0.1.0] [--build-label label]");
  process.exit(2);
}
if(!/^\d+(?:\.\d+){0,3}$/.test(version)) throw new Error("Extension version must contain one to four numeric components.");
if(!Number.isInteger(expectedCount)||expectedCount<1) throw new Error("--expected-count must be a positive integer.");

const manifestPath=path.resolve(process.cwd(),manifestArg);
const hdRoot=path.resolve(process.cwd(),hdRootArg);
const output=path.resolve(process.cwd(),outputArg);
const staged=JSON.parse(fs.readFileSync(manifestPath,"utf8"));

const baseUrl=new URL(assetBaseArg);
if(baseUrl.protocol!=="https:") throw new Error("Public asset base URL must use HTTPS.");
if(baseUrl.username||baseUrl.password||baseUrl.search||baseUrl.hash) throw new Error("Public asset base URL must not contain credentials, query parameters, or fragments.");
const assetBaseUrl=baseUrl.toString().replace(/\/$/,"");

if(staged.schemaVersion!==1) throw new Error("Staged manifest schemaVersion must be 1.");
const entries=(staged.replacements||[]).filter(item=>item?.state==="active");
if(entries.length!==expectedCount) throw new Error("Public build requires exactly "+expectedCount+" active replacements; got "+entries.length+".");

const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const expectedSha=item=>item.expectedHdSha256||item.generator?.expectedSha256||item.expectedSha256||null;
const webPath=value=>String(value||"").split("/").filter(Boolean).map(encodeURIComponent).join("/");

const normalizedSources=new Set();
const cdnRows=[];
for(const item of entries){
  const sourcePath=normalizeAssetPath(item.sourcePath);
  if(!sourcePath) throw new Error("Invalid public sourcePath.");
  if(normalizedSources.has(sourcePath)) throw new Error(sourcePath+": duplicate active public sourcePath.");
  normalizedSources.add(sourcePath);
  if(typeof item.hdPath!=="string"||!item.hdPath) throw new Error(sourcePath+": hdPath missing.");
  if(!Number.isInteger(item.scale)||item.scale<2||item.scale>8) throw new Error(sourcePath+": invalid scale.");
  if(!Number.isInteger(item.hdPixels?.width)||item.hdPixels.width<=0||!Number.isInteger(item.hdPixels?.height)||item.hdPixels.height<=0) throw new Error(sourcePath+": hdPixels missing.");
  const file=path.join(hdRoot,...item.hdPath.split("/"));
  if(!fs.existsSync(file)) throw new Error(sourcePath+": staged HD file missing: "+item.hdPath);
  const actualSha=sha256(file);
  const pinned=expectedSha(item);
  if(pinned&&pinned!==actualSha) throw new Error(sourcePath+": staged HD SHA256 does not match promotion evidence.");
  cdnRows.push({
    sourcePath,
    hdPath:item.hdPath,
    scale:item.scale,
    hdPixels:{width:item.hdPixels.width,height:item.hdPixels.height},
    sha256:actualSha,
    bytes:fs.statSync(file).size
  });
}
cdnRows.sort((a,b)=>a.sourcePath<b.sourcePath?-1:a.sourcePath>b.sourcePath?1:0);

const buildHash=crypto.createHash("sha256");
buildHash.update(JSON.stringify({version,buildLabel,assetBaseUrl,rows:cdnRows}));
const buildId=buildLabel+"-"+buildHash.digest("hex").slice(0,12);

fs.rmSync(output,{recursive:true,force:true});
const cdnDir=path.join(output,"cdn");
const chromiumDir=path.join(output,"chromium");
const firefoxDir=path.join(output,"firefox");
for(const dir of [cdnDir,chromiumDir,firefoxDir]) fs.mkdirSync(dir,{recursive:true});

for(const row of cdnRows){
  const source=path.join(hdRoot,...row.hdPath.split("/"));
  const target=path.join(cdnDir,...row.hdPath.split("/"));
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}

const publicManifest={
  schemaVersion:1,
  mode:"ASSET_ONLY",
  distribution:"browser-extension",
  upstreamCommit:staged.upstreamCommit||null,
  buildId,
  assetBaseUrl,
  replacements:cdnRows.map(row=>({
    sourcePath:row.sourcePath,
    runtimeUrl:assetBaseUrl+"/"+webPath(row.hdPath)+"?alhdv="+row.sha256.slice(0,12),
    scale:row.scale,
    hdPixels:row.hdPixels,
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true
  }))
};
const pageManifest="window.__ALHD_PUBLIC_MANIFEST__ = Object.freeze("+JSON.stringify(publicManifest,null,2)+");\n";

const staticFiles=["page-bootstrap.js","popup.html","popup.css","popup.js"];
for(const browserDir of [chromiumDir,firefoxDir]){
  for(const name of staticFiles) fs.copyFileSync(path.join(sourceDir,name),path.join(browserDir,name));
  fs.writeFileSync(path.join(browserDir,"page-manifest.js"),pageManifest,"utf8");
}

function browserManifest(templateName){
  const obj=JSON.parse(fs.readFileSync(path.join(sourceDir,templateName),"utf8"));
  obj.version=version;
  obj.version_name=version+" · "+buildLabel;
  return JSON.stringify(obj,null,2)+"\n";
}
fs.writeFileSync(path.join(chromiumDir,"manifest.json"),browserManifest("manifest.chromium.json"),"utf8");
fs.writeFileSync(path.join(firefoxDir,"manifest.json"),browserManifest("manifest.firefox.json"),"utf8");

const cdnManifest={
  schemaVersion:1,
  distribution:"Adventure Land HD static image pack",
  buildId,
  assetBaseUrl,
  assetCount:cdnRows.length,
  assets:cdnRows
};
fs.writeFileSync(path.join(output,"cdn-manifest.json"),JSON.stringify(cdnManifest,null,2)+"\n","utf8");
fs.writeFileSync(path.join(output,"build-info.json"),JSON.stringify({
  schemaVersion:1,
  name:"Adventure Land HD",
  version,
  buildLabel,
  buildId,
  assetBaseUrl,
  assetCount:cdnRows.length,
  upstreamCommit:staged.upstreamCommit||null,
  browsers:["chromium","firefox"],
  remoteCode:false,
  remoteAssets:"images-only"
},null,2)+"\n","utf8");

console.log("Adventure Land HD public distribution built:",buildId,cdnRows.length+" image assets ->",output);
