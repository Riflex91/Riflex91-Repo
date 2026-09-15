'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { CharacterRuntimeManager } = require('./runtime/CharacterRuntimeManager');
const { ALClientTransport } = require('./runtime/ALClientTransport');

function loadConfig() {
  const file = process.env.AIO_CLIENTLESS_CONFIG || path.join(process.cwd(), 'clientless.config.json');
  if (!fs.existsSync(file)) throw new Error(`CLIENTLESS_CONFIG_NOT_FOUND:${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  const config = loadConfig();
  if (!Array.isArray(config.characters) || !config.characters.length) throw new Error('CLIENTLESS_CHARACTERS_REQUIRED');
  const credentials = config.credentials || {};
  const manager = new CharacterRuntimeManager({
    transportFactory: ({ characterName, role }) => new ALClientTransport({
      credentials,
      characterName,
      role,
      region: config.region || 'EU',
      identifier: config.identifier || 'I'
    })
  });

  await manager.applySelection(config.characters);
  console.log(JSON.stringify({ event: 'SMARTPHONE_CLIENTLESS_READY', status: manager.status() }));

  const shutdown = async (signal) => {
    console.log(JSON.stringify({ event: 'SMARTPHONE_CLIENTLESS_STOPPING', signal }));
    await manager.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  setInterval(() => {
    console.log(JSON.stringify({ event: 'SMARTPHONE_CLIENTLESS_HEARTBEAT', at: Date.now(), status: manager.status() }));
  }, Math.max(5000, Number(config.heartbeatMs) || 15000)).unref();
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'SMARTPHONE_CLIENTLESS_FATAL', error: String(error && error.stack || error) }));
  process.exitCode = 1;
});
