import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTER_INVENTORY_STYLE,
  withCharacterInventoryPresentation
} from '../src/worker-free-tier.js';

test('character inventory presentation removes internal scrolling and keeps seven responsive columns', () => {
  assert.match(CHARACTER_INVENTORY_STYLE, /\.char-details \.al-panel\{overflow:hidden!important/);
  assert.match(CHARACTER_INVENTORY_STYLE, /grid-template-columns:repeat\(7,minmax\(0,1fr\)\)!important/);
  assert.match(CHARACTER_INVENTORY_STYLE, /aspect-ratio:1\/1/);
});

test('dashboard root allows Adventure Land sprite sheets including subdomains and injects inventory presentation fix', async () => {
  const request = new Request('https://dashboard.example/');
  const response = new Response('<!doctype html><html><head></head><body></body></html>', {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'self'; img-src 'self' data:;"
    }
  });

  const patched = await withCharacterInventoryPresentation(request, response);
  const html = await patched.text();
  const csp = patched.headers.get('content-security-policy') || '';

  assert.match(csp, /img-src 'self' data: https:\/\/adventure\.land https:\/\/www\.adventure\.land https:\/\/\*\.adventure\.land;/);
  assert.match(html, /character-inventory-presentation-fix/);
  assert.match(html, /al-inventory-grid/);
});