import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const publisher=fs.readFileSync(path.join(root,"tools","publish-public-assets-s3.mjs"),"utf8");
const verifier=fs.readFileSync(path.join(root,"tools","verify-public-cdn.mjs"),"utf8");

test("public asset publisher is static-file-only and uses signed HTTPS PUTs",()=>{
  assert.match(publisher,/method:"PUT"/);
  assert.match(publisher,/AWS4-HMAC-SHA256/);
  assert.match(publisher,/S3-compatible endpoint must use HTTPS/);
  assert.match(publisher,/image\/png/);
  assert.doesNotMatch(publisher,/eval\(|new Function|child_process/);
});

test("public CDN verifier checks official-origin CORS and PNG content",()=>{
  assert.match(verifier,/Origin:"https:\/\/adventure\.land"/);
  assert.match(verifier,/access-control-allow-origin/);
  assert.match(verifier,/image\/png/);
  assert.match(verifier,/CDN byte count mismatch/);
});
