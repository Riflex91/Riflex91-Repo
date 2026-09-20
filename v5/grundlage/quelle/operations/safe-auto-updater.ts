import type { SpeicherPort } from "../persistenz/speicher-port.js";

export type SafeUpdateZustand =
  | "GEPLANT"
  | "QUIESCE_AUSSTEHEND"
  | "QUIESCED"
  | "APPLY_AUSSTEHEND"
  | "COMMITTED"
  | "ROLLBACK_AUSSTEHEND"
  | "ROLLED_BACK_SAFE"
  | "RECOVERY_PENDING"
  | "FAILED_SAFE";

export interface V5ReleaseEvidence {
  readonly schemaVersion: 1;
  readonly basisSha: string;
  readonly candidateSha: string;
  readonly bundleSha256: string;
  readonly dependencyLockSha256: string;
  readonly laufzeitKonfigurationSha256: string;
  readonly releaseEvidenceId: string;
  readonly provenienzEvidenceId: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface SafeUpdatePlan {
  readonly schemaVersion: 1;
  readonly updateId: string;
  readonly aktuellerReleaseSha: string;
  readonly baselineBootFingerprint: string;
  readonly releaseEvidence: V5ReleaseEvidence;
  readonly geplantAmMs: number;
}

export interface SafeUpdateQuiesceEvidence {
  readonly schemaVersion: 1;
  readonly prozessLaeuft: false;
  readonly aktiveGameplayAutoritaeten: 0;
  readonly offeneMutationen: 0;
  readonly offeneTransfers: 0;
  readonly recoveryPending: 0;
  readonly bootFingerprint: string;
  readonly evidenceId: string;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface SafeUpdateBootHandshakeEvidence {
  readonly schemaVersion: 1;
  readonly gitSha: string;
  readonly runtimeKennung: "V5";
  readonly prozessLaeuft: true;
  readonly bereit: true;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly bootFingerprint: string;
  readonly handshakeEvidenceId: string;
  readonly gestartetAmMs: number;
  readonly beobachtetAmMs: number;
  readonly gueltigBisMs: number;
}

export interface SafeUpdateSicht {
  readonly plan: SafeUpdatePlan;
  readonly zustand: SafeUpdateZustand;
  readonly recoveryVorZustand:
    | Exclude<SafeUpdateZustand, "RECOVERY_PENDING">
    | null;
  readonly applyIntentAmMs: number | null;
  readonly rollbackIntentAmMs: number | null;
  readonly letzteEvidenceId: string | null;
  readonly sameCandidateErneutAnwenden: false;
  readonly automatischerRetry: false;
}

export interface SafeUpdateApplyIntent {
  readonly schemaVersion: 1;
  readonly updateId: string;
  readonly adapterOperation: "RELEASE_AKTIVIEREN";
  readonly basisSha: string;
  readonly candidateSha: string;
  readonly bundleSha256: string;
  readonly releaseEvidenceId: string;
  readonly provenienzEvidenceId: string;
  readonly durableIntentPersistiert: true;
  readonly sameCandidateErneutAnwenden: false;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface SafeUpdateRollbackIntent {
  readonly schemaVersion: 1;
  readonly updateId: string;
  readonly adapterOperation: "RELEASE_ROLLBACK";
  readonly zielSha: string;
  readonly durableIntentPersistiert: true;
  readonly executionAuthority: false;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

export interface SafeUpdateLadeStatus {
  readonly schemaVersion: 1;
  readonly geladen: boolean;
  readonly recoveryPending: number;
  readonly committed: number;
  readonly rolledBackSafe: number;
  readonly failedSafe: number;
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
}

interface PersistierterSafeUpdateSnapshot {
  readonly schemaVersion: 1;
  readonly gespeichertAmMs: number;
  readonly eintraege: readonly SafeUpdateSicht[];
}

const terminaleZustaende: readonly SafeUpdateZustand[] = Object.freeze([
  "COMMITTED",
  "ROLLED_BACK_SAFE",
  "FAILED_SAFE",
]);

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 240) throw new Error(fehler);
}

function pruefeZeit(jetztMs: number): void {
  if (!Number.isSafeInteger(jetztMs) || jetztMs < 0) {
    throw new Error("SAFE_UPDATE_ZEIT_UNGUELTIG");
  }
}

function pruefeSha(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{40}$/i.test(wert)) throw new Error(fehler);
}

function pruefeSha256(wert: string, fehler: string): void {
  if (!/^[0-9a-f]{64}$/i.test(wert)) throw new Error(fehler);
}

function evidenceFrisch(
  beobachtetAmMs: number,
  gueltigBisMs: number,
  jetztMs: number,
): boolean {
  return Number.isSafeInteger(beobachtetAmMs)
    && Number.isSafeInteger(gueltigBisMs)
    && beobachtetAmMs >= 0
    && gueltigBisMs >= beobachtetAmMs
    && jetztMs >= beobachtetAmMs
    && jetztMs <= gueltigBisMs;
}

function friereReleaseEvidence(
  evidence: V5ReleaseEvidence,
): V5ReleaseEvidence {
  return Object.freeze({ ...evidence });
}

function frierePlan(plan: SafeUpdatePlan): SafeUpdatePlan {
  return Object.freeze({
    ...plan,
    releaseEvidence: friereReleaseEvidence(plan.releaseEvidence),
  });
}

function friereSicht(sicht: SafeUpdateSicht): SafeUpdateSicht {
  return Object.freeze({
    ...sicht,
    plan: frierePlan(sicht.plan),
  });
}

function istTerminal(zustand: SafeUpdateZustand): boolean {
  return terminaleZustaende.includes(zustand);
}

function validiereReleaseEvidence(
  evidence: V5ReleaseEvidence,
  aktuellerReleaseSha: string,
  jetztMs: number,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.gameplayAutoritaet !== false
      || evidence.rawWriteAutoritaet !== false) {
    throw new Error("SAFE_UPDATE_RELEASE_EVIDENCE_SCHEMA_UNGUELTIG");
  }
  pruefeSha(evidence.basisSha, "SAFE_UPDATE_BASIS_SHA_UNGUELTIG");
  pruefeSha(evidence.candidateSha, "SAFE_UPDATE_CANDIDATE_SHA_UNGUELTIG");
  pruefeSha256(evidence.bundleSha256, "SAFE_UPDATE_BUNDLE_SHA_UNGUELTIG");
  pruefeSha256(
    evidence.dependencyLockSha256,
    "SAFE_UPDATE_DEPENDENCY_LOCK_SHA_UNGUELTIG",
  );
  pruefeSha256(
    evidence.laufzeitKonfigurationSha256,
    "SAFE_UPDATE_KONFIG_SHA_UNGUELTIG",
  );
  pruefeText(
    evidence.releaseEvidenceId,
    "SAFE_UPDATE_RELEASE_EVIDENCE_ID_UNGUELTIG",
  );
  pruefeText(
    evidence.provenienzEvidenceId,
    "SAFE_UPDATE_PROVENIENZ_EVIDENCE_ID_UNGUELTIG",
  );
  if (evidence.basisSha !== aktuellerReleaseSha) {
    throw new Error("SAFE_UPDATE_RELEASE_BASIS_DRIFT");
  }
  if (evidence.candidateSha === evidence.basisSha) {
    throw new Error("SAFE_UPDATE_CANDIDATE_IST_BEREITS_AKTUELL");
  }
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
  )) {
    throw new Error("SAFE_UPDATE_RELEASE_EVIDENCE_NICHT_FRISCH");
  }
}

function validiereQuiesceEvidence(
  plan: SafeUpdatePlan,
  evidence: SafeUpdateQuiesceEvidence,
  jetztMs: number,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.prozessLaeuft !== false
      || evidence.aktiveGameplayAutoritaeten !== 0
      || evidence.offeneMutationen !== 0
      || evidence.offeneTransfers !== 0
      || evidence.recoveryPending !== 0) {
    throw new Error("SAFE_UPDATE_QUIESCE_NICHT_SICHER");
  }
  pruefeText(evidence.bootFingerprint, "SAFE_UPDATE_BOOT_FP_UNGUELTIG");
  pruefeText(evidence.evidenceId, "SAFE_UPDATE_QUIESCE_EVIDENCE_ID_UNGUELTIG");
  if (evidence.bootFingerprint !== plan.baselineBootFingerprint) {
    throw new Error("SAFE_UPDATE_QUIESCE_BOOT_DRIFT");
  }
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
  ) || evidence.beobachtetAmMs < plan.geplantAmMs) {
    throw new Error("SAFE_UPDATE_QUIESCE_EVIDENCE_NICHT_FRISCH");
  }
}

function validiereHandshakeBasis(
  evidence: SafeUpdateBootHandshakeEvidence,
  jetztMs: number,
): void {
  if (evidence.schemaVersion !== 1
      || evidence.runtimeKennung !== "V5"
      || evidence.prozessLaeuft !== true
      || evidence.bereit !== true
      || evidence.gameplayAutoritaet !== false
      || evidence.rawWriteAutoritaet !== false) {
    throw new Error("SAFE_UPDATE_HANDSHAKE_GRENZE_UNGUELTIG");
  }
  pruefeSha(evidence.gitSha, "SAFE_UPDATE_HANDSHAKE_SHA_UNGUELTIG");
  pruefeText(
    evidence.bootFingerprint,
    "SAFE_UPDATE_HANDSHAKE_BOOT_FP_UNGUELTIG",
  );
  pruefeText(
    evidence.handshakeEvidenceId,
    "SAFE_UPDATE_HANDSHAKE_EVIDENCE_ID_UNGUELTIG",
  );
  if (!evidenceFrisch(
    evidence.beobachtetAmMs,
    evidence.gueltigBisMs,
    jetztMs,
  ) || !Number.isSafeInteger(evidence.gestartetAmMs)
      || evidence.gestartetAmMs < 0
      || evidence.gestartetAmMs > evidence.beobachtetAmMs) {
    throw new Error("SAFE_UPDATE_HANDSHAKE_NICHT_FRISCH");
  }
}

export class SafeUpdateLedger {
  readonly #maximum: number;
  #eintraege: readonly SafeUpdateSicht[] = Object.freeze([]);

  public constructor(maximum = 64) {
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 512) {
      throw new Error("SAFE_UPDATE_LEDGER_GRENZE_UNGUELTIG");
    }
    this.#maximum = maximum;
  }

  public plane(
    updateId: string,
    aktuellerReleaseSha: string,
    baselineBootFingerprint: string,
    releaseEvidence: V5ReleaseEvidence,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    pruefeText(updateId, "SAFE_UPDATE_ID_UNGUELTIG");
    pruefeSha(
      aktuellerReleaseSha,
      "SAFE_UPDATE_AKTUELLER_RELEASE_SHA_UNGUELTIG",
    );
    pruefeText(
      baselineBootFingerprint,
      "SAFE_UPDATE_BASELINE_BOOT_FP_UNGUELTIG",
    );
    validiereReleaseEvidence(releaseEvidence, aktuellerReleaseSha, jetztMs);

    if (this.#eintraege.some(x => x.plan.updateId === updateId)) {
      throw new Error("SAFE_UPDATE_ID_DOPPELT");
    }
    if (this.#eintraege.some(x => !istTerminal(x.zustand))) {
      throw new Error("SAFE_UPDATE_BEREITS_AKTIV");
    }
    if (this.#eintraege.length >= this.#maximum) {
      throw new Error("SAFE_UPDATE_LEDGER_VOLL");
    }

    const sicht = friereSicht({
      plan: Object.freeze({
        schemaVersion: 1,
        updateId,
        aktuellerReleaseSha,
        baselineBootFingerprint,
        releaseEvidence: friereReleaseEvidence(releaseEvidence),
        geplantAmMs: jetztMs,
      }),
      zustand: "GEPLANT",
      recoveryVorZustand: null,
      applyIntentAmMs: null,
      rollbackIntentAmMs: null,
      letzteEvidenceId: releaseEvidence.releaseEvidenceId,
      sameCandidateErneutAnwenden: false,
      automatischerRetry: false,
    });
    this.#eintraege = Object.freeze([...this.#eintraege, sicht]);
    return sicht;
  }

  public beginneQuiesce(updateId: string): SafeUpdateSicht {
    const alt = this.#finde(updateId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && (alt.recoveryVorZustand === "GEPLANT"
        || alt.recoveryVorZustand === "QUIESCE_AUSSTEHEND"
        || alt.recoveryVorZustand === "QUIESCED");
    if (alt.zustand !== "GEPLANT" && !darfNachRestart) {
      throw new Error("SAFE_UPDATE_QUIESCE_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "QUIESCE_AUSSTEHEND",
      recoveryVorZustand: null,
    }));
  }

  public bestaetigeQuiesce(
    updateId: string,
    evidence: SafeUpdateQuiesceEvidence,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    const alt = this.#finde(updateId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && (alt.recoveryVorZustand === "GEPLANT"
        || alt.recoveryVorZustand === "QUIESCE_AUSSTEHEND"
        || alt.recoveryVorZustand === "QUIESCED");
    if (alt.zustand !== "QUIESCE_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("SAFE_UPDATE_QUIESCE_EVIDENCE_ZUSTAND_UNGUELTIG");
    }
    validiereQuiesceEvidence(alt.plan, evidence, jetztMs);
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "QUIESCED",
      recoveryVorZustand: null,
      letzteEvidenceId: evidence.evidenceId,
    }));
  }

  public bereiteApplyVor(
    updateId: string,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    const alt = this.#finde(updateId);
    if (alt.zustand !== "QUIESCED") {
      throw new Error("SAFE_UPDATE_APPLY_ZUSTAND_UNGUELTIG");
    }
    if (jetztMs > alt.plan.releaseEvidence.gueltigBisMs) {
      throw new Error("SAFE_UPDATE_RELEASE_EVIDENCE_NICHT_MEHR_FRISCH");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "APPLY_AUSSTEHEND",
      applyIntentAmMs: jetztMs,
      recoveryVorZustand: null,
      sameCandidateErneutAnwenden: false,
      automatischerRetry: false,
    }));
  }

  public verifiziereCandidateHandshake(
    updateId: string,
    evidence: SafeUpdateBootHandshakeEvidence,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    const alt = this.#finde(updateId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "APPLY_AUSSTEHEND";
    if (alt.zustand !== "APPLY_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("SAFE_UPDATE_HANDSHAKE_ZUSTAND_UNGUELTIG");
    }
    if (alt.applyIntentAmMs === null) {
      throw new Error("SAFE_UPDATE_APPLY_INTENT_FEHLT");
    }
    validiereHandshakeBasis(evidence, jetztMs);
    if (evidence.gitSha !== alt.plan.releaseEvidence.candidateSha) {
      throw new Error("SAFE_UPDATE_HANDSHAKE_CANDIDATE_MISMATCH");
    }
    if (evidence.bootFingerprint === alt.plan.baselineBootFingerprint) {
      throw new Error("SAFE_UPDATE_HANDSHAKE_ALTE_BOOT_IDENTITAET");
    }
    if (evidence.gestartetAmMs < alt.applyIntentAmMs) {
      throw new Error("SAFE_UPDATE_HANDSHAKE_VOR_APPLY_INTENT");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "COMMITTED",
      recoveryVorZustand: null,
      letzteEvidenceId: evidence.handshakeEvidenceId,
    }));
  }

  public beginneRollback(
    updateId: string,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    const alt = this.#finde(updateId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "APPLY_AUSSTEHEND";
    if (alt.zustand !== "APPLY_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("SAFE_UPDATE_ROLLBACK_ZUSTAND_UNGUELTIG");
    }
    if (alt.applyIntentAmMs === null) {
      throw new Error("SAFE_UPDATE_ROLLBACK_OHNE_APPLY_INTENT");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "ROLLBACK_AUSSTEHEND",
      recoveryVorZustand: null,
      rollbackIntentAmMs: jetztMs,
      sameCandidateErneutAnwenden: false,
      automatischerRetry: false,
    }));
  }

  public verifiziereRollbackHandshake(
    updateId: string,
    evidence: SafeUpdateBootHandshakeEvidence,
    jetztMs: number,
  ): SafeUpdateSicht {
    pruefeZeit(jetztMs);
    const alt = this.#finde(updateId);
    const darfNachRestart = alt.zustand === "RECOVERY_PENDING"
      && alt.recoveryVorZustand === "ROLLBACK_AUSSTEHEND";
    if (alt.zustand !== "ROLLBACK_AUSSTEHEND" && !darfNachRestart) {
      throw new Error("SAFE_UPDATE_ROLLBACK_HANDSHAKE_ZUSTAND_UNGUELTIG");
    }
    if (alt.rollbackIntentAmMs === null) {
      throw new Error("SAFE_UPDATE_ROLLBACK_INTENT_FEHLT");
    }
    validiereHandshakeBasis(evidence, jetztMs);
    if (evidence.gitSha !== alt.plan.aktuellerReleaseSha) {
      throw new Error("SAFE_UPDATE_ROLLBACK_SHA_MISMATCH");
    }
    if (evidence.gestartetAmMs < alt.rollbackIntentAmMs) {
      throw new Error("SAFE_UPDATE_ROLLBACK_HANDSHAKE_ZU_ALT");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "ROLLED_BACK_SAFE",
      recoveryVorZustand: null,
      letzteEvidenceId: evidence.handshakeEvidenceId,
    }));
  }

  public scheitereSicher(updateId: string): SafeUpdateSicht {
    const alt = this.#finde(updateId);
    if (istTerminal(alt.zustand)) {
      throw new Error("SAFE_UPDATE_FAILED_SAFE_ZUSTAND_UNGUELTIG");
    }
    return this.#ersetze(friereSicht({
      ...alt,
      zustand: "FAILED_SAFE",
      recoveryVorZustand: null,
      sameCandidateErneutAnwenden: false,
      automatischerRetry: false,
    }));
  }

  public importiereNachRestart(snapshot: readonly SafeUpdateSicht[]): void {
    if (snapshot.length > this.#maximum) {
      throw new Error("SAFE_UPDATE_RESTART_ZU_GROSS");
    }
    const neu = snapshot.map((x, index) => {
      if (x.plan.schemaVersion !== 1
          || snapshot.slice(0, index).some(
            y => y.plan.updateId === x.plan.updateId,
          )) {
        throw new Error("SAFE_UPDATE_RESTART_SNAPSHOT_UNGUELTIG");
      }
      const terminal = istTerminal(x.zustand);
      const recoveryVorZustand = terminal
        ? null
        : x.zustand === "RECOVERY_PENDING"
          ? x.recoveryVorZustand
          : x.zustand;
      if (!terminal && recoveryVorZustand === null) {
        throw new Error("SAFE_UPDATE_RESTART_URSPRUNG_FEHLT");
      }
      return friereSicht({
        ...x,
        zustand: terminal ? x.zustand : "RECOVERY_PENDING",
        recoveryVorZustand,
        sameCandidateErneutAnwenden: false,
        automatischerRetry: false,
      });
    });
    if (neu.filter(x => !istTerminal(x.zustand)).length > 1) {
      throw new Error("SAFE_UPDATE_RESTART_MEHRFACH_AKTIV");
    }
    this.#eintraege = Object.freeze(neu);
  }

  public finde(updateId: string): SafeUpdateSicht {
    return friereSicht(this.#finde(updateId));
  }

  public snapshot(): readonly SafeUpdateSicht[] {
    return Object.freeze(this.#eintraege.map(x => friereSicht(x)));
  }

  #finde(updateId: string): SafeUpdateSicht {
    pruefeText(updateId, "SAFE_UPDATE_ID_UNGUELTIG");
    const sicht = this.#eintraege.find(x => x.plan.updateId === updateId);
    if (sicht === undefined) throw new Error("SAFE_UPDATE_UNBEKANNT");
    return sicht;
  }

  #ersetze(neu: SafeUpdateSicht): SafeUpdateSicht {
    this.#eintraege = Object.freeze(
      this.#eintraege.map(
        x => x.plan.updateId === neu.plan.updateId ? neu : x,
      ),
    );
    return friereSicht(neu);
  }
}

function istObjekt(wert: unknown): wert is Readonly<Record<string, unknown>> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function parsePersistenz(text: string): PersistierterSafeUpdateSnapshot {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("SAFE_UPDATE_PERSISTENZ_UNGUELTIG");
  }
  if (!istObjekt(roh)
      || roh["schemaVersion"] !== 1
      || !Array.isArray(roh["eintraege"])) {
    throw new Error("SAFE_UPDATE_PERSISTENZ_UNGUELTIG");
  }
  const gespeichertAmMs = roh["gespeichertAmMs"];
  if (typeof gespeichertAmMs !== "number"
      || !Number.isSafeInteger(gespeichertAmMs)
      || gespeichertAmMs < 0
      || roh["eintraege"].length > 512) {
    throw new Error("SAFE_UPDATE_PERSISTENZ_UNGUELTIG");
  }
  const eintraege = roh["eintraege"] as unknown as readonly SafeUpdateSicht[];
  return Object.freeze({
    schemaVersion: 1,
    gespeichertAmMs,
    eintraege,
  });
}

export class PersistenterSafeAutoUpdater {
  public readonly executionAuthority = false as const;
  public readonly gameplayAutoritaet = false as const;
  public readonly rawWriteAutoritaet = false as const;
  public readonly automatischerRetry = false as const;

  readonly #speicher: SpeicherPort;
  readonly #pfad: string;
  readonly #ledger: SafeUpdateLedger;

  public constructor(
    speicher: SpeicherPort,
    pfad = "operations/safe-auto-updater-v1.json",
    maximum = 64,
  ) {
    pruefeText(pfad, "SAFE_UPDATE_PFAD_UNGUELTIG");
    this.#speicher = speicher;
    this.#pfad = pfad;
    this.#ledger = new SafeUpdateLedger(maximum);
  }

  public async lade(jetztMs: number): Promise<SafeUpdateLadeStatus> {
    pruefeZeit(jetztMs);
    const text = await this.#speicher.lies(this.#pfad);
    if (text === undefined) {
      return Object.freeze({
        schemaVersion: 1,
        geladen: false,
        recoveryPending: 0,
        committed: 0,
        rolledBackSafe: 0,
        failedSafe: 0,
        gameplayAutoritaet: false,
        rawWriteAutoritaet: false,
      });
    }
    const snapshot = parsePersistenz(text);
    if (snapshot.gespeichertAmMs > jetztMs) {
      throw new Error("SAFE_UPDATE_PERSISTENZ_AUS_ZUKUNFT");
    }
    this.#ledger.importiereNachRestart(snapshot.eintraege);
    await this.#persistiere(jetztMs);
    return this.#ladeStatus(true);
  }

  public async plane(
    updateId: string,
    aktuellerReleaseSha: string,
    baselineBootFingerprint: string,
    releaseEvidence: V5ReleaseEvidence,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    const sicht = this.#ledger.plane(
      updateId,
      aktuellerReleaseSha,
      baselineBootFingerprint,
      releaseEvidence,
      jetztMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneQuiesce(
    updateId: string,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.beginneQuiesce(updateId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async bestaetigeQuiesce(
    updateId: string,
    evidence: SafeUpdateQuiesceEvidence,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    const sicht = this.#ledger.bestaetigeQuiesce(
      updateId,
      evidence,
      jetztMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async bereiteApplyVor(
    updateId: string,
    jetztMs: number,
  ): Promise<SafeUpdateApplyIntent> {
    const sicht = this.#ledger.bereiteApplyVor(updateId, jetztMs);
    await this.#persistiere(jetztMs);
    return Object.freeze({
      schemaVersion: 1,
      updateId,
      adapterOperation: "RELEASE_AKTIVIEREN",
      basisSha: sicht.plan.aktuellerReleaseSha,
      candidateSha: sicht.plan.releaseEvidence.candidateSha,
      bundleSha256: sicht.plan.releaseEvidence.bundleSha256,
      releaseEvidenceId: sicht.plan.releaseEvidence.releaseEvidenceId,
      provenienzEvidenceId: sicht.plan.releaseEvidence.provenienzEvidenceId,
      durableIntentPersistiert: true,
      sameCandidateErneutAnwenden: false,
      executionAuthority: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async verifiziereCandidateHandshake(
    updateId: string,
    evidence: SafeUpdateBootHandshakeEvidence,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    const sicht = this.#ledger.verifiziereCandidateHandshake(
      updateId,
      evidence,
      jetztMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async beginneRollback(
    updateId: string,
    jetztMs: number,
  ): Promise<SafeUpdateRollbackIntent> {
    const sicht = this.#ledger.beginneRollback(updateId, jetztMs);
    await this.#persistiere(jetztMs);
    return Object.freeze({
      schemaVersion: 1,
      updateId,
      adapterOperation: "RELEASE_ROLLBACK",
      zielSha: sicht.plan.aktuellerReleaseSha,
      durableIntentPersistiert: true,
      executionAuthority: false,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  public async verifiziereRollbackHandshake(
    updateId: string,
    evidence: SafeUpdateBootHandshakeEvidence,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    const sicht = this.#ledger.verifiziereRollbackHandshake(
      updateId,
      evidence,
      jetztMs,
    );
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public async scheitereSicher(
    updateId: string,
    jetztMs: number,
  ): Promise<SafeUpdateSicht> {
    pruefeZeit(jetztMs);
    const sicht = this.#ledger.scheitereSicher(updateId);
    await this.#persistiere(jetztMs);
    return sicht;
  }

  public finde(updateId: string): SafeUpdateSicht {
    return this.#ledger.finde(updateId);
  }

  public snapshot(): readonly SafeUpdateSicht[] {
    return this.#ledger.snapshot();
  }

  #ladeStatus(geladen: boolean): SafeUpdateLadeStatus {
    const sicht = this.#ledger.snapshot();
    return Object.freeze({
      schemaVersion: 1,
      geladen,
      recoveryPending: sicht.filter(
        x => x.zustand === "RECOVERY_PENDING",
      ).length,
      committed: sicht.filter(x => x.zustand === "COMMITTED").length,
      rolledBackSafe: sicht.filter(
        x => x.zustand === "ROLLED_BACK_SAFE",
      ).length,
      failedSafe: sicht.filter(x => x.zustand === "FAILED_SAFE").length,
      gameplayAutoritaet: false,
      rawWriteAutoritaet: false,
    });
  }

  async #persistiere(jetztMs: number): Promise<void> {
    pruefeZeit(jetztMs);
    const snapshot: PersistierterSafeUpdateSnapshot = Object.freeze({
      schemaVersion: 1,
      gespeichertAmMs: jetztMs,
      eintraege: this.#ledger.snapshot(),
    });
    const inhalt = JSON.stringify(snapshot);
    if (inhalt.length > 1_000_000) {
      throw new Error("SAFE_UPDATE_PERSISTENZ_ZU_GROSS");
    }
    await this.#speicher.schreibe({
      relativerPfad: this.#pfad,
      inhalt,
      kritisch: true,
    });
  }
}
