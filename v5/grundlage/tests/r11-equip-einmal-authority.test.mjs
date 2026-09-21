import test from "node:test";
import assert from "node:assert/strict";

import {
  BedienerRichtlinienDienst,
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
  EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
  V5ProduktionsRuntime,
  V5_PRODUKTIONS_STORAGE_HEALTH_ID,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

function policy() {
  return new BedienerRichtlinienDienst({
    async schreibeDurable() {},
  });
}

function protocol({ fehler = false, falsch = false } = {}) {
  return {
    eintraege: [],
    async schreibeDurable(intent) {
      if (fehler) throw new Error("DISK_DOWN");
      this.eintraege = [...this.eintraege, intent];
      return {
        durable: true,
        bestaetigungsId: "EQUIP-AUTH:" + intent.aktivierungsId,
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: falsch ? "FALSCHE-TX" : intent.transaktionsId,
      };
    },
  };
}

function health(gueltigBisMs = 2_000) {
  return [{
    healthId: V5_PRODUKTIONS_STORAGE_HEALTH_ID,
    zustand: "GESUND",
    beobachtetAmMs: 90,
    gueltigBisMs,
    evidenceId: "HEALTH-EQUIP-1",
  }];
}

function metrik(zeitMs = 100) {
  return {
    schemaVersion: 1,
    zeitMs,
    ssdIoLatenzMs: 2,
    ioQueueTiefe: 0,
    backpressureAktiv: false,
    freieBytes: 50_000_000,
    recorderDrops: 0,
  };
}

function anforderung(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "EQUIP-AUTH-1",
    transaktionsId: "EQUIP-TX-1",
    faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
    anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
    anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
    actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
    recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
    verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
    policyId: EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
    bestaetigungText: EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    jetztMs: 100,
    gueltigBisMs: 2_100,
    ...overrides,
  };
}

async function system(optionen = {}) {
  const bediener = policy();
  const durable = optionen.protokoll ?? protocol();
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bediener,
    null,
    optionen.ohneProtokoll ? null : durable,
  );
  assert.equal((await runtime.starte()).erfolgreich, true);
  runtime.erfasseOperationsMetrik(metrik());
  return { runtime, bediener, durable };
}

test("produktive Equip-Einmal-Authority wird durable gebunden ohne Registry-Aktivierung", async () => {
  const { runtime, durable } = await system();

  const ergebnis = await runtime.erteileEquipEinmalAuthority(anforderung());

  assert.equal(ergebnis.erfolgreich, true);
  assert.equal(ergebnis.grund, "V5_EQUIP_EINMAL_AUTHORITY_ERTEILT");
  assert.ok(ergebnis.authority);
  assert.equal(ergebnis.maximaleVerwendungen, 1);
  assert.equal(ergebnis.gameplayWriteAusgefuehrt, false);
  assert.equal(ergebnis.rawWriteAutoritaet, false);
  assert.equal(ergebnis.breiteRuntimeFreigabe, false);
  assert.equal(durable.eintraege.length, 1);
  assert.equal(
    durable.eintraege[0].art,
    "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
  );
  assert.equal(durable.eintraege[0].transaktionsId, "EQUIP-TX-1");
  assert.equal(durable.eintraege[0].maximaleVerwendungen, 1);

  const status = runtime.status();
  assert.equal(status.aktiveModule, 0);
  assert.equal(status.aktiveFaehigkeiten, 0);
  assert.equal(status.aktiveMutierendeFaehigkeiten, 0);
  assert.equal(status.offeneEquipEinmalAuthority, true);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
  assert.equal(status.actionAuthority, false);
});

test("Equip-Einmal-Authority ist exakt einmal als mutierende Capability-Authority nutzbar", async () => {
  const { runtime } = await system();
  const ergebnis = await runtime.erteileEquipEinmalAuthority(anforderung());
  const authority = ergebnis.authority;
  assert.ok(authority);
  assert.equal(authority.gueltigFuer(101), true);

  const erlaubt = authority.pruefe("equipment.equip", "equipment-core");
  assert.equal(erlaubt.erlaubt, true);
  assert.equal(erlaubt.mutierend, true);
  assert.equal(authority.verbraucht(), true);

  const wiederholt = authority.pruefe("equipment.equip", "equipment-core");
  assert.equal(wiederholt.erlaubt, false);

  const revalidierung = runtime.revalidiereEquipEinmalAuthority(health(), 101);
  assert.equal(revalidierung.bereit, true);
  assert.equal(revalidierung.grund, "V5_EQUIP_EINMAL_AUTHORITY_VERBRAUCHT");
  assert.equal(revalidierung.authorityOffen, false);
  assert.equal(runtime.status().offeneEquipEinmalAuthority, false);
});

test("falsche Equip-Bindung oder fehlende Einmal-Bestaetigung blockiert vor Durable-Write", async () => {
  const { runtime, durable } = await system();

  const falsch = await runtime.erteileEquipEinmalAuthority(anforderung({
    actionContractId: "AL-ACTION-UPGRADE",
  }));
  assert.equal(falsch.erfolgreich, false);
  assert.equal(falsch.grund, "V5_EQUIP_EINMAL_BINDUNG_UNGUELTIG");

  const ohneBestaetigung = await runtime.erteileEquipEinmalAuthority(
    anforderung({ bestaetigungText: "mach weiter" }),
  );
  assert.equal(ohneBestaetigung.erfolgreich, false);
  assert.equal(
    ohneBestaetigung.grund,
    "V5_EQUIP_EINMAL_BINDUNG_UNGUELTIG",
  );
  assert.equal(durable.eintraege.length, 0);
});

test("Equip-Einmal-Authority verlangt durable Vor-Wirkung-Protokollierung", async () => {
  const ohne = await system({ ohneProtokoll: true });
  const fehlt = await ohne.runtime.erteileEquipEinmalAuthority(anforderung());
  assert.equal(fehlt.erfolgreich, false);
  assert.equal(
    fehlt.grund,
    "V5_EQUIP_EINMAL_DURABLE_PROTOKOLL_FEHLT",
  );

  const defekt = await system({ protokoll: protocol({ fehler: true }) });
  const disk = await defekt.runtime.erteileEquipEinmalAuthority(anforderung());
  assert.equal(disk.erfolgreich, false);
  assert.equal(disk.grund, "V5_EQUIP_EINMAL_AUDIT_NICHT_DURABLE");

  const falsch = await system({ protokoll: protocol({ falsch: true }) });
  const ack = await falsch.runtime.erteileEquipEinmalAuthority(anforderung());
  assert.equal(ack.erfolgreich, false);
  assert.equal(
    ack.grund,
    "V5_EQUIP_EINMAL_DURABILITY_NICHT_BESTAETIGT",
  );
});

test("Capability-Deny und NOTHALT blockieren Equip-Einmal-Authority", async () => {
  const deny = await system();
  await deny.bediener.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "DENY-EQUIP-1",
    bedienerId: "operator",
    zeitMs: 95,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  });
  const gesperrt = await deny.runtime.erteileEquipEinmalAuthority(anforderung());
  assert.equal(gesperrt.erfolgreich, false);
  assert.equal(gesperrt.grund, "V5_EQUIP_EINMAL_DURCH_POLICY_GESPERRT");

  const stop = await system();
  await stop.bediener.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "STOP-EQUIP-1",
    bedienerId: "operator",
    zeitMs: 95,
    art: "NOTHALT_AKTIVIEREN",
  });
  const nothalt = await stop.runtime.erteileEquipEinmalAuthority(anforderung());
  assert.equal(nothalt.erfolgreich, false);
  assert.equal(nothalt.grund, "V5_EQUIP_EINMAL_NOTHALT_AKTIV");
});

test("offene Equip-Authority wird bei Policy-Verlust widerrufen", async () => {
  const { runtime, bediener } = await system();
  const ergebnis = await runtime.erteileEquipEinmalAuthority(anforderung());
  assert.ok(ergebnis.authority);

  await bediener.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "DENY-EQUIP-REVAL",
    bedienerId: "operator",
    zeitMs: 101,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  });

  const revalidierung = runtime.revalidiereEquipEinmalAuthority(health(), 101);
  assert.equal(revalidierung.bereit, false);
  assert.equal(revalidierung.authorityWiderrufen, true);
  assert.equal(ergebnis.authority.gueltigFuer(101), false);
  assert.equal(runtime.status().offeneEquipEinmalAuthority, false);
});

test("abgelaufene Equip-Authority endet ohne Host-Fehler und kann nicht genutzt werden", async () => {
  const { runtime } = await system();
  const ergebnis = await runtime.erteileEquipEinmalAuthority(anforderung({
    gueltigBisMs: 101,
  }));
  assert.ok(ergebnis.authority);

  const revalidierung = runtime.revalidiereEquipEinmalAuthority(health(), 102);
  assert.equal(revalidierung.bereit, true);
  assert.equal(revalidierung.grund, "V5_EQUIP_EINMAL_AUTHORITY_ABGELAUFEN");
  assert.equal(revalidierung.authorityWiderrufen, true);
  assert.equal(ergebnis.authority.gueltigFuer(102), false);
});
