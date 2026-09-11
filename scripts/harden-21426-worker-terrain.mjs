#!/usr/bin/env node
import fs from 'node:fs';
const p='cloudflare-dashboard/src/worker.js';
let s=fs.readFileSync(p,'utf8');
const start=s.indexOf('function cleanTerrain(input){');
const end=s.indexOf('\nfunction cleanLearningFeed',start);
if(start<0||end<0)throw new Error('cleanTerrain boundaries missing');
const fn=`function cleanTerrain(input){
  if(!input||typeof input!=="object")return null;
  const vector=input.v&&typeof input.v==="object"?{x:cleanTerrainRows(input.v.x,420,3),y:cleanTerrainRows(input.v.y,420,3)}:null;
  const base={map:text(input.map,80),source:text(input.source,160),omitted:Boolean(input.omitted),bytes:number(input.bytes),fallback:text(input.fallback,80),v:vector,encoding:text(input.encoding,32)};
  if(input.omitted)return base;
  const sets={};Object.keys(input.s&&typeof input.s==="object"?input.s:{}).slice(0,48).forEach(k=>{sets[text(k,80)]=text(input.s[k],500);});
  const groups=Array.isArray(input.g)?input.g.slice(0,64).map(g=>cleanTerrainRows(g,240,6)).filter(g=>g.length):[];
  const packed=typeof input.pc==="string"?input.pc.slice(0,120000):"";
  const out=Object.assign({},base,{d:input.d==null?null:number(input.d),t:cleanTerrainRows(input.t,640,6),p:cleanTerrainRows(input.p,2600,6),pc:packed,g:groups,a:cleanTerrainRows(input.a,500,6),s:sets});
  try{if(JSON.stringify(out).length>118000)return Object.assign({},base,{omitted:true,fallback:base.fallback||"worker-size-guard"});}catch{}
  return out;
}`;
s=s.slice(0,start)+fn+s.slice(end);
fs.writeFileSync(p,s);
console.log('Worker now preserves base36 packed terrain up to the v2.14.26 payload guard');
