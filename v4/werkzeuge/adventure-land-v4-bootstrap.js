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

  function config() {
    const wert = globalThis.AIO_V4_BOOTSTRAP_CONFIG;
    return wert && typeof wert === 'object' ? wert : {};
  }

  function runtimeUrl() {
    const wert = config().runtimeUrl;
    return typeof wert === 'string' && wert.trim().length > 0 ? wert.trim() : null;
  }

  function status() {
    const laufzeit = globalThis.V4ProduktionsLaufzeit;
    return Object.freeze({
      schemaVersion: 1,
      werkzeug: API_NAME,
      version: VERSION,
      runtimeUrlKonfiguriert: runtimeUrl() !== null,
      ladeVersuch,
      bereit: Boolean(laufzeit && typeof laufzeit.status === 'function'),
      geladenVon,
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
    if (typeof globalThis.fetch !== 'function') throw new Error('fetch ist im Adventure-Land-Codekontext nicht verfuegbar.');

    ladeVersuch = true;
    letzterFehler = null;
    geladenVon = null;

    try {
      const response = await globalThis.fetch(url, { cache: 'no-store' });
      if (!response || response.ok !== true) throw new Error(`Runtime-Download fehlgeschlagen: HTTP ${String(response?.status ?? 'unbekannt')}.`);
      const code = String(await response.text());
      if (code.length < MIN_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet klein.');
      if (code.length > MAX_RUNTIME_BYTES) throw new Error('Geladene V4-Produktionsruntime ist unerwartet gross.');
      if (!code.includes(RUNTIME_MARKER)) throw new Error('Geladene Datei besitzt nicht den erwarteten V4-Produktionsruntime-Marker.');

      (0, eval)(code);

      const laufzeit = globalThis.V4ProduktionsLaufzeit;
      if (!laufzeit || typeof laufzeit.status !== 'function' || typeof laufzeit.stoppe !== 'function') {
        throw new Error('Geladene V4-Produktionsruntime hat ihre feste globale API nicht installiert.');
      }
      geladenVon = url;
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
