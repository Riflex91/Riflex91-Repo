import test from "node:test";
import assert from "node:assert/strict";

import {
  PR20_7_GEAR_SWAP_AUTHORITY_BESTAETIGUNG,
  PR20_7_GEAR_SWAP_AUTHORITY_GAMEPLAY_WRITES,
  PR20_7_GEAR_SWAP_AUTHORITY_HOST_EXPOSED,
  PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID,
  PR20_7_GEAR_SWAP_AUTHORITY_PUBLIC_FUNCTION_CALLS,
  PR20_7_GEAR_SWAP_AUTHORITY_EXECUTOR_WIRED,
  PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS,
  RessourcenVerwalter,
  bereitePr207GearSwapEinmalAuthorityVor,
  gibPr207GearSwapEinmalAuthorityFrei,
  pr207GearSwapEquipmentRessourcenId,
  pr207GearSwapInventoryRessourcenId,
} from "../../erzeugt/index.js";

const A = "a".repeat(64);
const B = "b".repeat(64);
const C = "c".repeat(64);
const D = "d".repeat(64);
const E = "e".repeat(64);
const F = "f".repeat(64);

function scope(overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    characterId: "My_Merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    slot: "helmet",
    kandidatIndex: 7,
    kandidatFingerprint: A,
    vorherigesSlotItemFingerprint: B,
    restInventarFingerprint: C,
    restEquipmentFingerprint: D,
    prestateFingerprint: E,
    evidenceFingerprint: F,
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "PR20-7-GEAR-AUTH-1",
    transaktionsId: "PR20-7-GEAR-TX-1",
    ablaufId: "PR20-7-GEAR-FLOW-1",
    evidenceId: "PR20-7-REAL-PREFLIGHT-1",
    realEvidenceStatus: PR20_7_GEAR_SWAP_REAL_EVIDENCE_STATUS,
    policyId: PR20_7_GEAR_SWAP_AUTHORITY_POLICY_ID,
    bestaetigungText: PR20_7_GEAR_SWAP_AUTHORITY_BESTAETIGUNG,
    scope: scope(),
    jetztMs: 100,
    gueltigBisMs: 1_600,
    ...overrides,
  };
}

function protocol({ fail = false, wrong = false } = {}) {
  return {
    entries: [],
    async schreibeDurable(intent) {
      if (fail) throw new Error("DISK_DOWN");
      this.entries.push(intent);
      return {
        durable: true,
        bestaetigungsId: "ACK:" + intent.aktivierungsId,
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: wrong ? "WRONG" : intent.transaktionsId,
        ablaufId: intent.ablaufId,
      };
    },
  };
}

test("PR20.7 Swap-Authority wird durable und mit Equipment/Inventory-Fences vorbereitet", async () => {
  const resources = new RessourcenVerwalter();
  const durable = protocol();
  const result = await bereitePr207GearSwapEinmalAuthorityVor(
    request(),
    durable,
    resources,
  );

  assert.equal(result.erfolgreich, true);
  assert.equal(
    result.grund,
    "PR20_7_GEAR_SWAP_AUTHORITY_BEREIT_NO_WRITE",
  );
  assert.ok(result.authority);
  assert.equal(result.fences.length, 2);
  assert.equal(durable.entries.length, 1);
  assert.equal(
    durable.entries[0].art,
    "PR20_7_GEAR_SWAP_AUTHORITY_VOR_WIRKUNG",
  );
  assert.equal(durable.entries[0].scope.characterId, "My_Merchant");
  assert.equal(durable.entries[0].scope.sessionId, "merchant-session-1");
  assert.equal(durable.entries[0].scope.slot, "helmet");
  assert.equal(durable.entries[0].scope.kandidatIndex, 7);
  assert.equal(durable.entries[0].scope.kandidatFingerprint, A);
  assert.equal(durable.entries[0].scope.vorherigesSlotItemFingerprint, B);
  assert.deepEqual(
    durable.entries[0].fences.map(x => x.ressourcenId).sort(),
    [
      pr207GearSwapEquipmentRessourcenId("My_Merchant"),
      pr207GearSwapInventoryRessourcenId("My_Merchant"),
    ].sort(),
  );
  assert.ok(durable.entries[0].fences.every(
    x => x.art === "LANGLEBIG" && x.leaseBisMs === 1_600,
  ));
  assert.equal(result.produktiveRegistrierungErlaubt, false);
  assert.equal(result.gameplayWriteAusgefuehrt, false);
  assert.equal(result.gameplayAutoritaet, false);
  assert.equal(result.rawWriteAutoritaet, false);
  assert.equal(result.swapWriteRatification, false);
  assert.equal(result.normalRuntimeAllowed, false);
  assert.equal(PR20_7_GEAR_SWAP_AUTHORITY_GAMEPLAY_WRITES, 0);
  assert.equal(PR20_7_GEAR_SWAP_AUTHORITY_PUBLIC_FUNCTION_CALLS, 0);
  assert.equal(PR20_7_GEAR_SWAP_AUTHORITY_EXECUTOR_WIRED, false);
  assert.equal(PR20_7_GEAR_SWAP_AUTHORITY_HOST_EXPOSED, false);

  const views = resources.sicht();
  assert.equal(views.length, 2);
  assert.ok(views.every(x => x.status === "AKTIV"));
  assert.ok(views.every(x => x.art === "LANGLEBIG"));
});

test("PR20.7 Authority akzeptiert nur den exakt gepinnten Scope und exakt einmal", async () => {
  const resources = new RessourcenVerwalter();
  const result = await bereitePr207GearSwapEinmalAuthorityVor(
    request(),
    protocol(),
    resources,
  );
  assert.ok(result.authority);

  const drift = result.authority.pruefeUndVerbrauche(
    scope({ sessionId: "other-session" }),
    101,
    resources,
  );
  assert.equal(drift.erlaubt, false);
  assert.equal(drift.grund, "PR20_7_GEAR_SWAP_AUTHORITY_SCOPE_DRIFT");
  assert.equal(result.authority.verbraucht(), false);

  const exact = result.authority.pruefeUndVerbrauche(
    scope(),
    101,
    resources,
  );
  assert.equal(exact.erlaubt, true);
  assert.equal(exact.grund, "PR20_7_GEAR_SWAP_AUTHORITY_ERLAUBT");
  assert.equal(exact.gameplayAutoritaet, false);
  assert.equal(exact.swapWriteRatification, false);
  assert.equal(result.authority.verbraucht(), true);

  const second = result.authority.pruefeUndVerbrauche(
    scope(),
    102,
    resources,
  );
  assert.equal(second.erlaubt, false);
  assert.equal(second.grund, "PR20_7_GEAR_SWAP_AUTHORITY_VERBRAUCHT");
});

test("PR20.7 Fences blockieren konkurrierende Ablaufe fuer denselben Recipient", async () => {
  const resources = new RessourcenVerwalter();
  const first = await bereitePr207GearSwapEinmalAuthorityVor(
    request(),
    protocol(),
    resources,
  );
  assert.equal(first.erfolgreich, true);

  const second = await bereitePr207GearSwapEinmalAuthorityVor(
    request({
      aktivierungsId: "PR20-7-GEAR-AUTH-2",
      transaktionsId: "PR20-7-GEAR-TX-2",
      ablaufId: "PR20-7-GEAR-FLOW-2",
    }),
    protocol(),
    resources,
  );
  assert.equal(second.erfolgreich, false);
  assert.match(second.grund, /^PR20_7_GEAR_SWAP_FENCING_BLOCKIERT:/);
  assert.match(second.grund, /RESSOURCE_BELEGT/);
  assert.equal(second.authority, null);
});

test("PR20.7 ungenutzte Authority kann vor Ablauf widerrufen und sauber freigegeben werden", async () => {
  const resources = new RessourcenVerwalter();
  const result = await bereitePr207GearSwapEinmalAuthorityVor(
    request(),
    protocol(),
    resources,
  );
  assert.ok(result.authority);
  assert.equal(result.authority.gueltigFuer(101, resources), true);

  gibPr207GearSwapEinmalAuthorityFrei(
    result.authority,
    resources,
    101,
  );

  assert.equal(result.authority.widerrufen(), true);
  assert.equal(result.authority.gueltigFuer(102, resources), false);
  assert.ok(resources.sicht().every(x => x.status === "FREI"));
});

test("PR20.7 abgelaufene Fences verlangen Abgleich statt stiller Wiederverwendung", async () => {
  const resources = new RessourcenVerwalter();
  const first = await bereitePr207GearSwapEinmalAuthorityVor(
    request(),
    protocol(),
    resources,
  );
  assert.ok(first.authority);

  assert.deepEqual(
    resources.markiereAbgelaufeneLeases(1_601),
    [
      pr207GearSwapEquipmentRessourcenId("My_Merchant"),
      pr207GearSwapInventoryRessourcenId("My_Merchant"),
    ].sort(),
  );
  assert.ok(
    resources.sicht().every(x => x.status === "ABGELAUFEN_ABGLEICH"),
  );
  assert.equal(first.authority.gueltigFuer(1_601, resources), false);
  assert.throws(
    () => gibPr207GearSwapEinmalAuthorityFrei(
      first.authority,
      resources,
      1_601,
    ),
    /ERFORDERT_GUELTIGE_FENCES_ODER_ABGLEICH/,
  );

  const second = await bereitePr207GearSwapEinmalAuthorityVor(
    request({
      aktivierungsId: "PR20-7-GEAR-AUTH-2",
      transaktionsId: "PR20-7-GEAR-TX-2",
      ablaufId: "PR20-7-GEAR-FLOW-2",
      jetztMs: 1_601,
      gueltigBisMs: 3_101,
    }),
    protocol(),
    resources,
  );
  assert.equal(second.erfolgreich, false);
  assert.match(second.grund, /RESSOURCE_ABGLEICH_ERFORDERLICH/);
});

test("PR20.7 Durable-Fehler oder falsches ACK gibt beide Fences fail-closed frei", async () => {
  for (const p of [
    protocol({ fail: true }),
    protocol({ wrong: true }),
  ]) {
    const resources = new RessourcenVerwalter();
    const result = await bereitePr207GearSwapEinmalAuthorityVor(
      request(),
      p,
      resources,
    );
    assert.equal(result.erfolgreich, false);
    assert.equal(result.authority, null);
    assert.ok(resources.sicht().every(x => x.status === "FREI"));
  }
});

test("PR20.7 blockiert ungepruefte Evidence, Waffen, Identitaetsambiguitaet und zu lange TTL vor Fence-Claim", async () => {
  const cases = [
    request({ realEvidenceStatus: "OFFEN" }),
    request({ scope: scope({ slot: "mainhand" }) }),
    request({
      scope: scope({
        vorherigesSlotItemFingerprint: A,
      }),
    }),
    request({ gueltigBisMs: 1_601 }),
    request({ bestaetigungText: "mach weiter" }),
  ];

  for (const candidate of cases) {
    const resources = new RessourcenVerwalter();
    const durable = protocol();
    const result = await bereitePr207GearSwapEinmalAuthorityVor(
      candidate,
      durable,
      resources,
    );
    assert.equal(result.erfolgreich, false);
    assert.equal(result.authority, null);
    assert.equal(durable.entries.length, 0);
    assert.equal(resources.sicht().length, 0);
  }
});
