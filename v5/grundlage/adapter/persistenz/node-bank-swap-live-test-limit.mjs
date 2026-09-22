const PFAD = "runtime/canary/bank-swap-evening/live-test-limit.json";

function sha(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/i.test(value)) {
    throw new Error("BANK_SWAP_TESTLIMIT_SOURCE_SHA_UNGUELTIG");
  }
  return value.toLowerCase();
}
function text(value, name, max = 192) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    throw new Error("BANK_SWAP_TESTLIMIT_TEXT_UNGUELTIG:" + name);
  }
  return value;
}
function fp(value, name) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("BANK_SWAP_TESTLIMIT_FP_UNGUELTIG:" + name);
  }
  return value.toLowerCase();
}
function kandidat(value) {
  if (!value || typeof value !== "object"
      || !/^items[0-9]+$/.test(String(value.pack || ""))
      || !Number.isInteger(value.a) || value.a < 0 || value.a > 41
      || !Number.isInteger(value.b) || value.b < 0 || value.b > 41
      || value.a === value.b
      || !value.itemA || !value.itemB) {
    throw new Error("BANK_SWAP_TESTLIMIT_KANDIDAT_UNGUELTIG");
  }
  const aName = text(value.itemA.name, "itemA.name");
  const bName = text(value.itemB.name, "itemB.name");
  if (aName === bName) throw new Error("BANK_SWAP_TESTLIMIT_STACK_RISIKO");
  return Object.freeze({
    pack: String(value.pack),
    a: value.a,
    b: value.b,
    itemA: Object.freeze({ name: aName, fingerprint: fp(value.itemA.fingerprint, "itemA") }),
    itemB: Object.freeze({ name: bName, fingerprint: fp(value.itemB.fingerprint, "itemB") }),
    packRestFingerprint: fp(value.packRestFingerprint, "packRest"),
    inventoryFingerprint: fp(value.inventoryFingerprint, "inventory"),
    characterGold: value.characterGold,
    bankGold: value.bankGold,
  });
}
function pruefeZahlen(k) {
  if (!Number.isSafeInteger(k.characterGold) || k.characterGold < 0
      || !Number.isSafeInteger(k.bankGold) || k.bankGold < 0) {
    throw new Error("BANK_SWAP_TESTLIMIT_GOLD_UNGUELTIG");
  }
}
function reverseVonErstem(erster, zweiter) {
  return erster.pack === zweiter.pack
    && erster.a === zweiter.a
    && erster.b === zweiter.b
    && erster.itemA.fingerprint === zweiter.itemB.fingerprint
    && erster.itemB.fingerprint === zweiter.itemA.fingerprint
    && erster.packRestFingerprint === zweiter.packRestFingerprint
    && erster.inventoryFingerprint === zweiter.inventoryFingerprint
    && erster.characterGold === zweiter.characterGold
    && erster.bankGold === zweiter.bankGold;
}
function leer(sourceSha) {
  return Object.freeze({
    schemaVersion: 1,
    sourceSha,
    maximaleEchteFunktionstests: 2,
    attempts: Object.freeze([]),
  });
}
function validiereState(value) {
  if (!value || value.schemaVersion !== 1
      || value.maximaleEchteFunktionstests !== 2
      || !Array.isArray(value.attempts)
      || value.attempts.length > 2) {
    throw new Error("BANK_SWAP_TESTLIMIT_STATE_UNGUELTIG");
  }
  const sourceSha = sha(value.sourceSha);
  return Object.freeze({
    schemaVersion: 1,
    sourceSha,
    maximaleEchteFunktionstests: 2,
    attempts: Object.freeze(value.attempts.map((x, i) => Object.freeze({
      ...x,
      testNummer: i + 1,
      sourceSha: sha(x.sourceSha),
      transaktionsId: text(x.transaktionsId, "tx"),
      prestate: kandidat(x.prestate),
    }))),
  });
}

export class NodeBankSwapLiveTestLimit {
  constructor(dateisystem) {
    if (!dateisystem
        || typeof dateisystem.liesText !== "function"
        || typeof dateisystem.schreibeAtomarDurable !== "function") {
      throw new Error("BANK_SWAP_TESTLIMIT_DATEISYSTEM_UNGUELTIG");
    }
    this.ds = dateisystem;
  }

  async lade(sourceSha) {
    const s = sha(sourceSha);
    const raw = await this.ds.liesText(PFAD);
    if (raw === undefined) return leer(s);
    if (raw.length < 2 || raw.length > 500_000) {
      throw new Error("BANK_SWAP_TESTLIMIT_DATEI_UNGUELTIG");
    }
    let state;
    try { state = validiereState(JSON.parse(raw)); }
    catch (e) { throw new Error("BANK_SWAP_TESTLIMIT_PARSE_ODER_STATE_FEHLER:" + String(e?.message || e)); }
    if (state.sourceSha !== s) {
      throw new Error("BANK_SWAP_TESTLIMIT_SOURCE_DRIFT:" + state.sourceSha + ":" + s);
    }
    return state;
  }

  async pruefeVorTest({ sourceSha, testNummer, prestate }) {
    const s = sha(sourceSha);
    if (testNummer !== 1 && testNummer !== 2) {
      throw new Error("BANK_SWAP_TESTLIMIT_TESTNUMMER_UNGUELTIG");
    }
    const k = kandidat(prestate); pruefeZahlen(k);
    const state = await this.lade(s);
    if (testNummer === 1) {
      if (state.attempts.length !== 0) {
        throw new Error("BANK_SWAP_TESTLIMIT_TEST_1_BEREITS_VERBRAUCHT");
      }
    } else {
      if (state.attempts.length !== 1) {
        throw new Error("BANK_SWAP_TESTLIMIT_TEST_2_REIHENFOLGE_BLOCKIERT");
      }
      const first = state.attempts[0];
      if (first.status !== "COMMITTED_BESTAETIGT") {
        throw new Error("BANK_SWAP_TESTLIMIT_TEST_1_NICHT_SAUBER");
      }
      if (!reverseVonErstem(first.prestate, k)) {
        throw new Error("BANK_SWAP_TESTLIMIT_TEST_2_IST_NICHT_EXAKTER_REVERSE");
      }
    }
    return Object.freeze({ bereit: true, testNummer, sourceSha: s, prestate: k });
  }

  async armiereMoeglichenSend({ sourceSha, testNummer, transaktionsId, prestate, zeitMs }) {
    if (!Number.isSafeInteger(zeitMs) || zeitMs < 0) {
      throw new Error("BANK_SWAP_TESTLIMIT_ZEIT_UNGUELTIG");
    }
    text(transaktionsId, "tx");
    const gate = await this.pruefeVorTest({ sourceSha, testNummer, prestate });
    const state = await this.lade(gate.sourceSha);
    const attempt = Object.freeze({
      schemaVersion: 1,
      testNummer,
      sourceSha: gate.sourceSha,
      transaktionsId,
      status: "MOEGLICHER_SEND_ARMED",
      armiertAmMs: zeitMs,
      prestate: gate.prestate,
      sameIntentRetry: false,
    });
    const next = Object.freeze({
      ...state,
      attempts: Object.freeze([...state.attempts, attempt]),
    });
    await this.ds.schreibeAtomarDurable(
      PFAD,
      JSON.stringify(next, null, 2) + "\n",
      "bank-swap-live-test-limit-arm-" + testNummer + "-" + zeitMs,
    );
    return attempt;
  }

  async finalisiere({ sourceSha, transaktionsId, sauberCommitted, ergebnis, zeitMs }) {
    if (!Number.isSafeInteger(zeitMs) || zeitMs < 0) {
      throw new Error("BANK_SWAP_TESTLIMIT_FINAL_ZEIT_UNGUELTIG");
    }
    const state = await this.lade(sourceSha);
    if (state.attempts.length < 1) throw new Error("BANK_SWAP_TESTLIMIT_KEIN_ARMED_TEST");
    const last = state.attempts[state.attempts.length - 1];
    if (last.transaktionsId !== transaktionsId || last.status !== "MOEGLICHER_SEND_ARMED") {
      throw new Error("BANK_SWAP_TESTLIMIT_FINAL_BINDUNG_UNGUELTIG");
    }
    const replacement = Object.freeze({
      ...last,
      status: sauberCommitted ? "COMMITTED_BESTAETIGT" : "NICHT_SAUBER_ABGESCHLOSSEN",
      finalisiertAmMs: zeitMs,
      ergebnis: Object.freeze({ ...(ergebnis ?? {}) }),
      sameIntentRetry: false,
    });
    const attempts = [...state.attempts];
    attempts[attempts.length - 1] = replacement;
    const next = Object.freeze({ ...state, attempts: Object.freeze(attempts) });
    await this.ds.schreibeAtomarDurable(
      PFAD,
      JSON.stringify(next, null, 2) + "\n",
      "bank-swap-live-test-limit-final-" + last.testNummer + "-" + zeitMs,
    );
    return replacement;
  }
}

export const BANK_SWAP_LIVE_TEST_LIMIT_PFAD = PFAD;
export const BANK_SWAP_MAX_ECHTE_FUNKTIONSTESTS = 2;
