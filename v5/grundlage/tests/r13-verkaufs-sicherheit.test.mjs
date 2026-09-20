import test from "node:test";
import assert from "node:assert/strict";

import {
  GegenstandsDispositionsLedger,
  bewerteNpcVerkauf,
} from "../../erzeugt/index.js";

function identitaet(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    inventarIndex: 4,
    name: "iron",
    level: 0,
    menge: 10,
    beobachtungsFingerprint: "item-fp-1",
    beobachtetAmMs: 100,
    ...overrides,
  };
}

function metadaten(overrides = {}) {
  return {
    schemaVersion: 1,
    name: "iron",
    typ: "material",
    maximaleStackMenge: 9999,
    quest: false,
    exchange: false,
    event: false,
    cash: false,
    soulbound: false,
    upgrade: false,
    compound: false,
    strukturelleSignale: [],
    spezialSignale: [],
    konflikt: false,
    beobachtetAmMs: 100,
    gueltigBisMs: 500,
    fingerprint: "meta-fp-1",
    ...overrides,
  };
}

function wert(overrides = {}) {
  return {
    schemaVersion: 1,
    name: "iron",
    level: 0,
    npcVerkaufProEinheit: 60,
    konservativerReferenzwertProEinheit: 100,
    beobachtetAmMs: 100,
    gueltigBisMs: 500,
    fingerprint: "value-fp-1",
    ...overrides,
  };
}

function richtlinie(overrides = {}) {
  return {
    richtlinienVersion: "sell-v1",
    erlaubteMetadatenTypen: ["material"],
    referenzwertErforderlich: true,
    minimalerNpcAnteilAmReferenzwertBp: 5_000,
    maximalerAutomatischerGesamtwert: 10_000,
    maximalesIdentitaetsAlterMs: 500,
    ...overrides,
  };
}

function baueLedger(
  item = identitaet(),
  disposition = "NPC_VERKAUF",
) {
  const ledger = new GegenstandsDispositionsLedger();
  ledger.setze({
    identitaet: item,
    disposition,
    begruendung: "zentrale Disposition",
    policyVersion: "merchant-policy-1",
  });
  return ledger;
}

function anfrage(overrides = {}) {
  const item = overrides.identitaet ?? identitaet();
  return {
    identitaet: item,
    metadaten: metadaten(),
    wert: wert(),
    physik: {
      gesperrt: false,
      blockiert: false,
      spezialKennung: null,
    },
    dispositionen: baueLedger(item),
    richtlinie: richtlinie(),
    ...overrides,
  };
}

test("plain stackable Material wird nur mit kompletter frischer Evidence freigegeben", () => {
  const bewertung = bewerteNpcVerkauf(anfrage(), 200);

  assert.equal(bewertung.art, "ERLAUBT");
  assert.equal(bewertung.npcGesamtwert, 600);
  assert.equal(bewertung.referenzGesamtwert, 1_000);
  assert.equal(bewertung.npcAnteilAmReferenzwertBp, 6_000);
  assert.equal(bewertung.actionContractId, "AL-ACTION-SELL");
  assert.equal(bewertung.recoveryContractId, "AL-RECOVERY-SELL");
  assert.equal(bewertung.planungsNachweis, true);
  assert.equal(bewertung.ausfuehrungsAutoritaet, false);
  assert.equal(bewertung.gameplayAutoritaet, false);
  assert.equal(bewertung.rawWriteAutoritaet, false);
});

test("zentrale Disposition kann durch Sell-Evaluator niemals ueberschrieben werden", () => {
  const item = identitaet();
  const bewertung = bewerteNpcVerkauf(
    anfrage({
      identitaet: item,
      dispositionen: baueLedger(item, "BEHALTEN"),
    }),
    200,
  );

  assert.equal(bewertung.art, "GESPERRT");
  assert.deepEqual(
    bewertung.gruende,
    ["VERKAUF_DISPOSITION_VERBIETET_NPC:BEHALTEN"],
  );
});

test("Progression-, Quest- und Spezialsignale blockieren Verkauf fail-closed", () => {
  const bewertung = bewerteNpcVerkauf(
    anfrage({
      metadaten: metadaten({
        quest: true,
        upgrade: true,
        strukturelleSignale: ["grades"],
        spezialSignale: ["rare"],
      }),
    }),
    200,
  );

  assert.equal(bewertung.art, "GESPERRT");
  assert.ok(bewertung.gruende.includes("VERKAUF_QUEST_ITEM_GESCHUETZT"));
  assert.ok(bewertung.gruende.includes("VERKAUF_UPGRADE_ITEM_GESCHUETZT"));
  assert.ok(
    bewertung.gruende.includes("VERKAUF_STRUKTURELLES_SIGNAL_GESCHUETZT"),
  );
  assert.ok(
    bewertung.gruende.includes("VERKAUF_SPEZIAL_SIGNAL_GESCHUETZT"),
  );
});

test("Metadatenkonflikt oder Identitaetswiderspruch fuehrt in Quarantaene", () => {
  const konflikt = bewerteNpcVerkauf(
    anfrage({
      metadaten: metadaten({ konflikt: true }),
    }),
    200,
  );
  assert.equal(konflikt.art, "QUARANTAENE");

  const mismatch = bewerteNpcVerkauf(
    anfrage({
      wert: wert({ name: "copper" }),
    }),
    200,
  );
  assert.equal(mismatch.art, "QUARANTAENE");
  assert.deepEqual(
    mismatch.gruende,
    ["VERKAUF_EVIDENCE_IDENTITAETS_WIDERSPRUCH"],
  );
});

test("aktive physische Reservierung blockiert automatische Verwertung", () => {
  const item = identitaet();
  const ledger = baueLedger(item);
  ledger.reserviere(
    "R-SELL-1",
    "WF-SELL-1",
    item,
    "NPC_VERKAUF",
    1,
  );

  const bewertung = bewerteNpcVerkauf(
    anfrage({
      identitaet: item,
      dispositionen: ledger,
    }),
    200,
  );

  assert.equal(bewertung.art, "GESPERRT");
  assert.match(
    bewertung.gruende[0] ?? "",
    /VERKAUF_ITEM_BEREITS_RESERVIERT:R-SELL-1/,
  );
});

test("High-Value-Grenze und schlechter NPC-Referenzwert blockieren Verkauf", () => {
  const highValue = bewerteNpcVerkauf(
    anfrage({
      richtlinie: richtlinie({
        maximalerAutomatischerGesamtwert: 500,
      }),
    }),
    200,
  );
  assert.equal(highValue.art, "GESPERRT");
  assert.deepEqual(
    highValue.gruende,
    ["VERKAUF_AUTOMATIK_WERTGRENZE_UEBERSCHRITTEN"],
  );

  const badValue = bewerteNpcVerkauf(
    anfrage({
      wert: wert({
        npcVerkaufProEinheit: 10,
        konservativerReferenzwertProEinheit: 100,
      }),
    }),
    200,
  );
  assert.equal(badValue.art, "GESPERRT");
  assert.deepEqual(
    badValue.gruende,
    ["VERKAUF_NPC_WERT_ZU_WEIT_UNTER_REFERENZ"],
  );
});

test("fehlender Referenzwert wird nur bei expliziter Richtlinie akzeptiert", () => {
  const blockiert = bewerteNpcVerkauf(
    anfrage({
      wert: wert({ konservativerReferenzwertProEinheit: null }),
    }),
    200,
  );
  assert.equal(blockiert.art, "GESPERRT");
  assert.deepEqual(blockiert.gruende, ["VERKAUF_REFERENZWERT_FEHLT"]);

  const erlaubt = bewerteNpcVerkauf(
    anfrage({
      wert: wert({ konservativerReferenzwertProEinheit: null }),
      richtlinie: richtlinie({ referenzwertErforderlich: false }),
    }),
    200,
  );
  assert.equal(erlaubt.art, "ERLAUBT");
  assert.deepEqual(
    erlaubt.gruende,
    ["VERKAUF_SICHER_OHNE_REFERENZWERT"],
  );
});

test("stale Item-, Metadaten- oder Wert-Evidence kann Verkauf nicht autorisieren", () => {
  assert.throws(
    () => bewerteNpcVerkauf(
      anfrage({
        identitaet: identitaet({ beobachtetAmMs: 0 }),
        dispositionen: baueLedger(
          identitaet({ beobachtetAmMs: 0 }),
        ),
        richtlinie: richtlinie({ maximalesIdentitaetsAlterMs: 100 }),
      }),
      200,
    ),
    /VERKAUF_ITEM_IDENTITAET_NICHT_FRISCH/,
  );

  assert.throws(
    () => bewerteNpcVerkauf(
      anfrage({
        metadaten: metadaten({ gueltigBisMs: 150 }),
      }),
      200,
    ),
    /VERKAUF_METADATEN_NICHT_FRISCH/,
  );

  assert.throws(
    () => bewerteNpcVerkauf(
      anfrage({
        wert: wert({ gueltigBisMs: 150 }),
      }),
      200,
    ),
    /VERKAUF_WERT_NICHT_FRISCH/,
  );
});

test("locked, blocked oder spezial markierte physische Items bleiben geschuetzt", () => {
  for (const physik of [
    { gesperrt: true, blockiert: false, spezialKennung: null },
    { gesperrt: false, blockiert: true, spezialKennung: null },
    { gesperrt: false, blockiert: false, spezialKennung: "gift" },
  ]) {
    const bewertung = bewerteNpcVerkauf(
      anfrage({ physik }),
      200,
    );
    assert.equal(bewertung.art, "GESPERRT");
    assert.deepEqual(
      bewertung.gruende,
      ["VERKAUF_PHYSISCHES_ITEM_GESCHUETZT"],
    );
  }
});
