'use strict';

const CLOUD_PRESENCE_DECOUPLING_MODE = 'cloud-presence-decoupling-v1';

function finite(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function installCloudPresenceDecoupling(runtime) {
  if (!runtime || !runtime.cloudControlPlane) return null;
  if (runtime.cloudPresenceDecoupling && runtime.cloudPresenceDecoupling.mode === CLOUD_PRESENCE_DECOUPLING_MODE) {
    return runtime.cloudPresenceDecoupling;
  }

  const cloud = runtime.cloudControlPlane;
  const baseCycle = cloud.cycle.bind(cloud);

  const state = {
    mode: CLOUD_PRESENCE_DECOUPLING_MODE,
    installedAt: typeof runtime.now === 'function' ? runtime.now() : Date.now(),
    minRuntimePushMs: 15000,
    status: () => ({
      mode: CLOUD_PRESENCE_DECOUPLING_MODE,
      installedAt: state.installedAt,
      ready: !!(cloud.credentials && cloud.credentials.baseUrl && cloud.credentials.writeKey && cloud.fetchFn),
      controlPlaneEnabled: !!(cloud.control && cloud.control.get && cloud.control.get('cloud.enabled', false)),
      lastRuntimePushAt: finite(cloud.lastRuntimePushAt, 0),
      lastSuccessAt: finite(cloud.lastSuccessAt, 0),
      lastError: cloud.lastError || null
    })
  };

  cloud.cycle = async (...args) => {
    const controlEnabled = !!(cloud.control && cloud.control.get && cloud.control.get('cloud.enabled', false));
    if (controlEnabled) return baseCycle(...args);

    const ready = !!(cloud.credentials && cloud.credentials.baseUrl && cloud.credentials.writeKey && cloud.fetchFn);
    if (cloud.busy || !ready) return false;

    cloud.busy = true;
    try {
      const now = typeof cloud.now === 'function' ? cloud.now() : Date.now();
      const configuredPushMs = cloud.control && cloud.control.get ? cloud.control.get('cloud.runtimePushMs', 15000) : 15000;
      const pushMs = Math.max(15000, finite(configuredPushMs, 15000));
      if (now - finite(cloud.lastRuntimePushAt, 0) >= pushMs) await cloud.pushRuntime();
      cloud.lastError = null;
      return true;
    } catch (error) {
      if (cloud.stats) cloud.stats.failures = finite(cloud.stats.failures, 0) + 1;
      cloud.lastError = {
        at: typeof cloud.now === 'function' ? cloud.now() : Date.now(),
        message: String(error && error.message || error || 'unknown').slice(0, 300)
      };
      try {
        if (runtime.log && typeof runtime.log.emit === 'function') {
          runtime.log.emit({
            component: 'cloud-presence',
            event: 'CLOUD_PRESENCE_CYCLE_FAILED',
            severity: 'warn',
            reason: cloud.lastError.message,
            data: { localSafetyUnaffected: true }
          });
        }
      } catch (_) {}
      return false;
    } finally {
      cloud.busy = false;
    }
  };

  runtime.cloudPresenceDecoupling = state;
  try {
    if (runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({
        component: 'cloud-presence',
        event: 'CLOUD_PRESENCE_DECOUPLING_INSTALLED',
        data: { mode: CLOUD_PRESENCE_DECOUPLING_MODE, minRuntimePushMs: 15000 }
      });
    }
  } catch (_) {}

  return state;
}

module.exports = { CLOUD_PRESENCE_DECOUPLING_MODE, installCloudPresenceDecoupling };
