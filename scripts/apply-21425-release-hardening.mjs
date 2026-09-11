#!/usr/bin/env node
import fs from 'node:fs';

const workerPath='cloudflare-dashboard/src/worker.js';
let w=fs.readFileSync(workerPath,'utf8');
w=w.replaceAll('2.14.24','2.14.25');
fs.writeFileSync(workerPath,w);

const verifyPath='scripts/verify-release.js';
let v=fs.readFileSync(verifyPath,'utf8');
const a='  ok(version.version === "2.14.24", "prepared release must be 2.14.24");\n  ok(version.dashboardVersion === "2.14.24", "dashboard version must be 2.14.24 for layered brain/dashboard release");';
const b='  const pv=String(version.version||"0.0.0").split(".").map(Number);\n  ok(pv[0]===2 && pv[1]===14 && pv[2]>=24, "prepared release must be >= 2.14.24");\n  ok(version.dashboardVersion === version.version, "dashboard version must equal release version");';
if(!v.includes(a))throw new Error('verify-release exact-version block not found');
v=v.replace(a,b);
fs.writeFileSync(verifyPath,v);
console.log('Applied v2.14.25 worker/release-verifier hardening');
