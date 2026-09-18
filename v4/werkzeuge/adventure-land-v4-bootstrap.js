(() => {
  'use strict';

  const API_NAME = 'V4Bootstrap';
  const VERSION = '1.0.0';
  const RUNTIME_MARKER = 'Adventure Land AiO Bot V4 | generated | production runtime';
  const MIN_RUNTIME_BYTES = 10_000;
  const MAX_RUNTIME_BYTES = 8 * 1024 * 1024;

  let ladeVersuch = false;
  let letzterFehler = null;
  let geladenVon = null;
  let geladenerSha256 = null;

  function config() {
    const wert = globalThis.AIO_V4_BOOTSTRAP_CONFIG;
    return wert && typeof wert === 'object' ? wert : {};
  }

  function runtimeUrl() {
    const wert = config().runtimeUrl;
    return typeof wert === 'string' && wert.trim().length > 0 ? wert.trim() : null;
  }

  function runtimeSha256() {
    const wert = config().runtimeSha256;
    if (typeof wert !== 'string') return null;
    const normalisiert = wert.trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(normalisiert) ? normalisiert : null;
  }

  async function berechneSha256(code) {
    if (!globalThis.crypto?.subtle || typeof globalThis.TextEncoder !== 'function') {
      throw new Error('Web-Crypto oder TextEncoder ist fuer die V4-Runtime-Hashpruefung nicht verfuegbar.');
    }
    const bytes = new globalThis.TextEncoder().encode(code);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (wert) => wert.toString(16).padStart(2, '0')).join('');
  }

  function status() {
    const laufzeit = globalThis.V4ProduktionsLaufzeit;
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      runtimeUrlKonfiguriert: runtimeUrl() !== null,
      runtimeSha256Konfiguriert: runtimeSha256() !== null,
      ladeVersuch,
      bereit: Boolean(laufzeit && typeof laufzeit.status === 'function'),
      geladenVon,
      geladenerSha256,
      letzterFehler
    });
  }

  async function lade() {
    if (ladeVersuch) throw new Error('Der V4-Bootstrap hat seinen Ladeversuch bereits verbraucht.');
    if (globalThis.V4ProduktionsLaufzeit !== undefined) {
      throw new Error('V4ProduktionsLaufzeit ist bereits vorhanden; Bootstrap ueberschreibt keine bestehende Runtime.');
    }
    const url = runtimeUrl();
    if (url === null) throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl fehlt; Produktionsruntime bleibt gesperrt.');
    if (!/^https:\/\//i.test(url)) throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeUrl muss eine explizite HTTPS-URL sein.');
    const erwarteterSha256 = runtimeSha256();
    if (erwarteterSha256 === null) {
      throw new Error('AIO_V4_BOOTSTRAP_CONFIG.runtimeSha256 fehlt oder ist kein gueltiger SHA-256.');
    }
    if (typeof globalThis.fetch !== 'function') throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');

    ladeVersuch = true;
    letzterFehler = null;
    geladenVon = null;
    geladenerSha256 = null;

    try {
      const response = await globalThis.fetch(url, { cache: 'no-store' });
      if (!response || response.ok !== true) throw new Error(`Runtime-Download fehlgeschlagen: HTTP ${String(response?.status ?? 'unbekannt')}.`);
      const code = String(await response.text());
      if (code.length < MIN_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet klein.');
      if (code.length > MAX_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet gross.');
      if (!code.includes(RUNTIME_MARKER)) throw new Error('Geladene Datei besitzt nicht den erwarteten V4-Produktionsruntime-Marker.');
      const tatsaechlicherSha256 = await berechneSha256(code);
      if (tatsaechlicherSha256 !== erwarteterSha256) {
        throw new Error(`SHA-256 der geladenen V4-Produktionsruntime stimmt nicht: ${tatsaechlicherSha256}.`);
      }

      (0, eval)(code);

      const laufzeit = globalThis.V4ProduktionsLaufzeit;
      if (!laufzeit || typeof laufzeit.status !== 'function' || typeof laufzeit.stoppe !== 'function') {
        throw new Error('Geladene V4-Produktionsruntime hat ihre feste globale API nicht installiert.');
      }
      geladenVon = url;
      geladenerSha256 = erwarteterSha256;
      return status();
    } catch (fehler) {
      letzterFehler = fehler instanceof Error ? fehler.message : String(fehler);
      throw fehler;
    }
  }

  const api = Object.freeze({
    version: VERSION,
    status,
    lade
  });

  if (globalThis[API_NAME] !== undefined) {
    throw new Error(`${API_NAME} ist bereits im Codekontext vorhanden.`);
  }
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
})();
