import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  BankLeaseKoordinator,
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
  NodeBankDepositTransaktionsJournal,
} from "../grundlage/adapter/persistenz/node-bank-deposit-transaktionsjournal.mjs";
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
  #bankLeaseController;
  #runtime;

  constructor(
    host,
    bedienerRichtlinie,
    dateisystem,
    gesamtfreigabeGate,
    equipJournal,
    bankDepositJournal,
    bankLeaseController,
    runtime,
  ) {
    this.#host = host;
    this.#bedienerRichtlinie = bedienerRichtlinie;
    this.#dateisystem = dateisystem;
    this.#gesamtfreigabeGate = gesamtfreigabeGate;
    this.#equipJournal = equipJournal;
    this.#bankDepositJournal = bankDepositJournal;
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

  async pruefeBankDepositStartBereit() {
    const journal = await this.#bankDepositJournal.pruefeStartBereit();
    const offeneLeases = this.#bankLeaseController.sicht().filter(
      x => x.zustand !== "RELEASED",
    );
    return Object.freeze({
      bereit: journal.bereit && offeneLeases.length === 0,
      offeneTransaktionsId: journal.offeneTransaktionsId,
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
        || tick.bankDepositEinmalAuthorityOffen) {
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
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bedienerRichtlinie,
    planenProtokoll,
    equipEinmalAuthorityProtokoll,
    bankDepositEinmalAuthorityProtokoll,
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
  const bankLeaseController = new PersistenterBankLeaseController(
    new BankLeaseKoordinator(runtime.kernKomponenten().ressourcen),
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
    bankLeaseController,
    runtime,
  );
}
