import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const args=process.argv.slice(2);
const value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null;};
const input=value("--input");
const output=value("--output");
const scaleValue=value("--scale");
const scale=scaleValue===null?8:Number(scaleValue);

if(!input||!output||!Number.isInteger(scale)||scale<2||scale>8){
  console.error("Usage: node tools/build-nearest-png.mjs --input <png> --output <png> [--scale 2..8]");
  process.exit(2);
}

const signature=Buffer.from("89504e470d0a1a0a","hex");
const source=fs.readFileSync(input);
if(!source.subarray(0,8).equals(signature)) throw new Error("Input is not a PNG.");

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let k=0;k<8;k++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type,"ascii");
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  name.copy(out,4);
  data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([name,data])),8+data.length);
  return out;
}
function paeth(a,b,c){
  const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

const chunks=[];
let offset=8;
while(offset<source.length){
  if(offset+12>source.length) throw new Error("Truncated PNG chunk.");
  const length=source.readUInt32BE(offset);
  if(offset+12+length>source.length) throw new Error("Truncated PNG chunk data.");
  const type=source.subarray(offset+4,offset+8).toString("ascii");
  const data=source.subarray(offset+8,offset+8+length);
  chunks.push({type,data:Buffer.from(data)});
  offset+=12+length;
  if(type==="IEND") break;
}

const ihdr=chunks.find(c=>c.type==="IHDR")?.data;
if(!ihdr||ihdr.length!==13) throw new Error("PNG IHDR missing.");
const width=ihdr.readUInt32BE(0), height=ihdr.readUInt32BE(4);
const bitDepth=ihdr[8], colorType=ihdr[9], compression=ihdr[10], filter=ihdr[11], interlace=ihdr[12];
if(compression!==0||filter!==0||interlace!==0) throw new Error("Nearest terrain scaler requires standard compression/filter methods and non-interlaced PNG input.");

const indexed=colorType===3&&(bitDepth===4||bitDepth===8);
const rgba=colorType===6&&bitDepth===8;
if(!indexed&&!rgba) throw new Error("Nearest terrain scaler supports 4/8-bit indexed PNG and 8-bit RGBA PNG input.");
if(indexed&&!chunks.some(c=>c.type==="PLTE")) throw new Error("Indexed PNG requires PLTE.");

const channels=rgba?4:1;
const bitsPerPixel=bitDepth*channels;
const stride=Math.ceil(width*bitsPerPixel/8);
const filterBpp=Math.max(1,Math.ceil(bitsPerPixel/8));
const idat=Buffer.concat(chunks.filter(c=>c.type==="IDAT").map(c=>c.data));
const packed=zlib.inflateSync(idat);
if(packed.length!==(stride+1)*height) throw new Error("Unexpected PNG scanline size.");

const rows=[];
let previous=Buffer.alloc(stride);
for(let y=0;y<height;y++){
  const start=y*(stride+1);
  const filterType=packed[start];
  const filtered=packed.subarray(start+1,start+1+stride);
  const row=Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
    const a=x>=filterBpp?row[x-filterBpp]:0;
    const b=previous[x];
    const c=x>=filterBpp?previous[x-filterBpp]:0;
    let predictor=0;
    if(filterType===0) predictor=0;
    else if(filterType===1) predictor=a;
    else if(filterType===2) predictor=b;
    else if(filterType===3) predictor=Math.floor((a+b)/2);
    else if(filterType===4) predictor=paeth(a,b,c);
    else throw new Error("Unsupported PNG filter "+filterType);
    row[x]=(filtered[x]+predictor)&255;
  }
  rows.push(row);
  previous=row;
}

const outWidth=width*scale, outHeight=height*scale;
const outStride=Math.ceil(outWidth*bitsPerPixel/8);
const raw=Buffer.alloc((outStride+1)*outHeight);

function indexedSample(row,x){
  if(bitDepth===8) return row[x];
  const byte=row[x>>1];
  return x&1?byte&0x0f:(byte>>4)&0x0f;
}
function writeIndexedSample(row,x,value){
  if(bitDepth===8){row[x]=value;return;}
  const at=x>>1;
  if(x&1) row[at]=(row[at]&0xf0)|(value&0x0f);
  else row[at]=((value&0x0f)<<4)|(row[at]&0x0f);
}
function expandRow(row){
  const expanded=Buffer.alloc(outStride);
  if(indexed){
    for(let x=0;x<width;x++){
      const sample=indexedSample(row,x);
      for(let sx=0;sx<scale;sx++) writeIndexedSample(expanded,x*scale+sx,sample);
    }
    return expanded;
  }
  for(let x=0;x<width;x++){
    const pixel=row.subarray(x*4,x*4+4);
    for(let sx=0;sx<scale;sx++) pixel.copy(expanded,(x*scale+sx)*4);
  }
  return expanded;
}

for(let y=0;y<height;y++){
  const expanded=expandRow(rows[y]);
  for(let sy=0;sy<scale;sy++){
    const dst=(y*scale+sy)*(outStride+1);
    raw[dst]=0;
    expanded.copy(raw,dst+1);
  }
}

const newIHDR=Buffer.from(ihdr);
newIHDR.writeUInt32BE(outWidth,0);
newIHDR.writeUInt32BE(outHeight,4);
const keepTypes=new Set(["gAMA","cHRM","sRGB","iCCP","PLTE","tRNS","pHYs"]);
const out=[signature,chunk("IHDR",newIHDR)];
for(const c of chunks) if(keepTypes.has(c.type)) out.push(chunk(c.type,c.data));
out.push(chunk("IDAT",zlib.deflateSync(raw,{level:9})));
out.push(chunk("IEND",Buffer.alloc(0)));

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,Buffer.concat(out));
console.log(JSON.stringify({
  input:path.resolve(input),
  output:path.resolve(output),
  scale,
  png:{bitDepth,colorType,interlace},
  originalPixels:{width,height},
  hdPixels:{width:outWidth,height:outHeight},
  bytes:fs.statSync(output).size
}));
