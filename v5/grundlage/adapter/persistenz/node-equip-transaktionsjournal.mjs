const ARTEN = new Set([
  "INTENT",
  "SERVER_ERGEBNIS",
  "POSTCONDITION",
  "COMMIT",
  "UNBEKANNT",
  "ABBRUCH",
  "SICHER_FEHLGESCHLAGEN",
]);
const TERMINAL = new Set(["COMMIT", "ABBRUCH", "SICHER_FEHLGESCHLAGEN"]);
const BASIS = "runtime/transactions/equipment-equip";
const CURRENT = BASIS + "/current.json";
const MAX_EINTRAEGE = 16;

function text(wert, max, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > max) throw new Error(fehler);
}

function safe(wert, fehler) {
  text(wert, 128, fehler);
  if (!/^[A-Za-z0-9._:-]+$/.test(wert)) throw new Error(fehler);
  return wert.replaceAll(":", "_");
}

function parse(json, fehler) {
  if (json === undefined) return undefined;
  try {
    return JSON.parse(json);
  } catch {
    throw new Error(fehler);
  }
}

function validateEntry(e) {
  if (e === null || typeof e !== "object"
      || e.schemaVersion !== 1
      || !ARTEN.has(e.art)
      || !Number.isSafeInteger(e.sequenz)
      || e.sequenz < 1
      || e.sequenz > MAX_EINTRAEGE
      || !Number.isSafeInteger(e.zeitMs)
      || e.zeitMs < 0
      || e.inhalt === null
      || typeof e.inhalt !== "object"
      || Array.isArray(e.inhalt)) {
    throw new Error("EQUIP_TX_JOURNAL_EINTRAG_UNGUELTIG");
  }
  text(e.journalId, 160, "EQUIP_TX_JOURNAL_ID_UNGUELTIG");
  text(e.transaktionsId, 128, "EQUIP_TX_ID_UNGUELTIG");
  if (e.sequenz === 1 && e.art !== "INTENT") {
    throw new Error("EQUIP_TX_JOURNAL_INTENT_ERFORDERLICH");
  }
  if (e.sequenz > 1 && e.art === "INTENT") {
    throw new Error("EQUIP_TX_JOURNAL_INTENT_POSITION_UNGUELTIG");
  }
  return Object.freeze({
    schemaVersion: 1,
    journalId: e.journalId,
    transaktionsId: e.transaktionsId,
    sequenz: e.sequenz,
    art: e.art,
    zeitMs: e.zeitMs,
    inhalt: Object.freeze({ ...e.inhalt }),
  });
}

function validateState(s, txId) {
  if (s === null || typeof s !== "object"
      || s.schemaVersion !== 1
      || s.transaktionsId !== txId
      || !Array.isArray(s.eintraege)
      || s.eintraege.length > MAX_EINTRAEGE
      || !["OFFEN", "TERMINAL"].includes(s.status)) {
    throw new Error("EQUIP_TX_JOURNAL_STATE_UNGUELTIG");
  }
  let seq = 1;
  let terminal = false;
  for (const x of s.eintraege) {
    if (x === null || typeof x !== "object"
        || x.sequenz !== seq
        || !ARTEN.has(x.art)
        || terminal) {
      throw new Error("EQUIP_TX_JOURNAL_STATE_UNGUELTIG");
    }
    if (TERMINAL.has(x.art)) terminal = true;
    seq += 1;
  }
  if ((terminal ? "TERMINAL" : "OFFEN") !== s.status) {
    throw new Error("EQUIP_TX_JOURNAL_STATE_UNGUELTIG");
  }
  return s;
}

export class NodeEquipTransaktionsJournal {
  #fs;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.schreibeAtomarDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("EQUIP_TX_JOURNAL_DATEISYSTEM_UNGUELTIG");
    }
    this.#fs = dateisystem;
  }

  async haengeDurableAn(eintragWert) {
    const e = validateEntry(eintragWert);
    const txSafe = safe(e.transaktionsId, "EQUIP_TX_ID_UNGUELTIG");
    const statePath = BASIS + "/" + txSafe + "/state.json";

    const current = parse(
      await this.#fs.liesText(CURRENT),
      "EQUIP_TX_CURRENT_UNGUELTIG",
    );
    if (e.sequenz === 1) {
      if (current?.status === "OFFEN"
          && current.transaktionsId !== e.transaktionsId) {
        throw new Error(
          "EQUIP_TX_OFFENE_TRANSAKTION_BLOCKIERT:"
          + String(current.transaktionsId || "UNBEKANNT"),
        );
      }
      if (current === undefined || current.status === "TERMINAL") {
        await this.#fs.schreibeAtomarDurable(
          CURRENT,
          JSON.stringify({
            schemaVersion: 1,
            transaktionsId: e.transaktionsId,
            status: "OFFEN",
            letzteSequenz: 0,
            aktualisiertAmMs: e.zeitMs,
          }) + "\n",
          "equip-current-" + txSafe,
        );
      }
    } else if (current?.status !== "OFFEN"
        || current.transaktionsId !== e.transaktionsId) {
      throw new Error("EQUIP_TX_CURRENT_BINDUNG_UNGUELTIG");
    }

    let state = parse(
      await this.#fs.liesText(statePath),
      "EQUIP_TX_JOURNAL_STATE_UNGUELTIG",
    );
    if (state === undefined) {
      if (e.sequenz !== 1) throw new Error("EQUIP_TX_JOURNAL_STATE_FEHLT");
      state = {
        schemaVersion: 1,
        transaktionsId: e.transaktionsId,
        status: "OFFEN",
        eintraege: [],
      };
    } else {
      validateState(state, e.transaktionsId);
    }

    const existingMeta = state.eintraege.find(x => x.sequenz === e.sequenz);
    const name = String(e.sequenz).padStart(6, "0") + "-" + e.art + ".json";
    const entryPath = BASIS + "/" + txSafe + "/" + name;
    const json = JSON.stringify(e) + "\n";

    if (existingMeta !== undefined) {
      if (existingMeta.art !== e.art) {
        throw new Error("EQUIP_TX_JOURNAL_SEQUENZ_KOLLISION");
      }
      const existing = await this.#fs.liesText(entryPath);
      if (existing !== json) throw new Error("EQUIP_TX_JOURNAL_INHALT_KOLLISION");
      return this.#ack(e, name);
    }

    if (state.status === "TERMINAL") {
      throw new Error("EQUIP_TX_JOURNAL_NACH_TERMINAL");
    }
    if (e.sequenz !== state.eintraege.length + 1) {
      throw new Error("EQUIP_TX_JOURNAL_SEQUENZ_LUECKE");
    }

    const created = await this.#fs.erstelleExklusivDurable(entryPath, json);
    if (!created) {
      const race = await this.#fs.liesText(entryPath);
      if (race !== json) throw new Error("EQUIP_TX_JOURNAL_INHALT_KOLLISION");
    }

    const terminal = TERMINAL.has(e.art);
    const next = {
      schemaVersion: 1,
      transaktionsId: e.transaktionsId,
      status: terminal ? "TERMINAL" : "OFFEN",
      eintraege: [
        ...state.eintraege,
        { sequenz: e.sequenz, art: e.art, datei: name },
      ],
    };
    await this.#fs.schreibeAtomarDurable(
      statePath,
      JSON.stringify(next) + "\n",
      "equip-state-" + txSafe + "-" + e.sequenz,
    );
    await this.#fs.schreibeAtomarDurable(
      CURRENT,
      JSON.stringify({
        schemaVersion: 1,
        transaktionsId: e.transaktionsId,
        status: terminal ? "TERMINAL" : "OFFEN",
        letzteSequenz: e.sequenz,
        aktualisiertAmMs: e.zeitMs,
      }) + "\n",
      "equip-current-" + txSafe + "-" + e.sequenz,
    );
    return this.#ack(e, name);
  }

  async liesTransaktion(transaktionsId) {
    const txSafe = safe(transaktionsId, "EQUIP_TX_ID_UNGUELTIG");
    const statePath = BASIS + "/" + txSafe + "/state.json";
    const state = parse(
      await this.#fs.liesText(statePath),
      "EQUIP_TX_JOURNAL_STATE_UNGUELTIG",
    );
    if (state === undefined) return Object.freeze([]);
    validateState(state, transaktionsId);
    const out = [];
    for (const meta of state.eintraege) {
      const raw = await this.#fs.liesText(
        BASIS + "/" + txSafe + "/" + meta.datei,
      );
      if (raw === undefined) throw new Error("EQUIP_TX_JOURNAL_DATEI_FEHLT");
      const e = validateEntry(parse(raw, "EQUIP_TX_JOURNAL_EINTRAG_UNGUELTIG"));
      if (e.transaktionsId !== transaktionsId
          || e.sequenz !== meta.sequenz
          || e.art !== meta.art) {
        throw new Error("EQUIP_TX_JOURNAL_STATE_WIDERSPRUCH");
      }
      out.push(e);
    }
    return Object.freeze(out);
  }

  async pruefeStartBereit() {
    const current = parse(
      await this.#fs.liesText(CURRENT),
      "EQUIP_TX_CURRENT_UNGUELTIG",
    );
    if (current === undefined || current.status === "TERMINAL") {
      return Object.freeze({ bereit: true, offeneTransaktionsId: null });
    }
    if (current.status !== "OFFEN"
        || typeof current.transaktionsId !== "string") {
      throw new Error("EQUIP_TX_CURRENT_UNGUELTIG");
    }
    return Object.freeze({
      bereit: false,
      offeneTransaktionsId: current.transaktionsId,
    });
  }

  #ack(e, name) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "EQUIP-TX:" + name,
      journalId: e.journalId,
      transaktionsId: e.transaktionsId,
      sequenz: e.sequenz,
    });
  }
}
