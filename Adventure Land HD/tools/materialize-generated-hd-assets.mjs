import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {normalizeAssetPath} from "../lib/hd-contracts.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=value("--upstream");
if(!upstreamArg){
  console.error("Usage: node tools/materialize-generated-hd-assets.mjs --upstream <checkout>");
  process.exit(2);
}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);

const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
const generated=(manifest.replacements||[]).filter(item=>item?.generator);
for(const item of generated){
  const method=item.generator?.method;
  if(method!=="nearest-neighbor-png") throw new Error(item.sourcePath+": unsupported generator method "+method);
  const sourcePath=normalizeAssetPath(item.sourcePath);
  if(!sourcePath) throw new Error("Generated replacement requires a valid sourcePath.");
  const source=path.join(upstream,...sourcePath.split("/"));
  if(!fs.existsSync(source)) throw new Error(item.sourcePath+": generator source missing");
  const output=path.join(root,"hd-assets",...String(item.hdPath||"").split("/"));
  execFileSync(process.execPath,[
    path.join(root,"tools","build-nearest-png.mjs"),
    "--input",source,
    "--output",output,
    "--scale",String(item.scale)
  ],{stdio:"inherit"});
  const actual=crypto.createHash("sha256").update(fs.readFileSync(output)).digest("hex");
  const expected=item.generator?.expectedSha256;
  if(typeof expected!=="string"||!expected) throw new Error(item.sourcePath+": generator expectedSha256 missing");
  if(actual!==expected) throw new Error(item.sourcePath+": generated SHA256 mismatch: "+actual+" != "+expected);
}
console.log("Generated HD assets materialized:",generated.length);
