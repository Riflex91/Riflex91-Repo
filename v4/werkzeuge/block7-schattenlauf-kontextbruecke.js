(() => {
  'use strict';

  const API_NAME = 'V4Block7SchattenKontextbruecke';
  const VERSION = '2.0.0';
  const KOMPATIBILITAETS_NAME = 'ms_to_next_skill';

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
    if (!kontext) return null;
    try {
      const wert = Reflect.get(kontext, name);
      return typeof wert === 'function' ? wert : null;
    } catch {
      return null;
    }
  }

  function holeWert(kontext, name) {
    if (!kontext) return undefined;
    try {
      return Reflect.get(kontext, name);
    } catch {
      return undefined;
    }
  }

  function findeFunktion(name) {
    const lokal = holeFunktion(globalThis, name);
    if (lokal) return { funktion: lokal, kontext: globalThis, quelle: 'lokal' };
    const eltern = holeElternFenster();
    const dort = holeFunktion(eltern, name);
    if (dort) return { funktion: dort, kontext: eltern, quelle: 'eltern' };
    return null;
  }

  function findeObjekt(name) {
    const lokal = holeWert(globalThis, name);
    if (lokal && typeof lokal === 'object') return lokal;
    const eltern = holeWert(holeElternFenster(), name);
    if (eltern && typeof eltern === 'object') return eltern;
    return null;
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

  function cooldownName(aktionsName) {
    const g = findeObjekt('G');
    const skills = g?.skills;
    if (!skills || typeof skills !== 'object') return aktionsName;

    let aktuell = aktionsName;
    const besucht = new Set();
    for (let schritt = 0; schritt < 16; schritt += 1) {
      if (besucht.has(aktuell)) return aktuell;
      besucht.add(aktuell);
      const skill = skills[aktuell];
      if (!skill || typeof skill !== 'object' || typeof skill.share !== 'string' || !skill.share) return aktuell;
      aktuell = skill.share;
    }
    return aktuell;
  }

  function zeitstempel(wert) {
    if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
    if (typeof wert === 'string') {
      const zeit = Date.parse(wert);
      return Number.isFinite(zeit) ? zeit : null;
    }
    if (wert && typeof wert === 'object' && typeof wert.getTime === 'function') {
      try {
        const zeit = wert.getTime();
        return Number.isFinite(zeit) ? zeit : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function restAusNextSkill(aktionsName) {
    const nextSkill = findeObjekt('next_skill');
    if (!nextSkill) return null;
    const name = cooldownName(aktionsName);
    const bereitAb = zeitstempel(nextSkill[name]);
    if (bereitAb === null) return null;
    return Math.max(0, bereitAb - Date.now());
  }

  function aktiviere() {
    const elternFenster = holeElternFenster();
    const zielKontext = elternFenster ?? globalThis;
    const vorhandeneKompatibilitaet = holeFunktion(zielKontext, KOMPATIBILITAETS_NAME);
    if (vorhandeneKompatibilitaet) {
      letzterStatus = Object.freeze({
        aktiv: true,
        quelle: 'vorhandenes_ms_to_next_skill',
        zeitQuelle: 'nativ',
        weitergereicht: false,
        grund: `${KOMPATIBILITAETS_NAME} ist im vom Schattenrunner verwendeten Kontext bereits verfuegbar.`
      });
      return letzterStatus;
    }

    const cooldown = findeFunktion('is_on_cooldown');
    const canUse = findeFunktion('can_use');
    if (!cooldown && !canUse) {
      letzterStatus = Object.freeze({
        aktiv: false,
        quelle: 'keine',
        zeitQuelle: 'keine',
        weitergereicht: false,
        grund: 'Adventure Land stellt weder is_on_cooldown noch can_use im lokalen oder Parent-Kontext bereit.'
      });
      return letzterStatus;
    }

    const kompatibilitaetsFunktion = function (aktionsName) {
      if (cooldown) {
        const istCooldown = Reflect.apply(cooldown.funktion, cooldown.kontext, [aktionsName]);
        if (typeof istCooldown !== 'boolean') return Number.NaN;
        if (!istCooldown) return 0;
        const rest = restAusNextSkill(aktionsName);
        return rest === null ? 1 : Math.max(1, rest);
      }

      const nutzbar = Reflect.apply(canUse.funktion, canUse.kontext, [aktionsName]);
      if (nutzbar === true) return 0;
      return Number.NaN;
    };

    if (!schreibeFunktion(zielKontext, KOMPATIBILITAETS_NAME, kompatibilitaetsFunktion)) {
      letzterStatus = Object.freeze({
        aktiv: false,
        quelle: cooldown ? 'is_on_cooldown' : 'can_use',
        zeitQuelle: 'keine',
        weitergereicht: false,
        grund: `${KOMPATIBILITAETS_NAME} konnte fuer den bestehenden Schattenrunner nicht sicher bereitgestellt werden.`
      });
      return letzterStatus;
    }

    letzterStatus = Object.freeze({
      aktiv: true,
      quelle: cooldown ? `is_on_cooldown:${cooldown.quelle}` : `can_use:${canUse.quelle}`,
      zeitQuelle: cooldown && findeObjekt('next_skill') ? 'next_skill' : (cooldown ? 'boolescher_cooldown' : 'keine'),
      weitergereicht: true,
      grund: cooldown
        ? 'Der Schattenrunner erhaelt seine Attack-Bereitschaft aus Adventure Lands is_on_cooldown und, soweit vorhanden, next_skill.'
        : 'Der Schattenrunner nutzt can_use nur als positiven Bereitschafts-Fallback; false bleibt unbekannt.'
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
    konsole?.ausgeben?.({ version: VERSION, ...ergebnis }, 'Block 7 Schatten · Bereitschaftsadapter');
  } catch {
    // Diagnoseausgabe darf den Adapter nicht beeinflussen.
  }
})();