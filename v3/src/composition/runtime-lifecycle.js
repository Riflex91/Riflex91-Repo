'use strict';

const RUNTIME_LIFECYCLE_METHODS = Object.freeze([
  'start',
  'stop',
  'tick',
  'setMode',
  'status',
  'exportDiagnostics'
]);

function assertRuntimeLifecycle(runtime) {
  if (!runtime || typeof runtime !== 'object') throw new TypeError('runtime object required');
  const missing = RUNTIME_LIFECYCLE_METHODS.filter((name) => typeof runtime[name] !== 'function');
  if (missing.length) throw new Error(`runtime lifecycle incomplete: ${missing.join(', ')}`);
  return true;
}

module.exports = { RUNTIME_LIFECYCLE_METHODS, assertRuntimeLifecycle };
