export interface BewegungsZielBeobachtung {
  readonly schemaVersion: 1;
  readonly entityId: string;
  readonly entityFingerprint: string;
  readonly serverRegion: string;
  readonly serverIdentifier: string;
  readonly map: string;
  readonly instanz: string;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly moving: boolean;
  readonly visible: boolean;
  readonly tot: boolean;
  readonly beobachtetAmMs: number;
}

export interface BewegungsZielPin extends BewegungsZielBeobachtung {
  readonly maxAlterMs: number;
  readonly maxVorhersageFehler: number;
  readonly maxGeschwindigkeit: number;
}

export interface BewegungsFreshnessNachweis {
  readonly frisch: true;
  readonly alterMs: number;
  readonly vorhersageFehler: number;
  readonly evidenceFingerprint: string;
}

function pruefeText(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

function pruefeZahl(wert: number, maxAbs: number, fehler: string): void {
  if (!Number.isFinite(wert) || Math.abs(wert) > maxAbs) throw new Error(fehler);
}

function validiereBeobachtung(b: BewegungsZielBeobachtung): void {
  if (b.schemaVersion !== 1) throw new Error("MOTION_SCHEMA_UNGUELTIG");
  for (const text of [
    b.entityId,
    b.entityFingerprint,
    b.serverRegion,
    b.serverIdentifier,
    b.map,
    b.instanz,
  ]) pruefeText(text, "MOTION_TEXT_UNGUELTIG");
  for (const [wert, fehler] of [
    [b.x, "MOTION_X_UNGUELTIG"],
    [b.y, "MOTION_Y_UNGUELTIG"],
    [b.vx, "MOTION_VX_UNGUELTIG"],
    [b.vy, "MOTION_VY_UNGUELTIG"],
  ] as const) pruefeZahl(wert, 1_000_000, fehler);
  if (!Number.isSafeInteger(b.beobachtetAmMs) || b.beobachtetAmMs < 0) {
    throw new Error("MOTION_ZEIT_UNGUELTIG");
  }
}

export function pinneBewegungsZiel(
  beobachtung: BewegungsZielBeobachtung,
  maxAlterMs: number,
  maxVorhersageFehler: number,
  maxGeschwindigkeit: number,
): BewegungsZielPin {
  validiereBeobachtung(beobachtung);
  if (!beobachtung.visible || beobachtung.tot) throw new Error("MOTION_ZIEL_NICHT_NUTZBAR");
  if (!Number.isSafeInteger(maxAlterMs) || maxAlterMs < 1 || maxAlterMs > 60_000
      || !Number.isFinite(maxVorhersageFehler) || maxVorhersageFehler < 0 || maxVorhersageFehler > 10_000
      || !Number.isFinite(maxGeschwindigkeit) || maxGeschwindigkeit < 0 || maxGeschwindigkeit > 10_000) {
    throw new Error("MOTION_POLICY_UNGUELTIG");
  }
  const speed = Math.hypot(beobachtung.vx, beobachtung.vy);
  if (speed > maxGeschwindigkeit) throw new Error("MOTION_GESCHWINDIGKEIT_AUSSERHALB_POLICY");
  return Object.freeze({
    ...beobachtung,
    maxAlterMs,
    maxVorhersageFehler,
    maxGeschwindigkeit,
  });
}

export function validiereBewegungsZielFrische(
  pin: BewegungsZielPin,
  aktuell: BewegungsZielBeobachtung,
  jetztMs: number,
  evidenceFingerprint: string,
): BewegungsFreshnessNachweis {
  validiereBeobachtung(aktuell);
  pruefeText(evidenceFingerprint, "MOTION_EVIDENCE_FINGERPRINT_UNGUELTIG");
  if (!Number.isSafeInteger(jetztMs) || jetztMs < aktuell.beobachtetAmMs) {
    throw new Error("MOTION_JETZT_UNGUELTIG");
  }
  if (aktuell.entityId !== pin.entityId
      || aktuell.entityFingerprint !== pin.entityFingerprint
      || aktuell.serverRegion !== pin.serverRegion
      || aktuell.serverIdentifier !== pin.serverIdentifier
      || aktuell.map !== pin.map
      || aktuell.instanz !== pin.instanz) {
    throw new Error("MOTION_ZIEL_IDENTITAET_DRIFT");
  }
  if (!aktuell.visible || aktuell.tot) throw new Error("MOTION_ZIEL_NICHT_MEHR_SICHTBAR");
  if (aktuell.beobachtetAmMs < pin.beobachtetAmMs) throw new Error("MOTION_EVIDENCE_VERALTET");
  const alterMs = jetztMs - aktuell.beobachtetAmMs;
  if (alterMs > pin.maxAlterMs) throw new Error("MOTION_EVIDENCE_STALE");
  const dtSek = (aktuell.beobachtetAmMs - pin.beobachtetAmMs) / 1000;
  const erwartetesX = pin.x + pin.vx * dtSek;
  const erwartetesY = pin.y + pin.vy * dtSek;
  const vorhersageFehler = Math.hypot(aktuell.x - erwartetesX, aktuell.y - erwartetesY);
  if (vorhersageFehler > pin.maxVorhersageFehler) {
    throw new Error("MOTION_ZIEL_ZU_STARK_GEDRIFTET");
  }
  if (Math.hypot(aktuell.vx, aktuell.vy) > pin.maxGeschwindigkeit) {
    throw new Error("MOTION_GESCHWINDIGKEIT_AUSSERHALB_POLICY");
  }
  return Object.freeze({ frisch: true, alterMs, vorhersageFehler, evidenceFingerprint });
}
