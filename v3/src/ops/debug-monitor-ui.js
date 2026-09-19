'use strict';

const { OperatorRunControl } = require('./operator-run-control');
const { CombatMode, COMBAT_MODE_LABELS } = require('../autonomy/combat-modes');

function safeText(value) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch (_) { return String(value); }
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

class DebugMonitorUI {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.monitor = options.monitor;
    this.log = options.log || null;
    this.refreshMs = Math.max(500, Math.min(10000, Number(options.refreshMs) || 1000));
    this.containerId = options.containerId || 'aio-v3-session-monitor';
    this.minWidth = Math.max(280, Math.min(700, Number(options.minWidth) || 340));
    this.minHeight = Math.max(180, Math.min(600, Number(options.minHeight) || 240));
    this.container = null;
    this.header = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.runButton = null;
    this.skillsButton = null;
    this.skillsPanel = null;
    this.skillsPanelOpen = false;
    this.fallbackArea = null;
    this.resizeHandle = null;
    this.timer = null;
    this.minimized = false;
    this.lastCopy = null;
    this.lastRunControlError = null;
    this.documentScope = 'none';
    this._interactionCleanup = null;
    this._expandedLayout = null;
    this.runControl = options.runControl || (
      this.monitor && this.monitor.runtime
        ? new OperatorRunControl({ runtime: this.monitor.runtime, log: this.log, now: this.monitor.now })
        : null
    );
  }

  _doc() {
    try {
      if (
        this.root &&
        this.root.parent &&
        this.root.parent !== this.root &&
        this.root.parent.document
      ) {
        this.documentScope = 'parent';
        return this.root.parent.document;
      }
    } catch (_) {}

    try {
      if (this.root && this.root.document) {
        this.documentScope = 'local';
        return this.root.document;
      }
    } catch (_) {}

    this.documentScope = 'none';
    return null;
  }

  _windowForDocument(doc) {
    try {
      if (doc && doc.defaultView) return doc.defaultView;
    } catch (_) {}
    try {
      if (this.root && this.root.parent && this.root.parent.document === doc) return this.root.parent;
    } catch (_) {}
    return this.root || null;
  }

  _viewport(doc) {
    const win = this._windowForDocument(doc);
    const width = Number(win && win.innerWidth) || Number(doc && doc.documentElement && doc.documentElement.clientWidth) || 1280;
    const height = Number(win && win.innerHeight) || Number(doc && doc.documentElement && doc.documentElement.clientHeight) || 720;
    return { width: Math.max(320, width), height: Math.max(240, height) };
  }

  _setStyle(node, styles) {
    if (!node || !node.style) return;
    for (const [key, value] of Object.entries(styles)) node.style[key] = value;
  }

  _button(doc, text, onClick) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = text;
    this._setStyle(button, {
      marginLeft: '7px', padding: '5px 10px', border: '1px solid #666', borderRadius: '4px',
      background: '#222', color: '#eee', cursor: 'pointer', fontSize: '12px'
    });
    button.onclick = onClick;
    button.onmousedown = (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    };
    return button;
  }

  _row(doc, label, value) {
    const row = doc.createElement('div');
    this._setStyle(row, { display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '5px' });
    const l = doc.createElement('span');
    l.textContent = label;
    this._setStyle(l, { color: '#9ca3af', whiteSpace: 'nowrap' });
    const v = doc.createElement('span');
    v.textContent = safeText(value);
    this._setStyle(v, { color: '#f3f4f6', textAlign: 'right', overflowWrap: 'anywhere' });
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  _rect() {
    if (!this.container) return null;
    try {
      if (typeof this.container.getBoundingClientRect === 'function') {
        const rect = this.container.getBoundingClientRect();
        if (rect && Number.isFinite(Number(rect.width)) && Number.isFinite(Number(rect.height))) return rect;
      }
    } catch (_) {}
    const width = parseFloat(this.container.style.width) || 480;
    const height = parseFloat(this.container.style.height) || 420;
    const left = parseFloat(this.container.style.left) || 0;
    const top = parseFloat(this.container.style.top) || 0;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }

  _anchorToPixels(rect) {
    if (!this.container || !rect) return;
    this._setStyle(this.container, {
      left: `${Math.round(rect.left)}px`,
      top: `${Math.round(rect.top)}px`,
      right: 'auto',
      bottom: 'auto',
      width: `${Math.round(rect.width)}px`
    });
  }

  _listenInteraction(doc, onMove, onEnd) {
    if (this._interactionCleanup) this._interactionCleanup();
    if (!doc || typeof doc.addEventListener !== 'function') return false;
    const move = (event) => onMove(event || {});
    const end = (event) => {
      cleanup();
      onEnd(event || {});
    };
    const cleanup = () => {
      if (typeof doc.removeEventListener === 'function') {
        doc.removeEventListener('mousemove', move);
        doc.removeEventListener('mouseup', end);
      }
      if (this._interactionCleanup === cleanup) this._interactionCleanup = null;
    };
    doc.addEventListener('mousemove', move);
    doc.addEventListener('mouseup', end);
    this._interactionCleanup = cleanup;
    return true;
  }

  _beginDrag(event) {
    if (!this.container) return false;
    if (event && Number.isFinite(Number(event.button)) && Number(event.button) !== 0) return false;
    const doc = this._doc();
    const rect = this._rect();
    if (!doc || !rect) return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const startX = Number(event && event.clientX) || 0;
    const startY = Number(event && event.clientY) || 0;
    const startLeft = Number(rect.left) || 0;
    const startTop = Number(rect.top) || 0;
    const width = Math.max(this.minWidth, Number(rect.width) || this.minWidth);
    const height = this.minimized
      ? Math.max(1, Number(rect.height) || 1)
      : Math.max(this.minHeight, Number(rect.height) || this.minHeight);
    this._anchorToPixels({ ...rect, width, height });
    if (this.header) this.header.style.cursor = 'grabbing';

    return this._listenInteraction(doc, (moveEvent) => {
      const viewport = this._viewport(doc);
      const dx = (Number(moveEvent.clientX) || 0) - startX;
      const dy = (Number(moveEvent.clientY) || 0) - startY;
      const left = clamp(startLeft + dx, 0, Math.max(0, viewport.width - width));
      const top = clamp(startTop + dy, 0, Math.max(0, viewport.height - height));
      this.container.style.left = `${Math.round(left)}px`;
      this.container.style.top = `${Math.round(top)}px`;
    }, () => {
      if (this.header) this.header.style.cursor = 'move';
    });
  }

  _beginResize(event) {
    if (!this.container || this.minimized) return false;
    if (event && Number.isFinite(Number(event.button)) && Number(event.button) !== 0) return false;
    const doc = this._doc();
    const rect = this._rect();
    if (!doc || !rect) return false;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const startX = Number(event && event.clientX) || 0;
    const startY = Number(event && event.clientY) || 0;
    const startWidth = Math.max(this.minWidth, Number(rect.width) || this.minWidth);
    const startHeight = Math.max(this.minHeight, Number(rect.height) || this.minHeight);
    const left = Math.max(0, Number(rect.left) || 0);
    const top = Math.max(0, Number(rect.top) || 0);
    this._anchorToPixels({ ...rect, left, top, width: startWidth, height: startHeight });
    this.container.style.height = `${Math.round(startHeight)}px`;

    return this._listenInteraction(doc, (moveEvent) => {
      const viewport = this._viewport(doc);
      const dx = (Number(moveEvent.clientX) || 0) - startX;
      const dy = (Number(moveEvent.clientY) || 0) - startY;
      const maxWidth = Math.max(this.minWidth, viewport.width - left);
      const maxHeight = Math.max(this.minHeight, viewport.height - top);
      const width = clamp(startWidth + dx, this.minWidth, maxWidth);
      const height = clamp(startHeight + dy, this.minHeight, maxHeight);
      this.container.style.width = `${Math.round(width)}px`;
      this.container.style.height = `${Math.round(height)}px`;
    }, () => {});
  }

  _setMinimized(minimized) {
    if (!this.container || !this.header) return false;
    const next = minimized === true;
    if (next === this.minimized) return true;

    if (next) {
      const rect = this._rect();
      this._expandedLayout = {
        width: rect ? `${Math.round(Number(rect.width) || this.minWidth)}px` : (this.container.style.width || '480px'),
        height: rect ? `${Math.round(Number(rect.height) || this.minHeight)}px` : (this.container.style.height || `${this.minHeight}px`),
        minHeight: this.container.style.minHeight || `${this.minHeight}px`,
        maxHeight: this.container.style.maxHeight || 'calc(100vh - 36px)',
        overflow: this.container.style.overflow || 'auto',
        headerMarginBottom: this.header.style.marginBottom || '9px'
      };
      this.minimized = true;
      if (this.body) this.body.style.display = 'none';
      if (this.skillsPanel) this.skillsPanel.style.display = 'none';
      if (this.logBox) this.logBox.style.display = 'none';
      if (this.resizeHandle) this.resizeHandle.style.display = 'none';
      if (this.fallbackArea) this.fallbackArea.style.display = 'none';
      this._setStyle(this.container, {
        width: this._expandedLayout.width,
        height: 'auto',
        minHeight: '0px',
        maxHeight: 'none',
        overflow: 'hidden'
      });
      this.header.style.marginBottom = '0px';
      return true;
    }

    this.minimized = false;
    const layout = this._expandedLayout || {};
    this._setStyle(this.container, {
      width: layout.width || this.container.style.width || '480px',
      height: layout.height || `${this.minHeight}px`,
      minHeight: layout.minHeight || `${this.minHeight}px`,
      maxHeight: layout.maxHeight || 'calc(100vh - 36px)',
      overflow: layout.overflow || 'auto'
    });
    this.header.style.marginBottom = layout.headerMarginBottom || '9px';
    if (this.body) this.body.style.display = 'block';
    if (this.skillsPanel) this.skillsPanel.style.display = this.skillsPanelOpen ? 'block' : 'none';
    if (this.logBox) this.logBox.style.display = 'block';
    if (this.resizeHandle) this.resizeHandle.style.display = 'block';
    if (this.fallbackArea) this.fallbackArea.style.display = 'none';
    return true;
  }

  async _copy() {
    if (!this.monitor) return;
    if (this.copyButton) {
      this.copyButton.disabled = true;
      this.copyButton.textContent = 'Kopiere…';
    }
    let result = null;
    try { result = await this.monitor.copyToClipboard(); }
    catch (error) { result = { copied: false, method: 'manual', text: this.monitor.exportSession(), error: String(error && error.message || error) }; }
    this.lastCopy = result;
    if (result && result.copied) {
      if (this.copyButton) {
        this.copyButton.textContent = 'Kopiert ✓';
        this.copyButton.disabled = false;
      }
      if (this.fallbackArea) this.fallbackArea.style.display = 'none';
      const setTimer = (this.root && this.root.setTimeout) || setTimeout;
      setTimer(() => { if (this.copyButton) this.copyButton.textContent = 'Log kopieren'; }, 1800);
      return;
    }

    if (this.fallbackArea) {
      this.fallbackArea.value = result && result.text || this.monitor.exportSession();
      this.fallbackArea.style.display = 'block';
      if (typeof this.fallbackArea.focus === 'function') this.fallbackArea.focus();
      if (typeof this.fallbackArea.select === 'function') this.fallbackArea.select();
      if (typeof this.fallbackArea.setSelectionRange === 'function') this.fallbackArea.setSelectionRange(0, this.fallbackArea.value.length);
    }
    if (this.copyButton) {
      this.copyButton.textContent = 'Strg+C';
      this.copyButton.disabled = false;
    }
  }

  _runStatus() {
    if (!this.runControl || typeof this.runControl.status !== 'function') return null;
    try { return this.runControl.status(); } catch (error) {
      this.lastRunControlError = String(error && error.message || error);
      return null;
    }
  }

  _runButtonText(status) {
    if (!status) return 'Start/Stop';
    if (status.state === 'STOPPING') return 'Stoppt…';
    if (status.state === 'STARTING') return 'Startet…';
    if (status.state === 'RUNNING') return 'Stoppen';
    if (status.state === 'STOPPED_BLOCKED') return 'Start blockiert';
    return 'Starten';
  }

  _updateRunButton(status = this._runStatus()) {
    if (!this.runButton) return;
    this.runButton.textContent = this._runButtonText(status);
    this.runButton.disabled = !status || status.state === 'STOPPING' || status.state === 'STARTING' || status.state === 'STOPPED_BLOCKED';
    this.runButton.title = status && status.state === 'STOPPED_BLOCKED'
      ? `Start blockiert: ${(status.blockers || []).slice(0, 3).join(', ') || 'Reconciliation erforderlich'}`
      : 'Bot sicher starten oder stoppen';
  }

  async _toggleRun() {
    if (!this.runControl) return { ok: false, reason: 'SAFE_RUN_CONTROL_UNAVAILABLE' };
    const before = this._runStatus();
    if (!before) return { ok: false, reason: 'SAFE_RUN_CONTROL_STATUS_UNAVAILABLE' };
    if (before.state === 'STOPPING' || before.state === 'STARTING') return { ok: false, reason: 'CONTROL_TRANSITION_IN_PROGRESS' };
    this._updateRunButton({ ...before, state: before.running ? 'STOPPING' : 'STARTING' });
    let result;
    try {
      result = before.running ? await this.runControl.stop('GUI_BUTTON') : await this.runControl.start('GUI_BUTTON');
      this.lastRunControlError = result && result.ok === false ? result.reason || null : null;
    } catch (error) {
      this.lastRunControlError = String(error && error.message || error);
      result = { ok: false, reason: 'GUI_RUN_CONTROL_FAILED', error: this.lastRunControlError };
    }
    this.refresh();
    this._updateRunButton();
    return result;
  }

  _skillRuntime() {
    return this.monitor && this.monitor.runtime || null;
  }

  _skillCharacter() {
    const runtime = this._skillRuntime();
    const snapshot = runtime && runtime.lastSnapshot;
    if (snapshot && snapshot.character) return snapshot.character;
    try {
      return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
    } catch (_) {
      return null;
    }
  }

  _primeSkills() {
    const runtime = this._skillRuntime();
    if (!runtime || !runtime.skillCatalog) return false;
    try {
      runtime.skillCatalog.audit('GUI_SKILLS_OPEN', { force: true });
      const snapshot = runtime.lastSnapshot || (runtime.adapter && typeof runtime.adapter.snapshot === 'function' ? runtime.adapter.snapshot() : null);
      if (snapshot && snapshot.character) {
        runtime.lastSnapshot = runtime.lastSnapshot || snapshot;
        if (typeof runtime._refreshSkillCapabilities === 'function') runtime._refreshSkillCapabilities(snapshot, runtime.adapter.getGameData ? runtime.adapter.getGameData() || {} : {});
      }
      return true;
    } catch (error) {
      if (this.log && typeof this.log.emit === 'function') {
        try { this.log.emit({ component: 'debug-monitor-ui', event: 'SKILLS_PANEL_PRIME_FAILED', severity: 'warn', reason: String(error && error.message || error) }); } catch (_) {}
      }
      return false;
    }
  }

  _skillPanelState() {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    if (!runtime || !runtime.skillCatalog || !runtime.characterCombatProfiles || !character) {
      return { available: false, reason: 'SKILL_CONFIGURATION_UNAVAILABLE', character: null, catalogState: null, rows: [], enabled: 0 };
    }
    const ctype = String(character.ctype || character.type || '').toLowerCase();
    const level = Math.max(0, Number(character.level) || 0);
    const catalog = runtime.skillCatalog.status();
    const rows = runtime.skillCatalog.list({ ctype })
      .filter((skill) => Number(skill.requiredLevel || 0) <= level)
      .map((skill) => {
        const settings = runtime.characterCombatProfiles.skillSettings(character.name, skill) || { enabled: false, parameters: {}, configured: false };
        let availability = null;
        if (runtime.adapter && typeof runtime.adapter.skillAvailability === 'function') {
          try { availability = runtime.adapter.skillAvailability(skill.id); } catch (_) { availability = null; }
        }
        return {
          skill,
          enabled: settings.enabled === true,
          configured: settings.configured === true,
          parameters: settings.parameters || {},
          availability
        };
      });
    return {
      available: true,
      character: { name: character.name || 'unknown', ctype, level },
      catalogState: catalog.state,
      catalogReady: catalog.state === 'READY',
      generation: catalog.generation,
      rows,
      enabled: rows.filter((row) => row.enabled).length,
      combatMode: runtime.characterCombatProfiles.getCombatMode(character.name),
      adaptivePull: runtime.tacticalPartyCombat && runtime.tacticalPartyCombat.encounter && runtime.tacticalPartyCombat.encounter.aoe
        ? {
            engagedCount: runtime.tacticalPartyCombat.encounter.aoe.engagedCount,
            desiredPullSize: runtime.tacticalPartyCombat.encounter.aoe.desiredPullSize,
            deterministicDesiredPullSize: runtime.tacticalPartyCombat.encounter.aoe.deterministicDesiredPullSize,
            pullCapacity: runtime.tacticalPartyCombat.encounter.aoe.pullCapacity,
            reason: runtime.tacticalPartyCombat.encounter.aoe.adaptivePull && runtime.tacticalPartyCombat.encounter.aoe.adaptivePull.reason || 'DETERMINISTIC_BASELINE'
          }
        : null
    };
  }

  _skillControlLabel(key) {
    const labels = {
      hpThreshold: 'HP ≤',
      recipientMpThreshold: 'MP ≤',
      minInjuredMembers: 'Verletzte ≥',
      minTargets: 'Ziele ≥',
      maxDesiredTargets: 'Ziele max',
      manaBudgetRatio: 'MP Budget'
    };
    return labels[String(key || '')] || String(key || '');
  }

  _skillStatusText(row, state) {
    if (!state.catalogReady) return state.catalogState || 'CATALOG';
    if (!row.skill.automationValidated) return 'NEU · nicht validiert';
    if (!row.enabled) return 'DEAKTIVIERT';
    const availability = row.availability;
    if (!availability) return 'AKTIV';
    return availability.ready ? 'READY' : String(availability.reason || 'NICHT BEREIT');
  }

  _refreshCapabilitiesAfterSkillChange() {
    const runtime = this._skillRuntime();
    if (!runtime) return;
    try {
      if (typeof runtime._refreshSkillCapabilities === 'function') runtime._refreshSkillCapabilities();
    } catch (_) {}
  }

  _setCombatMode(mode) {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    if (!runtime || !character || !runtime.characterCombatProfiles || typeof runtime.characterCombatProfiles.setCombatMode !== 'function') return false;
    const result = runtime.characterCombatProfiles.setCombatMode(character.name, mode);
    if (!result || result.ok !== true) return false;
    try {
      if (runtime.tacticalPartyCombat && runtime.lastSnapshot) {
        const team = runtime.teamCombatCohesionHotfix && runtime.teamCombatCohesionHotfix._team(runtime.lastSnapshot);
        if (team && runtime.tacticalPartyCombat.encounter) runtime.tacticalPartyCombat._refreshEncounterPlan(runtime.lastSnapshot, team);
      }
    } catch (_) {}
    this.refresh();
    return true;
  }

  _setSkillEnabled(skillId, enabled) {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    if (!runtime || !character || !runtime.skillCatalog || !runtime.characterCombatProfiles) return false;
    const record = runtime.skillCatalog.get(skillId);
    if (!record || record.automationValidated !== true) return false;
    runtime.characterCombatProfiles.setEnabled(character.name, record, enabled === true);
    this._refreshCapabilitiesAfterSkillChange();
    this.refresh();
    return true;
  }

  _setSkillParameter(skillId, key, value) {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    if (!runtime || !character || !runtime.skillCatalog || !runtime.characterCombatProfiles) return false;
    const record = runtime.skillCatalog.get(skillId);
    if (!record) return false;
    const result = runtime.characterCombatProfiles.setParameter(character.name, record, key, value);
    this._refreshCapabilitiesAfterSkillChange();
    return !!(result && result.ok);
  }

  _enableAllSkills() {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    const state = this._skillPanelState();
    if (!runtime || !character || !state.available) return false;
    for (const row of state.rows) {
      if (row.skill.automationValidated !== true) continue;
      runtime.characterCombatProfiles.setEnabled(character.name, row.skill, true);
    }
    this._refreshCapabilitiesAfterSkillChange();
    this.refresh();
    return true;
  }

  _resetSkillProfile() {
    const runtime = this._skillRuntime();
    const character = this._skillCharacter();
    if (!runtime || !character || !runtime.characterCombatProfiles) return false;
    runtime.characterCombatProfiles.resetProfile(character.name);
    this._refreshCapabilitiesAfterSkillChange();
    this.refresh();
    return true;
  }

  _updateSkillsButton(state = this._skillPanelState()) {
    if (!this.skillsButton) return;
    if (!state.available) {
      this.skillsButton.textContent = 'Skills —';
      this.skillsButton.title = 'Skill-Konfiguration noch nicht verfügbar';
      return;
    }
    this.skillsButton.textContent = `Skills ${state.enabled}/${state.rows.length}`;
    this.skillsButton.title = `${state.character.name} · ${state.catalogState || 'UNKNOWN'} · Skill-Freigaben und taktische Schwellen`;
  }

  _renderSkillsPanel() {
    if (!this.skillsPanel) return false;
    const doc = this._doc();
    if (!doc) return false;
    const state = this._skillPanelState();
    this._updateSkillsButton(state);
    while (this.skillsPanel.firstChild) this.skillsPanel.removeChild(this.skillsPanel.firstChild);
    this.skillsPanel.style.display = this.skillsPanelOpen && !this.minimized ? 'block' : 'none';
    if (!this.skillsPanelOpen || this.minimized) return true;

    const heading = doc.createElement('div');
    heading.textContent = state.available
      ? `${state.character.name} · ${state.character.ctype} L${state.character.level} · Catalog ${state.catalogState}`
      : 'Skill-Konfiguration nicht verfügbar';
    this._setStyle(heading, { color: '#d1d5db', marginBottom: '8px', fontWeight: 'bold' });
    this.skillsPanel.appendChild(heading);
    if (!state.available) return true;

    const modeRow = doc.createElement('div');
    this._setStyle(modeRow, { display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '8px', marginBottom: '8px' });
    const modeLabel = doc.createElement('span');
    modeLabel.textContent = 'Combat Mode';
    this._setStyle(modeLabel, { color: '#9ca3af', fontSize: '10px' });
    const modeSelect = doc.createElement('select');
    for (const mode of [CombatMode.SINGLE_TARGET, CombatMode.SMART_AUTO, CombatMode.AOE_PREFERRED]) {
      const option = doc.createElement('option');
      option.value = mode;
      option.textContent = COMBAT_MODE_LABELS[mode] || mode;
      modeSelect.appendChild(option);
    }
    modeSelect.value = state.combatMode || CombatMode.SMART_AUTO;
    modeSelect.onchange = () => this._setCombatMode(modeSelect.value);
    this._setStyle(modeSelect, { width: '100%', background: '#0b0f14', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '4px', padding: '4px' });
    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeSelect);
    this.skillsPanel.appendChild(modeRow);

    const adaptiveRow = doc.createElement('div');
    this._setStyle(adaptiveRow, { display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '8px', marginBottom: '8px' });
    const adaptiveLabel = doc.createElement('span');
    adaptiveLabel.textContent = 'Adaptive Pull';
    this._setStyle(adaptiveLabel, { color: '#9ca3af', fontSize: '10px' });
    const adaptiveValue = doc.createElement('span');
    if (state.adaptivePull) {
      adaptiveValue.textContent = `Ziel ${state.adaptivePull.desiredPullSize}/${state.adaptivePull.pullCapacity} · aktiv ${state.adaptivePull.engagedCount} · ${state.adaptivePull.reason}`;
    } else {
      adaptiveValue.textContent = 'noch keine aktive Encounter-Evidenz';
    }
    this._setStyle(adaptiveValue, { color: '#d1d5db', fontSize: '10px', overflowWrap: 'anywhere' });
    adaptiveRow.appendChild(adaptiveLabel);
    adaptiveRow.appendChild(adaptiveValue);
    this.skillsPanel.appendChild(adaptiveRow);

    const actions = doc.createElement('div');
    this._setStyle(actions, { display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' });
    const enableAll = this._button(doc, 'Alle aktivieren', () => this._enableAllSkills());
    enableAll.style.marginLeft = '0px';
    const reset = this._button(doc, 'Standard', () => this._resetSkillProfile());
    reset.style.marginLeft = '0px';
    actions.appendChild(enableAll);
    actions.appendChild(reset);
    this.skillsPanel.appendChild(actions);

    for (const row of state.rows) {
      const skillBox = doc.createElement('div');
      this._setStyle(skillBox, {
        padding: '7px 0', borderTop: '1px solid #303641'
      });

      const top = doc.createElement('div');
      this._setStyle(top, { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' });
      const left = doc.createElement('label');
      this._setStyle(left, { display: 'flex', alignItems: 'center', gap: '7px', minWidth: '0', cursor: row.skill.automationValidated ? 'pointer' : 'default' });
      const check = doc.createElement('input');
      check.type = 'checkbox';
      check.checked = row.enabled;
      check.disabled = !state.catalogReady || row.skill.automationValidated !== true;
      check.onchange = () => this._setSkillEnabled(row.skill.id, check.checked === true);
      const name = doc.createElement('span');
      name.textContent = `${row.skill.name || row.skill.id} · L${row.skill.requiredLevel || 0}`;
      this._setStyle(name, { color: '#f3f4f6', overflowWrap: 'anywhere' });
      left.appendChild(check);
      left.appendChild(name);
      const status = doc.createElement('span');
      status.textContent = this._skillStatusText(row, state);
      this._setStyle(status, { color: '#9ca3af', fontSize: '10px', textAlign: 'right' });
      top.appendChild(left);
      top.appendChild(status);
      skillBox.appendChild(top);

      for (const control of row.skill.controls || []) {
        if (!control || !control.key) continue;
        const wrap = doc.createElement('div');
        this._setStyle(wrap, { display: 'grid', gridTemplateColumns: '82px 1fr 42px', alignItems: 'center', gap: '7px', marginTop: '6px' });
        const label = doc.createElement('span');
        label.textContent = this._skillControlLabel(control.key);
        this._setStyle(label, { color: '#9ca3af', fontSize: '10px' });
        const input = doc.createElement('input');
        input.type = 'range';
        const percent = control.type === 'percent';
        const dynamicMax = control.maxSource === 'targetCapacity' && Number.isFinite(Number(row.skill.targetCapacity))
          ? Number(row.skill.targetCapacity) : Number(control.max);
        input.min = String(percent ? Math.round(Number(control.min || 0) * 100) : Number(control.min || 0));
        input.max = String(percent ? Math.round(Number(dynamicMax || 1) * 100) : Number(dynamicMax || control.max || 1));
        input.step = String(percent ? Math.max(1, Math.round(Number(control.step || 0.01) * 100)) : Number(control.step || 1));
        const current = Number(row.parameters[control.key]);
        input.value = String(percent ? Math.round((Number.isFinite(current) ? current : Number(control.default || 0)) * 100) : (Number.isFinite(current) ? current : Number(control.default || 0)));
        input.disabled = !state.catalogReady || !row.enabled || row.skill.automationValidated !== true;
        const value = doc.createElement('span');
        value.textContent = percent ? `${input.value}%` : input.value;
        this._setStyle(value, { color: '#d1d5db', fontSize: '10px', textAlign: 'right' });
        input.oninput = () => { value.textContent = percent ? `${input.value}%` : input.value; };
        input.onchange = () => {
          const raw = Number(input.value);
          this._setSkillParameter(row.skill.id, control.key, percent ? raw / 100 : raw);
          this.refresh();
        };
        wrap.appendChild(label);
        wrap.appendChild(input);
        wrap.appendChild(value);
        skillBox.appendChild(wrap);
      }
      this.skillsPanel.appendChild(skillBox);
    }
    return true;
  }

  _toggleSkillsPanel() {
    this.skillsPanelOpen = !this.skillsPanelOpen;
    if (this.skillsPanelOpen) this._primeSkills();
    this._renderSkillsPanel();
    return this.skillsPanelOpen;
  }

  _formatDuration(ms) {
    const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  _eventsText() {
    if (!this.log || typeof this.log.list !== 'function') return 'Keine Events';
    const rows = this.log.list(16);
    if (!rows.length) return 'Keine Events';
    return rows.map((row) => {
      const time = row.ts ? String(row.ts).slice(11, 19) : '--:--:--';
      return `${time} ${String(row.severity || 'info').toUpperCase()} ${row.component || '-'} :: ${row.event || '-'}${row.reason ? ` [${row.reason}]` : ''}`;
    }).join('\n');
  }

  refresh() {
    if (!this.container || !this.monitor) return false;
    const doc = this._doc();
    if (!doc || !this.body) return false;
    const summary = this.monitor.summary();
    while (this.body.firstChild) this.body.removeChild(this.body.firstChild);
    const char = summary.character || {};
    const sup = summary.supervisor || {};
    const economy = summary.economy || {};
    const travel = summary.travel || {};
    const inventory = summary.inventory || {};
    const controlledEconomy = economy.controlled || {};
    const controlledTravel = travel.controlled || {};
    const runStatus = this._runStatus();
    let runtimeStatus = null;
    try { runtimeStatus = this.monitor.runtime && typeof this.monitor.runtime.status === 'function' ? this.monitor.runtime.status() : null; } catch (_) {}
    const merchantService = runtimeStatus && runtimeStatus.merchantService || null;
    const controlledService = merchantService && merchantService.controlled || {};
    const serviceExecution = merchantService && merchantService.lastExecution || controlledService.lastAction || null;
    const serviceKind = serviceExecution && (serviceExecution.kind || serviceExecution.planKind || serviceExecution.action) || '—';
    const serviceRaw = Number(controlledService.stats && controlledService.stats.rawActions) || 0;
    const serviceCircuit = controlledService.circuit && controlledService.circuit.open ? 'OPEN' : 'ok';
    const standOpen = !!(this.root && this.root.character && this.root.character.stand);
    const sessionDuration = Math.max(0, Number(summary.generatedAt || 0) - Number(summary.startedAt || 0));
    const runLabel = runStatus
      ? `${runStatus.state}${runStatus.state === 'STOPPED_BLOCKED' && runStatus.blockers.length ? ` · ${runStatus.blockers.slice(0, 2).join(', ')}` : ''}`
      : (summary.running ? 'RUNNING' : 'STOPPED');
    const serviceLabel = !merchantService ? '—' : controlledService.enabled
      ? `AN · Stand:${controlledService.allowStand ? 'on' : 'off'}${standOpen ? '/offen' : '/zu'} · Delivery:${controlledService.allowDelivery ? 'on' : 'off'}${controlledService.busy ? ' · BUSY' : ''}`
      : `AUS · Stand:${standOpen ? 'offen' : 'zu'}`;

    const rows = [
      ['Version / Modus', `${summary.version || '—'} / ${summary.mode || '—'}`],
      ['Bot', runLabel],
      ['Session', this._formatDuration(sessionDuration)],
      ['Charakter', `${char.name || '—'} (${char.ctype || '—'}) L${char.level || 0}`],
      ['Map', `${char.map || '—'} @ ${Math.round(char.x || 0)}, ${Math.round(char.y || 0)}`],
      ['Supervisor', `${sup.state || '—'}${sup.reasons && sup.reasons.length ? ` · ${sup.reasons.slice(0, 2).join(', ')}` : ''}`],
      ['Merchant live', controlledEconomy.enabled ? `AN · SELL:${controlledEconomy.sellEnabled ? 'on' : 'off'} BANK:${controlledEconomy.bankEnabled ? 'on' : 'off'}` : 'AUS'],
      ['Merchant Service', serviceLabel],
      ['Service Aktion', merchantService ? `${serviceKind} · Raw ${serviceRaw} · Circuit ${serviceCircuit}` : '—'],
      ['Travel live', controlledTravel.enabled ? `AN${controlledTravel.busy ? ' · BUSY' : ''}` : 'AUS'],
      ['Transaktionen', `aktiv ${economy.activeTransactions || 0} · recovery ${economy.recoveringTransactions || 0}`],
      ['Travel', `aktiv ${travel.active || 0} · Circuit ${travel.circuit && travel.circuit.open ? 'OPEN' : 'ok'}`],
      ['Inventar', `Einträge ${inventory.totalEntries || 0}${inventory.stale ? ' · STALE' : ''}`],
      ['Log', `Fehler ${summary.recentSignals.errors || 0} · Warn ${summary.recentSignals.warnings || 0}`]
    ];
    for (const [label, value] of rows) this.body.appendChild(this._row(doc, label, value));
    if (this.logBox) this.logBox.textContent = this._eventsText();
    this._updateRunButton(runStatus);
    this._updateSkillsButton();
    if (this.skillsPanelOpen) this._renderSkillsPanel();
    return true;
  }

  show() {
    const doc = this._doc();
    if (!doc || typeof doc.createElement !== 'function') return { shown: false, reason: 'DOM_UNAVAILABLE' };
    if (this.container && this.container.parentNode) {
      this.container.style.display = 'block';
      return { shown: true, reused: true };
    }
    const old = typeof doc.getElementById === 'function' ? doc.getElementById(this.containerId) : null;
    if (old && old.parentNode) old.parentNode.removeChild(old);

    const box = doc.createElement('div');
    box.id = this.containerId;
    this._setStyle(box, {
      position: 'fixed', right: '18px', bottom: '18px', top: 'auto', left: 'auto', width: '480px',
      minWidth: `${this.minWidth}px`, minHeight: `${this.minHeight}px`, maxWidth: 'calc(100vw - 36px)',
      maxHeight: 'calc(100vh - 36px)', boxSizing: 'border-box', overflow: 'auto', zIndex: '2147483646',
      background: 'rgba(10,12,16,0.96)', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,.5)', padding: '11px', fontFamily: 'monospace', fontSize: '12px',
      lineHeight: '1.45', pointerEvents: 'auto'
    });

    const header = doc.createElement('div');
    this.header = header;
    this._setStyle(header, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '9px',
      cursor: 'move', userSelect: 'none', WebkitUserSelect: 'none'
    });
    header.onmousedown = (event) => this._beginDrag(event);

    const title = doc.createElement('strong');
    title.textContent = 'AIO v3 Monitor';
    this._setStyle(title, { fontSize: '14px', color: '#fff' });
    const buttons = doc.createElement('div');
    this._setStyle(buttons, { display: 'flex', alignItems: 'center', flexShrink: '0' });
    buttons.onmousedown = (event) => {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    };
    this.copyButton = this._button(doc, 'Log kopieren', () => { this._copy(); });
    if (this.runControl) this.runButton = this._button(doc, 'Start/Stop', () => { this._toggleRun(); });
    this.skillsButton = this._button(doc, 'Skills —', () => { this._toggleSkillsPanel(); });
    const minimize = this._button(doc, '–', () => {
      this._setMinimized(!this.minimized);
      minimize.textContent = this.minimized ? '+' : '–';
    });
    const close = this._button(doc, '×', () => this.hide());
    buttons.appendChild(this.copyButton);
    if (this.runButton) buttons.appendChild(this.runButton);
    buttons.appendChild(this.skillsButton);
    buttons.appendChild(minimize);
    buttons.appendChild(close);
    header.appendChild(title);
    header.appendChild(buttons);
    box.appendChild(header);

    this.skillsPanel = doc.createElement('div');
    this._setStyle(this.skillsPanel, { display: 'none', marginBottom: '10px', padding: '8px', background: '#11151b', border: '1px solid #374151', borderRadius: '5px' });
    box.appendChild(this.skillsPanel);

    this.body = doc.createElement('div');
    box.appendChild(this.body);

    this.logBox = doc.createElement('pre');
    this._setStyle(this.logBox, {
      margin: '10px 0 0', padding: '8px', maxHeight: '260px', overflow: 'auto', whiteSpace: 'pre-wrap',
      background: '#05070a', border: '1px solid #374151', borderRadius: '5px', color: '#d1d5db',
      fontSize: '11px', lineHeight: '1.4'
    });
    box.appendChild(this.logBox);

    this.fallbackArea = doc.createElement('textarea');
    this.fallbackArea.setAttribute('readonly', 'readonly');
    this._setStyle(this.fallbackArea, {
      display: 'none', width: '100%', height: '180px', marginTop: '9px', boxSizing: 'border-box',
      background: '#05070a', color: '#fff', border: '1px solid #f59e0b', fontSize: '10px'
    });
    box.appendChild(this.fallbackArea);

    this.resizeHandle = doc.createElement('div');
    this.resizeHandle.setAttribute('aria-label', 'Monitorgröße ändern');
    this.resizeHandle.title = 'Größe ändern';
    this._setStyle(this.resizeHandle, {
      position: 'absolute', right: '2px', bottom: '2px', width: '18px', height: '18px', cursor: 'nwse-resize',
      borderRight: '3px solid #9ca3af', borderBottom: '3px solid #9ca3af', boxSizing: 'border-box', opacity: '0.8'
    });
    this.resizeHandle.onmousedown = (event) => this._beginResize(event);
    box.appendChild(this.resizeHandle);

    const host = doc.body || doc.documentElement;
    if (!host || typeof host.appendChild !== 'function') return { shown: false, reason: 'DOM_HOST_UNAVAILABLE' };
    host.appendChild(box);
    this.container = box;
    this.refresh();
    const setTimer = (this.root && this.root.setInterval) || setInterval;
    this.timer = setTimer(() => this.refresh(), this.refreshMs);
    return { shown: true, reused: false, documentScope: this.documentScope };
  }

  hide() {
    if (this._interactionCleanup) this._interactionCleanup();
    if (this.container) this.container.style.display = 'none';
    return true;
  }

  destroy() {
    if (this._interactionCleanup) this._interactionCleanup();
    const clearTimer = (this.root && this.root.clearInterval) || clearInterval;
    if (this.timer != null) clearTimer(this.timer);
    this.timer = null;
    if (this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.header = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.runButton = null;
    this.skillsButton = null;
    this.skillsPanel = null;
    this.skillsPanelOpen = false;
    this.fallbackArea = null;
    this.resizeHandle = null;
    this._expandedLayout = null;
    return true;
  }

  status() {
    const rect = this._rect();
    const runStatus = this._runStatus();
    return {
      schemaVersion: 1,
      mode: this.runControl ? 'operator-control-debug-ui' : 'read-only-debug-ui',
      actionAuthority: false,
      directGameplayActionAccess: false,
      runtimeControlAuthority: !!this.runControl,
      safeStartStop: !!this.runControl,
      skillConfigurationAuthority: !!(this._skillRuntime() && this._skillRuntime().characterCombatProfiles),
      skillPanelOpen: this.skillsPanelOpen,
      runControl: runStatus,
      lastRunControlError: this.lastRunControlError,
      domAvailable: !!this._doc(),
      documentScope: this.documentScope,
      visible: !!(this.container && this.container.style.display !== 'none'),
      minimized: this.minimized,
      collapsedToTitleBar: this.minimized,
      draggable: true,
      resizable: true,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      layout: rect ? {
        left: Math.round(Number(rect.left) || 0), top: Math.round(Number(rect.top) || 0),
        width: Math.round(Number(rect.width) || 0), height: Math.round(Number(rect.height) || 0)
      } : null,
      refreshMs: this.refreshMs,
      lastCopy: this.lastCopy ? { copied: this.lastCopy.copied === true, method: this.lastCopy.method || null, bytes: this.lastCopy.bytes || null } : null
    };
  }
}

module.exports = { DebugMonitorUI };