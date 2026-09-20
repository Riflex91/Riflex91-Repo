import type { SpeicherPort } from "../persistenz/speicher-port.js";

export type RemoteConfigWert = boolean | number | string;

interface RemoteConfigRegelBasis {
  readonly schluessel: string;
  readonly authorityNeutral: true;
  readonly safetyNeutral: true;
  readonly secretFrei: true;
}

export interface RemoteConfigBooleanRegel extends RemoteConfigRegelBasis {
  readonly art: "BOOLEAN";
}

export interface RemoteConfigNumberRegel extends RemoteConfigRegelBasis {
  readonly art: "NUMBER";
  readonly minimum: number;
  readonly maximum: number;
  readonly ganzzahlig: boolean;
}

export interface RemoteConfigEnumRegel extends RemoteConfigRegelBasis {
  readonly art: "ENUM";
  readonly erlaubteWerte: readonly string[];
}

export type RemoteConfigRegel =
  | RemoteConfigBooleanRegel
  | RemoteConfigNumberRegel
  | RemoteConfigEnumRegel;

export interface RemoteConfigPolicy {
  readonly schemaVersion: 1;
  readonly policyId: string;
  readonly policyFingerprint: string;
  readonly vertrauensQuelleId: string;
  readonly vertrauensQuelleFingerprint: string;
  readonly maximaleEvidenceAlterMs: number;
  readonly regeln: readonly RemoteConfigRegel[];
}

export interface RemoteConfigWertEintrag {
  readonly schluessel: string;
  readonly wert: RemoteConfigWert;
}

export interface RemoteConfigEvidence {
  readonly schemaVersion: 1;
  readonly evidenceId: string;
  readonly quelleId: string;
  readonly quelleFingerprint: string;
  readonly policyFingerprint: string;
  readonly revision: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly configFingerprint: string;
  readonly transportVerifiziert: true;
  readonly quelleAuthentifiziert: true;
  readonly secretFrei: true;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly werte: readonly RemoteConfigWertEintrag[];
}

export interface RemoteConfigSnapshot {
  readonly schemaVersion: 1;
  readonly policyId: string;
  readonly policyFingerprint: string;
  readonly evidenceId: string;
  readonly quelleId: string;
  readonly quelleFingerprint: string;
  readonly revision: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly configFingerprint: string;
  readonly werte: readonly RemoteConfigWertEintrag[];
  readonly planningEvidence: true;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface RemoteConfigLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly verwendbar: boolean;
  readonly revision: number | null;
  readonly planningEvidence: true;
  readonly executionAuthority: false;
}

interface PersistierterRemoteConfigStand {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly snapshot: RemoteConfigSnapshot | null;
}

const VERBOTENE_SCHLUESSEL_TEILE: readonly string[] = Object.freeze([
  "authority",
  "autoritaet",
  "capability",
  "faehigkeit",
  "owner",
  "admission",
  "operator",
  "bediener",
  "nothalt",
  "killswitch",
  "kill_switch",
  "rawwrite",
  "raw_write",
  "mutation",
  "mutating",
  "actioncontract",
  "action_contract",
  "recoverycontract",
  "recovery_contract",
  "token",
  "secret",
  "password",
  "credential",
  "writekey",
  "write_key",
  "apikey",
  "api_key",
  "release",
  "update",
  "shell",
  "hostcommand",
  "host_command",
]);

function pruefeText(wert: string, fehler: string, maximum = 192): void {
  if (wert.trim().length === 0 || wert.length > maximum) throw new Error(fehler);
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("REMOTE_CONFIG_ZEIT_UNGUELTIG");
  }
}

function istVerbotenerSchluessel(schluessel: string): boolean {
  const normalisiert = schluessel.toLowerCase().replace(/[-.]/g, "_");
  return VERBOTENE_SCHLUESSEL_TEILE.some(
    teil => normalisiert.includes(teil),
  );
}

function friereRegel(regel: RemoteConfigRegel): RemoteConfigRegel {
  if (regel.art === "ENUM") {
    return Object.freeze({
      ...regel,
      erlaubteWerte: Object.freeze([...regel.erlaubteWerte]),
    });
  }
  return Object.freeze({ ...regel });
}

function frierePolicy(policy: RemoteConfigPolicy): RemoteConfigPolicy {
  return Object.freeze({
    ...policy,
    regeln: Object.freeze(policy.regeln.map(x => friereRegel(x))),
  });
}

function friereWerte(
  werte: readonly RemoteConfigWertEintrag[],
): readonly RemoteConfigWertEintrag[] {
  return Object.freeze(
    werte.map(x => Object.freeze({ ...x })),
  );
}

function friereSnapshot(snapshot: RemoteConfigSnapshot): RemoteConfigSnapshot {
  return Object.freeze({
    ...snapshot,
    werte: friereWerte(snapshot.werte),
  });
}

function validierePolicy(policy: RemoteConfigPolicy): void {
  if (policy.schemaVersion !== 1) {
    throw new Error("REMOTE_CONFIG_POLICY_SCHEMA_UNGUELTIG");
  }
  for (const text of [
    policy.policyId,
    policy.policyFingerprint,
    policy.vertrauensQuelleId,
    policy.vertrauensQuelleFingerprint,
  ]) {
    pruefeText(text, "REMOTE_CONFIG_POLICY_TEXT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(policy.maximaleEvidenceAlterMs)
      || policy.maximaleEvidenceAlterMs < 1
      || policy.maximaleEvidenceAlterMs > 86_400_000) {
    throw new Error("REMOTE_CONFIG_POLICY_FRESHNESS_UNGUELTIG");
  }
  if (policy.regeln.length < 1 || policy.regeln.length > 128) {
    throw new Error("REMOTE_CONFIG_POLICY_REGELN_UNGUELTIG");
  }

  for (let index = 0; index < policy.regeln.length; index += 1) {
    const regel = policy.regeln[index];
    if (regel === undefined) {
      throw new Error("REMOTE_CONFIG_POLICY_REGEL_FEHLT");
    }
    pruefeText(
      regel.schluessel,
      "REMOTE_CONFIG_POLICY_SCHLUESSEL_UNGUELTIG",
      160,
    );
    if (istVerbotenerSchluessel(regel.schluessel)) {
      throw new Error(
        "REMOTE_CONFIG_POLICY_SCHLUESSEL_SICHERHEITSKRITISCH:"
        + regel.schluessel,
      );
    }
    if (regel.authorityNeutral !== true
        || regel.safetyNeutral !== true
        || regel.secretFrei !== true) {
      throw new Error("REMOTE_CONFIG_POLICY_GRENZE_UNGUELTIG");
    }
    if (policy.regeln.slice(0, index).some(
      x => x.schluessel === regel.schluessel,
    )) {
      throw new Error("REMOTE_CONFIG_POLICY_SCHLUESSEL_DOPPELT");
    }

    if (regel.art === "NUMBER") {
      if (!Number.isFinite(regel.minimum)
          || !Number.isFinite(regel.maximum)
          || regel.maximum < regel.minimum) {
        throw new Error("REMOTE_CONFIG_POLICY_NUMBER_GRENZE_UNGUELTIG");
      }
      continue;
    }
    if (regel.art === "BOOLEAN") continue;
    if (regel.art !== "ENUM"
        || regel.erlaubteWerte.length < 1
        || regel.erlaubteWerte.length > 64) {
      throw new Error("REMOTE_CONFIG_POLICY_ENUM_UNGUELTIG");
    }
    for (let wertIndex = 0;
      wertIndex < regel.erlaubteWerte.length;
      wertIndex += 1) {
      const wert = regel.erlaubteWerte[wertIndex];
      if (wert === undefined) {
        throw new Error("REMOTE_CONFIG_POLICY_ENUM_WERT_FEHLT");
      }
      pruefeText(wert, "REMOTE_CONFIG_POLICY_ENUM_WERT_UNGUELTIG", 128);
      if (regel.erlaubteWerte.slice(0, wertIndex).includes(wert)) {
        throw new Error("REMOTE_CONFIG_POLICY_ENUM_WERT_DOPPELT");
      }
    }
  }
}

function validiereWert(
  regel: RemoteConfigRegel,
  wert: RemoteConfigWert,
): void {
  if (regel.art === "BOOLEAN") {
    if (typeof wert !== "boolean") {
      throw new Error(
        "REMOTE_CONFIG_WERT_TYP_UNGUELTIG:" + regel.schluessel,
      );
    }
    return;
  }
  if (regel.art === "NUMBER") {
    if (typeof wert !== "number"
        || !Number.isFinite(wert)
        || wert < regel.minimum
        || wert > regel.maximum
        || (regel.ganzzahlig && !Number.isSafeInteger(wert))) {
      throw new Error(
        "REMOTE_CONFIG_WERT_NUMBER_UNGUELTIG:" + regel.schluessel,
      );
    }
    return;
  }
  if (typeof wert !== "string"
      || !regel.erlaubteWerte.includes(wert)) {
    throw new Error(
      "REMOTE_CONFIG_WERT_ENUM_UNGUELTIG:" + regel.schluessel,
    );
  }
}

function validiereEvidence(
  policy: RemoteConfigPolicy,
  evidence: RemoteConfigEvidence,
  jetztMs: number,
  letzteRevision: number | null,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.transportVerifiziert !== true
      || evidence.quelleAuthentifiziert !== true
      || evidence.secretFrei !== true
      || evidence.gameplayAutoritaet !== false
      || evidence.rawWriteAutoritaet !== false) {
    throw new Error("REMOTE_CONFIG_EVIDENCE_GRENZE_UNGUELTIG");
  }
  for (const text of [
    evidence.evidenceId,
    evidence.quelleId,
    evidence.quelleFingerprint,
    evidence.policyFingerprint,
    evidence.configFingerprint,
  ]) {
    pruefeText(text, "REMOTE_CONFIG_EVIDENCE_TEXT_UNGUELTIG");
  }
  if (evidence.quelleId !== policy.vertrauensQuelleId
      || evidence.quelleFingerprint !== policy.vertrauensQuelleFingerprint) {
    throw new Error("REMOTE_CONFIG_QUELLE_NICHT_VERTRAUT");
  }
  if (evidence.policyFingerprint !== policy.policyFingerprint) {
    throw new Error("REMOTE_CONFIG_POLICY_DRIFT");
  }
  if (!Number.isSafeInteger(evidence.revision)
      || evidence.revision < 1) {
    throw new Error("REMOTE_CONFIG_REVISION_UNGUELTIG");
  }
  if (letzteRevision !== null && evidence.revision <= letzteRevision) {
    throw new Error("REMOTE_CONFIG_REVISION_REPLAY_ODER_STALE");
  }
  if (!Number.isSafeInteger(evidence.beobachtetAmMs)
      || !Number.isSafeInteger(evidence.gueltigBisMs)
      || evidence.beobachtetAmMs < 0
      || evidence.gueltigBisMs < evidence.beobachtetAmMs
      || jetztMs < evidence.beobachtetAmMs
      || jetztMs > evidence.gueltigBisMs
      || jetztMs - evidence.beobachtetAmMs > policy.maximaleEvidenceAlterMs) {
    throw new Error("REMOTE_CONFIG_EVIDENCE_NICHT_FRISCH");
  }
  if (evidence.werte.length < 1 || evidence.werte.length > 64) {
    throw new Error("REMOTE_CONFIG_WERTE_ANZAHL_UNGUELTIG");
  }

  for (let index = 0; index < evidence.werte.length; index += 1) {
    const eintrag = evidence.werte[index];
    if (eintrag === undefined) {
      throw new Error("REMOTE_CONFIG_WERT_FEHLT");
    }
    pruefeText(
      eintrag.schluessel,
      "REMOTE_CONFIG_SCHLUESSEL_UNGUELTIG",
      160,
    );
    if (istVerbotenerSchluessel(eintrag.schluessel)) {
      throw new Error(
        "REMOTE_CONFIG_SCHLUESSEL_SICHERHEITSKRITISCH:"
        + eintrag.schluessel,
      );
    }
    if (evidence.werte.slice(0, index).some(
      x => x.schluessel === eintrag.schluessel,
    )) {
      throw new Error("REMOTE_CONFIG_SCHLUESSEL_DOPPELT");
    }
    const regel = policy.regeln.find(
      x => x.schluessel === eintrag.schluessel,
    );
    if (regel === undefined) {
      throw new Error(
        "REMOTE_CONFIG_SCHLUESSEL_NICHT_ERLAUBT:"
        + eintrag.schluessel,
      );
    }
    validiereWert(regel, eintrag.wert);
  }
}

function snapshotAusEvidence(
  policy: RemoteConfigPolicy,
  evidence: RemoteConfigEvidence,
): RemoteConfigSnapshot {
  return Object.freeze({
    schemaVersion: 1,
    policyId: policy.policyId,
    policyFingerprint: policy.policyFingerprint,
    evidenceId: evidence.evidenceId,
    quelleId: evidence.quelleId,
    quelleFingerprint: evidence.quelleFingerprint,
    revision: evidence.revision,
    beobachtetAmMs: evidence.beobachtetAmMs,
    gueltigBisMs: evidence.gueltigBisMs,
    configFingerprint: evidence.configFingerprint,
    werte: friereWerte(evidence.werte),
    planningEvidence: true,
    executionAuthority: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  });
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function parsePersistenz(text: string): PersistierterRemoteConfigStand {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("REMOTE_CONFIG_PERSISTENZ_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1) {
    throw new Error("REMOTE_CONFIG_PERSISTENZ_UNGUELTIG");
  }
  const gespeichertAmMs = roh["gespeichertAmMs"];
  if (typeof gespeichertAmMs !== "number"
      || !Number.isSafeInteger(gespeichertAmMs)
      || gespeichertAmMs < 0) {
    throw new Error("REMOTE_CONFIG_PERSISTENZ_UNGUELTIG");
  }
  const snapshotRoh = roh["snapshot"];
  if (snapshotRoh === null) {
    return Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs,
      snapshot: null,
    });
  }
  if (!istObjekt(snapshotRoh)
      || snapshotRoh["schemaVersion"] !== 1
      || snapshotRoh["planningEvidence"] !== true
      || snapshotRoh["executionAuthority"] !== false
      || snapshotRoh["gameplayAutoritaet"] !== false
      || snapshotRoh["rawWriteAutoritaet"] !== false
      || !Array.isArray(snapshotRoh["werte"])) {
    throw new Error("REMOTE_CONFIG_PERSISTENZ_SNAPSHOT_UNGUELTIG");
  }
  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs,
    snapshot: snapshotRoh as unknown as RemoteConfigSnapshot,
  });
}

export class PersistenterRemoteConfigRegister {
  public readonly planningEvidence = true as const;
  public readonly executionAuthority = false as const;
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;

  readonly #policy: RemoteConfigPolicy;
  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  #snapshot: RemoteConfigSnapshot | null = null;

  public constructor(
    policy: RemoteConfigPolicy,
    speicher: SpeicherPort,
    pfad = "control/remote-config-v1.json",
  ) {
    validierePolicy(policy);
    pruefeText(pfad, "REMOTE_CONFIG_PFAD_UNGUELTIG", 240);
    this.#policy = frierePolicy(policy);
    this.#speicher = speicher;
    this.#pfad = pfad;
  }

  public async lade(jetztMs: number): Promise<RemoteConfigLadeStatus> {
    pruefeZeit(jetztMs);
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        verwendbar: false,
        revision: null,
        planningEvidence: true,
        executionAuthority: false,
      });
    }
    const persistiert = parsePersistenz(text);
    if (persistiert.gespeichertAmMs > jetztMs) {
      throw new Error("REMOTE_CONFIG_PERSISTENZ_AUS_ZUKUNFT");
    }
    if (persistiert.snapshot !== null) {
      const snapshot = persistiert.snapshot;
      if (snapshot.policyId !== this.#policy.policyId
          || snapshot.policyFingerprint !== this.#policy.policyFingerprint
          || snapshot.quelleId !== this.#policy.vertrauensQuelleId
          || snapshot.quelleFingerprint
            !== this.#policy.vertrauensQuelleFingerprint) {
        throw new Error("REMOTE_CONFIG_PERSISTENZ_POLICY_ODER_QUELLE_DRIFT");
      }
      const evidence: RemoteConfigEvidence = Object.freeze({
        schemaVersion: 1,
        evidenceId: snapshot.evidenceId,
        quelleId: snapshot.quelleId,
        quelleFingerprint: snapshot.quelleFingerprint,
        policyFingerprint: snapshot.policyFingerprint,
        revision: snapshot.revision,
        beobachtetAmMs: snapshot.beobachtetAmMs,
        gueltigBisMs: snapshot.gueltigBisMs,
        configFingerprint: snapshot.configFingerprint,
        transportVerifiziert: true,
        quelleAuthentifiziert: true,
        secretFrei: true,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
        werte: snapshot.werte,
      });
      validiereEvidence(
        this.#policy,
        evidence,
        Math.min(jetztMs, snapshot.gueltigBisMs),
        null,
      );
      this.#snapshot = snapshotAusEvidence(this.#policy, evidence);
    }
    return this.#status(true, jetztMs);
  }

  public async uebernehme(
    evidence: RemoteConfigEvidence,
    jetztMs: number,
  ): Promise<RemoteConfigSnapshot> {
    pruefeZeit(jetztMs);
    validiereEvidence(
      this.#policy,
      evidence,
      jetztMs,
      this.#snapshot?.revision ?? null,
    );
    const snapshot = snapshotAusEvidence(this.#policy, evidence);
    this.#snapshot = snapshot;
    await this.#persistiere(jetztMs);
    return friereSnapshot(snapshot);
  }

  public pinne(jetztMs: number): RemoteConfigSnapshot {
    pruefeZeit(jetztMs);
    if (this.#snapshot === null) {
      throw new Error("REMOTE_CONFIG_SNAPSHOT_FEHLT");
    }
    if (jetztMs < this.#snapshot.beobachtetAmMs
        || jetztMs > this.#snapshot.gueltigBisMs
        || jetztMs - this.#snapshot.beobachtetAmMs
          > this.#policy.maximaleEvidenceAlterMs) {
      throw new Error("REMOTE_CONFIG_SNAPSHOT_NICHT_FRISCH");
    }
    return friereSnapshot(this.#snapshot);
  }

  public status(jetztMs: number): RemoteConfigLadeStatus {
    pruefeZeit(jetztMs);
    return this.#status(this.#snapshot !== null, jetztMs);
  }

  #status(
    geladen: boolean,
    jetztMs: number,
  ): RemoteConfigLadeStatus {
    let verwendbar = false;
    if (this.#snapshot !== null) {
      verwendbar = jetztMs >= this.#snapshot.beobachtetAmMs
        && jetztMs <= this.#snapshot.gueltigBisMs
        && jetztMs - this.#snapshot.beobachtetAmMs
          <= this.#policy.maximaleEvidenceAlterMs;
    }
    return Object.freeze({
      schemaVersion: 1,
      geladen,
      verwendbar,
      revision: this.#snapshot?.revision ?? null,
      planningEvidence: true,
      executionAuthority: false,
    });
  }

  async #persistiere(jetztMs: number): Promise<void> {
    const stand: PersistierterRemoteConfigStand = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      snapshot: this.#snapshot === null
        ? null
        : friereSnapshot(this.#snapshot),
    });
    const inhalt = JSON.stringify(stand);
    if (inhalt.length > 500_000) {
      throw new Error("REMOTE_CONFIG_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
