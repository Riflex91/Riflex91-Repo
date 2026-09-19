export interface BegrenztesJsonOptionen {
  readonly maximaleBytes: number;
  readonly erlaubteSchemaVersionen: readonly number[];
}

export function utf8ByteLaenge(text: string): number {
  let bytes = 0;
  for (const zeichen of text) {
    const codepoint = zeichen.codePointAt(0);
    if (codepoint === undefined) continue;
    if (codepoint <= 0x7f) bytes += 1;
    else if (codepoint <= 0x7ff) bytes += 2;
    else if (codepoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

export function parseBegrenztesVersioniertesJson(
  text: string,
  optionen: BegrenztesJsonOptionen,
): Readonly<Record<string, unknown>> {
  const bytes = utf8ByteLaenge(text);
  if (!Number.isInteger(optionen.maximaleBytes)
      || optionen.maximaleBytes < 1
      || bytes > optionen.maximaleBytes) {
    throw new Error("PERSISTENZ_GROESSE_UNGUELTIG");
  }

  let wert: unknown;
  try {
    wert = JSON.parse(text);
  } catch {
    throw new Error("PERSISTENZ_JSON_KORRUPT");
  }

  if (wert === null || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("PERSISTENZ_FORMAT_UNGUELTIG");
  }

  const datensatz = wert as Record<string, unknown>;
  const version = datensatz.schemaVersion;
  if (!Number.isInteger(version)
      || !(optionen.erlaubteSchemaVersionen as readonly unknown[]).includes(version)) {
    throw new Error("PERSISTENZ_SCHEMA_NICHT_UNTERSTUETZT");
  }

  return Object.freeze({ ...datensatz });
}
