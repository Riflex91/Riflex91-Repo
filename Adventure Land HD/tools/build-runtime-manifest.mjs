import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasResolutionSuffix } from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const output=path.resolve(process.cwd(),val("--output")||path.join(root,"runtime","adventure-land-hd-manifest.js"));
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const active=[];

for(const item of manifest.replacements||[]){
  if(item.state!=="active") continue;
  if(typeof item.sourcePath!=="string"||typeof item.hdPath!=="string") throw new Error("Active replacement requires sourcePath and hdPath.");
  if(!hasResolutionSuffix(item.hdPath,item.scale)) throw new Error(item.sourcePath+": hdPath must contain @"+item.scale+"x before the extension.");
  active.push({
    sourcePath:item.sourcePath.replace(/^\/+/, ""),
    runtimeUrl:"/images/alhd/"+item.hdPath.replace(/^\/+/, ""),
    scale:item.scale,
    state:"active",
    preserveLogicalSize:true,
    originalFallback:true
  });
}

active.sort((a,b)=>a.sourcePath.localeCompare(b.sourcePath));
const payload={schemaVersion:1,mode:"ASSET_ONLY",upstreamCommit:"90052162eb3ebda36c893e1eb4af643913c8f984",replacements:active};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,"window.__ALHD_MANIFEST__ = Object.freeze("+JSON.stringify(payload,null,2)+");\n","utf8");
console.log("Runtime manifest:",active.length,"active replacements ->",output);
