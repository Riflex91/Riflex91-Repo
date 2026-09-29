import test from 'node:test';
import assert from 'node:assert/strict';
import freeTierWorker from '../src/worker-free-tier.js';
import {
  parseAlhdPublicAssetRead,
  isAlhdPublicAssetRead,
  handleAlhdPublicAsset
} from '../src/alhd-public-asset.js';

test('ALHD public asset path is versioned, PNG-only and maps into isolated R2 prefix',()=>{
  const req=new Request('https://example.test/alhd/releases/0.1.0/map/doors@8x.png?alhdv=abc');
  const parsed=parseAlhdPublicAssetRead(req);
  assert.equal(parsed.version,'0.1.0');
  assert.equal(parsed.assetPath,'map/doors@8x.png');
  assert.equal(parsed.objectKey,'releases/alhd/0.1.0/map/doors@8x.png');
  assert.equal(isAlhdPublicAssetRead(req),true);
  assert.equal(isAlhdPublicAssetRead(new Request('https://example.test/alhd/releases/0.1.0/code.js')),false);
  assert.equal(isAlhdPublicAssetRead(new Request('https://example.test/alhd/releases/latest/map/a.png')),false);
  assert.equal(isAlhdPublicAssetRead(new Request('https://example.test/alhd/releases/0.1.0/../a.png')),false);
});

test('ALHD public asset serves exact R2 PNG with immutable CORS headers',async()=>{
  const seen=[];
  const env={LOG_ARCHIVE:{async get(key){seen.push(key);return {body:new Uint8Array([137,80,78,71]),etag:'alhd-etag'};}}};
  const response=await handleAlhdPublicAsset(new Request('https://example.test/alhd/releases/0.1.0/map/doors@8x.png',{headers:{origin:'https://adventure.land'}}),env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/png');
  assert.equal(response.headers.get('access-control-allow-origin'),'*');
  assert.match(response.headers.get('cache-control')||'',/immutable/);
  assert.equal(response.headers.get('x-alhd-release-version'),'0.1.0');
  assert.deepEqual(seen,['releases/alhd/0.1.0/map/doors@8x.png']);
});

test('top-level Worker routes ALHD assets directly without archive quota wrapper',async()=>{
  const seen=[];
  const env={LOG_ARCHIVE:{async get(key){seen.push(key);return {body:'png-bytes',etag:'e'};}}};
  const response=await freeTierWorker.fetch(new Request('https://example.test/alhd/releases/0.1.0/map/doors@8x.png'),env,{waitUntil(){}});
  assert.equal(response.status,200);
  assert.equal(await response.text(),'png-bytes');
  assert.deepEqual(seen,['releases/alhd/0.1.0/map/doors@8x.png']);
});

test('missing ALHD public asset fails closed with CORS',async()=>{
  const response=await handleAlhdPublicAsset(new Request('https://example.test/alhd/releases/0.1.0/map/missing.png'),{LOG_ARCHIVE:{async get(){return null;}}});
  assert.equal(response.status,404);
  assert.equal(response.headers.get('access-control-allow-origin'),'*');
  assert.equal(response.headers.get('x-alhd-release-version'),'0.1.0');
});
