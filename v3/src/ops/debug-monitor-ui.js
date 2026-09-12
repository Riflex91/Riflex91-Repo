'use strict';

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
    this.fallbackArea = null;
    this.resizeHandle = null;
    this.timer = null;
    this.minimized = false;
    this.lastCopy = null;
    this.documentScope = 'none';
    this._interactionCleanup = null;
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
    if (!this.container || this.minimized) return false;
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
    const height = Math.max(this.minHeight, Number(rect.height) || this.minHeight);
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

    const rows = [
      ['Version / Modus', `${summary.version || '—'} / ${summary.mode || '—'}`],
      ['Charakter', `${char.name || '—'} (${char.ctype || '—'}) L${char.level || 0}`],
      ['Map', `${char.map || '—'} @ ${Math.round(char.x || 0)}, ${Math.round(char.y || 0)}`],
      ['Supervisor', `${sup.state || '—'}${sup.reasons && sup.reasons.length ? ` · ${sup.reasons.slice(0, 2).join(', ')}` : ''}`],
      ['Merchant live', controlledEconomy.enabled ? `AN · SELL:${controlledEconomy.sellEnabled ? 'on' : 'off'} BANK:${controlledEconomy.bankEnabled ? 'on' : 'off'}` : 'AUS'],
      ['Travel live', controlledTravel.enabled ? `AN${controlledTravel.busy ? ' · BUSY' : ''}` : 'AUS'],
      ['Transaktionen', `aktiv ${economy.activeTransactions || 0} · recovery ${economy.recoveringTransactions || 0}`],
      ['Travel', `aktiv ${travel.active || 0} · Circuit ${travel.circuit && travel.circuit.open ? 'OPEN' : 'ok'}`],
      ['Inventar', `Einträge ${inventory.totalEntries || 0}${inventory.stale ? ' · STALE' : ''}`],
      ['Log', `Fehler ${summary.recentSignals.errors || 0} · Warn ${summary.recentSignals.warnings || 0}`]
    ];
    for (const [label, value] of rows) this.body.appendChild(this._row(doc, label, value));
    if (this.logBox) this.logBox.textContent = this._eventsText();
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
    const minimize = this._button(doc, '–', () => {
      this.minimized = !this.minimized;
      if (this.body) this.body.style.display = this.minimized ? 'none' : 'block';
      if (this.logBox) this.logBox.style.display = this.minimized ? 'none' : 'block';
      if (this.resizeHandle) this.resizeHandle.style.display = this.minimized ? 'none' : 'block';
      if (this.fallbackArea) this.fallbackArea.style.display = 'none';
      minimize.textContent = this.minimized ? '+' : '–';
    });
    const close = this._button(doc, '×', () => this.hide());
    buttons.appendChild(this.copyButton);
    buttons.appendChild(minimize);
    buttons.appendChild(close);
    header.appendChild(title);
    header.appendChild(buttons);
    box.appendChild(header);

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
    this.fallbackArea = null;
    this.resizeHandle = null;
    return true;
  }

  status() {
    const rect = this._rect();
    return {
      schemaVersion: 1,
      mode: 'read-only-debug-ui',
      actionAuthority: false,
      directGameplayActionAccess: false,
      domAvailable: !!this._doc(),
      documentScope: this.documentScope,
      visible: !!(this.container && this.container.style.display !== 'none'),
      minimized: this.minimized,
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
