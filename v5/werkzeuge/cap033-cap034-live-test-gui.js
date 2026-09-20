(() => {
  'use strict';

  const API_NAME = 'V5Cap033034LiveTest';
  const VERSION = '1.0.0';
  const SESSION_KEY = 'AIO_V5_CAP033034_LIVE_SESSION_V1';
  const JOURNAL_KEY = 'AIO_V5_CAP034_MUTATION_JOURNAL_V1';
  const DAUER_MS = 5 * 60 * 1000;
  const INTERVALL_MS = 15 * 1000;
  const MAX_SAMPLE_GAP_MS = 45 * 1000;
  const MAX_SAMPLES = 30;
  const MIN_PREVIEW_CHANCE = 0.99;
  const MAX_TEST_BASISWERT_GOLD = 100000;
  const UPGRADE_BESTAETIGUNG = 'CAP034-UPGRADE-ONE-SHOT-ITEMVERLUST-AKZEPTIERT';
  const COMPOUND_BESTAETIGUNG = 'CAP034-COMPOUND-ONE-SHOT-3-ITEM-VERLUST-AKZEPTIERT';
  const ERLAUBTE_GEAR_TYPEN = Object.freeze({
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

  function rootFenster() {
    const kandidaten = [];
    try { kandidaten.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) kandidaten.push(parent); } catch {}
    for (const root of kandidaten) {
      try {
        if (root?.character && Array.isArray(root.character.items)
            && root.character.slots && root.G?.items) return root;
      } catch {}
    }
    throw new Error('CAP033034_ADVENTURE_LAND_CODEKONTEXT_FEHLT');
  }

  function guiApi() {
    try { if (globalThis.V5TestGui) return globalThis.V5TestGui; } catch {}
    try { if (parent?.V5TestGui) return parent.V5TestGui; } catch {}
    throw new Error('V5_TEST_GUI_FEHLT');
  }

  function storage() {
    const root = rootFenster();
    try { if (root.localStorage) return root.localStorage; } catch {}
    try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
    throw new Error('CAP033034_STORAGE_FEHLT');
  }

  function jetztIso() { return new Date().toISOString(); }

  function runtimeStatus() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try { if (parent && parent !== globalThis) roots.push(parent); } catch {}
    let v3 = { vorhanden: false, aktiv: false };
    let v4 = { vorhanden: false, aktiv: false };
    for (const root of roots) {
      try {
        const runtime = root?.AIO_V3?.__runtime;
        if (runtime) {
          const status = typeof runtime.status === 'function' ? runtime.status() : null;
          v3 = { vorhanden: true, aktiv: !!(runtime.timer || status?.running === true), status };
        }
      } catch (error) {
        v3 = { vorhanden: true, aktiv: true, fehler: String(error?.message || error) };
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
          v4 = { vorhanden: true, aktiv, status };
        }
      } catch (error) {
        v4 = { vorhanden: true, aktiv: true, fehler: String(error?.message || error) };
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
      aktionen,
      nachher
    };
  }

  function hashText(text) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function itemMenge(item) {
    if (!item) return 0;
    const q = Number(item.q);
    return Number.isFinite(q) && q > 0 ? Math.trunc(q) : 1;
  }

  function itemLocked(item) {
    return item?.l === true || item?.locked === true || item?.lock === true;
  }

  function plainItem(item) {
    if (!item?.name || itemLocked(item)) return false;
    if (item.p != null || item.stat_type != null) return false;
    if (Number(item.grace || 0) !== 0) return false;
    if (item.expires != null || item.gift != null || item.data != null) return false;
    return true;
  }

  function cleanItem(root, item, index) {
    if (!item?.name) return null;
    const def = root.G.items[item.name] || {};
    return {
      index,
      name: String(item.name),
      level: Number(item.level || 0),
      menge: itemMenge(item),
      locked: itemLocked(item),
      plain: plainItem(item),
      typ: String(def.type || ''),
      upgrade: !!def.upgrade,
      compound: !!def.compound,
      cash: def.cash === true || def.cash_item === true,
      quest: def.quest === true || def.q === true,
      event: def.event === true,
      exchange: def.exchange === true || def.e === true,
      basisGold: Number.isFinite(Number(def.g ?? def.gold))
        ? Math.max(0, Math.trunc(Number(def.g ?? def.gold)))
        : 0,
      fingerprint: hashText(JSON.stringify({
        index,
        name: String(item.name),
        level: Number(item.level || 0),
        menge: itemMenge(item),
        locked: itemLocked(item),
        p: item.p ?? null,
        stat_type: item.stat_type ?? null,
        grace: Number(item.grace || 0)
      }))
    };
  }

  function inventarSnapshot(root) {
    return root.character.items
      .map((item, index) => cleanItem(root, item, index))
      .filter(Boolean)
      .slice(0, 128);
  }

  function istGeschuetzt(item) {
    return item.cash || item.quest || item.event || item.exchange;
  }

  function gearKandidat(root, inventar) {
    const rows = inventar
      .filter(x => x.plain && !istGeschuetzt(x) && ERLAUBTE_GEAR_TYPEN[x.typ])
      .map(x => ({
        index: x.index,
        name: x.name,
        level: x.level,
        slot: ERLAUBTE_GEAR_TYPEN[x.typ],
        slotIstLeer: !root.character.slots?.[ERLAUBTE_GEAR_TYPEN[x.typ]],
        fingerprint: x.fingerprint
      }))
      .sort((a, b) =>
        Number(b.slotIstLeer) - Number(a.slotIstLeer)
        || a.level - b.level
        || a.index - b.index);
    return rows[0] ?? null;
  }

  function findeScroll(inventar, typ, name) {
    return inventar.find(x =>
      x.name === name && x.typ === typ && x.menge >= 1 && !x.locked) ?? null;
  }

  function upgradeKandidat(inventar) {
    const scroll = findeScroll(inventar, 'uscroll', 'scroll0');
    if (!scroll) return null;
    const ziel = inventar
      .filter(x =>
        x.upgrade && x.level === 0 && x.plain && !istGeschuetzt(x)
        && x.basisGold > 0 && x.basisGold <= MAX_TEST_BASISWERT_GOLD
        && x.index !== scroll.index)
      .sort((a, b) => a.index - b.index)[0] ?? null;
    if (!ziel) return null;
    return {
      art: 'UPGRADE',
      ziel,
      scroll,
      fingerprint: hashText(JSON.stringify({
        ziel: ziel.fingerprint,
        scroll: scroll.fingerprint
      }))
    };
  }

  function compoundKandidat(inventar) {
    const scroll = findeScroll(inventar, 'cscroll', 'cscroll0');
    if (!scroll) return null;
    const gruppen = {};
    for (const item of inventar) {
      if (!item.compound || item.level !== 0 || !item.plain || istGeschuetzt(item)
          || item.basisGold <= 0 || item.basisGold > MAX_TEST_BASISWERT_GOLD
          || item.index === scroll.index) continue;
      const key = item.name + ':' + item.level;
      if (!gruppen[key]) gruppen[key] = [];
      if (gruppen[key].length < 3) gruppen[key].push(item);
    }
    const key = Object.keys(gruppen).sort().find(k => gruppen[k].length >= 3);
    if (!key) return null;
    const ziele = gruppen[key].slice(0, 3);
    return {
      art: 'COMPOUND',
      ziele,
      scroll,
      fingerprint: hashText(JSON.stringify({
        ziele: ziele.map(x => x.fingerprint),
        scroll: scroll.fingerprint
      }))
    };
  }

  function qStatus(root) {
    return {
      upgrade: root.character?.q?.upgrade ?? null,
      compound: root.character?.q?.compound ?? null
    };
  }

  function beobachte() {
    const root = rootFenster();
    const inventar = inventarSnapshot(root);
    const runtime = runtimeStatus();
    const gear = gearKandidat(root, inventar);
    const upgrade = upgradeKandidat(inventar);
    const compound = compoundKandidat(inventar);
    return {
      zeitMs: Date.now(),
      charakter: String(root.character?.name || ''),
      rip: !!root.character?.rip,
      bewegtSich: !!root.character?.moving,
      ziel: root.character?.target == null ? null : String(root.character.target),
      runtime,
      q: qStatus(root),
      inventar,
      inventarFingerprint: hashText(JSON.stringify(inventar)),
      gear,
      upgrade,
      compound
    };
  }

  function blockerFuerLive(obs) {
    const blocker = [];
    if (!obs.charakter) blocker.push('CHARAKTER_FEHLT');
    if (obs.rip) blocker.push('CHARAKTER_TOT');
    if (obs.bewegtSich) blocker.push('CHARAKTER_BEWEGT_SICH');
    if (obs.ziel !== null) blocker.push('CHARAKTER_HAT_ZIEL');
    if (obs.runtime.alternativeRuntimeAktiv) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (obs.q.upgrade || obs.q.compound) blocker.push('MUTATIONS_Q_BEREITS_AKTIV');
    return blocker;
  }

  function liesSession() {
    const raw = storage().getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT', samples: [] }; }
  }

  function schreibeSession(session) {
    const text = JSON.stringify(session);
    if (text.length > 900000) throw new Error('CAP033034_SESSION_ZU_GROSS');
    storage().setItem(SESSION_KEY, text);
    if (storage().getItem(SESSION_KEY) !== text) {
      throw new Error('CAP033034_SESSION_ROUNDTRIP_FEHLER');
    }
  }

  function liesJournal() {
    const raw = storage().getItem(JOURNAL_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return { status: 'BESCHAEDIGT' }; }
  }

  function journalOffen(journal) {
    return !!journal && !['COMMITTED','ABORTED'].includes(journal.status);
  }

  function schreibeJournal(journal) {
    const text = JSON.stringify(journal);
    if (text.length > 20000) throw new Error('CAP034_JOURNAL_ZU_GROSS');
    storage().setItem(JOURNAL_KEY, text);
    if (storage().getItem(JOURNAL_KEY) !== text) {
      throw new Error('CAP034_JOURNAL_ROUNDTRIP_FEHLER');
    }
  }

  function validiereKette(samples) {
    if (!Array.isArray(samples) || samples.length > MAX_SAMPLES) return false;
    let vorher = null;
    for (let i = 0; i < samples.length; i += 1) {
      const s = samples[i];
      if (!s || s.sequenz !== i + 1 || s.vorherigerFingerprint !== vorher) return false;
      const basis = { ...s };
      delete basis.evidenceFingerprint;
      if (s.evidenceFingerprint !== hashText(JSON.stringify(basis))) return false;
      vorher = s.evidenceFingerprint;
    }
    return true;
  }

  function sampleErstellen(session) {
    const obs = beobachte();
    const vorher = session.samples.at(-1) || null;
    const basis = {
      schemaVersion: 1,
      sequenz: session.samples.length + 1,
      zeitMs: obs.zeitMs,
      seitStartMs: obs.zeitMs - session.gestartetAmMs,
      vorherigerFingerprint: vorher?.evidenceFingerprint ?? null,
      gapMs: vorher ? obs.zeitMs - vorher.zeitMs : 0,
      charakter: obs.charakter,
      rip: obs.rip,
      alternativeRuntimeAktiv: obs.runtime.alternativeRuntimeAktiv,
      performanceTrickAktiv: guiApi().performanceTrickStatus().aktiv === true,
      qUpgradeAktiv: !!obs.q.upgrade,
      qCompoundAktiv: !!obs.q.compound,
      inventarFingerprint: obs.inventarFingerprint,
      gearKandidat: obs.gear,
      upgradeKandidat: obs.upgrade,
      compoundKandidat: obs.compound,
      gameplayWritesDurchHarness: 0
    };
    return Object.freeze({
      ...basis,
      evidenceFingerprint: hashText(JSON.stringify(basis))
    });
  }

  function bewerteShadow(session) {
    const samples = session.samples;
    const letzter = samples.at(-1);
    const dauerMs = letzter ? letzter.zeitMs - session.gestartetAmMs : 0;
    const blocker = [];
    const gaps = samples.filter(x => x.gapMs > MAX_SAMPLE_GAP_MS).length;
    const gearSamples = samples.filter(x => x.gearKandidat !== null).length;
    const mutationSamples = samples.filter(x =>
      x.upgradeKandidat !== null || x.compoundKandidat !== null).length;
    if (dauerMs < DAUER_MS) blocker.push('DAUER_UNTER_5M');
    if (samples.length < 20) blocker.push('ZU_WENIGE_SAMPLES');
    if (!validiereKette(samples)) blocker.push('EVIDENCE_KETTE_UNGUELTIG');
    if (gaps !== 0) blocker.push('SAMPLE_GAPS');
    if (samples.some(x => x.rip)) blocker.push('CHARAKTER_TOT');
    if (samples.some(x => x.alternativeRuntimeAktiv)) blocker.push('ALTERNATIVE_RUNTIME_AKTIV');
    if (samples.some(x => !x.performanceTrickAktiv)) blocker.push('PERFORMANCE_TRICK_AUSGEFALLEN');
    if (samples.some(x => x.qUpgradeAktiv || x.qCompoundAktiv)) blocker.push('UNERWARTETE_MUTATIONS_Q');
    if (gearSamples === 0) blocker.push('CAP033_KEIN_GEAR_KANDIDAT_BEOBACHTET');
    if (mutationSamples === 0) blocker.push('CAP034_KEIN_MUTATIONS_KANDIDAT_BEOBACHTET');
    return {
      schemaVersion: 1,
      test: 'CAP033_CAP034_FUNKTION_5M_LIVE_SHADOW',
      testzeitStandard: 'FUNKTION_5M',
      status: blocker.length ? 'NICHT_BESTANDEN' : 'BESTANDEN',
      dauerMs,
      sampleAnzahl: samples.length,
      sampleGaps: gaps,
      evidenceKetteGueltig: validiereKette(samples),
      cap033GearKandidatSamples: gearSamples,
      cap034MutationsKandidatSamples: mutationSamples,
      gameplayWritesDurchHarness: 0,
      unerwarteteGameWrites: 0,
      blocker,
      hinweis: blocker.length
        ? 'Live-Shadow nicht bestanden. Vor Mutation Bericht auswerten.'
        : '5-Minuten-Live-Shadow bestanden. Controlled-Live-Preview kann folgen.'
    };
  }

  async function passiveVorpruefung() {
    const obs = beobachte();
    const blocker = blockerFuerLive(obs);
    const performanceTrick = await guiApi().aktivierePerformanceTrick();
    if (!performanceTrick.aktiv) blocker.push('PERFORMANCE_TRICK_NICHT_AKTIV');
    const journal = liesJournal();
    if (journalOffen(journal)) blocker.push('VORHERIGE_MUTATION_UNGEKLAERT');
    if (!obs.gear) blocker.push('CAP033_KEIN_GEAR_KANDIDAT');
    if (!obs.upgrade && !obs.compound) blocker.push('CAP034_KEIN_TESTKANDIDAT');
    return {
      schemaVersion: 1,
      status: blocker.length ? 'BLOCKIERT' : 'BESTANDEN',
      zeit: jetztIso(),
      charakter: obs.charakter,
      performanceTrick,
      runtime: obs.runtime,
      q: obs.q,
      cap033GearKandidat: obs.gear,
      cap034UpgradeKandidat: obs.upgrade,
      cap034CompoundKandidat: obs.compound,
      blocker,
      gameplayWritesDurchHarness: 0
    };
  }

  function previewChance(result) {
    const kandidaten = [
      result?.chance,
      result?.probability,
      result?.p,
      typeof result === 'number' ? result : null
    ];
    for (const wert of kandidaten) {
      const n = Number(wert);
      if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
    }
    return null;
  }

  async function rufeUpgrade(root, kandidat, nurBerechnen) {
    return Promise.resolve(
      root.upgrade(
        kandidat.ziel.index,
        kandidat.scroll.index,
        null,
        nurBerechnen
      )
    );
  }

  async function rufeCompound(root, kandidat, nurBerechnen) {
    return Promise.resolve(
      root.compound(
        kandidat.ziele[0].index,
        kandidat.ziele[1].index,
        kandidat.ziele[2].index,
        kandidat.scroll.index,
        null,
        nurBerechnen
      )
    );
  }

  function shadowBestanden() {
    const session = liesSession();
    return session?.status === 'COMPLETED'
      && session?.result?.status === 'BESTANDEN';
  }

  async function preview(art) {
    if (!shadowBestanden()) {
      throw new Error('CAP033034_5M_SHADOW_FEHLT');
    }
    const pre = await passiveVorpruefung();
    if (pre.status !== 'BESTANDEN') return pre;
    const obs = beobachte();
    const kandidat = art === 'UPGRADE' ? obs.upgrade : obs.compound;
    if (!kandidat) {
      return { status: 'BLOCKIERT', blocker: ['KANDIDAT_FEHLT'], art };
    }
    const root = rootFenster();
    let result;
    try {
      result = art === 'UPGRADE'
        ? await rufeUpgrade(root, kandidat, true)
        : await rufeCompound(root, kandidat, true);
    } catch (error) {
      return {
        status: 'BLOCKIERT',
        art,
        blocker: ['SERVER_PREVIEW_ABGELEHNT'],
        serverFehler: String(error?.message || error),
        kandidat
      };
    }
    const chance = previewChance(result);
    return {
      schemaVersion: 1,
      status: chance !== null && chance >= MIN_PREVIEW_CHANCE
        ? 'BESTANDEN'
        : 'BLOCKIERT',
      art,
      kandidat,
      kandidatFingerprint: kandidat.fingerprint,
      previewChance: chance,
      minimalePreviewChance: MIN_PREVIEW_CHANCE,
      serverPreview: result ?? null,
      previewVerbrauchtNichts: true,
      gameplayWritesDurchHarness: 0,
      blocker: chance === null
        ? ['PREVIEW_CHANCE_NICHT_LESBAR']
        : chance < MIN_PREVIEW_CHANCE
          ? ['PREVIEW_CHANCE_UNTER_TESTGRENZE']
          : []
    };
  }

  function itemAmIndex(root, index) {
    return cleanItem(root, root.character.items[index], index);
  }

  function scrollMenge(root, index) {
    return itemMenge(root.character.items[index]);
  }

  async function warteTerminal(art, kandidat, pre, timeoutMs = 30000) {
    const start = Date.now();
    let qGesehen = false;
    while (Date.now() - start <= timeoutMs) {
      const root = rootFenster();
      const q = qStatus(root);
      if (art === 'UPGRADE' && q.upgrade) qGesehen = true;
      if (art === 'COMPOUND' && q.compound) qGesehen = true;
      const aktiv = art === 'UPGRADE' ? !!q.upgrade : !!q.compound;
      if (!aktiv && (qGesehen || Date.now() - start > 1200)) {
        const scrollNachher = scrollMenge(root, kandidat.scroll.index);
        if (art === 'UPGRADE') {
          const ziel = itemAmIndex(root, kandidat.ziel.index);
          const success = ziel?.name === kandidat.ziel.name
            && ziel?.level === kandidat.ziel.level + 1;
          const preUnveraendert = ziel?.fingerprint === kandidat.ziel.fingerprint
            && scrollNachher === pre.scrollMenge;
          const konsumiert = scrollNachher < pre.scrollMenge;
          return {
            klassifikation: success
              ? 'BESTAETIGT_ERFOLG'
              : konsumiert && !preUnveraendert
                ? 'BESTAETIGT_ERWARTETER_FEHLER_ODER_VERLUST'
                : preUnveraendert && !qGesehen
                  ? 'NICHT_AUSGEFUEHRT'
                  : 'UNGEKLAERT',
            qGesehen,
            ziel,
            scrollMengeVorher: pre.scrollMenge,
            scrollMengeNachher: scrollNachher
          };
        }
        const ziele = kandidat.ziele.map(x => itemAmIndex(root, x.index));
        const success = ziele[0]?.name === kandidat.ziele[0].name
          && ziele[0]?.level === kandidat.ziele[0].level + 1
          && ziele[1] === null && ziele[2] === null;
        const allePre = ziele.every((x, i) =>
          x?.fingerprint === kandidat.ziele[i]?.fingerprint);
        const konsumiert = scrollNachher < pre.scrollMenge;
        return {
          klassifikation: success
            ? 'BESTAETIGT_ERFOLG'
            : konsumiert && ziele.every(x => x === null)
              ? 'BESTAETIGT_COMPOUND_VERLUST'
              : allePre && !qGesehen && !konsumiert
                ? 'NICHT_AUSGEFUEHRT'
                : 'UNGEKLAERT',
          qGesehen,
          ziele,
          scrollMengeVorher: pre.scrollMenge,
          scrollMengeNachher: scrollNachher
        };
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return { klassifikation: 'UNGEKLAERT_TIMEOUT', qGesehen };
  }

  let letzterUpgradePreview = null;
  let letzterCompoundPreview = null;
  let sendVerbraucht = false;
  let shadowTimer = null;
  let countdownTimer = null;
  let sampling = false;

  const gui = guiApi().erstelleTest({
    kennung: 'cap033-cap034-live-function-test',
    titel: 'V5 · CAP-033/034 · Echte Funktionsabnahme',
    beschreibung: 'Zuerst 5 Minuten echte Live-Shadow-Evidence ohne Write. Danach optional exakt ein manuell bestaetigter Upgrade- ODER Compound-Send mit Postcondition und ohne Retry.'
  });

  function setzeResultat(result, text) {
    const status = result.status === 'BESTANDEN'
      ? 'bestanden'
      : result.status === 'BLOCKIERT'
        ? 'blockiert'
        : result.status === 'NICHT_BESTANDEN'
          ? 'fehler'
          : result.status === 'UNGEKLAERT'
            ? 'warnung'
            : 'info';
    gui.setzeErgebnis(result, status, text);
    return result;
  }

  function restzeitMs(session) {
    return Math.max(0, DAUER_MS - (Date.now() - session.gestartetAmMs));
  }

  function stoppeCountdown(abgeschlossen = false) {
    if (countdownTimer !== null) clearInterval(countdownTimer);
    countdownTimer = null;
    if (abgeschlossen) gui.setzeRestzeit(0, '5-Minuten-Testdauer erreicht');
    else gui.setzeRestzeit(null);
  }

  async function shadowTick() {
    if (sampling) return;
    sampling = true;
    try {
      const session = liesSession();
      if (!session || session.status !== 'RUNNING') return;
      if (!validiereKette(session.samples)) {
        throw new Error('CAP033034_EVIDENCE_KETTE_MANIPULIERT');
      }
      const sample = sampleErstellen(session);
      const samples = [...session.samples, sample];
      if (samples.length > MAX_SAMPLES) {
        throw new Error('CAP033034_SAMPLE_GRENZE_UEBERSCHRITTEN');
      }
      const aktualisiert = { ...session, samples };
      schreibeSession(aktualisiert);
      gui.setzeRestzeit(restzeitMs(aktualisiert), 'Verbleibende Live-Shadow-Dauer');
      gui.setzeErgebnis({
        status: 'LAEUFT',
        seitStartMs: sample.seitStartMs,
        sampleAnzahl: samples.length,
        gearKandidat: sample.gearKandidat,
        upgradeKandidat: sample.upgradeKandidat,
        compoundKandidat: sample.compoundKandidat,
        gameplayWritesDurchHarness: 0
      }, 'laeuft', 'CAP-033/034 Live-Shadow laeuft.');
      if (sample.seitStartMs >= DAUER_MS) {
        if (shadowTimer !== null) clearInterval(shadowTimer);
        shadowTimer = null;
        stoppeCountdown(true);
        const finalSession = {
          ...aktualisiert,
          status: 'COMPLETED',
          abgeschlossenAmMs: Date.now()
        };
        const result = bewerteShadow(finalSession);
        schreibeSession({ ...finalSession, result });
        gui.protokolliere('5m Live-Shadow abgeschlossen', result);
        setzeResultat(result, result.status === 'BESTANDEN'
          ? '5m Live-Shadow BESTANDEN. Jetzt Preview ausfuehren.'
          : '5m Live-Shadow NICHT BESTANDEN. Kein Mutations-Send.');
        gui.setzeAktionAktiv('preview-upgrade', result.status === 'BESTANDEN');
        gui.setzeAktionAktiv('preview-compound', result.status === 'BESTANDEN');
      }
    } finally {
      sampling = false;
    }
  }

  gui.registriereAktion({
    kennung: 'runtime-stoppen',
    titel: '1 · Alte Runtime stoppen',
    async ausfuehren() {
      const performanceTrick = await guiApi().aktivierePerformanceTrick();
      const result = stoppeAltRuntime();
      result.performanceTrick = performanceTrick;
      if (!performanceTrick.aktiv) result.status = 'BLOCKIERT';
      gui.protokolliere('Runtime-Stopp', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Alte Runtime gestoppt; Performance-Trick aktiv.'
        : 'Runtime-Stopp oder Performance-Trick blockiert.');
      gui.setzeAktionAktiv('vorpruefung', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'vorpruefung',
    titel: '2 · Live-Vorprüfung',
    aktiviert: false,
    art: 'primaer',
    async ausfuehren() {
      const result = await passiveVorpruefung();
      gui.protokolliere('Live-Vorpruefung', result);
      setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Vorprüfung bestanden. 5-Minuten-Test kann starten.'
        : 'Vorprüfung blockiert. Keine Mutation.');
      gui.setzeAktionAktiv('shadow-start', result.status === 'BESTANDEN');
      return result;
    }
  });

  gui.registriereAktion({
    kennung: 'shadow-start',
    titel: '3 · 5m Live-Shadow starten',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: 'CAP033034-5M-LIVE-SHADOW-START',
    async ausfuehren() {
      const pre = await passiveVorpruefung();
      if (pre.status !== 'BESTANDEN') return setzeResultat(pre, 'Frische Vorprüfung blockiert.');
      const session = {
        schemaVersion: 1,
        status: 'RUNNING',
        gestartetAmMs: Date.now(),
        samples: [],
        gameplayWritesDurchHarness: 0
      };
      schreibeSession(session);
      gui.setzeRestzeit(DAUER_MS, 'Verbleibende Live-Shadow-Dauer');
      countdownTimer = setInterval(() => {
        const s = liesSession();
        if (s?.status === 'RUNNING') gui.setzeRestzeit(restzeitMs(s), 'Verbleibende Live-Shadow-Dauer');
      }, 1000);
      await shadowTick();
      shadowTimer = setInterval(() => { void shadowTick(); }, INTERVALL_MS);
      return { status: 'LAEUFT', dauerMs: DAUER_MS, gameplayWritesDurchHarness: 0 };
    }
  });

  gui.registriereAktion({
    kennung: 'preview-upgrade',
    titel: '4a · Upgrade Preview',
    aktiviert: false,
    async ausfuehren() {
      letzterUpgradePreview = await preview('UPGRADE');
      gui.protokolliere('Upgrade Preview', letzterUpgradePreview);
      setzeResultat(letzterUpgradePreview, letzterUpgradePreview.status === 'BESTANDEN'
        ? 'Upgrade Preview bestanden. One-Shot kann manuell freigegeben werden.'
        : 'Upgrade Preview blockiert.');
      gui.setzeAktionAktiv('one-shot-upgrade', letzterUpgradePreview.status === 'BESTANDEN' && !sendVerbraucht);
      return letzterUpgradePreview;
    }
  });

  gui.registriereAktion({
    kennung: 'preview-compound',
    titel: '4b · Compound Preview',
    aktiviert: false,
    async ausfuehren() {
      letzterCompoundPreview = await preview('COMPOUND');
      gui.protokolliere('Compound Preview', letzterCompoundPreview);
      setzeResultat(letzterCompoundPreview, letzterCompoundPreview.status === 'BESTANDEN'
        ? 'Compound Preview bestanden. One-Shot kann manuell freigegeben werden.'
        : 'Compound Preview blockiert.');
      gui.setzeAktionAktiv('one-shot-compound', letzterCompoundPreview.status === 'BESTANDEN' && !sendVerbraucht);
      return letzterCompoundPreview;
    }
  });

  async function oneShot(art, previewResult) {
    if (sendVerbraucht) throw new Error('CAP034_ONE_SHOT_BEREITS_VERBRAUCHT');
    if (!previewResult || previewResult.status !== 'BESTANDEN') {
      throw new Error('CAP034_PREVIEW_FEHLT');
    }
    const preflight = await passiveVorpruefung();
    if (preflight.status !== 'BESTANDEN') return preflight;
    const obs = beobachte();
    const kandidat = art === 'UPGRADE' ? obs.upgrade : obs.compound;
    if (!kandidat || kandidat.fingerprint !== previewResult.kandidatFingerprint) {
      return {
        status: 'BLOCKIERT',
        blocker: ['KANDIDAT_DRIFT_SEIT_PREVIEW'],
        vorher: previewResult.kandidat,
        jetzt: kandidat
      };
    }
    const frischPreview = await preview(art);
    if (frischPreview.status !== 'BESTANDEN'
        || frischPreview.kandidatFingerprint !== kandidat.fingerprint) {
      return {
        status: 'BLOCKIERT',
        blocker: ['FRISCHE_PREVIEW_BLOCKIERT_ODER_DRIFT'],
        frischPreview
      };
    }

    const root = rootFenster();
    const runId = 'CAP034-' + art + '-' + Date.now();
    const pre = {
      inventarFingerprint: obs.inventarFingerprint,
      scrollMenge: scrollMenge(root, kandidat.scroll.index),
      q: obs.q
    };
    const intent = {
      schemaVersion: 1,
      runId,
      status: 'INTENT',
      zeit: jetztIso(),
      art,
      actionContractId: art === 'UPGRADE' ? 'AL-ACTION-UPGRADE' : 'AL-ACTION-COMPOUND',
      recoveryContractId: art === 'UPGRADE' ? 'AL-RECOVERY-UPGRADE' : 'AL-RECOVERY-COMPOUND',
      verifierId: art === 'UPGRADE' ? 'AL-VERIFIER-UPGRADE' : 'AL-VERIFIER-COMPOUND',
      kandidat,
      kandidatFingerprint: kandidat.fingerprint,
      previewChance: frischPreview.previewChance,
      maximaleAktionen: 1,
      sameIntentRetry: false,
      pre
    };
    schreibeJournal(intent);
    sendVerbraucht = true;
    gui.setzeAktionAktiv('one-shot-upgrade', false);
    gui.setzeAktionAktiv('one-shot-compound', false);

    let serverErgebnis = null;
    let serverFehler = null;
    try {
      serverErgebnis = art === 'UPGRADE'
        ? await rufeUpgrade(root, kandidat, false)
        : await rufeCompound(root, kandidat, false);
    } catch (error) {
      serverFehler = String(error?.message || error);
    }

    const post = await warteTerminal(art, kandidat, pre);
    const bestaetigt = post.klassifikation.startsWith('BESTAETIGT_');
    const finalStatus = bestaetigt ? 'COMMITTED' : 'UNGEKLAERT';
    const journal = {
      ...intent,
      status: finalStatus,
      abgeschlossenAm: jetztIso(),
      sendVersuche: 1,
      serverErgebnis: serverErgebnis ?? null,
      serverFehler,
      postcondition: post
    };
    schreibeJournal(journal);

    return {
      schemaVersion: 1,
      test: 'CAP034_CONTROLLED_LIVE_' + art,
      status: bestaetigt ? 'BESTANDEN' : 'UNGEKLAERT',
      runId,
      art,
      actionContractId: intent.actionContractId,
      recoveryContractId: intent.recoveryContractId,
      verifierId: intent.verifierId,
      kandidat,
      previewChance: frischPreview.previewChance,
      gameWrites: 1,
      unerwarteteGameWrites: 0,
      maximaleAktionen: 1,
      sameIntentRetry: false,
      serverErgebnis: serverErgebnis ?? null,
      serverFehler,
      postcondition: post,
      hinweis: bestaetigt
        ? 'Controlled-Live-One-Shot postcondition-verifiziert. Bericht kopieren.'
        : 'Ausgang ungeklärt. KEIN Retry. Bericht kopieren.'
    };
  }

  gui.registriereAktion({
    kennung: 'one-shot-upgrade',
    titel: '5a · ONE-SHOT Upgrade',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: UPGRADE_BESTAETIGUNG,
    async ausfuehren() {
      const result = await oneShot('UPGRADE', letzterUpgradePreview);
      gui.protokolliere('Upgrade ONE-SHOT', result);
      return setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Upgrade BESTANDEN. Gesamtbericht kopieren.'
        : 'Upgrade nicht eindeutig. KEIN Retry; Bericht kopieren.');
    }
  });

  gui.registriereAktion({
    kennung: 'one-shot-compound',
    titel: '5b · ONE-SHOT Compound',
    aktiviert: false,
    art: 'gefahr',
    einmalig: true,
    bestaetigungsText: COMPOUND_BESTAETIGUNG,
    async ausfuehren() {
      const result = await oneShot('COMPOUND', letzterCompoundPreview);
      gui.protokolliere('Compound ONE-SHOT', result);
      return setzeResultat(result, result.status === 'BESTANDEN'
        ? 'Compound BESTANDEN. Gesamtbericht kopieren.'
        : 'Compound nicht eindeutig. KEIN Retry; Bericht kopieren.');
    }
  });

  gui.registriereAktion({
    kennung: 'status',
    titel: 'Status / Journal',
    ausfuehren() {
      const result = {
        status: 'INFO',
        session: liesSession(),
        journal: liesJournal(),
        sendVerbraucht
      };
      gui.protokolliere('Status gelesen', result);
      gui.setzeErgebnis(result, 'info', 'Aktueller Teststatus.');
      return result;
    }
  });

  const api = Object.freeze({
    version: VERSION,
    test: gui,
    passiveVorpruefung,
    beobachte,
    status: () => ({ session: liesSession(), journal: liesJournal(), sendVerbraucht }),
    kopiereBericht: () => gui.kopiereBericht()
  });

  try { delete globalThis[API_NAME]; } catch {}
  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (parent && parent !== globalThis) {
      try { delete parent[API_NAME]; } catch {}
      Object.defineProperty(parent, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}

  gui.protokolliere('CAP-033/034 Live-Test bereit', {
    version: VERSION,
    testzeitStandard: 'FUNKTION_5M',
    dauerMs: DAUER_MS,
    intervallMs: INTERVALL_MS,
    minPreviewChance: MIN_PREVIEW_CHANCE,
    maxTestBasiswertGold: MAX_TEST_BASISWERT_GOLD,
    maximaleMutationsWritesProLauf: 1,
    sameIntentRetry: false,
    upgradeBestaetigung: UPGRADE_BESTAETIGUNG,
    compoundBestaetigung: COMPOUND_BESTAETIGUNG
  });
  gui.setzeStatus('bereit', 'Mit „1 · Alte Runtime stoppen“ beginnen.');
})();
