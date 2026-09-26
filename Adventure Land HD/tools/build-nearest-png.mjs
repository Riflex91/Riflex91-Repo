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

const chunks=[];
let offset=8;
while(offset<source.length){
  const length=source.readUInt32BE(offset);
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
if(bitDepth!==8||colorType!==3||compression!==0||filter!==0||interlace!==0){
  throw new Error("Nearest terrain pilot currently requires 8-bit indexed, non-interlaced PNG input.");
}
const palette=chunks.find(c=>c.type==="PLTE");
if(!palette) throw new Error("Indexed PNG requires PLTE.");
const idat=Buffer.concat(chunks.filter(c=>c.type==="IDAT").map(c=>c.data));
const packed=zlib.inflateSync(idat);
const stride=width;
if(packed.length!==(stride+1)*height) throw new Error("Unexpected indexed PNG scanline size.");

const rows=[];
let previous=Buffer.alloc(stride);
for(let y=0;y<height;y++){
  const start=y*(stride+1);
  const filterType=packed[start];
  const filtered=packed.subarray(start+1,start+1+stride);
  const row=Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
    const a=x?row[x-1]:0;
    const b=previous[x];
    const c=x?previous[x-1]:0;
    let predictor=0;
    if(filterType===0) predictor=0;
    else if(filterType===1) predictor=a;
    else if(filterType===2) predictor=b;
    else if(filterType===3) predictor=Math.floor((a+b)/2);
    else if(filterType===4){
      const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
      predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;
    }else throw new Error("Unsupported PNG filter "+filterType);
    row[x]=(filtered[x]+predictor)&255;
  }
  rows.push(row);
  previous=row;
}

const outWidth=width*scale, outHeight=height*scale;
const raw=Buffer.alloc((outWidth+1)*outHeight);
for(let y=0;y<height;y++){
  const expanded=Buffer.alloc(outWidth);
  for(let x=0;x<width;x++) expanded.fill(rows[y][x],x*scale,(x+1)*scale);
  for(let sy=0;sy<scale;sy++){
    const dst=(y*scale+sy)*(outWidth+1);
    raw[dst]=0;
    expanded.copy(raw,dst+1);
  }
}

const newIHDR=Buffer.from(ihdr);
newIHDR.writeUInt32BE(outWidth,0);
newIHDR.writeUInt32BE(outHeight,4);
const keepTypes=new Set(["gAMA","cHRM","sRGB","iCCP","PLTE","tRNS","pHYs"]);
const out=[signature,chunk("IHDR",newIHDR)];
for(const c of chunks){
  if(keepTypes.has(c.type)) out.push(chunk(c.type,c.data));
}
out.push(chunk("IDAT",zlib.deflateSync(raw,{level:9})));
out.push(chunk("IEND",Buffer.alloc(0)));

fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,Buffer.concat(out));
console.log(JSON.stringify({
  input:path.resolve(input),
  output:path.resolve(output),
  scale,
  originalPixels:{width,height},
  hdPixels:{width:outWidth,height:outHeight},
  bytes:fs.statSync(output).size
}));
