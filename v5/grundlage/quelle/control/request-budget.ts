import type { SpeicherPort } from "../persistenz/speicher-port.js";

export type CloudRequestZweck =
  | "REMOTE_CONFIG"
  | "RUNTIME_TELEMETRIE"
  | "KNOWLEDGE_SYNC"
  | "UPDATE_CHECK"
  | "SONSTIGES_READONLY";

export interface RequestBudgetZweckLimit {
  readonly zweck: CloudRequestZweck;
  readonly limit: number;
}

export interface RequestBudgetPolicy {
  readonly schemaVersion: 1;
  readonly policyId: string;
  readonly policyFingerprint: string;
  readonly fensterDauerMs: number;
  readonly anbieterLimit: number;
  readonly sicherheitsReserve: number;
  readonly systemLimit: number;
  readonly maximaleReservierungen: number;
  readonly zweckLimits: readonly RequestBudgetZweckLimit[];
}

export interface RequestBudgetVerbrauch {
  readonly zweck: CloudRequestZweck;
  readonly verbraucht: number;
}

export interface RequestBudgetReservierung {
  readonly requestId: string;
  readonly zweck: CloudRequestZweck;
  readonly kosten: number;
  readonly reserviertAmMs: number;
}

export interface RequestBudgetPermit {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly zweck: CloudRequestZweck;
  readonly kosten: number;
  readonly fensterStartMs: number;
  readonly fensterEndeMs: number;
  readonly verbleibendGesamt: number;
  readonly verbleibendZweck: number;
  readonly durableReserviert: true;
  readonly refundBeiUnbekanntemAusgang: false;
  readonly automatischerRetry: false;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface RequestBudgetSicht {
  readonly schemaVersion: 1;
  readonly policyId: string;
  readonly policyFingerprint: string;
  readonly fensterStartMs: number;
  readonly fensterEndeMs: number;
  readonly verbrauchtGesamt: number;
  readonly verbleibendGesamt: number;
  readonly zweckVerbrauch: readonly RequestBudgetVerbrauch[];
  readonly reservierungen: number;
  readonly persistent: true;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

interface PersistierterRequestBudgetStand {
  readonly schemaVersion: 1;
  readonly policyId: string;
  readonly policyFingerprint: string;
  readonly gespeichertAmMs: number;
  readonly fensterStartMs: number;
  readonly verbrauchtGesamt: number;
  readonly zweckVerbrauch: readonly RequestBudgetVerbrauch[];
  readonly reservierungen: readonly RequestBudgetReservierung[];
}

const ZWECKE: readonly CloudRequestZweck[] = Object.freeze([
  "REMOTE_CONFIG",
  "RUNTIME_TELEMETRIE",
  "KNOWLEDGE_SYNC",
  "UPDATE_CHECK",
  "SONSTIGES_READONLY",
]);

function pruefeText(wert: string, fehler: string, maximum = 192): void {
  if (wert.trim().length === 0 || wert.length > maximum) throw new Error(fehler);
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("REQUEST_BUDGET_ZEIT_UNGUELTIG");
  }
}

function istZweck(wert: unknown): wert is CloudRequestZweck {
  return typeof wert === "string"
    && ZWECKE.includes(wert as CloudRequestZweck);
}

function fensterStart(
  jetztMs: number,
  fensterDauerMs: number,
): number {
  return Math.floor(jetztMs / fensterDauerMs) * fensterDauerMs;
}

function frierePolicy(policy: RequestBudgetPolicy): RequestBudgetPolicy {
  return Object.freeze({
    ...policy,
    zweckLimits: Object.freeze(
      policy.zweckLimits.map(x => Object.freeze({ ...x })),
    ),
  });
}

function validierePolicy(policy: RequestBudgetPolicy): void {
  if (policy.schemaVersion !== 1) {
    throw new Error("REQUEST_BUDGET_POLICY_SCHEMA_UNGUELTIG");
  }
  pruefeText(policy.policyId, "REQUEST_BUDGET_POLICY_ID_UNGUELTIG");
  pruefeText(
    policy.policyFingerprint,
    "REQUEST_BUDGET_POLICY_FP_UNGUELTIG",
  );
  if (!Number.isSafeInteger(policy.fensterDauerMs)
      || policy.fensterDauerMs < 60_000
      || policy.fensterDauerMs > 7 * 24 * 60 * 60 * 1000) {
    throw new Error("REQUEST_BUDGET_FENSTER_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [policy.anbieterLimit, "REQUEST_BUDGET_ANBIETER_LIMIT_UNGUELTIG"],
    [policy.sicherheitsReserve, "REQUEST_BUDGET_RESERVE_UNGUELTIG"],
    [policy.systemLimit, "REQUEST_BUDGET_SYSTEM_LIMIT_UNGUELTIG"],
    [
      policy.maximaleReservierungen,
      "REQUEST_BUDGET_RESERVIERUNGEN_GRENZE_UNGUELTIG",
    ],
  ] as const) {
    if (!Number.isSafeInteger(wert) || wert < 1 || wert > 10_000_000) {
      throw new Error(fehler);
    }
  }
  if (policy.sicherheitsReserve >= policy.anbieterLimit
      || policy.systemLimit
        > policy.anbieterLimit - policy.sicherheitsReserve) {
    throw new Error("REQUEST_BUDGET_RESERVE_ODER_SYSTEMLIMIT_UNSICHER");
  }
  if (policy.maximaleReservierungen < policy.systemLimit) {
    throw new Error("REQUEST_BUDGET_RESERVIERUNGSHISTORIE_ZU_KLEIN");
  }
  if (policy.zweckLimits.length !== ZWECKE.length) {
    throw new Error("REQUEST_BUDGET_ZWECK_LIMITS_UNVOLLSTAENDIG");
  }
  for (let index = 0; index < policy.zweckLimits.length; index += 1) {
    const row = policy.zweckLimits[index];
    if (row === undefined
        || !istZweck(row.zweck)
        || !Number.isSafeInteger(row.limit)
        || row.limit < 1
        || row.limit > policy.systemLimit) {
      throw new Error("REQUEST_BUDGET_ZWECK_LIMIT_UNGUELTIG");
    }
    if (policy.zweckLimits.slice(0, index).some(
      x => x.zweck === row.zweck,
    )) {
      throw new Error("REQUEST_BUDGET_ZWECK_LIMIT_DOPPELT");
    }
  }
  for (const zweck of ZWECKE) {
    if (!policy.zweckLimits.some(x => x.zweck === zweck)) {
      throw new Error("REQUEST_BUDGET_ZWECK_LIMIT_FEHLT:" + zweck);
    }
  }
}

function leererVerbrauch(): readonly RequestBudgetVerbrauch[] {
  return Object.freeze(
    ZWECKE.map(zweck => Object.freeze({
      zweck,
      verbraucht: 0,
    })),
  );
}

function friereVerbrauch(
  verbrauch: readonly RequestBudgetVerbrauch[],
): readonly RequestBudgetVerbrauch[] {
  return Object.freeze(
    verbrauch.map(x => Object.freeze({ ...x })),
  );
}

function friereReservierungen(
  rows: readonly RequestBudgetReservierung[],
): readonly RequestBudgetReservierung[] {
  return Object.freeze(
    rows.map(x => Object.freeze({ ...x })),
  );
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function parsePersistenz(
  text: string,
  policy: RequestBudgetPolicy,
): PersistierterRequestBudgetStand {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("REQUEST_BUDGET_PERSISTENZ_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1
      || roh["policyId"] !== policy.policyId
      || roh["policyFingerprint"] !== policy.policyFingerprint
      || !Array.isArray(roh["zweckVerbrauch"])
      || !Array.isArray(roh["reservierungen"])) {
    throw new Error("REQUEST_BUDGET_PERSISTENZ_POLICY_ODER_SCHEMA_DRIFT");
  }

  const gespeichertAmMs = roh["gespeichertAmMs"];
  const fensterStartMs = roh["fensterStartMs"];
  const verbrauchtGesamt = roh["verbrauchtGesamt"];
  if (typeof gespeichertAmMs !== "number"
      || !Number.isSafeInteger(gespeichertAmMs)
      || gespeichertAmMs < 0
      || typeof fensterStartMs !== "number"
      || !Number.isSafeInteger(fensterStartMs)
      || fensterStartMs < 0
      || typeof verbrauchtGesamt !== "number"
      || !Number.isSafeInteger(verbrauchtGesamt)
      || verbrauchtGesamt < 0
      || verbrauchtGesamt > policy.systemLimit
      || roh["zweckVerbrauch"].length !== ZWECKE.length
      || roh["reservierungen"].length > policy.maximaleReservierungen) {
    throw new Error("REQUEST_BUDGET_PERSISTENZ_UNGUELTIG");
  }

  const zweckVerbrauchRoh = roh["zweckVerbrauch"];
  const zweckVerbrauch = zweckVerbrauchRoh.map((wert, index) => {
    if (!istObjekt(wert)) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZWECK_UNGUELTIG");
    }
    const zweck = wert["zweck"];
    const verbraucht = wert["verbraucht"];
    if (!istZweck(zweck)
        || typeof verbraucht !== "number"
        || !Number.isSafeInteger(verbraucht)
        || verbraucht < 0) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZWECK_UNGUELTIG");
    }
    const limit = policy.zweckLimits.find(x => x.zweck === zweck);
    if (limit === undefined || verbraucht > limit.limit) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZWECK_LIMIT_DRIFT");
    }
    if (zweckVerbrauchRoh.slice(0, index).some(
      vorher => istObjekt(vorher) && vorher["zweck"] === zweck,
    )) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZWECK_DOPPELT");
    }
    return Object.freeze({
      zweck,
      verbraucht,
    });
  });
  for (const zweck of ZWECKE) {
    if (!zweckVerbrauch.some(x => x.zweck === zweck)) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZWECK_FEHLT:" + zweck);
    }
  }

  const reservierungenRoh = roh["reservierungen"];
  const reservierungen = reservierungenRoh.map((wert, index) => {
    if (!istObjekt(wert)) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_RESERVIERUNG_UNGUELTIG");
    }
    const requestId = wert["requestId"];
    const zweck = wert["zweck"];
    const kosten = wert["kosten"];
    const reserviertAmMs = wert["reserviertAmMs"];
    if (typeof requestId !== "string"
        || !istZweck(zweck)
        || typeof kosten !== "number"
        || !Number.isSafeInteger(kosten)
        || kosten < 1
        || typeof reserviertAmMs !== "number"
        || !Number.isSafeInteger(reserviertAmMs)
        || reserviertAmMs < fensterStartMs
        || reserviertAmMs >= fensterStartMs + policy.fensterDauerMs) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_RESERVIERUNG_UNGUELTIG");
    }
    pruefeText(
      requestId,
      "REQUEST_BUDGET_PERSISTENZ_REQUEST_ID_UNGUELTIG",
    );
    if (reservierungenRoh.slice(0, index).some(
      vorher => istObjekt(vorher)
        && vorher["requestId"] === requestId,
    )) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_REQUEST_ID_DOPPELT");
    }
    return Object.freeze({
      requestId,
      zweck,
      kosten,
      reserviertAmMs,
    });
  });

  const summeGesamt = reservierungen.reduce(
    (summe, x) => summe + x.kosten,
    0,
  );
  if (summeGesamt !== verbrauchtGesamt) {
    throw new Error("REQUEST_BUDGET_PERSISTENZ_GESAMT_DRIFT");
  }
  for (const verbrauch of zweckVerbrauch) {
    const summe = reservierungen
      .filter(x => x.zweck === verbrauch.zweck)
      .reduce((acc, x) => acc + x.kosten, 0);
    if (summe !== verbrauch.verbraucht) {
      throw new Error(
        "REQUEST_BUDGET_PERSISTENZ_ZWECK_DRIFT:" + verbrauch.zweck,
      );
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    policyId: policy.policyId,
    policyFingerprint: policy.policyFingerprint,
    gespeichertAmMs,
    fensterStartMs,
    verbrauchtGesamt,
    zweckVerbrauch: Object.freeze(zweckVerbrauch),
    reservierungen: Object.freeze(reservierungen),
  });
}

export class PersistentesCloudRequestBudget {
  public readonly executionAuthority = false as const;
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;
  public readonly refundBeiUnbekanntemAusgang = false as const;
  public readonly automatischerRetry = false as const;

  readonly #policy: RequestBudgetPolicy;
  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  #stand: PersistierterRequestBudgetStand | null = null;

  public constructor(
    policy: RequestBudgetPolicy,
    speicher: SpeicherPort,
    pfad = "control/cloud-request-budget-v1.json",
  ) {
    validierePolicy(policy);
    pruefeText(pfad, "REQUEST_BUDGET_PFAD_UNGUELTIG", 240);
    this.#policy = frierePolicy(policy);
    this.#speicher = speicher;
    this.#pfad = pfad;
  }

  public async lade(jetztMs: number): Promise<RequestBudgetSicht> {
    pruefeZeit(jetztMs);
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      this.#stand = this.#leererStand(jetztMs);
      await this.#persistiere(jetztMs);
      return this.sicht(jetztMs);
    }
    const stand = parsePersistenz(text, this.#policy);
    if (stand.gespeichertAmMs > jetztMs) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_AUS_ZUKUNFT");
    }
    const erwarteterStart = fensterStart(
      jetztMs,
      this.#policy.fensterDauerMs,
    );
    if (stand.fensterStartMs > erwarteterStart) {
      throw new Error("REQUEST_BUDGET_ZEITREGRESSION");
    }
    this.#stand = stand.fensterStartMs === erwarteterStart
      ? stand
      : this.#leererStand(jetztMs);
    if (stand.fensterStartMs !== erwarteterStart) {
      await this.#persistiere(jetztMs);
    }
    return this.sicht(jetztMs);
  }

  public async reserviere(
    requestId: string,
    zweck: CloudRequestZweck,
    kosten: number,
    jetztMs: number,
  ): Promise<RequestBudgetPermit> {
    pruefeText(requestId, "REQUEST_BUDGET_REQUEST_ID_UNGUELTIG");
    if (!istZweck(zweck)) {
      throw new Error("REQUEST_BUDGET_ZWECK_UNGUELTIG");
    }
    if (!Number.isSafeInteger(kosten) || kosten < 1 || kosten > 10_000) {
      throw new Error("REQUEST_BUDGET_KOSTEN_UNGUELTIG");
    }
    pruefeZeit(jetztMs);
    this.#rolleFensterWennNoetig(jetztMs);
    const stand = this.#stand;
    if (stand === null) {
      throw new Error("REQUEST_BUDGET_NICHT_GELADEN");
    }
    if (stand.gespeichertAmMs > jetztMs) {
      throw new Error("REQUEST_BUDGET_ZEITREGRESSION");
    }
    if (stand.reservierungen.some(x => x.requestId === requestId)) {
      throw new Error("REQUEST_BUDGET_REQUEST_ID_DOPPELT");
    }
    if (stand.reservierungen.length >= this.#policy.maximaleReservierungen) {
      throw new Error("REQUEST_BUDGET_RESERVIERUNGSHISTORIE_VOLL");
    }

    const zweckLimit = this.#policy.zweckLimits.find(
      x => x.zweck === zweck,
    );
    const zweckStand = stand.zweckVerbrauch.find(
      x => x.zweck === zweck,
    );
    if (zweckLimit === undefined || zweckStand === undefined) {
      throw new Error("REQUEST_BUDGET_ZWECK_POLICY_DRIFT");
    }
    if (stand.verbrauchtGesamt + kosten > this.#policy.systemLimit) {
      throw new Error("REQUEST_BUDGET_SYSTEM_LIMIT_ERSCHOEPFT");
    }
    if (stand.verbrauchtGesamt + kosten
        > this.#policy.anbieterLimit - this.#policy.sicherheitsReserve) {
      throw new Error("REQUEST_BUDGET_ANBIETER_RESERVE_ERREICHT");
    }
    if (zweckStand.verbraucht + kosten > zweckLimit.limit) {
      throw new Error("REQUEST_BUDGET_ZWECK_LIMIT_ERSCHOEPFT:" + zweck);
    }

    const reservierung: RequestBudgetReservierung = Object.freeze({
      requestId,
      zweck,
      kosten,
      reserviertAmMs: jetztMs,
    });
    const neuerVerbrauch = stand.zweckVerbrauch.map(x =>
      x.zweck === zweck
        ? Object.freeze({
            zweck: x.zweck,
            verbraucht: x.verbraucht + kosten,
          })
        : x,
    );
    this.#stand = Object.freeze({
      ...stand,
      gespeichertAmMs: jetztMs,
      verbrauchtGesamt: stand.verbrauchtGesamt + kosten,
      zweckVerbrauch: Object.freeze(neuerVerbrauch),
      reservierungen: Object.freeze([
        ...stand.reservierungen,
        reservierung,
      ]),
    });

    await this.#persistiere(jetztMs);

    const aktuellerZweck = this.#stand.zweckVerbrauch.find(
      x => x.zweck === zweck,
    );
    if (aktuellerZweck === undefined) {
      throw new Error("REQUEST_BUDGET_ZWECK_STAND_FEHLT");
    }
    return Object.freeze({
      schemaVersion: 1,
      requestId,
      zweck,
      kosten,
      fensterStartMs: this.#stand.fensterStartMs,
      fensterEndeMs:
        this.#stand.fensterStartMs + this.#policy.fensterDauerMs,
      verbleibendGesamt:
        this.#policy.systemLimit - this.#stand.verbrauchtGesamt,
      verbleibendZweck:
        zweckLimit.limit - aktuellerZweck.verbraucht,
      durableReserviert: true,
      refundBeiUnbekanntemAusgang: false,
      automatischerRetry: false,
      executionAuthority: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public sicht(jetztMs: number): RequestBudgetSicht {
    pruefeZeit(jetztMs);
    const stand = this.#stand;
    if (stand === null) {
      throw new Error("REQUEST_BUDGET_NICHT_GELADEN");
    }
    const aktuell = fensterStart(
      jetztMs,
      this.#policy.fensterDauerMs,
    );
    const gleichesFenster = aktuell === stand.fensterStartMs;
    const verbrauchtGesamt = gleichesFenster
      ? stand.verbrauchtGesamt
      : 0;
    const zweckVerbrauch = gleichesFenster
      ? stand.zweckVerbrauch
      : leererVerbrauch();
    return Object.freeze({
      schemaVersion: 1,
      policyId: this.#policy.policyId,
      policyFingerprint: this.#policy.policyFingerprint,
      fensterStartMs: aktuell,
      fensterEndeMs: aktuell + this.#policy.fensterDauerMs,
      verbrauchtGesamt,
      verbleibendGesamt:
        this.#policy.systemLimit - verbrauchtGesamt,
      zweckVerbrauch: friereVerbrauch(zweckVerbrauch),
      reservierungen: gleichesFenster
        ? stand.reservierungen.length
        : 0,
      persistent: true,
      executionAuthority: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  #rolleFensterWennNoetig(jetztMs: number): void {
    if (this.#stand === null) {
      throw new Error("REQUEST_BUDGET_NICHT_GELADEN");
    }
    const start = fensterStart(
      jetztMs,
      this.#policy.fensterDauerMs,
    );
    if (start < this.#stand.fensterStartMs) {
      throw new Error("REQUEST_BUDGET_ZEITREGRESSION");
    }
    if (start > this.#stand.fensterStartMs) {
      this.#stand = this.#leererStand(jetztMs);
    }
  }

  #leererStand(jetztMs: number): PersistierterRequestBudgetStand {
    const start = fensterStart(
      jetztMs,
      this.#policy.fensterDauerMs,
    );
    return Object.freeze({
      schemaVersion: 1,
      policyId: this.#policy.policyId,
      policyFingerprint: this.#policy.policyFingerprint,
      gespeichertAmMs: jetztMs,
      fensterStartMs: start,
      verbrauchtGesamt: 0,
      zweckVerbrauch: leererVerbrauch(),
      reservierungen: Object.freeze([]),
    });
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const stand = this.#stand;
    if (stand === null) {
      throw new Error("REQUEST_BUDGET_NICHT_GELADEN");
    }
    const persistiert: PersistierterRequestBudgetStand = Object.freeze({
      ...stand,
      gespeichertAmMs: jetztMs,
      zweckVerbrauch: friereVerbrauch(stand.zweckVerbrauch),
      reservierungen: friereReservierungen(stand.reservierungen),
    });
    const inhalt = JSON.stringify(persistiert);
    if (inhalt.length > 2_000_000) {
      throw new Error("REQUEST_BUDGET_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
    this.#stand = persistiert;
  }
}
