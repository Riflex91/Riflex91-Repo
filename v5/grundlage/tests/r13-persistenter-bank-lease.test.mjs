import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  BankLeaseKoordinator,
  PersistenterBankLeaseController,
  RessourcenVerwalter,
  actionKanalRessourcenId,
} from "../../erzeugt/index.js";
import {
  NodeBankLeasePersistenz,
} from "../adapter/persistenz/node-bank-lease-persistenz.mjs";
import {
  NodeProduktionsDateisystem,
} from "../adapter/persistenz/node-produktions-dateisystem.mjs";

const fence = {
  serverRegion: "EU",
  serverIdentifier: "I",
  mountedCharacterId: "merchant",
  konflikt: false,
};

function controller(dateisystem) {
  const ressourcen = new RessourcenVerwalter();
  const koordin = new BankLeaseKoordinator(ressourcen);
  const persistenz = new NodeBankLeasePersistenz(dateisystem);
  return {
    ressourcen,
    koordin,
    persistenz,
    controller: new PersistenterBankLeaseController(koordin, persistenz),
  };
}

test("persistente Bank-Lease wird nach Restart RECOVERY_PENDING und nie als alte Authority reaktiviert", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-lease-persist-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const a = controller(dateisystem);
    assert.equal((await a.controller.lade(100)).geladen, false);

    const token = await a.controller.beanspruche(
      "account-1",
      "merchant",
      "WF-BANK-1",
      "deposit",
      "EU",
      "I",
      101,
      10_000,
    );
    const aktiv = await a.controller.aktiviere(token, fence, 102);
    assert.equal(aktiv.zustand, "ACTIVE");

    const [kanal] = a.ressourcen.beanspruche("WF-BANK-1", [{
      ressourcenId: actionKanalRessourcenId("merchant", "bank"),
      art: "ACTION_KANAL",
      leaseDauerMs: null,
    }], 102);
    assert.equal(
      a.controller.validiereMutation(token, kanal, fence, 102),
      true,
    );

    const raw = await fs.readFile(
      path.join(root, "runtime", "bank", "lease-state-v1.json"),
      "utf8",
    );
    assert.equal(raw.includes("ressourcenToken"), false);
    assert.equal(raw.includes('"zustand":"ACTIVE"'), true);

    const b = controller(dateisystem);
    const geladen = await b.controller.lade(200);
    assert.equal(geladen.geladen, true);
    assert.equal(geladen.recoveryPending, 1);
    assert.equal(b.controller.sicht()[0].zustand, "RECOVERY_PENDING");
    assert.equal(b.controller.sicht()[0].ressourcenToken, null);

    await assert.rejects(
      () => b.controller.beanspruche(
        "account-1",
        "merchant",
        "WF-BANK-2",
        "deposit",
        "EU",
        "I",
        201,
        10_000,
      ),
      /BANK_LEASE_ACCOUNT_BEREITS_BELEGT/,
    );

    const reconciled = await b.controller.schliesseRestartAbgleichAb(
      "account-1",
      token.epoche,
      true,
      202,
    );
    assert.equal(reconciled.zustand, "RELEASED");

    const neu = await b.controller.beanspruche(
      "account-1",
      "merchant",
      "WF-BANK-2",
      "deposit",
      "EU",
      "I",
      203,
      10_000,
    );
    assert.ok(neu.epoche > token.epoche);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("RELEASED Lease persistiert nur Epoch-Floor und blockiert nach Restart keine neue Lease", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-bank-lease-release-"));
  try {
    const dateisystem = new NodeProduktionsDateisystem({
      wurzel: root,
      testmodus: true,
    });
    const a = controller(dateisystem);
    const token = await a.controller.beanspruche(
      "account-1",
      "merchant",
      "WF-1",
      "deposit",
      "EU",
      "I",
      10,
      10_000,
    );
    await a.controller.aktiviere(token, fence, 11);
    await a.controller.beginneFreigabe(token, 12);
    const released = await a.controller.gibFrei(token, {
      offeneTransaktionen: 0,
      backendInProgress: false,
      bankActionInFlight: false,
      characterBankAktiv: false,
      erwarteterExitBeobachtet: true,
    }, 13);
    assert.equal(released.zustand, "RELEASED");

    const b = controller(dateisystem);
    const status = await b.controller.lade(20);
    assert.equal(status.recoveryPending, 0);
    assert.equal(status.released, 1);
    assert.deepEqual(b.controller.sicht(), []);

    const neu = await b.controller.beanspruche(
      "account-1",
      "merchant",
      "WF-2",
      "deposit",
      "EU",
      "I",
      21,
      10_000,
    );
    assert.ok(neu.epoche > token.epoche);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Persistenzfehler nach Aktivierung entzieht lokale Bank-Mutationsfaehigkeit fail-closed", async () => {
  const ressourcen = new RessourcenVerwalter();
  const koordin = new BankLeaseKoordinator(ressourcen);
  let writes = 0;
  const persistenz = {
    async lies() {
      return undefined;
    },
    async schreibeDurable() {
      writes += 1;
      if (writes >= 2) throw new Error("DISK_DOWN");
    },
  };
  const controller = new PersistenterBankLeaseController(
    koordin,
    persistenz,
  );
  const token = await controller.beanspruche(
    "account-1",
    "merchant",
    "WF-1",
    "deposit",
    "EU",
    "I",
    100,
    10_000,
  );
  await assert.rejects(
    () => controller.aktiviere(token, fence, 101),
    /DISK_DOWN/,
  );
  assert.equal(controller.sicht()[0].zustand, "RECOVERY_PENDING");

  const [kanal] = ressourcen.beanspruche("WF-1", [{
    ressourcenId: actionKanalRessourcenId("merchant", "bank"),
    art: "ACTION_KANAL",
    leaseDauerMs: null,
  }], 101);
  assert.equal(
    controller.validiereMutation(token, kanal, fence, 101),
    false,
  );
});

test("korruptes oder zukuenftiges Lease-Snapshot blockiert Restart", async () => {
  const faelle = [
    "{kaputt",
    JSON.stringify({
      schemaVersion: 1,
      gespeichertAmMs: 999,
      eintraege: [],
    }),
    JSON.stringify({
      schemaVersion: 1,
      gespeichertAmMs: 10,
      eintraege: [
        {
          schemaVersion: 1,
          accountId: "account-1",
          ownerCharacterId: "merchant",
          ablaufId: "WF-1",
          epoche: 3,
          zustand: "ACTIVE",
          acquiredAtMs: 1,
          lastHeartbeatAtMs: 2,
          purpose: "deposit",
          serverRegion: "EU",
          serverIdentifier: "I",
        },
        {
          schemaVersion: 1,
          accountId: "account-1",
          ownerCharacterId: "merchant",
          ablaufId: "WF-2",
          epoche: 4,
          zustand: "RELEASED",
          acquiredAtMs: 3,
          lastHeartbeatAtMs: 4,
          purpose: "deposit",
          serverRegion: "EU",
          serverIdentifier: "I",
        },
      ],
    }),
  ];

  for (let i = 0; i < faelle.length; i += 1) {
    const persistenz = {
      async lies() {
        return faelle[i];
      },
      async schreibeDurable() {},
    };
    const controller = new PersistenterBankLeaseController(
      new BankLeaseKoordinator(new RessourcenVerwalter()),
      persistenz,
    );
    await assert.rejects(
      () => controller.lade(100),
      /BANK_LEASE_PERSISTENZ/,
    );
  }
});
