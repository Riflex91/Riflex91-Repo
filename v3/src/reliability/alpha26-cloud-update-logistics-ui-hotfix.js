'use strict';

const { RELEASE_VERSION } = require('../release-version');
const { installSafeAutoUpdater } = require('../ops/safe-auto-updater');

const ALPHA26_MODE = 'alpha26-cloud-update-logistics-ui-v1';

function finite(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hasOutboundTransferWork(logistics, snapshot) {
  if (!logistics || !snapshot || !snapshot.character) return false;
  const c = snapshot.character;
  const gold = Math.max(0, finite(c.gold, 0));
  const reserve = Math.max(0, finite(logistics.config && logistics.config.farmerGoldReserve, 0));
  if (gold > reserve) return true;
  const inventory = Array.isArray(c.inventory) ? c.inventory : [];
  if (typeof logistics._safeLootDescriptor !== 'function') return false;
  for (const item of inventory) {
    if (!item) continue;
    try {
      const safe = logistics._safeLootDescriptor(item);
      if (safe && safe.ok) return true;
    } catch (_) {}
  }
  return false;
}

function scheduleGuiCollapsedStart(runtime, stats = null) {
  const root = runtime && runtime.root || globalThis;
  const setTimer = root && root.setTimeout || (typeof setTimeout === 'function' ? setTimeout : null);
  if (!setTimer || root.__AIO_V3_GUI_COLLAPSE_SCHEDULED) return false;
  root.__AIO_V3_GUI_COLLAPSE_SCHEDULED = true;
  const tryCollapse = () => {
    let ui = null;
    try { ui = root && root.AIO_V3 && root.AIO_V3.__debugUI || null; } catch (_) {}
    if (!ui) return false;
    if (!ui.__alpha26CollapsedShowPatched && typeof ui.show === 'function') {
      const baseShow = ui.show.bind(ui);
      ui.show = (...args) => {
        const result = baseShow(...args);
        try {
          if (typeof ui._setMinimized === 'function') ui._setMinimized(true);
          ui.minimized = true;
        } catch (_) {}
        return result;
      };
      ui.__alpha26CollapsedShowPatched = true;
    }
    try {
      if (ui.container && typeof ui._setMinimized === 'function') ui._setMinimized(true);
      ui.minimized = true;
      if (stats) stats.guiCollapseApplies += 1;
    } catch (_) {}
    return true;
  };
  for (const delay of [0, 25, 100, 400, 1200]) {
    try { setTimer(tryCollapse, delay); } catch (_) {}
  }
  return true;
}

function installCloudTransportAuthority(runtime, stats) {
  const cloud = runtime && runtime.cloudControlPlane;
  const control = runtime && runtime.controlPlane;
  const alpha25 = runtime && runtime.alpha25ControlCenterBrain;
  if (!cloud || !control) return false;

  if (!control.__alpha26CloudTransportLocalAuthority && typeof control.patch === 'function') {
    const basePatch = control.patch.bind(control);
    control.patch = (input = {}, meta = {}) => {
      let next = input;
      if (String(meta && meta.source || '') === 'cloudflare-d1' && Object.prototype.hasOwnProperty.call(input || {}, 'cloud.enabled')) {
        next = { ...input };
        delete next['cloud.enabled'];
        stats.remoteCloudTransportOverridesIgnored += 1;
      }
      return basePatch(next, meta);
    };
    control.__alpha26CloudTransportLocalAuthority = true;
  }

  let ready = false;
  try { ready = !!(cloud.status && cloud.status().ready); } catch (_) {}
  cloud.autoEnableSuggested = ready;
  if (ready && control.get('cloud.enabled', false) !== true) {
    if (alpha25 && typeof alpha25.patchSettings === 'function') alpha25.patchSettings({ 'cloud.enabled': true }, 'alpha26-valid-cloud-credentials');
    else control.patch({ 'cloud.enabled': true }, { source: 'alpha26-valid-cloud-credentials' });
    stats.cloudAutoEnables += 1;
  }
  return true;
}

function installDemandDrivenRendezvous(runtime, stats) {
  const logistics = runtime && runtime.controlledPartyLogistics;
  if (!logistics || logistics.__alpha26DemandDrivenRendezvous || typeof logistics._send !== 'function') return false;
  const baseSend = logistics._send.bind(logistics);
  logistics._send = (target, action, data = {}) => {
    if (String(action || '') === 'RENDEZVOUS' && !logistics._isMerchant()) {
      let snapshot = null;
      try { snapshot = logistics.adapter && typeof logistics.adapter.snapshot === 'function' ? logistics.adapter.snapshot() : runtime.lastSnapshot; } catch (_) {}
      if (!hasOutboundTransferWork(logistics, snapshot)) {
        stats.emptyRendezvousBlocks += 1;
        logistics.lastDecision = { at: logistics.now(), action: 'HOLD', reason: 'NO_OUTBOUND_TRANSFER_WORK' };
        return Promise.resolve({ delivered: false, reason: 'NO_OUTBOUND_TRANSFER_WORK' });
      }
    }
    return baseSend(target, action, data);
  };
  logistics.__alpha26DemandDrivenRendezvous = true;
  return true;
}

class Alpha26CloudUpdateLogisticsUiHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.installedAt = this.now();
    this.lastUpdaterCycleAt = 0;
    this.updaterBusy = false;
    this.stats = {
      cloudAutoEnables: 0,
      remoteCloudTransportOverridesIgnored: 0,
      emptyRendezvousBlocks: 0,
      guiCollapseApplies: 0,
      updaterCycles: 0,
      updaterErrors: 0
    };
    scheduleGuiCollapsedStart(runtime, this.stats);
    this.cloudAuthorityInstalled = installCloudTransportAuthority(runtime, this.stats);
    this.rendezvousGuardInstalled = installDemandDrivenRendezvous(runtime, this.stats);
    this.updater = installSafeAutoUpdater(runtime, { ...options, localVersion: RELEASE_VERSION });
  }

  beforeTick() {
    if (!this.cloudAuthorityInstalled) this.cloudAuthorityInstalled = installCloudTransportAuthority(this.runtime, this.stats);
    if (!this.rendezvousGuardInstalled) this.rendezvousGuardInstalled = installDemandDrivenRendezvous(this.runtime, this.stats);
    if (!this.updater || this.updaterBusy || this.now() - this.lastUpdaterCycleAt < 1000) return false;
    this.lastUpdaterCycleAt = this.now();
    this.updaterBusy = true;
    this.stats.updaterCycles += 1;
    Promise.resolve(this.updater.cycle()).catch((error) => {
      this.stats.updaterErrors += 1;
      if (this.log && typeof this.log.emit === 'function') {
        this.log.emit({ component: 'alpha26-release-manager', event: 'SAFE_AUTO_UPDATE_CYCLE_FAILED', severity: 'warn', reason: String(error && error.message || error).slice(0, 240) });
      }
    }).finally(() => { this.updaterBusy = false; });
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: ALPHA26_MODE,
      installedAt: this.installedAt,
      cloudAuthorityInstalled: this.cloudAuthorityInstalled,
      rendezvousGuardInstalled: this.rendezvousGuardInstalled,
      updater: this.updater && this.updater.status ? this.updater.status() : null,
      stats: { ...this.stats },
      policies: {
        validStoredCloudCredentialsAutoEnable: true,
        remoteD1CannotDisableCloudTransport: true,
        cloudTransportStillLocallyDisableable: true,
        rendezvousRequiresRealTransferWork: true,
        guiStartsCollapsed: true,
        autoUpdateChecksGitHubMain: true,
        autoUpdateApplyRequiresStableSafety: true,
        autoUpdateNeverWidensCharacterAuthority: true,
        dangerousContentStillAbsolute: true,
        commandCharacterAuthorityWidened: false
      }
    };
  }
}

function installAlpha26CloudUpdateLogisticsUiHotfix(runtime, options = {}) {
  if (runtime.alpha26CloudUpdateLogisticsUiHotfix) return runtime.alpha26CloudUpdateLogisticsUiHotfix;
  const module = new Alpha26CloudUpdateLogisticsUiHotfix(runtime, options);
  runtime.alpha26CloudUpdateLogisticsUiHotfix = module;
  return module;
}

module.exports = {
  ALPHA26_MODE,
  Alpha26CloudUpdateLogisticsUiHotfix,
  installAlpha26CloudUpdateLogisticsUiHotfix,
  installCloudTransportAuthority,
  installDemandDrivenRendezvous,
  scheduleGuiCollapsedStart,
  hasOutboundTransferWork
};
