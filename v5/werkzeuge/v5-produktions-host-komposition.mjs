import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  BANK_WITHDRAW_ACTION_CONTRACT_ID,
  BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
  BANK_WITHDRAW_EINMAL_POLICY_ID,
  BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
  BANK_WITHDRAW_VERIFIER_ID,
  BedienerRichtlinienDienst,
  PersistenterBankLeaseController,
  EQUIPMENT_CORE_MODUL_ID,
  EQUIPMENT_CORE_MODUL_VERSION,
  EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
  EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
  EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
  EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
  EQUIPMENT_EQUIP_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  ProduktivesBankDepositEinmalAdmissionGate,
  ProduktivesBankWithdrawEinmalAdmissionGate,
  ProduktivesEquipEinmalAdmissionGate,
  ProduktivesV5GesamtfreigabeGate,
  V5ProduktionsBootstrap,
  V5ProduktionsHostController,
  V5ProduktionsRuntime,
  erstelleKanonischeProduktionsKomposition,
} from "../erzeugt/index.js";
import {
  NodeProduktionsDateisystem,
} from "../grundlage/adapter/persistenz/node-produktions-dateisystem.mjs";
import {
  NodePlanenAktivierungsProtokoll,
} from "../grundlage/adapter/persistenz/node-planen-aktivierungs-protokoll.mjs";
import {
  NodeEquipEinmalAuthorityProtokoll,
} from "../grundlage/adapter/persistenz/node-equip-einmal-authority-protokoll.mjs";
import {
  NodeEquipTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-equip-transaktionsjournal.mjs";
import {
  NodeBankDepositEinmalAuthorityProtokoll,
} from "../grundlage/adapter/persistenz/node-bank-deposit-einmal-authority-protokoll.mjs";
import {
  NodeBankWithdrawEinmalAuthorityProtokoll,
} from "../grundlage/adapter/persistenz/node-bank-withdraw-einmal-authority-protokoll.mjs";
import {
  NodeBankDepositTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-deposit-transaktionsjournal.mjs";
import {
  NodeBankWithdrawTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-withdraw-transaktionsjournal.mjs";
import {
  NodeBankLeasePersistenz,
} from "../grundlage/adapter/persistenz/node-bank-lease-persistenz.mjs";
import {
  NodeBedienerDenyProtokoll,
} from "../grundlage/adapter/persistenz/node-bediener-deny-protokoll.mjs";
import {
  NodeProduktionsOperationsQuelle,
} from "../grundlage/adapter/persistenz/node-produktions-operations-quelle.mjs";

const V5_WURZEL = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function ladeJson(relativerPfad, maximaleBytes = 2_000_000) {
  const absolut = path.join(V5_WURZEL, relativerPfad);
  const text = await fs.readFile(absolut, "utf8");
  if (text.length < 2 || text.length > maximaleBytes) {
    throw new Error("PRODUKTIONS_HOST_KONFIG_DATEI_UNGUELTIG:" + relativerPfad);
  }
  let wert;
  try {
    wert = JSON.parse(text);
  } catch {
    throw new Error("PRODUKTIONS_HOST_KONFIG_JSON_UNGUELTIG:" + relativerPfad);
  }
  if (wert === null || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("PRODUKTIONS_HOST_KONFIG_FORMAT_UNGUELTIG:" + relativerPfad);
  }
  return wert;
}

function pruefeZeit(jetztMs) {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("NODE_PRODUKTIONS_HOST_ZEIT_UNGUELTIG");
  }
}

class NodeV5ProduktionsHost {
  #host;
  #bedienerRichtlinie;
  #dateisystem;
  #gesamtfreigabeGate;
  #equipJournal;
  #bankDepositJournal;
  #bankWithdrawJournal;
  #bankLeaseController;
  #runtime;

  constructor(
    host,
    bedienerRichtlinie,
    dateisystem,
    gesamtfreigabeGate,
    equipJournal,
    bankDepositJournal,
    bankWithdrawJournal,
    bankLeaseController,
    runtime,
  ) {
    this.#host = host;
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#dateisystem = dateisystem;
    this.#gesamtfreigabeGate = gesamtfreigabeGate;
    this.#equipJournal = equipJournal;
    this.#bankDepositJournal = bankDepositJournal;
    this.#bankWithdrawJournal = bankWithdrawJournal;
    this.#bankLeaseController = bankLeaseController;
    this.#runtime = runtime;
  }

  async starte(jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.starte(jetztMs);
  }

  async tick(jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.tick(jetztMs);
  }

  async aktivierePlanen(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.aktivierePlanen(anfrage, jetztMs);
  }

  async erteileEquipEinmalAuthority(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.erteileEquipEinmalAuthority(anfrage, jetztMs);
  }

  async erteileBankDepositEinmalAuthority(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.erteileBankDepositEinmalAuthority(anfrage, jetztMs);
  }

  async erteileBankWithdrawEinmalAuthority(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    return this.#host.erteileBankWithdrawEinmalAuthority(anfrage, jetztMs);
  }

  async pruefeBankDepositStartBereit() {
    const journal = await this.#bankDepositJournal.pruefeStartBereit();
    const withdrawJournal = await this.#bankWithdrawJournal.pruefeStartBereit();
    const offeneLeases = this.#bankLeaseController.sicht().filter(
      x => x.zustand !== "RELEASED",
    );
    return Object.freeze({
      bereit: journal.bereit && withdrawJournal.bereit
        && offeneLeases.length === 0,
      offeneTransaktionsId: journal.offeneTransaktionsId
        ?? withdrawJournal.offeneTransaktionsId,
      offeneBankLease: offeneLeases.length === 0
        ? null
        : Object.freeze({
          accountId: offeneLeases[0].accountId,
          ownerCharacterId: offeneLeases[0].ownerCharacterId,
          epoche: offeneLeases[0].epoche,
          zustand: offeneLeases[0].zustand,
          serverRegion: offeneLeases[0].serverRegion,
          serverIdentifier: offeneLeases[0].serverIdentifier,
        }),
    });
  }

  async pruefeBankWithdrawStartBereit() {
    const journal = await this.#bankWithdrawJournal.pruefeStartBereit();
    const depositJournal = await this.#bankDepositJournal.pruefeStartBereit();
    const offeneLeases = this.#bankLeaseController.sicht().filter(
      x => x.zustand !== "RELEASED",
    );
    return Object.freeze({
      bereit: journal.bereit && depositJournal.bereit
        && offeneLeases.length === 0,
      offeneTransaktionsId: journal.offeneTransaktionsId
        ?? depositJournal.offeneTransaktionsId,
      offeneBankLease: offeneLeases.length === 0
        ? null
        : Object.freeze({
          accountId: offeneLeases[0].accountId,
          ownerCharacterId: offeneLeases[0].ownerCharacterId,
          epoche: offeneLeases[0].epoche,
          zustand: offeneLeases[0].zustand,
          serverRegion: offeneLeases[0].serverRegion,
          serverIdentifier: offeneLeases[0].serverIdentifier,
        }),
    });
  }

  async schliesseBankLeaseRestartAbgleichAb(
    accountId,
    erwarteteEpoche,
    externeBelegungFrei,
    jetztMs,
  ) {
    pruefeZeit(jetztMs);
    return this.#bankLeaseController.schliesseRestartAbgleichAb(
      accountId,
      erwarteteEpoche,
      externeBelegungFrei,
      jetztMs,
    );
  }

  bankLeaseStatus() {
    return this.#bankLeaseController.sicht();
  }

  async fuehreEquipEinmalTransaktion(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_EQUIP_PROD_TX_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "characterId",
      "bestaetigungText",
      "configFingerprint",
      "prestateFingerprint",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_EQUIP_PROD_TX_FELD_UNGUELTIG:" + feld);
      }
    }
    if (!anfrage.kandidat
        || typeof anfrage.kandidat !== "object"
        || anfrage.kandidat.vorherigesSlotItem !== null
        || !anfrage.wissensSnapshot
        || typeof anfrage.wissensSnapshot !== "object"
        || !anfrage.liveVoraussetzungen
        || typeof anfrage.liveVoraussetzungen.pruefe !== "function"
        || !anfrage.adapter
        || typeof anfrage.adapter.sende !== "function"
        || !anfrage.recoveryBeobachter
        || typeof anfrage.recoveryBeobachter.beobachte !== "function") {
      throw new Error("NODE_EQUIP_PROD_TX_PORT_ODER_KANDIDAT_UNGUELTIG");
    }

    const journalBereit = await this.#equipJournal.pruefeStartBereit();
    if (!journalBereit.bereit) {
      throw new Error(
        "NODE_EQUIP_PROD_TX_OFFENE_TRANSAKTION:"
        + journalBereit.offeneTransaktionsId,
      );
    }

    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error("NODE_EQUIP_PROD_TX_HOST_NICHT_BEREIT:" + tick.grund);
    }

    const authorityMs = Date.now();
    const authorityErgebnis = await this.#host.erteileEquipEinmalAuthority(
      Object.freeze({
        schemaVersion: 1,
        aktivierungsId: anfrage.aktivierungsId,
        transaktionsId: anfrage.transaktionsId,
        faehigkeitId: EQUIPMENT_EQUIP_FAEHIGKEIT_ID,
        anbieterModulId: EQUIPMENT_CORE_MODUL_ID,
        anbieterVersion: EQUIPMENT_CORE_MODUL_VERSION,
        actionContractId: EQUIPMENT_EQUIP_ACTION_CONTRACT_ID,
        recoveryContractId: EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID,
        verifierId: EQUIPMENT_EQUIP_VERIFIER_ID,
        policyId: EQUIPMENT_EQUIP_EINMAL_POLICY_ID,
        bestaetigungText: anfrage.bestaetigungText,
        gueltigBisMs: authorityMs + 2_000,
      }),
      authorityMs,
    );
    if (!authorityErgebnis.erfolgreich || authorityErgebnis.authority === null) {
      throw new Error(
        "NODE_EQUIP_PROD_TX_AUTHORITY_BLOCKIERT:" + authorityErgebnis.grund,
      );
    }

    const authority = authorityErgebnis.authority;
    try {
      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error("NODE_EQUIP_PROD_TX_AUTHORITY_VOR_ADMISSION_ABGELAUFEN");
      }
      const gate = new ProduktivesEquipEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );
      return await this.#runtime.fuehreEquipEinmalTransaktion(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          characterId: anfrage.characterId,
          kandidat: Object.freeze({ ...anfrage.kandidat }),
          ausgestelltAmMs: admissionMs,
          gueltigBisMs: Math.min(
            admissionMs + 1_500,
            authority.daten().gueltigBisMs,
          ),
          authority,
          wissensSnapshot: Object.freeze({
            gitCommit: anfrage.wissensSnapshot.gitCommit,
            quellenSha256: Object.freeze([
              ...anfrage.wissensSnapshot.quellenSha256,
            ]),
          }),
          configFingerprint: anfrage.configFingerprint,
          prestateFingerprint: anfrage.prestateFingerprint,
        }),
        Object.freeze({
          laufzeitGate: gate,
          liveVoraussetzungen: anfrage.liveVoraussetzungen,
          journal: this.#equipJournal,
          adapter: anfrage.adapter,
          recoveryBeobachter: anfrage.recoveryBeobachter,
          jetztMs: () => Date.now(),
        }),
      );
    } finally {
      authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Fail-closed: Authority ist bereits lokal widerrufen.
      }
    }
  }

  async fuehreBankDepositEinGoldTransaktion(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_BANK_DEPOSIT_PROD_TX_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "bestaetigungText",
      "configFingerprint",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_DEPOSIT_PROD_TX_FELD_UNGUELTIG:" + feld);
      }
    }
    if (anfrage.bestaetigungText !== BANK_DEPOSIT_EINMAL_BESTAETIGUNG) {
      throw new Error("NODE_BANK_DEPOSIT_PROD_TX_BESTAETIGUNG_FEHLT");
    }
    if (!anfrage.ausgang
        || typeof anfrage.ausgang !== "object"
        || anfrage.ausgang.bankGemountet !== false
        || !anfrage.mountBeobachter
        || typeof anfrage.mountBeobachter.warteAufMount !== "function"
        || !anfrage.releaseBeobachter
        || typeof anfrage.releaseBeobachter.beobachte !== "function"
        || !anfrage.adapter
        || typeof anfrage.adapter.sende !== "function"
        || !anfrage.bankBeobachter
        || typeof anfrage.bankBeobachter.beobachte !== "function"
        || !anfrage.wissensSnapshot
        || typeof anfrage.wissensSnapshot !== "object") {
      throw new Error("NODE_BANK_DEPOSIT_PROD_TX_PORT_ODER_AUSGANG_UNGUELTIG");
    }
    for (const feld of [
      "accountId",
      "charakterName",
      "sessionId",
      "serverRegion",
      "serverKennung",
    ]) {
      const wert = anfrage.ausgang[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_DEPOSIT_PROD_TX_BINDUNG_UNGUELTIG:" + feld);
      }
    }
    if (!Array.isArray(anfrage.wissensSnapshot.quellenSha256)
        || typeof anfrage.wissensSnapshot.gitCommit !== "string") {
      throw new Error("NODE_BANK_DEPOSIT_PROD_TX_WISSENSSNAPSHOT_UNGUELTIG");
    }

    const startBereit = await this.pruefeBankDepositStartBereit();
    if (!startBereit.bereit) {
      throw new Error("NODE_BANK_DEPOSIT_PROD_TX_START_BLOCKIERT");
    }
    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error(
        "NODE_BANK_DEPOSIT_PROD_TX_HOST_NICHT_BEREIT:" + tick.grund,
      );
    }

    let leaseToken = null;
    let authority = null;
    try {
      leaseToken = await this.#bankLeaseController.beanspruche(
        anfrage.ausgang.accountId,
        anfrage.ausgang.charakterName,
        anfrage.ablaufId,
        "bank_deposit_one_shot_live",
        anfrage.ausgang.serverRegion,
        anfrage.ausgang.serverKennung,
        jetztMs,
        300_000,
      );

      const mount = await anfrage.mountBeobachter.warteAufMount(Object.freeze({
        schemaVersion: 1,
        accountId: leaseToken.accountId,
        characterId: leaseToken.ownerCharacterId,
        sessionId: anfrage.ausgang.sessionId,
        serverRegion: anfrage.ausgang.serverRegion,
        serverIdentifier: anfrage.ausgang.serverKennung,
        leaseEpoche: leaseToken.epoche,
        leaseErworbenAmMs: jetztMs,
        gameplayWrites: 0,
      }));
      if (!mount
          || typeof mount !== "object"
          || mount.bankGemountet !== true
          || mount.accountId !== leaseToken.accountId
          || mount.charakterName !== leaseToken.ownerCharacterId
          || mount.sessionId !== anfrage.ausgang.sessionId
          || mount.serverRegion !== anfrage.ausgang.serverRegion
          || mount.serverKennung !== anfrage.ausgang.serverKennung
          || !Number.isSafeInteger(mount.beobachtetAmMs)
          || mount.beobachtetAmMs < jetztMs
          || !Number.isSafeInteger(mount.characterGold)
          || mount.characterGold < 1
          || !Number.isSafeInteger(mount.bankGold)
          || mount.bankGold < 0
          || typeof mount.fingerprint !== "string"
          || !/^[0-9a-f]{64}$/i.test(mount.fingerprint)) {
        throw new Error("NODE_BANK_DEPOSIT_PROD_TX_MOUNT_EVIDENCE_UNGUELTIG");
      }

      const authorityMs = Date.now();
      if (mount.beobachtetAmMs > authorityMs
          || authorityMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_DEPOSIT_PROD_TX_MOUNT_EVIDENCE_STALE");
      }
      const authorityErgebnis =
        await this.#host.erteileBankDepositEinmalAuthority(
          Object.freeze({
            schemaVersion: 1,
            aktivierungsId: anfrage.aktivierungsId,
            transaktionsId: anfrage.transaktionsId,
            faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
            anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
            anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
            actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
            recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
            verifierId: BANK_DEPOSIT_VERIFIER_ID,
            policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
            bestaetigungText: anfrage.bestaetigungText,
            gueltigBisMs: authorityMs + 2_000,
          }),
          authorityMs,
        );
      if (!authorityErgebnis.erfolgreich
          || authorityErgebnis.authority === null) {
        throw new Error(
          "NODE_BANK_DEPOSIT_PROD_TX_AUTHORITY_BLOCKIERT:"
          + authorityErgebnis.grund,
        );
      }
      authority = authorityErgebnis.authority;

      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error(
          "NODE_BANK_DEPOSIT_PROD_TX_AUTHORITY_VOR_ADMISSION_ABGELAUFEN",
        );
      }
      if (admissionMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_DEPOSIT_PROD_TX_PRESTATE_STALE");
      }

      const fence = Object.freeze({
        serverRegion: mount.serverRegion,
        serverIdentifier: mount.serverKennung,
        mountedCharacterId: mount.charakterName,
        konflikt: false,
      });
      const vorher = Object.freeze({
        schemaVersion: 1,
        characterId: mount.charakterName,
        sessionId: mount.sessionId,
        serverRegion: mount.serverRegion,
        serverKennung: mount.serverKennung,
        leaseEpoche: leaseToken.epoche,
        mountEpoche: mount.beobachtetAmMs,
        beobachtetAmMs: mount.beobachtetAmMs,
        characterGold: mount.characterGold,
        bankGold: mount.bankGold,
        fingerprint: mount.fingerprint,
      });
      const gate = new ProduktivesBankDepositEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );

      const ergebnis = await this.#runtime.fuehreBankDepositEinGoldTransaktion(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          accountId: mount.accountId,
          characterId: mount.charakterName,
          sessionId: mount.sessionId,
          serverRegion: mount.serverRegion,
          serverIdentifier: mount.serverKennung,
          betrag: 1,
          ausgestelltAmMs: admissionMs,
          gueltigBisMs: Math.min(
            admissionMs + 1_500,
            authority.daten().gueltigBisMs,
          ),
          leaseDauerMs: 300_000,
          maximaleSnapshotAlterMs: 1_000,
          externalFence: fence,
          externalFenceBeobachtetAmMs: mount.beobachtetAmMs,
          vorher,
          authority,
          wissensSnapshot: Object.freeze({
            gitCommit: anfrage.wissensSnapshot.gitCommit,
            quellenSha256: Object.freeze([
              ...anfrage.wissensSnapshot.quellenSha256,
            ]),
          }),
          configFingerprint: anfrage.configFingerprint,
          prestateFingerprint: mount.fingerprint,
        }),
        Object.freeze({
          laufzeitGate: gate,
          journal: this.#bankDepositJournal,
          leaseController: this.#bankLeaseController,
          adapter: anfrage.adapter,
          bankBeobachter: anfrage.bankBeobachter,
          releaseBeobachter: anfrage.releaseBeobachter,
          vorabLeaseToken: leaseToken,
          jetztMs: () => Date.now(),
        }),
      );
      return Object.freeze({
        ...ergebnis,
        manualMountTransition: true,
        manualExitRequired: true,
      });
    } catch (fehler) {
      if (leaseToken !== null) {
        try {
          const sichtbar = this.#bankLeaseController.sicht().find(x =>
            x.accountId === leaseToken.accountId
            && x.epoche === leaseToken.epoche);
          if (sichtbar?.zustand === "ACTIVE"
              || sichtbar?.zustand === "ACQUIRING"
              || sichtbar?.zustand === "RELEASING") {
            await this.#bankLeaseController.markiereRecovery(
              leaseToken,
              Date.now(),
            );
          }
        } catch {
          // Fail-closed: bestehende Lease-Evidence bleibt erhalten.
        }
      }
      throw fehler;
    } finally {
      if (authority !== null) authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Authority ist lokal widerrufen; spaetere Revalidation kann nur sperren.
      }
    }
  }

  async fuehreBankDepositRealShadow(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_BANK_SHADOW_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "shadowBestaetigungText",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_FELD_UNGUELTIG:" + feld);
      }
    }
    if (anfrage.shadowBestaetigungText
        !== "V5 BANK DEPOSIT SHADOW OHNE WRITE AUSFUEHREN") {
      throw new Error("NODE_BANK_SHADOW_BESTAETIGUNG_FEHLT");
    }
    if (!anfrage.ausgang
        || typeof anfrage.ausgang !== "object"
        || anfrage.ausgang.bankGemountet !== false
        || !anfrage.mountBeobachter
        || typeof anfrage.mountBeobachter.warteAufMount !== "function"
        || !anfrage.releaseBeobachter
        || typeof anfrage.releaseBeobachter.beobachte !== "function") {
      throw new Error("NODE_BANK_SHADOW_PORT_ODER_AUSGANG_UNGUELTIG");
    }
    for (const feld of [
      "accountId",
      "charakterName",
      "sessionId",
      "serverRegion",
      "serverKennung",
    ]) {
      const wert = anfrage.ausgang[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_BINDUNG_UNGUELTIG:" + feld);
      }
    }

    const startBereit = await this.pruefeBankDepositStartBereit();
    if (!startBereit.bereit) {
      throw new Error("NODE_BANK_SHADOW_START_BLOCKIERT");
    }
    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error("NODE_BANK_SHADOW_HOST_NICHT_BEREIT:" + tick.grund);
    }

    let leaseToken = null;
    let authority = null;
    try {
      leaseToken = await this.#bankLeaseController.beanspruche(
        anfrage.ausgang.accountId,
        anfrage.ausgang.charakterName,
        anfrage.ablaufId,
        "bank_deposit_real_browser_shadow",
        anfrage.ausgang.serverRegion,
        anfrage.ausgang.serverKennung,
        jetztMs,
        300_000,
      );

      const mount = await anfrage.mountBeobachter.warteAufMount(Object.freeze({
        schemaVersion: 1,
        accountId: leaseToken.accountId,
        characterId: leaseToken.ownerCharacterId,
        sessionId: anfrage.ausgang.sessionId,
        serverRegion: anfrage.ausgang.serverRegion,
        serverIdentifier: anfrage.ausgang.serverKennung,
        leaseEpoche: leaseToken.epoche,
        leaseErworbenAmMs: jetztMs,
        gameplayWrites: 0,
      }));
      if (!mount
          || typeof mount !== "object"
          || mount.bankGemountet !== true
          || mount.accountId !== leaseToken.accountId
          || mount.charakterName !== leaseToken.ownerCharacterId
          || mount.sessionId !== anfrage.ausgang.sessionId
          || mount.serverRegion !== anfrage.ausgang.serverRegion
          || mount.serverKennung !== anfrage.ausgang.serverKennung
          || !Number.isSafeInteger(mount.beobachtetAmMs)
          || mount.beobachtetAmMs < jetztMs
          || typeof mount.fingerprint !== "string"
          || mount.fingerprint.length < 16) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_UNGUELTIG");
      }

      const fence = Object.freeze({
        serverRegion: mount.serverRegion,
        serverIdentifier: mount.serverKennung,
        mountedCharacterId: mount.charakterName,
        konflikt: false,
      });
      const authorityMs = Date.now();
      const authorityErgebnis =
        await this.#host.erteileBankDepositEinmalAuthority(
          Object.freeze({
            schemaVersion: 1,
            aktivierungsId: anfrage.aktivierungsId,
            transaktionsId: anfrage.transaktionsId,
            faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
            anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
            anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
            actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
            recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
            verifierId: BANK_DEPOSIT_VERIFIER_ID,
            policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
            bestaetigungText: BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
            gueltigBisMs: authorityMs + 2_000,
          }),
          authorityMs,
        );
      if (!authorityErgebnis.erfolgreich
          || authorityErgebnis.authority === null) {
        throw new Error(
          "NODE_BANK_SHADOW_AUTHORITY_BLOCKIERT:"
          + authorityErgebnis.grund,
        );
      }
      authority = authorityErgebnis.authority;

      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error("NODE_BANK_SHADOW_AUTHORITY_VOR_ADMISSION_ABGELAUFEN");
      }
      const gueltigBisMs = Math.min(
        admissionMs + 1_500,
        authority.daten().gueltigBisMs,
      );
      if (mount.beobachtetAmMs > admissionMs
          || admissionMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_STALE");
      }
      const liveVoraussetzungen = Object.freeze({
        async pruefe(ids, zeitMs) {
          if (zeitMs !== admissionMs || !Array.isArray(ids)) {
            return Object.freeze([]);
          }
          return Object.freeze(ids.map(id => Object.freeze({
            voraussetzungId: id,
            fingerprint: String(
              id + ":" + mount.fingerprint + ":"
              + String(mount.inventorySha256 || ""),
            ),
            beobachtetAmMs: mount.beobachtetAmMs,
            gueltigBisMs,
          })));
        },
      });
      const gate = new ProduktivesBankDepositEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );

      const ergebnis = await this.#runtime.fuehreBankDepositShadowAdmission(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          accountId: mount.accountId,
          characterId: mount.charakterName,
          serverRegion: mount.serverRegion,
          serverIdentifier: mount.serverKennung,
          ausgestelltAmMs: admissionMs,
          gueltigBisMs,
          leaseDauerMs: 300_000,
          maximaleSnapshotAlterMs: 1_000,
          externalFence: fence,
          externalFenceBeobachtetAmMs: mount.beobachtetAmMs,
          snapshot: Object.freeze({
            schemaVersion: 1,
            accountId: mount.accountId,
            ownerCharacterId: mount.charakterName,
            beobachtetAmMs: mount.beobachtetAmMs,
            fingerprint: mount.fingerprint,
          }),
          authority,
        }),
        Object.freeze({
          laufzeitGate: gate,
          liveVoraussetzungen,
          journal: this.#bankDepositJournal,
          leaseController: this.#bankLeaseController,
          releaseBeobachter: anfrage.releaseBeobachter,
          vorabLeaseToken: leaseToken,
          jetztMs: () => Date.now(),
        }),
      );

      return Object.freeze({
        ...ergebnis,
        manualMountTransition: true,
        manualExitRequired: true,
        browserGameplayWrites: 0,
        hostGameplayWrites: 0,
      });
    } catch (fehler) {
      if (leaseToken !== null) {
        try {
          const sichtbar = this.#bankLeaseController.sicht().find(x =>
            x.accountId === leaseToken.accountId
            && x.epoche === leaseToken.epoche);
          if (sichtbar?.zustand === "ACTIVE"
              || sichtbar?.zustand === "ACQUIRING"
              || sichtbar?.zustand === "RELEASING") {
            await this.#bankLeaseController.markiereRecovery(
              leaseToken,
              Date.now(),
            );
          }
        } catch {
          // Fail-closed: bestehende Lease-Evidence bleibt erhalten.
        }
      }
      throw fehler;
    } finally {
      if (authority !== null) authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Shadow bleibt ohne Write; Revalidation kann nur weiter sperren.
      }
    }
  }
  async fuehreBankWithdrawEinGoldTransaktion(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_BANK_WITHDRAW_PROD_TX_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "bestaetigungText",
      "configFingerprint",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_WITHDRAW_PROD_TX_FELD_UNGUELTIG:" + feld);
      }
    }
    if (anfrage.bestaetigungText !== BANK_WITHDRAW_EINMAL_BESTAETIGUNG) {
      throw new Error("NODE_BANK_WITHDRAW_PROD_TX_BESTAETIGUNG_FEHLT");
    }
    if (!anfrage.ausgang
        || typeof anfrage.ausgang !== "object"
        || anfrage.ausgang.bankGemountet !== false
        || !anfrage.mountBeobachter
        || typeof anfrage.mountBeobachter.warteAufMount !== "function"
        || !anfrage.releaseBeobachter
        || typeof anfrage.releaseBeobachter.beobachte !== "function"
        || !anfrage.adapter
        || typeof anfrage.adapter.sende !== "function"
        || !anfrage.bankBeobachter
        || typeof anfrage.bankBeobachter.beobachte !== "function"
        || !anfrage.wissensSnapshot
        || typeof anfrage.wissensSnapshot !== "object") {
      throw new Error("NODE_BANK_WITHDRAW_PROD_TX_PORT_ODER_AUSGANG_UNGUELTIG");
    }
    for (const feld of [
      "accountId",
      "charakterName",
      "sessionId",
      "serverRegion",
      "serverKennung",
    ]) {
      const wert = anfrage.ausgang[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_WITHDRAW_PROD_TX_BINDUNG_UNGUELTIG:" + feld);
      }
    }
    if (!Array.isArray(anfrage.wissensSnapshot.quellenSha256)
        || typeof anfrage.wissensSnapshot.gitCommit !== "string") {
      throw new Error("NODE_BANK_WITHDRAW_PROD_TX_WISSENSSNAPSHOT_UNGUELTIG");
    }

    const startBereit = await this.pruefeBankWithdrawStartBereit();
    if (!startBereit.bereit) {
      throw new Error("NODE_BANK_WITHDRAW_PROD_TX_START_BLOCKIERT");
    }
    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error(
        "NODE_BANK_WITHDRAW_PROD_TX_HOST_NICHT_BEREIT:" + tick.grund,
      );
    }

    let leaseToken = null;
    let authority = null;
    try {
      leaseToken = await this.#bankLeaseController.beanspruche(
        anfrage.ausgang.accountId,
        anfrage.ausgang.charakterName,
        anfrage.ablaufId,
        "bank_withdraw_one_shot_live",
        anfrage.ausgang.serverRegion,
        anfrage.ausgang.serverKennung,
        jetztMs,
        300_000,
      );

      const mount = await anfrage.mountBeobachter.warteAufMount(Object.freeze({
        schemaVersion: 1,
        accountId: leaseToken.accountId,
        characterId: leaseToken.ownerCharacterId,
        sessionId: anfrage.ausgang.sessionId,
        serverRegion: anfrage.ausgang.serverRegion,
        serverIdentifier: anfrage.ausgang.serverKennung,
        leaseEpoche: leaseToken.epoche,
        leaseErworbenAmMs: jetztMs,
        gameplayWrites: 0,
      }));
      if (!mount
          || typeof mount !== "object"
          || mount.bankGemountet !== true
          || mount.accountId !== leaseToken.accountId
          || mount.charakterName !== leaseToken.ownerCharacterId
          || mount.sessionId !== anfrage.ausgang.sessionId
          || mount.serverRegion !== anfrage.ausgang.serverRegion
          || mount.serverKennung !== anfrage.ausgang.serverKennung
          || !Number.isSafeInteger(mount.beobachtetAmMs)
          || mount.beobachtetAmMs < jetztMs
          || !Number.isSafeInteger(mount.characterGold)
          || mount.characterGold < 0
          || !Number.isSafeInteger(mount.bankGold)
          || mount.bankGold < 1
          || typeof mount.fingerprint !== "string"
          || !/^[0-9a-f]{64}$/i.test(mount.fingerprint)) {
        throw new Error("NODE_BANK_WITHDRAW_PROD_TX_MOUNT_EVIDENCE_UNGUELTIG");
      }

      const authorityMs = Date.now();
      if (mount.beobachtetAmMs > authorityMs
          || authorityMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_WITHDRAW_PROD_TX_MOUNT_EVIDENCE_STALE");
      }
      const authorityErgebnis =
        await this.#host.erteileBankWithdrawEinmalAuthority(
          Object.freeze({
            schemaVersion: 1,
            aktivierungsId: anfrage.aktivierungsId,
            transaktionsId: anfrage.transaktionsId,
            faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
            anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
            anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
            actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
            recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
            verifierId: BANK_WITHDRAW_VERIFIER_ID,
            policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
            bestaetigungText: anfrage.bestaetigungText,
            gueltigBisMs: authorityMs + 2_000,
          }),
          authorityMs,
        );
      if (!authorityErgebnis.erfolgreich
          || authorityErgebnis.authority === null) {
        throw new Error(
          "NODE_BANK_WITHDRAW_PROD_TX_AUTHORITY_BLOCKIERT:"
          + authorityErgebnis.grund,
        );
      }
      authority = authorityErgebnis.authority;

      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error(
          "NODE_BANK_WITHDRAW_PROD_TX_AUTHORITY_VOR_ADMISSION_ABGELAUFEN",
        );
      }
      if (admissionMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_WITHDRAW_PROD_TX_PRESTATE_STALE");
      }

      const fence = Object.freeze({
        serverRegion: mount.serverRegion,
        serverIdentifier: mount.serverKennung,
        mountedCharacterId: mount.charakterName,
        konflikt: false,
      });
      const vorher = Object.freeze({
        schemaVersion: 1,
        characterId: mount.charakterName,
        sessionId: mount.sessionId,
        serverRegion: mount.serverRegion,
        serverKennung: mount.serverKennung,
        leaseEpoche: leaseToken.epoche,
        mountEpoche: mount.beobachtetAmMs,
        beobachtetAmMs: mount.beobachtetAmMs,
        characterGold: mount.characterGold,
        bankGold: mount.bankGold,
        fingerprint: mount.fingerprint,
      });
      const gate = new ProduktivesBankWithdrawEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );

      const ergebnis = await this.#runtime.fuehreBankWithdrawEinGoldTransaktion(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          accountId: mount.accountId,
          characterId: mount.charakterName,
          sessionId: mount.sessionId,
          serverRegion: mount.serverRegion,
          serverIdentifier: mount.serverKennung,
          betrag: 1,
          ausgestelltAmMs: admissionMs,
          gueltigBisMs: Math.min(
            admissionMs + 1_500,
            authority.daten().gueltigBisMs,
          ),
          leaseDauerMs: 300_000,
          maximaleSnapshotAlterMs: 1_000,
          externalFence: fence,
          externalFenceBeobachtetAmMs: mount.beobachtetAmMs,
          vorher,
          authority,
          wissensSnapshot: Object.freeze({
            gitCommit: anfrage.wissensSnapshot.gitCommit,
            quellenSha256: Object.freeze([
              ...anfrage.wissensSnapshot.quellenSha256,
            ]),
          }),
          configFingerprint: anfrage.configFingerprint,
          prestateFingerprint: mount.fingerprint,
        }),
        Object.freeze({
          laufzeitGate: gate,
          journal: this.#bankDepositJournal,
          leaseController: this.#bankLeaseController,
          adapter: anfrage.adapter,
          bankBeobachter: anfrage.bankBeobachter,
          releaseBeobachter: anfrage.releaseBeobachter,
          vorabLeaseToken: leaseToken,
          jetztMs: () => Date.now(),
        }),
      );
      return Object.freeze({
        ...ergebnis,
        manualMountTransition: true,
        manualExitRequired: true,
      });
    } catch (fehler) {
      if (leaseToken !== null) {
        try {
          const sichtbar = this.#bankLeaseController.sicht().find(x =>
            x.accountId === leaseToken.accountId
            && x.epoche === leaseToken.epoche);
          if (sichtbar?.zustand === "ACTIVE"
              || sichtbar?.zustand === "ACQUIRING"
              || sichtbar?.zustand === "RELEASING") {
            await this.#bankLeaseController.markiereRecovery(
              leaseToken,
              Date.now(),
            );
          }
        } catch {
          // Fail-closed: bestehende Lease-Evidence bleibt erhalten.
        }
      }
      throw fehler;
    } finally {
      if (authority !== null) authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Authority ist lokal widerrufen; spaetere Revalidation kann nur sperren.
      }
    }
  }

  async fuehreBankWithdrawRealShadow(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_BANK_SHADOW_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "shadowBestaetigungText",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_FELD_UNGUELTIG:" + feld);
      }
    }
    if (anfrage.shadowBestaetigungText
        !== "V5 BANK DEPOSIT SHADOW OHNE WRITE AUSFUEHREN") {
      throw new Error("NODE_BANK_SHADOW_BESTAETIGUNG_FEHLT");
    }
    if (!anfrage.ausgang
        || typeof anfrage.ausgang !== "object"
        || anfrage.ausgang.bankGemountet !== false
        || !anfrage.mountBeobachter
        || typeof anfrage.mountBeobachter.warteAufMount !== "function"
        || !anfrage.releaseBeobachter
        || typeof anfrage.releaseBeobachter.beobachte !== "function") {
      throw new Error("NODE_BANK_SHADOW_PORT_ODER_AUSGANG_UNGUELTIG");
    }
    for (const feld of [
      "accountId",
      "charakterName",
      "sessionId",
      "serverRegion",
      "serverKennung",
    ]) {
      const wert = anfrage.ausgang[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_BINDUNG_UNGUELTIG:" + feld);
      }
    }

    const startBereit = await this.pruefeBankWithdrawStartBereit();
    if (!startBereit.bereit) {
      throw new Error("NODE_BANK_SHADOW_START_BLOCKIERT");
    }
    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error("NODE_BANK_SHADOW_HOST_NICHT_BEREIT:" + tick.grund);
    }

    let leaseToken = null;
    let authority = null;
    try {
      leaseToken = await this.#bankLeaseController.beanspruche(
        anfrage.ausgang.accountId,
        anfrage.ausgang.charakterName,
        anfrage.ablaufId,
        "bank_withdraw_real_browser_shadow",
        anfrage.ausgang.serverRegion,
        anfrage.ausgang.serverKennung,
        jetztMs,
        300_000,
      );

      const mount = await anfrage.mountBeobachter.warteAufMount(Object.freeze({
        schemaVersion: 1,
        accountId: leaseToken.accountId,
        characterId: leaseToken.ownerCharacterId,
        sessionId: anfrage.ausgang.sessionId,
        serverRegion: anfrage.ausgang.serverRegion,
        serverIdentifier: anfrage.ausgang.serverKennung,
        leaseEpoche: leaseToken.epoche,
        leaseErworbenAmMs: jetztMs,
        gameplayWrites: 0,
      }));
      if (!mount
          || typeof mount !== "object"
          || mount.bankGemountet !== true
          || mount.accountId !== leaseToken.accountId
          || mount.charakterName !== leaseToken.ownerCharacterId
          || mount.sessionId !== anfrage.ausgang.sessionId
          || mount.serverRegion !== anfrage.ausgang.serverRegion
          || mount.serverKennung !== anfrage.ausgang.serverKennung
          || !Number.isSafeInteger(mount.beobachtetAmMs)
          || mount.beobachtetAmMs < jetztMs
          || typeof mount.fingerprint !== "string"
          || mount.fingerprint.length < 16) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_UNGUELTIG");
      }

      const fence = Object.freeze({
        serverRegion: mount.serverRegion,
        serverIdentifier: mount.serverKennung,
        mountedCharacterId: mount.charakterName,
        konflikt: false,
      });
      const authorityMs = Date.now();
      const authorityErgebnis =
        await this.#host.erteileBankWithdrawEinmalAuthority(
          Object.freeze({
            schemaVersion: 1,
            aktivierungsId: anfrage.aktivierungsId,
            transaktionsId: anfrage.transaktionsId,
            faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
            anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
            anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
            actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
            recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
            verifierId: BANK_WITHDRAW_VERIFIER_ID,
            policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
            bestaetigungText: BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
            gueltigBisMs: authorityMs + 2_000,
          }),
          authorityMs,
        );
      if (!authorityErgebnis.erfolgreich
          || authorityErgebnis.authority === null) {
        throw new Error(
          "NODE_BANK_SHADOW_AUTHORITY_BLOCKIERT:"
          + authorityErgebnis.grund,
        );
      }
      authority = authorityErgebnis.authority;

      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error("NODE_BANK_SHADOW_AUTHORITY_VOR_ADMISSION_ABGELAUFEN");
      }
      const gueltigBisMs = Math.min(
        admissionMs + 1_500,
        authority.daten().gueltigBisMs,
      );
      if (mount.beobachtetAmMs > admissionMs
          || admissionMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_STALE");
      }
      const liveVoraussetzungen = Object.freeze({
        async pruefe(ids, zeitMs) {
          if (zeitMs !== admissionMs || !Array.isArray(ids)) {
            return Object.freeze([]);
          }
          return Object.freeze(ids.map(id => Object.freeze({
            voraussetzungId: id,
            fingerprint: String(
              id + ":" + mount.fingerprint + ":"
              + String(mount.inventorySha256 || ""),
            ),
            beobachtetAmMs: mount.beobachtetAmMs,
            gueltigBisMs,
          })));
        },
      });
      const gate = new ProduktivesBankWithdrawEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );

      const ergebnis = await this.#runtime.fuehreBankWithdrawShadowAdmission(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          accountId: mount.accountId,
          characterId: mount.charakterName,
          serverRegion: mount.serverRegion,
          serverIdentifier: mount.serverKennung,
          ausgestelltAmMs: admissionMs,
          gueltigBisMs,
          leaseDauerMs: 300_000,
          maximaleSnapshotAlterMs: 1_000,
          externalFence: fence,
          externalFenceBeobachtetAmMs: mount.beobachtetAmMs,
          snapshot: Object.freeze({
            schemaVersion: 1,
            accountId: mount.accountId,
            ownerCharacterId: mount.charakterName,
            beobachtetAmMs: mount.beobachtetAmMs,
            fingerprint: mount.fingerprint,
          }),
          authority,
        }),
        Object.freeze({
          laufzeitGate: gate,
          liveVoraussetzungen,
          journal: this.#bankDepositJournal,
          leaseController: this.#bankLeaseController,
          releaseBeobachter: anfrage.releaseBeobachter,
          vorabLeaseToken: leaseToken,
          jetztMs: () => Date.now(),
        }),
      );

      return Object.freeze({
        ...ergebnis,
        manualMountTransition: true,
        manualExitRequired: true,
        browserGameplayWrites: 0,
        hostGameplayWrites: 0,
      });
    } catch (fehler) {
      if (leaseToken !== null) {
        try {
          const sichtbar = this.#bankLeaseController.sicht().find(x =>
            x.accountId === leaseToken.accountId
            && x.epoche === leaseToken.epoche);
          if (sichtbar?.zustand === "ACTIVE"
              || sichtbar?.zustand === "ACQUIRING"
              || sichtbar?.zustand === "RELEASING") {
            await this.#bankLeaseController.markiereRecovery(
              leaseToken,
              Date.now(),
            );
          }
        } catch {
          // Fail-closed: bestehende Lease-Evidence bleibt erhalten.
        }
      }
      throw fehler;
    } finally {
      if (authority !== null) authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Shadow bleibt ohne Write; Revalidation kann nur weiter sperren.
      }
    }
  }

  async fuehreBankWithdrawRealShadow(anfrage, jetztMs) {
    pruefeZeit(jetztMs);
    if (anfrage === null || typeof anfrage !== "object") {
      throw new Error("NODE_BANK_SHADOW_ANFRAGE_UNGUELTIG");
    }
    for (const feld of [
      "aktivierungsId",
      "transaktionsId",
      "freigabeId",
      "auftragId",
      "ablaufId",
      "shadowBestaetigungText",
    ]) {
      const wert = anfrage[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_FELD_UNGUELTIG:" + feld);
      }
    }
    if (anfrage.shadowBestaetigungText
        !== "V5 BANK WITHDRAW SHADOW OHNE WRITE AUSFUEHREN") {
      throw new Error("NODE_BANK_SHADOW_BESTAETIGUNG_FEHLT");
    }
    if (!anfrage.ausgang
        || typeof anfrage.ausgang !== "object"
        || anfrage.ausgang.bankGemountet !== false
        || !anfrage.mountBeobachter
        || typeof anfrage.mountBeobachter.warteAufMount !== "function"
        || !anfrage.releaseBeobachter
        || typeof anfrage.releaseBeobachter.beobachte !== "function") {
      throw new Error("NODE_BANK_SHADOW_PORT_ODER_AUSGANG_UNGUELTIG");
    }
    for (const feld of [
      "accountId",
      "charakterName",
      "sessionId",
      "serverRegion",
      "serverKennung",
    ]) {
      const wert = anfrage.ausgang[feld];
      if (typeof wert !== "string"
          || wert.trim().length === 0
          || wert.length > 192) {
        throw new Error("NODE_BANK_SHADOW_BINDUNG_UNGUELTIG:" + feld);
      }
    }

    const startBereit = await this.pruefeBankWithdrawStartBereit();
    if (!startBereit.bereit) {
      throw new Error("NODE_BANK_SHADOW_START_BLOCKIERT");
    }
    const tick = await this.#host.tick(jetztMs);
    if (tick.zustand !== "LAEUFT"
        || tick.aktivePlanenFaehigkeiten.length !== 0
        || tick.equipEinmalAuthorityOffen
        || tick.bankDepositEinmalAuthorityOffen
        || tick.bankWithdrawEinmalAuthorityOffen) {
      throw new Error("NODE_BANK_SHADOW_HOST_NICHT_BEREIT:" + tick.grund);
    }

    let leaseToken = null;
    let authority = null;
    try {
      leaseToken = await this.#bankLeaseController.beanspruche(
        anfrage.ausgang.accountId,
        anfrage.ausgang.charakterName,
        anfrage.ablaufId,
        "bank_withdraw_real_browser_shadow",
        anfrage.ausgang.serverRegion,
        anfrage.ausgang.serverKennung,
        jetztMs,
        300_000,
      );

      const mount = await anfrage.mountBeobachter.warteAufMount(Object.freeze({
        schemaVersion: 1,
        accountId: leaseToken.accountId,
        characterId: leaseToken.ownerCharacterId,
        sessionId: anfrage.ausgang.sessionId,
        serverRegion: anfrage.ausgang.serverRegion,
        serverIdentifier: anfrage.ausgang.serverKennung,
        leaseEpoche: leaseToken.epoche,
        leaseErworbenAmMs: jetztMs,
        gameplayWrites: 0,
      }));
      if (!mount
          || typeof mount !== "object"
          || mount.bankGemountet !== true
          || mount.accountId !== leaseToken.accountId
          || mount.charakterName !== leaseToken.ownerCharacterId
          || mount.sessionId !== anfrage.ausgang.sessionId
          || mount.serverRegion !== anfrage.ausgang.serverRegion
          || mount.serverKennung !== anfrage.ausgang.serverKennung
          || !Number.isSafeInteger(mount.beobachtetAmMs)
          || mount.beobachtetAmMs < jetztMs
          || !Number.isSafeInteger(mount.bankGold)
          || mount.bankGold < 1
          || typeof mount.fingerprint !== "string"
          || mount.fingerprint.length < 16) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_UNGUELTIG");
      }

      const fence = Object.freeze({
        serverRegion: mount.serverRegion,
        serverIdentifier: mount.serverKennung,
        mountedCharacterId: mount.charakterName,
        konflikt: false,
      });
      const authorityMs = Date.now();
      const authorityErgebnis =
        await this.#host.erteileBankWithdrawEinmalAuthority(
          Object.freeze({
            schemaVersion: 1,
            aktivierungsId: anfrage.aktivierungsId,
            transaktionsId: anfrage.transaktionsId,
            faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
            anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
            anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
            actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
            recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
            verifierId: BANK_WITHDRAW_VERIFIER_ID,
            policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
            bestaetigungText: BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
            gueltigBisMs: authorityMs + 2_000,
          }),
          authorityMs,
        );
      if (!authorityErgebnis.erfolgreich
          || authorityErgebnis.authority === null) {
        throw new Error(
          "NODE_BANK_SHADOW_AUTHORITY_BLOCKIERT:"
          + authorityErgebnis.grund,
        );
      }
      authority = authorityErgebnis.authority;

      const admissionMs = Date.now();
      if (!authority.gueltigFuer(admissionMs)) {
        throw new Error("NODE_BANK_SHADOW_AUTHORITY_VOR_ADMISSION_ABGELAUFEN");
      }
      const gueltigBisMs = Math.min(
        admissionMs + 1_500,
        authority.daten().gueltigBisMs,
      );
      if (mount.beobachtetAmMs > admissionMs
          || admissionMs - mount.beobachtetAmMs > 1_000) {
        throw new Error("NODE_BANK_SHADOW_MOUNT_EVIDENCE_STALE");
      }
      const liveVoraussetzungen = Object.freeze({
        async pruefe(ids, zeitMs) {
          if (zeitMs !== admissionMs || !Array.isArray(ids)) {
            return Object.freeze([]);
          }
          return Object.freeze(ids.map(id => Object.freeze({
            voraussetzungId: id,
            fingerprint: String(
              id + ":" + mount.fingerprint + ":"
              + String(mount.inventorySha256 || ""),
            ),
            beobachtetAmMs: mount.beobachtetAmMs,
            gueltigBisMs,
          })));
        },
      });
      const gate = new ProduktivesBankWithdrawEinmalAdmissionGate(
        this.#gesamtfreigabeGate,
        () => this.#host.status(),
        authority,
      );

      const ergebnis = await this.#runtime.fuehreBankWithdrawShadowAdmission(
        Object.freeze({
          schemaVersion: 1,
          freigabeId: anfrage.freigabeId,
          auftragId: anfrage.auftragId,
          ablaufId: anfrage.ablaufId,
          transaktionsId: anfrage.transaktionsId,
          accountId: mount.accountId,
          characterId: mount.charakterName,
          serverRegion: mount.serverRegion,
          serverIdentifier: mount.serverKennung,
          ausgestelltAmMs: admissionMs,
          gueltigBisMs,
          leaseDauerMs: 300_000,
          maximaleSnapshotAlterMs: 1_000,
          externalFence: fence,
          externalFenceBeobachtetAmMs: mount.beobachtetAmMs,
          snapshot: Object.freeze({
            schemaVersion: 1,
            accountId: mount.accountId,
            ownerCharacterId: mount.charakterName,
            beobachtetAmMs: mount.beobachtetAmMs,
            fingerprint: mount.fingerprint,
          }),
          authority,
        }),
        Object.freeze({
          laufzeitGate: gate,
          liveVoraussetzungen,
          journal: this.#bankWithdrawJournal,
          leaseController: this.#bankLeaseController,
          releaseBeobachter: anfrage.releaseBeobachter,
          vorabLeaseToken: leaseToken,
          jetztMs: () => Date.now(),
        }),
      );

      return Object.freeze({
        ...ergebnis,
        manualMountTransition: true,
        manualExitRequired: true,
        browserGameplayWrites: 0,
        hostGameplayWrites: 0,
      });
    } catch (fehler) {
      if (leaseToken !== null) {
        try {
          const sichtbar = this.#bankLeaseController.sicht().find(x =>
            x.accountId === leaseToken.accountId
            && x.epoche === leaseToken.epoche);
          if (sichtbar?.zustand === "ACTIVE"
              || sichtbar?.zustand === "ACQUIRING"
              || sichtbar?.zustand === "RELEASING") {
            await this.#bankLeaseController.markiereRecovery(
              leaseToken,
              Date.now(),
            );
          }
        } catch {
          // Fail-closed: bestehende Lease-Evidence bleibt erhalten.
        }
      }
      throw fehler;
    } finally {
      if (authority !== null) authority.widerrufe();
      try {
        await this.#host.tick(Date.now());
      } catch {
        // Shadow bleibt ohne Write; Revalidation kann nur weiter sperren.
      }
    }
  }

  async wendeDenyAn(befehl, jetztMs) {
    pruefeZeit(jetztMs);
    const snapshot = await this.#bedienerRichtlinie.wendeDenyAn(befehl);
    let hostStatus = this.#host.status();
    if (hostStatus.zustand === "LAEUFT") {
      hostStatus = await this.#host.tick(jetztMs);
    }
    return Object.freeze({
      schemaVersion: 1,
      bediener: snapshot,
      host: hostStatus,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
      actionAuthority: false,
    });
  }

  async stoppe(grund) {
    return this.#host.stoppe(grund);
  }

  status() {
    return this.#host.status();
  }

  bedienerStatus() {
    return this.#bedienerRichtlinie.snapshot();
  }

  produktionsWurzel() {
    return this.#dateisystem.wurzel;
  }
}

export async function erstelleNodeV5ProduktionsHost({
  dateisystemOptionen = {},
  operationsOptionen = {},
  bereitschaft = null,
  gesamtfreigabe = null,
} = {}) {
  const effektiveBereitschaft = bereitschaft
    ?? await ladeJson("bereitschaft/laufzeit-bereitschaft.json");
  const effektiveGesamtfreigabe = gesamtfreigabe
    ?? await ladeJson("roadmap/gesamtfreigabe.json");

  const dateisystem = new NodeProduktionsDateisystem(dateisystemOptionen);
  const bedienerProtokoll = new NodeBedienerDenyProtokoll(dateisystem);
  const bedienerRichtlinie = new BedienerRichtlinienDienst(
    bedienerProtokoll,
  );

  const historischeDenyBefehle =
    await bedienerProtokoll.ladeWirksameDenyBefehle();
  for (const befehl of historischeDenyBefehle) {
    await bedienerRichtlinie.wendeDenyAn(befehl);
  }

  const planenProtokoll = new NodePlanenAktivierungsProtokoll(
    dateisystem,
  );
  const equipEinmalAuthorityProtokoll = new NodeEquipEinmalAuthorityProtokoll(
    dateisystem,
  );
  const bankDepositEinmalAuthorityProtokoll =
    new NodeBankDepositEinmalAuthorityProtokoll(dateisystem);
  const bankWithdrawEinmalAuthorityProtokoll =
    new NodeBankWithdrawEinmalAuthorityProtokoll(dateisystem);
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bedienerRichtlinie,
    planenProtokoll,
    equipEinmalAuthorityProtokoll,
    bankDepositEinmalAuthorityProtokoll,
    bankWithdrawEinmalAuthorityProtokoll,
  );
  const gesamtfreigabeGate = new ProduktivesV5GesamtfreigabeGate(
    effektiveBereitschaft,
    effektiveGesamtfreigabe,
    1,
  );
  const bootstrap = new V5ProduktionsBootstrap(
    gesamtfreigabeGate,
    runtime.operationsSupervisor(),
    runtime,
  );
  const operationsQuelle = new NodeProduktionsOperationsQuelle(
    dateisystem,
    operationsOptionen,
  );
  const host = new V5ProduktionsHostController(
    bootstrap,
    runtime,
    operationsQuelle,
  );
  const equipJournal = new NodeEquipTransaktionsJournal(dateisystem);
  const bankDepositJournal = new NodeBankDepositTransaktionsJournal(dateisystem);
  const bankWithdrawJournal = new NodeBankWithdrawTransaktionsJournal(dateisystem);
  const bankLeaseController = new PersistenterBankLeaseController(
    runtime.bankLeaseKoordinator(),
    new NodeBankLeasePersistenz(dateisystem),
  );
  await bankLeaseController.lade(Date.now());

  return new NodeV5ProduktionsHost(
    host,
    bedienerRichtlinie,
    dateisystem,
    gesamtfreigabeGate,
    equipJournal,
    bankDepositJournal,
    bankWithdrawJournal,
    bankLeaseController,
    runtime,
  );
}
