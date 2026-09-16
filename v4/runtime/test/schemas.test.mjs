import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schemaFiles = [
  'domain-event.schema.json',
  'incident.schema.json',
  'archive-manifest.schema.json',
  'development-task.schema.json'
];

for (const filename of schemaFiles) {
  test(`${filename} is parseable and has a stable schema id`, async () => {
    const content = await readFile(new URL(`../../schemas/${filename}`, import.meta.url), 'utf8');
    const schema = JSON.parse(content);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.match(schema.$id, /^https:\/\/aio-v4\.invalid\/schemas\//);
    assert.equal(schema.type, 'object');
  });
}
