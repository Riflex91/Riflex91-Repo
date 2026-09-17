(() => {
  'use strict';

  const API_NAME = 'V4Block7SchattenKontextbruecke';
  const VERSION = '1.0.0';
  const FUNKTIONS_NAME = 'ms_to_next_skill';

  let letzterStatus = null;

  function holeElternFenster() {
    try {
      if (typeof parent !== 'undefined' && parent && parent !== globalThis) return parent;
    } catch {
      // Kein nutzbarer Elternkontext.
    }
    return null;
  }

  function holeFunktion(kontext, name) {
    try {
      const wert = Reflect.get(kontext, name);
      return typeof wert === 'function' ? wert : null;
    } catch {
      return null;
    }
  }

  function schreibeFunktion(kontext, name, funktion) {
    try {
      if (Reflect.set(kontext, name, funktion) && holeFunktion(kontext, name) === funktion) return true;
    } catch {
      // Zweiter Versuch per Property-Definition.
    }
    try {
      Object.defineProperty(kontext, name, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: funktion
      });
      return holeFunktion(kontext, name) === funktion;
    } catch {
      return false;
    }
  }

  function aktiviere() {
    const elternFenster = holeElternFenster();
    const lokaleFunktion = holeFunktion(globalThis, FUNKTIONS_NAME);
    const elternFunktion = elternFenster ? holeFunktion(elternFenster, FUNKTIONS_NAME) : null;

    if (elternFunktion) {
      letzterStatus = Object.freeze({
        aktiv: true,
        quelle: 'eltern',
        weitergereicht: false,
        grund: `${FUNKTIONS_NAME} ist bereits im Parent-Kontext verfuegbar.`
      });
      return letzterStatus;
    }

    if (!lokaleFunktion) {
      letzterStatus = Object.freeze({
        aktiv: false,
        quelle: 'keine',
        weitergereicht: false,
        grund: `${FUNKTIONS_NAME} ist weder lokal noch im Parent-Kontext verfuegbar.`
      });
      return letzterStatus;
    }

    if (!elternFenster) {
      letzterStatus = Object.freeze({
        aktiv: true,
        quelle: 'lokal',
        weitergereicht: false,
        grund: `${FUNKTIONS_NAME} ist im aktuellen Kontext verfuegbar; kein separater Parent-Kontext erkannt.`
      });
      return letzterStatus;
    }

    const weiterleitung = function (...argumente) {
      return Reflect.apply(lokaleFunktion, globalThis, argumente);
    };

    if (!schreibeFunktion(elternFenster, FUNKTIONS_NAME, weiterleitung)) {
      letzterStatus = Object.freeze({
        aktiv: false,
        quelle: 'lokal',
        weitergereicht: false,
        grund: `${FUNKTIONS_NAME} konnte nicht sicher in den Parent-Kontext weitergereicht werden.`
      });
      return letzterStatus;
    }

    letzterStatus = Object.freeze({
      aktiv: true,
      quelle: 'lokal',
      weitergereicht: true,
      grund: `${FUNKTIONS_NAME} wird read-only aus dem lokalen Adventure-Land-Codekontext an den Parent-Kontext weitergereicht.`
    });
    return letzterStatus;
  }

  function status() {
    return letzterStatus ?? aktiviere();
  }

  const api = Object.freeze({ version: VERSION, aktiviere, status });
  globalThis[API_NAME] = api;

  const ergebnis = aktiviere();
  try {
    const konsole = globalThis.V4Testkonsole ?? holeElternFenster()?.V4Testkonsole;
    konsole?.ausgeben?.({ version: VERSION, ...ergebnis }, 'Block 7 Schatten · Kontextbruecke');
  } catch {
    // Diagnoseausgabe darf die Bruecke nicht beeinflussen.
  }
})();