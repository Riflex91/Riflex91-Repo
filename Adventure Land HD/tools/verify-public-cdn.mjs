import fs from "node:fs";

const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const manifestArg=value("--cdn-manifest");
const sampleCount=Math.max(1,Number(value("--sample-count")||3));
if(!manifestArg){
  console.error("Usage: node tools/verify-public-cdn.mjs --cdn-manifest <json> [--sample-count 3]");
  process.exit(2);
}

const manifest=JSON.parse(fs.readFileSync(manifestArg,"utf8"));
if(!String(manifest.assetBaseUrl||"").startsWith("https://")) throw new Error("CDN manifest requires HTTPS assetBaseUrl.");
const rows=manifest.assets||[];
if(rows.length!==48) throw new Error("CDN manifest must describe exactly 48 assets.");

function webPath(value){
  return String(value||"").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
const samples=[];
for(let i=0;i<Math.min(sampleCount,rows.length);i++){
  const index=Math.floor(i*(rows.length-1)/Math.max(1,Math.min(sampleCount,rows.length)-1));
  if(!samples.includes(rows[index])) samples.push(rows[index]);
}

for(const row of samples){
  const url=manifest.assetBaseUrl.replace(/\/$/,"")+"/"+webPath(row.hdPath)+"?alhdv="+row.sha256.slice(0,12);
  const response=await fetch(url,{headers:{Origin:"https://adventure.land"},redirect:"follow"});
  if(!response.ok) throw new Error(row.hdPath+": CDN returned "+response.status);
  const type=String(response.headers.get("content-type")||"").toLowerCase();
  if(!type.startsWith("image/png")) throw new Error(row.hdPath+": CDN Content-Type is not image/png: "+type);
  const cors=String(response.headers.get("access-control-allow-origin")||"");
  if(cors!=="*"&&cors!=="https://adventure.land") throw new Error(row.hdPath+": CDN CORS must allow https://adventure.land or *");
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length!==row.bytes) throw new Error(row.hdPath+": CDN byte count mismatch");
  console.log("CDN_OK",row.hdPath,bytes.length,cors);
}
console.log("Adventure Land HD public CDN verified:",samples.length,"sample assets reachable with browser-compatible CORS.");
