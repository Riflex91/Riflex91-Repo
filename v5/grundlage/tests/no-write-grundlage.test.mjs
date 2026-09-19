import test from "node:test";
import assert from "node:assert/strict";
import {
  BegrenzteReplayAufzeichnung,
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

test("Mehrfach-Verriegelung blockiert jede einzeln fehlende Safety-Schicht", () => {
  const basis = {
    schemaVersion: 1,
    freigabeId: "f-2",
    auftragId: "a-2",
    faehigkeit: "MARKT_SCHREIBEN",
    owner: "ACCOUNT_COORDINATOR",
    ressourcenEpoche: 9,
    ausgestelltAmMs: 900,
    gueltigBisMs: 1100,
    operatorErlaubt: true,
    vorbedingungenBestaetigt: true,
    ressourcenBestaetigt: true,
    kanalBestaetigt: true,
    budgetBestaetigt: true,
    intentDurable: true,
  };
  const erwartet = {
    auftragId: "a-2",
    faehigkeit: "MARKT_SCHREIBEN",
    owner: "ACCOUNT_COORDINATOR",
    ressourcenEpoche: 9,
    jetztMs: 1000,
  };

  const faelle = [
    ["operatorErlaubt", "OPERATOR_DENY"],
    ["vorbedingungenBestaetigt", "VORBEDINGUNGEN_FEHLEN"],
    ["ressourcenBestaetigt", "RESSOURCEN_FEHLEN"],
    ["kanalBestaetigt", "ACTION_KANAL_FEHLT"],
    ["budgetBestaetigt", "BUDGET_FEHLT"],
    ["intentDurable", "DURABLE_INTENT_FEHLT"],
  ];

  for (const [feld, grund] of faelle) {
    const pruefung = pruefeAusfuehrungsFreigabe({ ...basis, [feld]: false }, erwartet);
    assert.deepEqual(pruefung, { erlaubt: false, grund });
  }

  assert.deepEqual(pruefeAusfuehrungsFreigabe(basis, erwartet), { erlaubt: true });
});

test("Replay-Aufzeichnung ist deterministisch gepinnt und bounded", () => {
  const baueQuellen = () => {
    let id = 0;
    let zeit = 100;
    return {
      jetztMs: () => zeit++,
      naechsteId: () => "id-" + (++id),
      zufall01: () => 0.25,
    };
  };
  const kopf = {
    schemaVersion: 1,
    buildGitSha: "a".repeat(40),
    wissensSnapshotSha256: "b".repeat(64),
    konfigurationSha256: "c".repeat(64),
  };

  const eins = new BegrenzteReplayAufzeichnung(kopf, baueQuellen(), 2);
  const zwei = new BegrenzteReplayAufzeichnung(kopf, baueQuellen(), 2);

  for (const recorder of [eins, zwei]) {
    assert.equal(recorder.zeichneAuf("PLAN", { wert: 1 }), true);
    assert.equal(recorder.zeichneAuf("ENTSCHEIDUNG", { wert: 2 }), true);
    assert.equal(recorder.zeichneAuf("ZU_VIEL", { wert: 3 }), false);
  }

  assert.deepEqual(eins.snapshot(), zwei.snapshot());
  assert.equal(eins.snapshot().eintraege.length, 2);
  assert.equal(eins.snapshot().verworfenWegenGrenze, 1);
});
