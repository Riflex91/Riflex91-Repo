import test from "node:test";
import assert from "node:assert/strict";

import {
  BankLeaseKoordinator,
  RessourcenVerwalter,
  actionKanalRessourcenId,
} from "../../erzeugt/index.js";

const fence = {
  serverRegion: "EU",
  serverIdentifier: "I",
  mountedCharacterId: "merchant",
  konflikt: false,
};

test("Bankmutation braucht accountweite Lease plus lokalen Bank-Channel und externes Fence", () => {
  const ressourcen = new RessourcenVerwalter();
  const bank = new BankLeaseKoordinator(ressourcen);
  const token = bank.beanspruche(
    "account-1", "merchant", "WF-BANK", "store", "EU", "I", 0, 1000,
  );

  assert.throws(
    () => bank.beanspruche(
      "account-1", "warrior", "WF-BANK-2", "retrieve", "EU", "I", 0, 1000,
    ),
    /BANK_LEASE_ACCOUNT_BEREITS_BELEGT/,
  );

  const aktiv = bank.aktiviere(token, fence, 1);
  assert.equal(aktiv.zustand, "ACTIVE");

  const [kanal] = ressourcen.beanspruche("WF-BANK", [{
    ressourcenId: actionKanalRessourcenId("merchant", "bank"),
    art: "ACTION_KANAL",
    leaseDauerMs: null,
  }], 1);

  assert.equal(bank.validiereMutation(token, kanal, fence, 1), true);
  assert.equal(bank.validiereMutation(token, kanal, {
    ...fence,
    mountedCharacterId: "warrior",
    konflikt: true,
  }, 1), false);
});

test("Bank External-Fence-Mismatch quarantiniert statt Force/Retry", () => {
  const ressourcen = new RessourcenVerwalter();
  const bank = new BankLeaseKoordinator(ressourcen);
  const token = bank.beanspruche(
    "account-1", "merchant", "WF-BANK", "store", "EU", "I", 0, 1000,
  );
  const sicht = bank.aktiviere(token, {
    serverRegion: "EU",
    serverIdentifier: "I",
    mountedCharacterId: "unmanaged-character",
    konflikt: true,
  }, 1);
  assert.equal(sicht.zustand, "QUARANTINED");
});

test("Banklease wird nur nach terminalem Settlement und beobachtetem Exit freigegeben", () => {
  const ressourcen = new RessourcenVerwalter();
  const bank = new BankLeaseKoordinator(ressourcen);
  const token = bank.beanspruche(
    "account-1", "merchant", "WF-BANK", "store", "EU", "I", 0, 1000,
  );
  bank.aktiviere(token, fence, 1);
  bank.beginneFreigabe(token, 2);

  assert.throws(
    () => bank.gibFrei(token, {
      offeneTransaktionen: 1,
      backendInProgress: false,
      bankActionInFlight: false,
      characterBankAktiv: false,
      erwarteterExitBeobachtet: true,
    }, 3),
    /BANK_LEASE_RELEASE_NACHWEIS_UNVOLLSTAENDIG/,
  );

  const released = bank.gibFrei(token, {
    offeneTransaktionen: 0,
    backendInProgress: false,
    bankActionInFlight: false,
    characterBankAktiv: false,
    erwarteterExitBeobachtet: true,
  }, 4);
  assert.equal(released.zustand, "RELEASED");
});

test("Restart importiert nicht-terminale Banklease als RECOVERY_PENDING und fenced alte Epoche", () => {
  const ressourcen = new RessourcenVerwalter();
  const bank = new BankLeaseKoordinator(ressourcen);
  const restart = bank.importiereNachRestart({
    accountId: "account-1",
    ownerCharacterId: "merchant",
    ablaufId: "ALT-WF",
    epoche: 8,
    acquiredAtMs: 100,
    lastHeartbeatAtMs: 200,
    purpose: "store",
    serverRegion: "EU",
    serverIdentifier: "I",
  });
  assert.equal(restart.zustand, "RECOVERY_PENDING");

  assert.throws(
    () => bank.beanspruche(
      "account-1", "merchant", "NEU-WF", "store", "EU", "I", 300, 1000,
    ),
    /BANK_LEASE_ACCOUNT_BEREITS_BELEGT/,
  );

  const abgeglichen = bank.schliesseRestartAbgleichAb("account-1", 8, true, 301);
  assert.equal(abgeglichen.zustand, "RELEASED");

  const neu = bank.beanspruche(
    "account-1", "merchant", "NEU-WF", "store", "EU", "I", 302, 1000,
  );
  assert.ok(neu.epoche > 8);
});
