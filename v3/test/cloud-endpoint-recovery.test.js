'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha28BrainCloud } = require('../src/reliability/alpha28-brain-cloud');
const { ACTIVE_CLOUDFLARE_BASE_URL } = require('../src/control/cloud-free-tier-budget');

function control(values = {}) {
  return {
    get(key, fallback) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback; }
  };
}

function runtimeWithCloud(source, baseUrl) {
  const cloudControlPlane = {
    credentialSource: source,
    credentials: { baseUrl, writeKey: 'present' },
    configure(input) {
      if (input.baseUrl != null) this.credentials.baseUrl = input.baseUrl;
      this.credentialSource = 'runtime-configure';
      return this.status();
    },
    status() {
      return { ready: true, configured: { baseUrl: this.credentials.baseUrl } };
    }
  };
  return {
    cloudControlPlane,
    controlPlane: control({ 'brain.mode': 'canary', 'cloud.enabled': true }),
    alpha25ControlCenterBrain: { patchSettings: () => ({ changed: [] }) },
    planner: null,
    strategicBrainV2: null
  };
}

test('Alpha28 repairs stale persisted Cloudflare worker endpoints to the canonical worker URL', () => {
  const runtime = runtimeWithCloud('local-v3-storage', 'https://old-dashboard.example.invalid');
  const stats = { brainCloudSettingPatches: 0 };
  const module = new Alpha28BrainCloud(runtime, { now: () => 1, log: null, stats });

  assert.equal(module.ensureSettings(), true);
  assert.equal(runtime.cloudControlPlane.credentials.baseUrl, ACTIVE_CLOUDFLARE_BASE_URL);
  assert.equal(module.status().cloudEndpointCanonical, true);
  assert.equal(module.status().cloudEndpointRepaired, true);
  assert.equal(stats.cloudEndpointRepairs, 1);
});

test('Alpha28 does not overwrite an explicitly configured custom cloud endpoint', () => {
  const custom = 'https://dashboard.example.com';
  const runtime = runtimeWithCloud('global-v3-config', custom);
  const stats = { brainCloudSettingPatches: 0 };
  const module = new Alpha28BrainCloud(runtime, { now: () => 1, log: null, stats });

  assert.equal(module.ensureSettings(), true);
  assert.equal(runtime.cloudControlPlane.credentials.baseUrl, custom);
  assert.equal(module.status().cloudEndpointRepaired, false);
  assert.equal(stats.cloudEndpointRepairs, undefined);
});
