'use strict';

function safeText(value) {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch (_) { return String(value); }
}

class DebugMonitorUI {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.monitor = options.monitor;
    this.log = options.log || null;
    this.refreshMs = Math.max(500, Math.min(10000, Number(options.refreshMs) || 1000));
    this.containerId = options.containerId || 'aio-v3-session-monitor';
    this.container = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.fallbackArea = null;
    this.timer = null;
    this.minimized = false;
    this.lastCopy = null;
  }

  _doc() {
    try {
      if (this.root && this.root.document) return this.root.document;
      if (this.root && this.root.parent && this.root.parent.document) return this.root.parent.document;
    } catch (_) {}
    return null;
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
      marginLeft: '6px', padding: '4px 8px', border: '1px solid #666', borderRadius: '4px',
      background: '#222', color: '#eee', cursor: 'pointer', fontSize: '11px'
    });
    button.onclick = onClick;
    return button;
  }

  _row(doc, label, value) {
    const row = doc.createElement('div');
    this._setStyle(row, { display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '3px' });
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
    const rows = this.log.list(12);
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
      position: 'fixed', top: '8px', right: '8px', width: '390px', maxHeight: '78vh', zIndex: '2147483646',
      background: 'rgba(10,12,16,0.96)', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '7px',
      boxShadow: '0 8px 26px rgba(0,0,0,.45)', padding: '8px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.35'
    });

    const header = doc.createElement('div');
    this._setStyle(header, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' });
    const title = doc.createElement('strong');
    title.textContent = 'AIO v3 Monitor';
    this._setStyle(title, { fontSize: '12px', color: '#fff' });
    const buttons = doc.createElement('div');
    this.copyButton = this._button(doc, 'Log kopieren', () => { this._copy(); });
    const minimize = this._button(doc, '–', () => {
      this.minimized = !this.minimized;
      if (this.body) this.body.style.display = this.minimized ? 'none' : 'block';
      if (this.logBox) this.logBox.style.display = this.minimized ? 'none' : 'block';
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
      margin: '7px 0 0', padding: '6px', maxHeight: '180px', overflow: 'auto', whiteSpace: 'pre-wrap',
      background: '#05070a', border: '1px solid #374151', borderRadius: '4px', color: '#d1d5db', fontSize: '10px'
    });
    box.appendChild(this.logBox);

    this.fallbackArea = doc.createElement('textarea');
    this.fallbackArea.setAttribute('readonly', 'readonly');
    this._setStyle(this.fallbackArea, {
      display: 'none', width: '100%', height: '110px', marginTop: '7px', boxSizing: 'border-box',
      background: '#05070a', color: '#fff', border: '1px solid #f59e0b', fontSize: '9px'
    });
    box.appendChild(this.fallbackArea);

    const host = doc.body || doc.documentElement;
    if (!host || typeof host.appendChild !== 'function') return { shown: false, reason: 'DOM_HOST_UNAVAILABLE' };
    host.appendChild(box);
    this.container = box;
    this.refresh();
    const setTimer = (this.root && this.root.setInterval) || setInterval;
    this.timer = setTimer(() => this.refresh(), this.refreshMs);
    return { shown: true, reused: false };
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
    return true;
  }

  destroy() {
    const clearTimer = (this.root && this.root.clearInterval) || clearInterval;
    if (this.timer != null) clearTimer(this.timer);
    this.timer = null;
    if (this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.body = null;
    this.logBox = null;
    this.copyButton = null;
    this.fallbackArea = null;
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: 'read-only-debug-ui',
      actionAuthority: false,
      directGameplayActionAccess: false,
      domAvailable: !!this._doc(),
      visible: !!(this.container && this.container.style.display !== 'none'),
      minimized: this.minimized,
      refreshMs: this.refreshMs,
      lastCopy: this.lastCopy ? { copied: this.lastCopy.copied === true, method: this.lastCopy.method || null, bytes: this.lastCopy.bytes || null } : null
    };
  }
}

module.exports = { DebugMonitorUI };
