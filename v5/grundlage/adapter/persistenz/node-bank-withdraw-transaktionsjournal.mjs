const ARTEN = Object.freeze([
  "INTENT",
  "SERVER_ERGEBNIS",
  "POSTCONDITION",
  "COMMIT",
  "UNBEKANNT",
  "ABBRUCH",
  "SICHER_FEHLGESCHLAGEN",
]);
const TERMINAL = Object.freeze(["COMMIT", "ABBRUCH", "SICHER_FEHLGESCHLAGEN"]);
const BASIS = "runtime/transactions/bank-withdraw";
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
  try { return JSON.parse(json); } catch { throw new Error(fehler); }
}

function validiereEintrag(e) {
  if (e === null || typeof e !== "object"
      || e.schemaVersion !== 1
      || !ARTEN.includes(e.art)
      || !Number.isSafeInteger(e.sequenz)
      || e.sequenz < 1
      || e.sequenz > MAX_EINTRAEGE
      || !Number.isSafeInteger(e.zeitMs)
      || e.zeitMs < 0
      || e.inhalt === null
      || typeof e.inhalt !== "object"
      || Array.isArray(e.inhalt)) {
    throw new Error("BANK_WITHDRAW_TX_EINTRAG_UNGUELTIG");
  }
  text(e.journalId, 160, "BANK_WITHDRAW_TX_JOURNAL_ID_UNGUELTIG");
  text(e.transaktionsId, 128, "BANK_WITHDRAW_TX_ID_UNGUELTIG");
  if (e.sequenz === 1 && e.art !== "INTENT") {
    throw new Error("BANK_WITHDRAW_TX_INTENT_ERFORDERLICH");
  }
  if (e.sequenz > 1 && e.art === "INTENT") {
    throw new Error("BANK_WITHDRAW_TX_INTENT_POSITION_UNGUELTIG");
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

function validiereState(s, txId) {
  if (s === null || typeof s !== "object"
      || s.schemaVersion !== 1
      || s.transaktionsId !== txId
      || !Array.isArray(s.eintraege)
      || s.eintraege.length > MAX_EINTRAEGE
      || !["OFFEN", "TERMINAL"].includes(s.status)) {
    throw new Error("BANK_WITHDRAW_TX_STATE_UNGUELTIG");
  }
  let seq = 1;
  let terminal = false;
  for (const x of s.eintraege) {
    if (!x || x.sequenz !== seq || !ARTEN.includes(x.art) || terminal) {
      throw new Error("BANK_WITHDRAW_TX_STATE_UNGUELTIG");
    }
    if (TERMINAL.includes(x.art)) terminal = true;
    seq += 1;
  }
  if ((terminal ? "TERMINAL" : "OFFEN") !== s.status) {
    throw new Error("BANK_WITHDRAW_TX_STATE_UNGUELTIG");
  }
  return s;
}

export class NodeBankWithdrawTransaktionsJournal {
  #fs;

  constructor(dateisystem) {
    if (!dateisystem
        || typeof dateisystem.erstelleExklusivDurable !== "function"
        || typeof dateisystem.schreibeAtomarDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("BANK_WITHDRAW_TX_DATEISYSTEM_UNGUELTIG");
    }
    this.#fs = dateisystem;
  }

  async haengeDurableAn(eintragWert) {
    const e = validiereEintrag(eintragWert);
    const txSafe = safe(e.transaktionsId, "BANK_WITHDRAW_TX_ID_UNGUELTIG");
    const statePath = BASIS + "/" + txSafe + "/state.json";
    const current = parse(
      await this.#fs.liesText(CURRENT),
      "BANK_WITHDRAW_TX_CURRENT_UNGUELTIG",
    );

    if (e.sequenz === 1) {
      if (current?.status === "OFFEN"
          && current.transaktionsId !== e.transaktionsId) {
        throw new Error(
          "BANK_WITHDRAW_TX_OFFENE_TRANSAKTION_BLOCKIERT:"
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
          "bank-withdraw-current-" + txSafe,
        );
      }
    } else if (current?.status !== "OFFEN"
        || current.transaktionsId !== e.transaktionsId) {
      throw new Error("BANK_WITHDRAW_TX_CURRENT_BINDUNG_UNGUELTIG");
    }

    let state = parse(
      await this.#fs.liesText(statePath),
      "BANK_WITHDRAW_TX_STATE_UNGUELTIG",
    );
    if (state === undefined) {
      if (e.sequenz !== 1) throw new Error("BANK_WITHDRAW_TX_STATE_FEHLT");
      state = {
        schemaVersion: 1,
        transaktionsId: e.transaktionsId,
        status: "OFFEN",
        eintraege: [],
      };
    } else {
      validiereState(state, e.transaktionsId);
    }

    const name = String(e.sequenz).padStart(6, "0") + "-" + e.art + ".json";
    const entryPath = BASIS + "/" + txSafe + "/" + name;
    const json = JSON.stringify(e) + "\n";
    const vorhanden = state.eintraege.find(x => x.sequenz === e.sequenz);
    if (vorhanden !== undefined) {
      if (vorhanden.art !== e.art
          || await this.#fs.liesText(entryPath) !== json) {
        throw new Error("BANK_WITHDRAW_TX_JOURNAL_KOLLISION");
      }
      return this.#ack(e, name);
    }
    if (state.status === "TERMINAL") {
      throw new Error("BANK_WITHDRAW_TX_NACH_TERMINAL");
    }
    if (e.sequenz !== state.eintraege.length + 1) {
      throw new Error("BANK_WITHDRAW_TX_SEQUENZ_LUECKE");
    }

    const created = await this.#fs.erstelleExklusivDurable(entryPath, json);
    if (!created && await this.#fs.liesText(entryPath) !== json) {
      throw new Error("BANK_WITHDRAW_TX_JOURNAL_KOLLISION");
    }
    const terminal = TERMINAL.includes(e.art);
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
      "bank-withdraw-state-" + txSafe + "-" + e.sequenz,
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
      "bank-withdraw-current-" + txSafe + "-" + e.sequenz,
    );
    return this.#ack(e, name);
  }

  async pruefeStartBereit() {
    const current = parse(
      await this.#fs.liesText(CURRENT),
      "BANK_WITHDRAW_TX_CURRENT_UNGUELTIG",
    );
    if (current === undefined || current.status === "TERMINAL") {
      return Object.freeze({ bereit: true, offeneTransaktionsId: null });
    }
    if (current.status !== "OFFEN"
        || typeof current.transaktionsId !== "string") {
      throw new Error("BANK_WITHDRAW_TX_CURRENT_UNGUELTIG");
    }
    return Object.freeze({
      bereit: false,
      offeneTransaktionsId: current.transaktionsId,
    });
  }

  async liesTransaktion(transaktionsId) {
    const txSafe = safe(transaktionsId, "BANK_WITHDRAW_TX_ID_UNGUELTIG");
    const state = parse(
      await this.#fs.liesText(BASIS + "/" + txSafe + "/state.json"),
      "BANK_WITHDRAW_TX_STATE_UNGUELTIG",
    );
    if (state === undefined) return Object.freeze([]);
    validiereState(state, transaktionsId);
    let ausgabe = Object.freeze([]);
    for (const meta of state.eintraege) {
      const raw = await this.#fs.liesText(
        BASIS + "/" + txSafe + "/" + meta.datei,
      );
      if (raw === undefined) throw new Error("BANK_WITHDRAW_TX_DATEI_FEHLT");
      const e = validiereEintrag(
        parse(raw, "BANK_WITHDRAW_TX_EINTRAG_UNGUELTIG"),
      );
      ausgabe = Object.freeze([...ausgabe, e]);
    }
    return ausgabe;
  }

  #ack(e, name) {
    return Object.freeze({
      durable: true,
      bestaetigungsId: "BANK-WITHDRAW-TX:" + name,
      journalId: e.journalId,
      transaktionsId: e.transaktionsId,
      sequenz: e.sequenz,
    });
  }
}
