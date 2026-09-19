import fs from "node:fs";
import path from "node:path";

const wurzel = path.join(process.cwd(), "architektur", "adr");
if (!fs.existsSync(wurzel)) throw new Error("[V5-R3-ADR] ADR-Verzeichnis fehlt.");

const dateien = fs.readdirSync(wurzel)
  .filter(name => /^ADR-\d{3}-.+\.md$/.test(name))
  .sort();

if (dateien.length === 0) throw new Error("[V5-R3-ADR] Mindestens eine ADR fehlt.");

const pflicht = [
  "## Kontext",
  "## Entscheidung",
  "## Alternativen",
  "## Konsequenzen",
  "## Invarianten",
  "## Migration",
  "## Rollback",
];

for (const name of dateien) {
  const text = fs.readFileSync(path.join(wurzel, name), "utf8");
  for (const heading of pflicht) {
    if (!text.includes(heading)) {
      throw new Error("[V5-R3-ADR] " + name + ": Abschnitt fehlt: " + heading);
    }
  }
  if (!text.includes("**Status:**")) throw new Error("[V5-R3-ADR] " + name + ": Status fehlt.");
}

console.log("[V5-R3-ADR] OK:", dateien.length);
