'use strict';

const {
  ALERT_SECRET_ENV,
  createWindowsCriticalAlertTransports,
  canaryWindowsCriticalAlertRoutes
} = require('./windows-alerting');

async function main(env = process.env) {
  const raw = String(env[ALERT_SECRET_ENV] || '');
  if (!raw) throw new Error('WINDOWS_ALERT_SECRETS_REQUIRED');
  const transports = createWindowsCriticalAlertTransports(raw);
  const result = await canaryWindowsCriticalAlertRoutes(transports);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(String(error && error.message || error || 'WINDOWS_ALERT_CANARY_FAILED').slice(0, 220) + '\n');
    process.exitCode = 1;
  });
}

module.exports = { main };
