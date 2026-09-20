import type { DurableIntentToken } from "../persistenz/journal.js";
import type { TransaktionsJournalEintrag } from "../persistenz/ports.js";
import type { FencingToken } from "../scheduler/ressourcen-verwalter.js";
import {
  CharacterSocketBudget,
  type MutationsKanalFreigabe,
} from "../scheduler/socket-budget.js";
import { RessourcenVerwalter } from "../scheduler/ressourcen-verwalter.js";
import {
  bindeDurablesIntent,
  type DurablerIntentNachweis,
} from "./intent-bindung.js";
import type {
  AktionsVertragsPort,
  FaehigkeitsAutoritaetsPort,
  LaufzeitGatePort,
  LiveVoraussetzungsNachweis,
  LiveVoraussetzungsPrueferPort,
  OperatorRichtlinienPort,
} from "./ports.js";

export interface AdmissionAnfrage {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: string;
  readonly eigentuemerModulId: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
  readonly invariantenKennungen: readonly string[];
  readonly voraussetzungsIds: readonly string[];
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly fencingTokens: readonly FencingToken[];
  readonly mutationsKanal: MutationsKanalFreigabe;
  readonly intentToken: DurableIntentToken;
  readonly intentEintrag: TransaktionsJournalEintrag;
}

export interface AdmissionAbhaengigkeiten {
  readonly faehigkeitsAutoritaet: FaehigkeitsAutoritaetsPort;
  readonly operatorRichtlinie: OperatorRichtlinienPort;
  readonly laufzeitGate: LaufzeitGatePort;
  readonly aktionsVertraege: AktionsVertragsPort;
  readonly liveVoraussetzungen: LiveVoraussetzungsPrueferPort;
  readonly ressourcen: RessourcenVerwalter;
  readonly socketBudget: CharacterSocketBudget;
}

export interface FreigabeDaten {
  readonly schemaVersion: 1;
  readonly freigabeId: string;
  readonly auftragId: string;
  readonly ablaufId: string;
  readonly transaktionsId: string;
  readonly faehigkeitId: string;
  readonly eigentuemerModulId: string;
  readonly actionContractId: string;
  readonly recoveryContractId: string;
  readonly verifierId: string;
  readonly invariantenKennungen: readonly string[];
  readonly ausgestelltAmMs: number;
  readonly gueltigBisMs: number;
  readonly faehigkeitsGeneration: number;
  readonly operatorGeneration: number;
  readonly laufzeitGateGeneration: number;
  readonly laufzeitGateNachweisId: string;
  readonly ressourcenEpochen: readonly Readonly<{
    ressourcenId: string;
    epoche: number;
  }>[];
  readonly actionKanalRessourcenId: string;
  readonly budgetReservierungId: string;
  readonly liveVoraussetzungen: readonly LiveVoraussetzungsNachweis[];
  readonly intent: DurablerIntentNachweis;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZeit(wert: number, fehler: string): void {
  if (!Number.isSafeInteger(wert) || wert < 0) throw new Error(fehler);
}

function pruefeEindeutig(werte: readonly string[], fehler: string): void {
  const sortiert = [...werte].sort();
  if (sortiert.some((wert, index) => index > 0 && wert === sortiert[index - 1])) {
    throw new Error(fehler);
  }
}

export class ErteilteAusfuehrungsFreigabe {
  readonly #daten: FreigabeDaten;

  private constructor(daten: FreigabeDaten) {
    this.#daten = Object.freeze({
      ...daten,
      invariantenKennungen: Object.freeze([...daten.invariantenKennungen].sort()),
      ressourcenEpochen: Object.freeze(daten.ressourcenEpochen.map(x => Object.freeze({ ...x }))),
      liveVoraussetzungen: Object.freeze(daten.liveVoraussetzungen.map(x => Object.freeze({ ...x }))),
      intent: Object.freeze({ ...daten.intent }),
    });
  }

  public static async erteile(
    anfrage: AdmissionAnfrage,
    abhaengigkeiten: AdmissionAbhaengigkeiten,
  ): Promise<ErteilteAusfuehrungsFreigabe> {
    if (anfrage.schemaVersion !== 1) throw new Error("ADMISSION_SCHEMA_UNGUELTIG");
    for (const [wert, fehler] of [
      [anfrage.freigabeId, "ADMISSION_FREIGABE_ID_UNGUELTIG"],
      [anfrage.auftragId, "ADMISSION_AUFTRAG_ID_UNGUELTIG"],
      [anfrage.ablaufId, "ADMISSION_ABLAUF_ID_UNGUELTIG"],
      [anfrage.transaktionsId, "ADMISSION_TRANSAKTION_ID_UNGUELTIG"],
      [anfrage.faehigkeitId, "ADMISSION_FAEHIGKEIT_ID_UNGUELTIG"],
      [anfrage.eigentuemerModulId, "ADMISSION_OWNER_ID_UNGUELTIG"],
      [anfrage.actionContractId, "ADMISSION_ACTION_CONTRACT_ID_UNGUELTIG"],
      [anfrage.recoveryContractId, "ADMISSION_RECOVERY_CONTRACT_ID_UNGUELTIG"],
      [anfrage.verifierId, "ADMISSION_VERIFIER_ID_UNGUELTIG"],
    ] as const) {
      pruefeText(wert, fehler);
    }
    pruefeZeit(anfrage.ausgestelltAmMs, "ADMISSION_AUSSTELLZEIT_UNGUELTIG");
    pruefeZeit(anfrage.gueltigBisMs, "ADMISSION_ABLAUFZEIT_UNGUELTIG");
    if (anfrage.gueltigBisMs < anfrage.ausgestelltAmMs
        || anfrage.gueltigBisMs - anfrage.ausgestelltAmMs > 2_000) {
      throw new Error("ADMISSION_GUELTIGKEIT_UNGUELTIG");
    }
    if (anfrage.invariantenKennungen.length < 1 || anfrage.invariantenKennungen.length > 64) {
      throw new Error("ADMISSION_INVARIANTEN_ANZAHL_UNGUELTIG");
    }
    if (anfrage.voraussetzungsIds.length < 1 || anfrage.voraussetzungsIds.length > 64) {
      throw new Error("ADMISSION_VORAUSSETZUNGEN_ANZAHL_UNGUELTIG");
    }
    pruefeEindeutig(anfrage.invariantenKennungen, "ADMISSION_INVARIANTE_DOPPELT");
    pruefeEindeutig(anfrage.voraussetzungsIds, "ADMISSION_VORAUSSETZUNG_DOPPELT");

    const runtime = abhaengigkeiten.laufzeitGate.pruefe();
    if (!runtime.freigegeben) throw new Error("LAUFZEIT_GATE_GESPERRT");
    pruefeText(runtime.nachweisId, "LAUFZEIT_GATE_NACHWEIS_UNGUELTIG");

    const capability = abhaengigkeiten.faehigkeitsAutoritaet.pruefe(
      anfrage.faehigkeitId,
      anfrage.eigentuemerModulId,
    );
    if (!capability.erlaubt || !capability.mutierend) {
      throw new Error("FAEHIGKEITS_AUTORITAET_FEHLT");
    }

    const operator = abhaengigkeiten.operatorRichtlinie.pruefe(anfrage.faehigkeitId);
    if (!operator.erlaubt) throw new Error("OPERATOR_DENY");

    const vertrag = abhaengigkeiten.aktionsVertraege.pruefe(
      anfrage.actionContractId,
      anfrage.recoveryContractId,
      anfrage.verifierId,
    );
    if (!vertrag.produktivErlaubt
        || vertrag.actionContractId !== anfrage.actionContractId
        || vertrag.recoveryContractId !== anfrage.recoveryContractId
        || vertrag.verifierId !== anfrage.verifierId) {
      throw new Error("AKTIONS_VERTRAG_NICHT_FREIGEGEBEN");
    }
    const vertragInvarianten = new Set(vertrag.invariantenKennungen);
    for (const kennung of anfrage.invariantenKennungen) {
      if (!vertragInvarianten.has(kennung)) {
        throw new Error("AKTIONS_VERTRAG_INVARIANTE_FEHLT:" + kennung);
      }
    }

    for (const token of anfrage.fencingTokens) {
      if (token.ablaufId !== anfrage.ablaufId
          || !abhaengigkeiten.ressourcen.validiereFencing(token, anfrage.ausgestelltAmMs)) {
        throw new Error("RESSOURCEN_FENCING_UNGUELTIG");
      }
    }
    if (anfrage.fencingTokens.length < 1) throw new Error("RESSOURCEN_FENCING_FEHLT");

    const kanalToken = anfrage.mutationsKanal.kanalToken;
    const budget = anfrage.mutationsKanal.budgetReservierung;
    if (kanalToken.ablaufId !== anfrage.ablaufId
        || !abhaengigkeiten.ressourcen.validiereFencing(kanalToken, anfrage.ausgestelltAmMs)) {
      throw new Error("ACTION_KANAL_FENCING_UNGUELTIG");
    }
    if (budget.ablaufId !== anfrage.ablaufId
        || !abhaengigkeiten.socketBudget.validiereReservierung(
          budget,
          anfrage.ausgestelltAmMs,
        )) {
      throw new Error("SOCKET_BUDGET_RESERVIERUNG_UNGUELTIG");
    }

    const intent = bindeDurablesIntent(
      anfrage.intentToken,
      anfrage.intentEintrag,
      {
        transaktionsId: anfrage.transaktionsId,
        auftragId: anfrage.auftragId,
        ablaufId: anfrage.ablaufId,
        faehigkeitId: anfrage.faehigkeitId,
        eigentuemerModulId: anfrage.eigentuemerModulId,
        actionContractId: anfrage.actionContractId,
        recoveryContractId: anfrage.recoveryContractId,
        verifierId: anfrage.verifierId,
      },
    );

    const live = await abhaengigkeiten.liveVoraussetzungen.pruefe(
      anfrage.voraussetzungsIds,
      anfrage.ausgestelltAmMs,
    );
    if (live.length !== anfrage.voraussetzungsIds.length) {
      throw new Error("LIVE_VORAUSSETZUNGEN_UNVOLLSTAENDIG");
    }
    const nachId = new Map(live.map(x => [x.voraussetzungId, x]));
    for (const id of anfrage.voraussetzungsIds) {
      const nachweis = nachId.get(id);
      if (nachweis === undefined
          || nachweis.fingerprint.trim().length === 0
          || nachweis.beobachtetAmMs > anfrage.ausgestelltAmMs
          || nachweis.gueltigBisMs < anfrage.ausgestelltAmMs
          || nachweis.gueltigBisMs < anfrage.gueltigBisMs) {
        throw new Error("LIVE_VORAUSSETZUNG_STALE_ODER_UNGUELTIG:" + id);
      }
    }

    return new ErteilteAusfuehrungsFreigabe({
      schemaVersion: 1,
      freigabeId: anfrage.freigabeId,
      auftragId: anfrage.auftragId,
      ablaufId: anfrage.ablaufId,
      transaktionsId: anfrage.transaktionsId,
      faehigkeitId: anfrage.faehigkeitId,
      eigentuemerModulId: anfrage.eigentuemerModulId,
      actionContractId: anfrage.actionContractId,
      recoveryContractId: anfrage.recoveryContractId,
      verifierId: anfrage.verifierId,
      invariantenKennungen: anfrage.invariantenKennungen,
      ausgestelltAmMs: anfrage.ausgestelltAmMs,
      gueltigBisMs: anfrage.gueltigBisMs,
      faehigkeitsGeneration: capability.generation,
      operatorGeneration: operator.generation,
      laufzeitGateGeneration: runtime.generation,
      laufzeitGateNachweisId: runtime.nachweisId,
      ressourcenEpochen: Object.freeze([
        ...anfrage.fencingTokens,
        kanalToken,
      ].map(token => ({
        ressourcenId: token.ressourcenId,
        epoche: token.epoche,
      }))),
      actionKanalRessourcenId: kanalToken.ressourcenId,
      budgetReservierungId: budget.reservierungId,
      liveVoraussetzungen: live,
      intent,
    });
  }

  public daten(): FreigabeDaten {
    return this.#daten;
  }

  public pruefeFuerAusfuehrung(
    jetztMs: number,
    actionContractId: string,
    recoveryContractId: string,
    verifierId: string,
  ): void {
    pruefeZeit(jetztMs, "AUSFUEHRUNGSZEIT_UNGUELTIG");
    if (jetztMs < this.#daten.ausgestelltAmMs) throw new Error("FREIGABE_AUS_ZUKUNFT");
    if (jetztMs > this.#daten.gueltigBisMs) throw new Error("FREIGABE_ABGELAUFEN");
    if (actionContractId !== this.#daten.actionContractId) {
      throw new Error("ADAPTER_ACTION_CONTRACT_STIMMT_NICHT");
    }
    if (recoveryContractId !== this.#daten.recoveryContractId) {
      throw new Error("ADAPTER_RECOVERY_CONTRACT_STIMMT_NICHT");
    }
    if (verifierId !== this.#daten.verifierId) {
      throw new Error("ADAPTER_VERIFIER_STIMMT_NICHT");
    }
  }
}
