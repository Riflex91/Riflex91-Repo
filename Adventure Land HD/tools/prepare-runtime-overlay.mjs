import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const val=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const upstreamArg=val("--upstream");
const checkOnly=args.includes("--check-only");
if(!upstreamArg){console.error("Usage: node tools/prepare-runtime-overlay.mjs --upstream <checkout> [--check-only]");process.exit(2);}

const upstream=path.resolve(process.cwd(),upstreamArg);
const lock=JSON.parse(fs.readFileSync(path.join(root,"UPSTREAM.lock.json"),"utf8"));
const head=execFileSync("git",["-C",upstream,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(head!==lock.commit) throw new Error("Wrong upstream commit: "+head);

const indexPath=path.join(upstream,"htmls","index.html");
const functionsPath=path.join(upstream,"js","functions.js");
const pixiPath=path.join(upstream,"js","pixi","4.8.2-roundpixels","pixi.js");
const index=fs.readFileSync(indexPath,"utf8");
const functionsSource=fs.readFileSync(functionsPath,"utf8");
const pixiSource=fs.readFileSync(pixiPath,"utf8");

const anchor='<script src="/data.js?v={{domain.v}}&amp;cache=1"></script>';
const count=index.split(anchor).length-1;
if(count!==1) throw new Error("Expected exactly one Adventure Land data.js injection anchor, found "+count);
const urlFactoryStart=functionsSource.indexOf("function url_factory(url)");
if(urlFactoryStart<0) throw new Error("Pinned url_factory(url) not found.");
const urlFactory=functionsSource.slice(urlFactoryStart,urlFactoryStart+1800);
if(!urlFactory.includes("return url;")) throw new Error("url_factory no longer proves transparent browser fallback.");
if(!pixiSource.includes("getResolutionOfUrl")) throw new Error("Pinned Pixi bundle no longer exposes URL resolution detection.");
if(!pixiSource.includes("RETINA_PREFIX")) throw new Error("Pinned Pixi bundle no longer contains retina URL matching.");

console.log("Phase 3 target verified: data.js anchor, transparent url_factory, Pixi URL-resolution support.");

if(checkOnly) process.exit(0);

const dirtyBefore=execFileSync("git",["-C",upstream,"status","--porcelain"],{encoding:"utf8"}).trim();
if(dirtyBefore) throw new Error("Upstream checkout must be clean before applying the HD overlay.");

const generatedManifest=path.join(root,"runtime",".generated-manifest.js");
execFileSync(process.execPath,[path.join(root,"tools","build-runtime-manifest.mjs"),"--output",generatedManifest],{stdio:"inherit"});

const manifestTarget=path.join(upstream,"js","adventure-land-hd-manifest.js");
const bootstrapTarget=path.join(upstream,"js","adventure-land-hd-bootstrap.js");
const manifestVersion=crypto.createHash("sha256").update(fs.readFileSync(generatedManifest)).digest("hex").slice(0,12);
fs.copyFileSync(generatedManifest,manifestTarget);
fs.copyFileSync(path.join(root,"runtime","adventure-land-hd-bootstrap.js"),bootstrapTarget);
fs.unlinkSync(generatedManifest);

const injection=anchor+'\n\t\t<script src="/js/adventure-land-hd-manifest.js?alhdv='+manifestVersion+'"></script>\n\t\t<script src="/js/adventure-land-hd-bootstrap.js"></script>';
fs.writeFileSync(indexPath,index.replace(anchor,injection),"utf8");

const hdManifest=JSON.parse(fs.readFileSync(path.join(root,"manifests","hd-assets.json"),"utf8"));
for(const item of hdManifest.replacements||[]){
  if(item.state!=="active") continue;
  const source=path.join(root,"hd-assets",...item.hdPath.split("/"));
  if(!fs.existsSync(source)) throw new Error("Missing active HD file: "+item.hdPath);
  const target=path.join(upstream,"images","alhd",...item.hdPath.split("/"));
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(source,target);
}

console.log("Adventure Land HD presentation overlay applied to local pinned checkout.");
