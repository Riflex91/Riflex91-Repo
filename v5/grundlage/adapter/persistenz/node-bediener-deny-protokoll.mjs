const STANDARD_PFAD = "runtime/operator/deny.jsonl";
const MAXIMALE_BYTES = 5_000_000;
const MAXIMALE_EINTRAEGE = 4096;

function pruefeText(wert, maximum, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > maximum) {
    throw new Error(fehler);
  }
}

function normalisiereEintrag(eintrag) {
  if (eintrag === null || typeof eintrag !== "object") {
    throw new Error("BEDIENER_PROTOKOLL_FORMAT_UNGUELTIG");
  }
  if (eintrag.schemaVersion !== 1
      || (eintrag.art !== "NOTHALT_AKTIVIEREN"
        && eintrag.art !== "FAEHIGKEIT_SPERREN")
      || (eintrag.wirkung !== "AUTORITAET_REDUZIERT"
        && eintrag.wirkung !== "UNVERAENDERT")
      || eintrag.gameplayAutoritaetErhoeht !== false
      || eintrag.safetyUmgangen !== false
      || !Number.isSafeInteger(eintrag.zeitMs)
      || eintrag.zeitMs < 0) {
    throw new Error("BEDIENER_PROTOKOLL_FORMAT_UNGUELTIG");
  }

  pruefeText(eintrag.befehlId, 128, "BEDIENER_PROTOKOLL_BEFEHL_ID_UNGUELTIG");
  pruefeText(eintrag.bedienerId, 128, "BEDIENER_PROTOKOLL_BEDIENER_ID_UNGUELTIG");

  if (eintrag.art === "FAEHIGKEIT_SPERREN") {
    pruefeText(
      eintrag.faehigkeitId,
      128,
      "BEDIENER_PROTOKOLL_FAEHIGKEIT_ID_UNGUELTIG",
    );
  } else if (eintrag.faehigkeitId !== undefined) {
    throw new Error("BEDIENER_PROTOKOLL_NOTHALT_FAEHIGKEIT_VERBOTEN");
  }

  return Object.freeze({
    schemaVersion: 1,
    befehlId: eintrag.befehlId,
    bedienerId: eintrag.bedienerId,
    zeitMs: eintrag.zeitMs,
    art: eintrag.art,
    ...(eintrag.art === "FAEHIGKEIT_SPERREN"
      ? { faehigkeitId: eintrag.faehigkeitId }
      : {}),
    wirkung: eintrag.wirkung,
    gameplayAutoritaetErhoeht: false,
    safetyUmgangen: false,
  });
}

function parseProtokoll(text) {
  if (text === undefined || text.length === 0) return Object.freeze([]);
  if (text.length > MAXIMALE_BYTES) {
    throw new Error("BEDIENER_PROTOKOLL_DATEI_ZU_GROSS");
  }

  const zeilen = text.split("\n").filter(x => x.length > 0);
  if (zeilen.length > MAXIMALE_EINTRAEGE) {
    throw new Error("BEDIENER_PROTOKOLL_ZU_VIELE_EINTRAEGE");
  }

  let eintraege = Object.freeze([]);
  let nothaltAktiv = false;
  let gesperrteFaehigkeiten = Object.freeze([]);

  for (const zeile of zeilen) {
    let roh;
    try {
      roh = JSON.parse(zeile);
    } catch {
      throw new Error("BEDIENER_PROTOKOLL_KORRUPT");
    }
    const eintrag = normalisiereEintrag(roh);

    const mitGleicherId = eintraege.find(
      x => x.befehlId === eintrag.befehlId,
    );
    if (mitGleicherId !== undefined) {
      throw new Error("BEDIENER_PROTOKOLL_BEFEHL_ID_DOPPELT");
    }

    const bereitsWirksam = eintrag.art === "NOTHALT_AKTIVIEREN"
      ? nothaltAktiv
      : gesperrteFaehigkeiten.includes(eintrag.faehigkeitId);
    const erwarteteWirkung = bereitsWirksam
      ? "UNVERAENDERT"
      : "AUTORITAET_REDUZIERT";
    if (eintrag.wirkung !== erwarteteWirkung) {
      throw new Error("BEDIENER_PROTOKOLL_WIRKUNG_WIDERSPRUCH");
    }

    if (eintrag.art === "NOTHALT_AKTIVIEREN") {
      nothaltAktiv = true;
    } else if (!bereitsWirksam) {
      gesperrteFaehigkeiten = Object.freeze([
        ...gesperrteFaehigkeiten,
        eintrag.faehigkeitId,
      ].sort());
    }

    eintraege = Object.freeze([...eintraege, eintrag]);
  }

  return eintraege;
}

function alsBefehl(eintrag) {
  if (eintrag.art === "NOTHALT_AKTIVIEREN") {
    return Object.freeze({
      schemaVersion: 1,
      befehlId: eintrag.befehlId,
      bedienerId: eintrag.bedienerId,
      zeitMs: eintrag.zeitMs,
      art: "NOTHALT_AKTIVIEREN",
    });
  }
  return Object.freeze({
    schemaVersion: 1,
    befehlId: eintrag.befehlId,
    bedienerId: eintrag.bedienerId,
    zeitMs: eintrag.zeitMs,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: eintrag.faehigkeitId,
  });
}

export class NodeBedienerDenyProtokoll {
  #dateisystem;

  constructor(dateisystem) {
    if (dateisystem === null
        || typeof dateisystem !== "object"
        || typeof dateisystem.haengeTextDurable !== "function"
        || typeof dateisystem.liesText !== "function") {
      throw new Error("BEDIENER_PROTOKOLL_DATEISYSTEM_UNGUELTIG");
    }
    this.#dateisystem = dateisystem;
  }

  async schreibeDurable(eintrag) {
    const normalisiert = normalisiereEintrag(eintrag);
    const text = await this.#dateisystem.liesText(STANDARD_PFAD);
    const vorhanden = parseProtokoll(text);

    const gleicheId = vorhanden.find(
      x => x.befehlId === normalisiert.befehlId,
    );
    if (gleicheId !== undefined) {
      if (JSON.stringify(gleicheId) !== JSON.stringify(normalisiert)) {
        throw new Error("BEDIENER_PROTOKOLL_BEFEHL_ID_KOLLISION");
      }
      return;
    }
    if (vorhanden.length >= MAXIMALE_EINTRAEGE) {
      throw new Error("BEDIENER_PROTOKOLL_VOLL");
    }

    const kandidat = Object.freeze([...vorhanden, normalisiert]);
    const kandidatText = kandidat
      .map(x => JSON.stringify(x))
      .join("\n") + "\n";
    if (kandidatText.length > MAXIMALE_BYTES) {
      throw new Error("BEDIENER_PROTOKOLL_DATEI_ZU_GROSS");
    }

    parseProtokoll(kandidatText);
    await this.#dateisystem.haengeTextDurable(
      STANDARD_PFAD,
      JSON.stringify(normalisiert) + "\n",
    );
  }

  async ladeWirksameDenyBefehle() {
    const text = await this.#dateisystem.liesText(STANDARD_PFAD);
    return Object.freeze(
      parseProtokoll(text).map(alsBefehl),
    );
  }
}
