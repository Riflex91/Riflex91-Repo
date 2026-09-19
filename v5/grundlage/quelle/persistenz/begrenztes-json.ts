export interface BegrenztesJsonOptionen {
  readonly maximaleBytes: number;
  readonly erlaubteSchemaVersionen: readonly number[];
}

export function parseBegrenztesVersioniertesJson(
  text: string,
  optionen: BegrenztesJsonOptionen,
): Readonly<Record<string, unknown>> {
  const bytes = new TextEncoder().encode(text).byteLength;
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
