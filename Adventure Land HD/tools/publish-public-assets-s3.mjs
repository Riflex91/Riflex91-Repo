import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const dirArg=value("--dir");
const endpointArg=value("--endpoint")||process.env.ALHD_S3_ENDPOINT;
const bucket=value("--bucket")||process.env.ALHD_S3_BUCKET;
const prefix=(value("--prefix")||"").replace(/^\/+|\/+$/g,"");
const region=value("--region")||process.env.ALHD_S3_REGION||"auto";
const dryRun=args.includes("--dry-run");
const accessKey=process.env.ALHD_S3_ACCESS_KEY_ID;
const secretKey=process.env.ALHD_S3_SECRET_ACCESS_KEY;

if(!dirArg||!endpointArg||!bucket){
  console.error("Usage: node tools/publish-public-assets-s3.mjs --dir <cdn-dir> --endpoint <https://s3-endpoint> --bucket <bucket> [--prefix path] [--region auto] [--dry-run]");
  process.exit(2);
}
if(!dryRun&&(!accessKey||!secretKey)) throw new Error("ALHD_S3_ACCESS_KEY_ID and ALHD_S3_SECRET_ACCESS_KEY are required for publishing.");

const root=path.resolve(process.cwd(),dirArg);
const endpoint=new URL(endpointArg);
if(endpoint.protocol!=="https:") throw new Error("S3-compatible endpoint must use HTTPS.");
if(endpoint.search||endpoint.hash||endpoint.username||endpoint.password) throw new Error("S3 endpoint must not contain credentials, query parameters, or fragments.");

function listFiles(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...listFiles(full));
    else if(entry.isFile()) out.push(full);
  }
  return out;
}

function rfc3986(value){
  return encodeURIComponent(value).replace(/[!'()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase());
}
function keyPath(file){
  const relative=path.relative(root,file).split(path.sep).join("/");
  return [prefix,relative].filter(Boolean).join("/");
}
function canonicalUri(key){
  return "/"+[bucket,...key.split("/")].map(rfc3986).join("/");
}
function hmac(key,data,encoding){
  return crypto.createHmac("sha256",key).update(data,"utf8").digest(encoding);
}
function sha256(data,encoding="hex"){
  return crypto.createHash("sha256").update(data).digest(encoding);
}
function signingKey(dateStamp){
  const kDate=hmac(Buffer.from("AWS4"+secretKey,"utf8"),dateStamp);
  const kRegion=hmac(kDate,region);
  const kService=hmac(kRegion,"s3");
  return hmac(kService,"aws4_request");
}
function contentType(file){
  return path.extname(file).toLowerCase()===".png"?"image/png":"application/octet-stream";
}

async function upload(file){
  const key=keyPath(file);
  const body=fs.readFileSync(file);
  const payloadHash=sha256(body);
  const now=new Date();
  const amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,"");
  const dateStamp=amzDate.slice(0,8);
  const uri=canonicalUri(key);
  const target=new URL(endpoint.toString().replace(/\/$/,"")+uri);
  const cacheControl="public,max-age=31536000,immutable";
  const type=contentType(file);
  const canonicalHeaders=[
    "cache-control:"+cacheControl,
    "content-type:"+type,
    "host:"+target.host,
    "x-amz-content-sha256:"+payloadHash,
    "x-amz-date:"+amzDate
  ].join("\n")+"\n";
  const signedHeaders="cache-control;content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest=["PUT",uri,"",canonicalHeaders,signedHeaders,payloadHash].join("\n");
  const scope=dateStamp+"/"+region+"/s3/aws4_request";
  const stringToSign=["AWS4-HMAC-SHA256",amzDate,scope,sha256(canonicalRequest)].join("\n");
  const signature=hmac(signingKey(dateStamp),stringToSign,"hex");
  const authorization="AWS4-HMAC-SHA256 Credential="+accessKey+"/"+scope+", SignedHeaders="+signedHeaders+", Signature="+signature;

  if(dryRun){
    console.log("DRY_RUN",key,body.length,payloadHash);
    return;
  }

  const response=await fetch(target,{
    method:"PUT",
    headers:{
      "Authorization":authorization,
      "Cache-Control":cacheControl,
      "Content-Type":type,
      "x-amz-content-sha256":payloadHash,
      "x-amz-date":amzDate
    },
    body
  });
  if(!response.ok){
    const text=await response.text();
    throw new Error("Upload failed "+response.status+" "+response.statusText+" for "+key+": "+text.slice(0,500));
  }
  console.log("UPLOADED",key,body.length,payloadHash);
}

const files=listFiles(root).sort();
if(!files.length) throw new Error("No public assets found in "+root);
for(const file of files) await upload(file);
console.log(dryRun?"Public asset upload dry-run complete:":"Public assets uploaded:",files.length,"files to",bucket+"/"+prefix);
