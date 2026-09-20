(() => {
  'use strict';

  const API_NAME = 'V5R12TestGui';
  const VERSION = '1.0.0';
  const JOURNAL_KEY = 'AIO_V5_R12_TEST_JOURNAL_V1';
  const PROBE_KEY = 'AIO_V5_R12_TEST_PROBE_V1';
  const BESTAETIGUNG = 'R12-EQUIP-ONCE';
  const ACTION = 'AL-ACTION-EQUIP';
  const RECOVERY = 'AL-RECOVERY-EQUIP';
  const VERIFIER = 'AL-VERIFIER-EQUIP';
  const ERLAUBTE_TYPEN = Object.freeze({
    helmet: 'helmet',
    chest: 'chest',
    pants: 'pants',
    shoes: 'shoes',
    gloves: 'gloves',
    cape: 'cape',
    amulet: 'amulet',
    belt: 'belt',
    orb: 'orb'
  });
  const SLOT_PRIORITAET = Object.freeze(['cape','belt','amulet','orb','helmet','gloves','shoes','pants','chest']);

  function fenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items) && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('R12_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_TEST_GUI_FEHLT');
  }

  function storage() {
    const root = fenster();
    try {
      if (root.localStorage) return root.localStorage;
    } catch {}
    try {
      if (globalThis.localStorage) return globalThis.localStorage;
    } catch {}
    throw new Error('R12_TEST_STORAGE_FEHLT');
  }

  function jetzt() { return new Date().toISOString(); }

  function runId() {
    const zufall = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    return 'R12-' + Date.now() + '-' + zufall;
  }

  function cleanSlot(item) {
    return item ? { name: String(item.name || ''), level: Number(item.level || 0) } : null;
  }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3 = { vorhanden: false, aktiv: false, detail: null };
    let v4 = { vorhanden: false, aktiv: false, detail: null };

    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          const aktiv = !!(runtime.timer || status?.running === true);
          v3 = { vorhanden: true, aktiv, detail: status };
        }
      } catch (error) {
        v3 = { vorhanden: true, aktiv: true, detail: { fehler: String(error?.message || error) } };
      }

      try {
        const runtime = root?.V4ProduktionsLaufzeit || root?.AIO_V4 || root?.V4Runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          const aktiv = !!(status && (
            status.running === true ||
            status.aktivFreigegeben === true ||
            status.gestoppt === false ||
            status.empfangInstalliert === true
          ));
          v4 = { vorhanden: true, aktiv, detail: status };
        }
      } catch (error) {
        v4 = { vorhanden: true, aktiv: true, detail: { fehler: String(error?.message || error) } };
      }
    }

    return { v3, v4, alternativeRuntimeAktiv: v3.aktiv || v4.aktiv };
  }

  function stoppeAltRuntime() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    const aktionen = [];

    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime && typeof runtime.stop === 'function') {
          aktionen.push({ runtime: 'V3', ergebnis: runtime.stop() });
        }
      } catch (error) {
        aktionen.push({ runtime: 'V3', fehler: String(error?.message || error) });
      }
      try {
        const runtime = root?.V4ProduktionsLaufzeit;
        if (runtime && typeof runtime.stoppe === 'function') {
          aktionen.push({ runtime: 'V4', ergebnis: runtime.stoppe() });
        } else if (runtime && typeof runtime.stop === 'function') {
          aktionen.push({ runtime: 'V4', ergebnis: runtime.stop() });
        }
      } catch (error) {
        aktionen.push({ runtime: 'V4', fehler: String(error?.message || error) });
      }
    }

    const nachher = runtimeStatus();
    return {
      status: nachher.alternativeRuntimeAktiv ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetzt(),
      aktionen,
      nachher
    };
  }

  function beobachte() {
    const root = fenster();
    const c = root.character;
    const entities = root.entities || {};
    const feinde = Object.values(entities).filter(e =>
      e && e.type === 'monster' && !e.dead && e.target === c.name).length;
    const slots = {};
    for (const slot of Object.values(ERLAUBTE_TYPEN)) slots[slot] = cleanSlot(c.slots?.[slot] || null);
    const inventar = c.items.map((item, index) => {
      if (!item?.name) return null;
      const def = root.G.items[item.name] || {};
      return {
        index,
        name: String(item.name),
        level: Number(item.level || 0),
        gesperrt: item.l === true || item.locked === true || item.lock === true,
        typ: String(def.type || '')
      };
    }).filter(Boolean);

    return {
      charakterName: String(c.name || ''),
      rip: !!c.rip,
      bewegtSich: !!c.moving,
      zielName: c.target == null ? null : String(c.target),
      feindeAufCharakter: feinde,
      runtime: runtimeStatus(),
      inventar,
      slots
    };
  }

  function ruheGruende(obs) {
    const gruende = [];
    if (!obs.charakterName) gruende.push('CHARAKTER_FEHLT');
    if (obs.rip) gruende.push('CHARAKTER_TOT');
    if (obs.bewegtSich) gruende.push('CHARAKTER_BEWEGT_SICH');
    if (obs.zielName !== null) gruende.push('CHARAKTER_HAT_ZIEL');
    if (obs.feindeAufCharakter !== 0) gruende.push('CHARAKTER_UNTER_ANGRIFF');
    if (obs.runtime.alternativeRuntimeAktiv) gruende.push('ALTERNATIVE_RUNTIME_AKTIV');
    return gruende;
  }

  function waehleKandidat(obs) {
    if (ruheGruende(obs).length) return null;
    const kandidaten = obs.inventar
      .filter(item => Number.isInteger(item.index)
        && item.index >= 0
        && item.index < 128
        && item.name
        && !item.gesperrt
        && ERLAUBTE_TYPEN[item.typ])
      .map(item => {
        const slot = ERLAUBTE_TYPEN[item.typ];
        const vorher = obs.slots[slot] ?? null;
        return {
          index: item.index,
          itemName: item.name,
          itemLevel: item.level,
          slot,
          slotWarLeer: vorher === null,
          vorherigesSlotItem: vorher
        };
      })
      .sort((a, b) =>
        Number(b.slotWarLeer) - Number(a.slotWarLeer)
        || SLOT_PRIORITAET.indexOf(a.slot) - SLOT_PRIORITAET.indexOf(b.slot)
        || a.index - b.index);
    return kandidaten[0] ?? null;
  }

  function kandidatFingerprint(k) {
    return JSON.stringify({
      index: k.index,
      itemName: k.itemName,
      itemLevel: k.itemLevel,
      slot: k.slot,
      vorherigesSlotItem: k.vorherigesSlotItem
    });
  }

  function liesJournal() {
    const raw = storage().getItem(JOURNAL_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'UNGEKLAERT', fehler: 'JOURNAL_JSON_UNGUELTIG' }; }
  }

  function journalOffen(journal) {
    return !!journal && !['COMMITTED','ABORTED'].includes(journal.status);
  }

  function schreibeJournal(wert) {
    const text = JSON.stringify(wert);
    if (text.length > 12000) throw new Error('R12_TEST_JOURNAL_ZU_GROSS');
    const store = storage();
    store.setItem(JOURNAL_KEY, text);
    const roundtrip = store.getItem(JOURNAL_KEY);
    if (roundtrip !== text) throw new Error('R12_TEST_JOURNAL_ROUNDTRIP_FEHLER');
    return wert;
  }

  function pruefeStorage() {
    const store = storage();
    const probe = JSON.stringify({ schemaVersion: 1, zeit: jetzt(), probe: 'R12' });
    store.setItem(PROBE_KEY, probe);
    const gelesen = store.getItem(PROBE_KEY);
    store.removeItem(PROBE_KEY);
    return { ok: gelesen === probe, art: 'BROWSER_TEST_WITNESS', produktionsPersistenz: false };
  }

  async function passiveVorpruefung() {
    const obs = beobachte();
    const gruende = ruheGruende(obs);
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    if (!performanceTrick.aktiv) gruende.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    const journal = liesJournal();
    if (journalOffen(journal)) gruende.push('VORHERIGER_TESTVERSUCH_UNGEKLAERT');
    const speicher = pruefeStorage();
    if (!speicher.ok) gruende.push('TEST_JOURNAL_NICHT_DURABLE');
    const kandidat = waehleKandidat(obs);
    if (!kandidat) gruende.push('KEIN_SICHERER_EQUIP_KANDIDAT');

    return {
      schemaVersion: 1,
      test: 'R12_CONTROLLED_LIVE_EQUIP',
      phase: 'R12',
      status: gruende.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetzt(),
      breiteRuntimeFreigabe: false,
      performanceTrick,
      actionContractId: ACTION,
      recoveryContractId: RECOVERY,
      verifierId: VERIFIER,
      charakter: obs.charakterName,
      health: {
        rip: obs.rip,
        bewegtSich: obs.bewegtSich,
        zielName: obs.zielName,
        feindeAufCharakter: obs.feindeAufCharakter,
        alternativeRuntimeAktiv: obs.runtime.alternativeRuntimeAktiv
      },
      runtime: obs.runtime,
      kandidat,
      kandidatFingerprint: kandidat ? kandidatFingerprint(kandidat) : null,
      testJournal: {
        speicher,
        bestehenderEintrag: journal ? { status: journal.status, runId: journal.runId ?? null, zeit: journal.zeit ?? null } : null
      },
      blocker: gruende
    };
  }

  function itemAmIndex(obs, index) {
    return obs.inventar.find(x => x.index === index) ?? null;
  }

  function slotGleich(a, b) {
    if (a === null || b === null) return a === b;
    return a.name === b.name && a.level === b.level;
  }

  async function postcondition(kandidat, versuche = 4) {
    let letzte = null;
    for (let i = 0; i < versuche; i += 1) {
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 300));
      const obs = beobachte();
      const slot = obs.slots[kandidat.slot] ?? null;
      const item = itemAmIndex(obs, kandidat.index);
      const slotCommitted = slot?.name === kandidat.itemName && slot?.level === kandidat.itemLevel;
      const inventoryCommitted = kandidat.vorherigesSlotItem === null
        ? item === null
        : item?.name === kandidat.vorherigesSlotItem.name && item?.level === kandidat.vorherigesSlotItem.level;
      const preNochDa = slotGleich(slot, kandidat.vorherigesSlotItem)
        && item?.name === kandidat.itemName
        && item?.level === kandidat.itemLevel;
      letzte = { obs, slot, item, slotCommitted, inventoryCommitted, preNochDa };
      if (slotCommitted && inventoryCommitted) return { klassifikation: 'BESTAETIGT', ...letzte };
    }
    if (letzte?.preNochDa) return { klassifikation: 'NICHT_AUSGEFUEHRT', ...letzte };
    return { klassifikation: 'UNGEKLAERT', ...letzte };
  }

  const gui = guiApi().erstelleTest({
    kennung: 'r12-controlled-live-equip',
    titel: 'V5 · R12 Controlled Live · Equip',
    beschreibung: 'Manueller Ingame-One-Shot. Maximal ein equip-Send. Kein automatischer Retry. Bericht danach mit einem Klick kopieren.'
  });

  let letzterPreflight = null;
  let sendVerbraucht = false;

  function setzeResultat(ergebnis, text) {
    const status = ergebnis.status === 'BESTANDEN'
      ? 'bestanden'
      : ergebnis.status === 'BLOCKIERT'
        ? 'blockiert'
        : ergebnis.status === 'UNGEKLAERT'
          ? 'warnung'
          : 'fehler';
    gui.setzeErgebnis(ergebnis, status, text);
    return ergebnis;
  }

  gui.registriereAktion({
    kennung: 'runtime-stoppen',
    titel: '1 · Alte Runtime stoppen',
    art: 'normal',
    ausfuehren() {
      const performanceTrick = await guiApi().aktivierePerformanceTrick();
      const result = stoppeAltRuntime();
      result.performanceTrick = performanceTrick;
      if (!performanceTrick.aktiv) result.status = 'BLOCKIERT';
      gui.protokolliere('Alte Runtime stoppen', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Keine alte V3/V4-Gameplay-Runtime mehr aktiv; performance_trick ist aktiv.'
        : 'Runtime- oder performance_trick-Vorbedingung ist nicht erfuellt.');
      gui.setzeAktionAktiv('passive-vorpruefung', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'passive-vorpruefung',
    titel: '2 · Passive Vorprüfung',
    art: 'primaer',
    aktiviert: false,
    async ausfuehren() {
      const result = await passiveVorpruefung();
      letzterPreflight = result;
      gui.protokolliere('Passive Vorpruefung', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Vorprüfung bestanden. Genau ein Equip-One-Shot kann freigegeben werden.'
        : 'Vorprüfung blockiert. Keine Spielaktion wurde ausgeführt.');
      gui.setzeAktionAktiv('one-shot', result.status === 'BESTANDEN' && !sendVerbraucht);
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'one-shot',
    titel: '3 · ONE-SHOT equip',
    art: 'gefahr',
    aktiviert: false,
    einmalig: true,
    bestaetigungsText: BESTAETIGUNG,
    async ausfuehren() {
      if (sendVerbraucht) throw new Error('R12_ONE_SHOT_BEREITS_VERBRAUCHT');
      if (!letzterPreflight || letzterPreflight.status !== 'BESTANDEN' || !letzterPreflight.kandidat) {
        throw new Error('R12_PASSIVE_VORPRUEFUNG_FEHLT');
      }

      const frisch = await passiveVorpruefung();
      if (frisch.status !== 'BESTANDEN') {
        setzeResultat(frisch, 'Frische Vorprüfung blockiert. Kein Send.');
        return frisch;
      }
      if (frisch.kandidatFingerprint !== letzterPreflight.kandidatFingerprint) {
        const drift = {
          schemaVersion: 1,
          status: 'BLOCKIERT',
          zeit: jetzt(),
          blocker: ['KANDIDAT_DRIFT_ZWISCHEN_VORPRUEFUNG_UND_SEND'],
          vorher: letzterPreflight.kandidat,
          jetzt: frisch.kandidat
        };
        setzeResultat(drift, 'Kandidat hat sich geändert. Kein Send.');
        return drift;
      }

      const root = fenster();
      const kandidat = frisch.kandidat;
      const id = runId();
      const intent = {
        schemaVersion: 1,
        runId: id,
        status: 'INTENT',
        zeit: jetzt(),
        actionContractId: ACTION,
        recoveryContractId: RECOVERY,
        verifierId: VERIFIER,
        publicFunction: 'equip',
        maximaleAktionen: 1,
        sameIntentRetry: false,
        breiteRuntimeFreigabe: false,
        preflight: {
          charakter: frisch.charakter,
          kandidat,
          health: frisch.health
        }
      };
      schreibeJournal(intent);
      sendVerbraucht = true;
      gui.setzeAktionAktiv('passive-vorpruefung', false);

      let serverErgebnis = null;
      let serverFehler = null;
      try {
        serverErgebnis = await Promise.resolve(root.equip(kandidat.index, kandidat.slot));
      } catch (error) {
        serverFehler = String(error?.message || error);
      }

      const post = await postcondition(kandidat);
      const erfolgreich = post.klassifikation === 'BESTAETIGT';
      const finalStatus = erfolgreich ? 'COMMITTED' : 'UNGEKLAERT';
      const journal = {
        ...intent,
        status: finalStatus,
        abgeschlossenAm: jetzt(),
        sendVersuche: 1,
        serverErgebnis: serverErgebnis ?? null,
        serverFehler,
        postcondition: {
          klassifikation: post.klassifikation,
          slot: post.slot ?? null,
          inventoryIndex: post.item ?? null
        }
      };
      schreibeJournal(journal);

      const result = {
        schemaVersion: 1,
        test: 'R12_CONTROLLED_LIVE_EQUIP',
        phase: 'R12',
        status: erfolgreich ? 'BESTANDEN' : 'UNGEKLAERT',
        zeit: jetzt(),
        runId: id,
        actionContractId: ACTION,
        recoveryContractId: RECOVERY,
        verifierId: VERIFIER,
        publicFunction: 'equip',
        gameWrites: 1,
        unerwarteteGameWrites: 0,
        maximaleAktionen: 1,
        sameIntentRetry: false,
        breiteRuntimeFreigabe: false,
        charakter: frisch.charakter,
        kandidat,
        serverErgebnis: serverErgebnis ?? null,
        serverFehler,
        postcondition: {
          klassifikation: post.klassifikation,
          slot: post.slot ?? null,
          inventoryIndex: post.item ?? null
        },
        testJournal: {
          art: 'BROWSER_TEST_WITNESS',
          produktionsPersistenz: false,
          status: finalStatus
        },
        hinweis: erfolgreich
          ? 'One-Shot postcondition-verifiziert. Keine weitere Spielaktion ausführen; Bericht kopieren und senden.'
          : 'Ausgang ist nicht eindeutig. KEIN Retry. Bericht kopieren und senden.'
      };
      gui.protokolliere('ONE-SHOT Ergebnis', result);
      return setzeResultat(result, erfolgreich
        ? 'BESTANDEN · Genau ein equip-Send, Postcondition bestätigt. Jetzt Gesamtbericht kopieren.'
        : 'UNGEKLÄRT · Kein Retry. Gesamtbericht kopieren und senden.');
    }
  });

  gui.registriereAktion({
    kennung: 'journal-anzeigen',
    titel: 'Testjournal anzeigen',
    ausfuehren() {
      const journal = liesJournal();
      const result = {
        schemaVersion: 1,
        status: journal ? 'INFO' : 'LEER',
        zeit: jetzt(),
        journal
      };
      gui.protokolliere('Testjournal gelesen', result);
      gui.setzeErgebnis(result, 'info', journal ? 'Aktueller Testjournal-Eintrag.' : 'Kein Testjournal vorhanden.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    test: gui,
    status: () => gui.status(),
    passiveVorpruefung,
    runtimeStatus,
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, { configurable: true, enumerable: true, writable: false, value: api });
    }
  } catch {}

  gui.protokolliere('R12 Ingame-Test-GUI bereit', {
    version: VERSION,
    bestaetigungsText: BESTAETIGUNG,
    actionContractId: ACTION,
    maximaleAktionen: 1,
    sameIntentRetry: false,
    breiteRuntimeFreigabe: false
  });
  gui.setzeStatus('bereit', 'Mit „1 · Alte Runtime stoppen“ beginnen.');
})();