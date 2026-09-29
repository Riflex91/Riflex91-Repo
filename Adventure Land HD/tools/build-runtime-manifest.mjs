import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { hasResolutionSuffix, normalizeAssetPath } from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const output=path.resolve(process.cwd(),val("--output")||path.join(root,"runtime","adventure-land-hd-manifest.js"));
const manifestArg=val("--manifest");
const hdRootArg=val("--hd-root");
if((manifestArg&&!hdRootArg)||(!manifestArg&&hdRootArg)) throw new Error("--manifest and --hd-root must be supplied together for a custom runtime manifest.");
const manifestPath=manifestArg?path.resolve(process.cwd(),manifestArg):path.join(root,"manifests","hd-assets.json");
const hdRoot=hdRootArg?path.resolve(process.cwd(),hdRootArg):path.join(root,"hd-assets");
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
if(manifest.upstreamCommit&&manifest.upstreamCommit!=="90052162eb3ebda36c893e1eb4af643913c8f984") throw new Error("manifest upstreamCommit mismatch");
const active=[];
const seenSourcePaths=new Set();

for(const item of manifest.replacements||[]){
  if(item.state!=="active") continue;
  if(typeof item.sourcePath!=="string"||typeof item.hdPath!=="string") throw new Error("Active replacement requires sourcePath and hdPath.");
  const sourcePath=normalizeAssetPath(item.sourcePath);
  if(!sourcePath) throw new Error("Active replacement requires a valid normalized sourcePath.");
  if(seenSourcePaths.has(sourcePath)) throw new Error(sourcePath+": duplicate active sourcePath after normalization.");
  seenSourcePaths.add(sourcePath);
  if(!hasResolutionSuffix(item.hdPath,item.scale)) throw new Error(item.sourcePath+": hdPath must contain @"+item.scale+"x before the extension.");
  if(!Number.isInteger(item.hdPixels?.width)||item.hdPixels.width<=0||!Number.isInteger(item.hdPixels?.height)||item.hdPixels.height<=0) throw new Error(item.sourcePath+": active replacement requires positive hdPixels dimensions.");
  const assetPath=path.join(hdRoot,...item.hdPath.split("/"));
  if(!fs.existsSync(assetPath)) throw new Error("Missing active HD file: "+item.hdPath);
  const assetVersion=crypto.createHash("sha256").update(fs.readFileSync(assetPath)).digest("hex").slice(0,12);
  active.push({
    sourcePath,
    runtimeUrl:"/images/alhd/"+item.hdPath.replace(/^\/+/, "")+"?alhdv="+assetVersion,
    scale:item.scale,
    hdPixels:{width:item.hdPixels.width,height:item.hdPixels.height},
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true
  });
}

active.sort((a,b)=>a.sourcePath<b.sourcePath?-1:a.sourcePath>b.sourcePath?1:0);
const payload={schemaVersion:1,mode:"ASSET_ONLY",upstreamCommit:"90052162eb3ebda36c893e1eb4af643913c8f984",replacements:active};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,"window.__ALHD_MANIFEST__ = Object.freeze("+JSON.stringify(payload,null,2)+");\n","utf8");
console.log("Runtime manifest:",active.length,"active replacements ->",output);
