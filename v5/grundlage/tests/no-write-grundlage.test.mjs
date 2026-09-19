import test from "node:test";
import assert from "node:assert/strict";
import {
  BegrenzterAsynchronerSchreiber,
  FaehigkeitsSchalter,
  LeereV5Grundlage,
  istErlaubterHostBefehl,
  istNachrichtGueltig,
  pruefeAusfuehrungsFreigabe,
} from "../../erzeugt/index.js";

test("leere Grundlage startet und stoppt headless ohne Gameplay Writes", () => {
  const grundlage = new LeereV5Grundlage();
  assert.equal(grundlage.status().spielSchreibversuche, 0);
  assert.deepEqual(grundlage.starte(), {
    zustand: "GESTARTET",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    spielSchreibversuche: 0,
  });
  assert.deepEqual(grundlage.stoppe(), {
    zustand: "GESTOPPT",
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    spielSchreibversuche: 0,
  });
});

test("mutierende Faehigkeit ist default-off", () => {
  const schalter = new FaehigkeitsSchalter();
  assert.equal(schalter.istFreigegeben({ kennung: "BANK_SCHREIBEN", mutierend: true }), false);
  assert.equal(schalter.istFreigegeben({ kennung: "STATUS_LESEN", mutierend: false }), true);
});

test("Mehrfach-Verriegelung verweigert fehlenden durable Intent", () => {
  const jetztMs = 1000;
  const freigabe = {
    schemaVersion: 1,
    freigabeId: "f-1",
    auftragId: "a-1",
    faehigkeit: "BANK_SCHREIBEN",
    owner: "ACCOUNT_COORDINATOR",
    ressourcenEpoche: 7,
    ausgestelltAmMs: 900,
    gueltigBisMs: 1100,
    operatorErlaubt: true,
    vorbedingungenBestaetigt: true,
    ressourcenBestaetigt: true,
    kanalBestaetigt: true,
    budgetBestaetigt: true,
    intentDurable: false,
  };
  assert.deepEqual(
    pruefeAusfuehrungsFreigabe(freigabe, {
      auftragId: "a-1",
      faehigkeit: "BANK_SCHREIBEN",
      owner: "ACCOUNT_COORDINATOR",
      ressourcenEpoche: 7,
      jetztMs,
    }),
    { erlaubt: false, grund: "DURABLE_INTENT_FEHLT" },
  );
});

test("Host-Grenze erlaubt keinen generischen Remote-Aufruf", () => {
  assert.equal(istErlaubterHostBefehl("STATUS_LESEN"), true);
  assert.equal(istErlaubterHostBefehl("evaluate"), false);
  assert.equal(istErlaubterHostBefehl("GAMEPLAY_COMMAND"), false);
});

test("Nachrichtenumschlag laeuft fail-closed bei TTL-Ablauf", () => {
  const nachricht = {
    protokollVersion: 1,
    nachrichtenId: "n-1",
    erzeugtAmMs: 10,
    gueltigBisMs: 20,
    dedupeSchluessel: "d-1",
    inhalt: { wert: 1 },
  };
  assert.equal(istNachrichtGueltig(nachricht, 15), true);
  assert.equal(istNachrichtGueltig(nachricht, 21), false);
});

test("asynchroner Writer besitzt harte Queue-Grenze und Backpressure", async () => {
  const geschrieben = [];
  let freigeben = () => {};
  const sperre = new Promise(resolve => { freigeben = resolve; });

  const writer = new BegrenzterAsynchronerSchreiber(2, async wert => {
    await sperre;
    geschrieben.push(wert);
  });

  assert.equal(writer.reiheEin("eins"), true);
  assert.equal(writer.reiheEin("zwei"), true);
  assert.equal(writer.reiheEin("drei"), false);
  assert.equal(writer.ausstehend, 2);

  freigeben();
  await writer.warteBisLeer();

  assert.deepEqual(geschrieben, ["eins", "zwei"]);
  assert.equal(writer.ausstehend, 0);
});
