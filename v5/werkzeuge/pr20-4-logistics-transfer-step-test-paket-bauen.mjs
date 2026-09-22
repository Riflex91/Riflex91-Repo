import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 PR20.4 Logistik/Transfer Gesamt-Stufentest
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/pr20-4-logistics-transfer-step-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync(
  "werkzeuge/pr20-4-logistics-transfer-step-test-gui.js",
  "utf8",
);
const ziel = "werkzeuge/pr20-4-logistics-transfer-step-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("PR20_4_TRANSFER_STEP_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) {
    throw new Error("PR20_4_TRANSFER_STEP_PAKET_NICHT_SOURCE_LOCKED");
  }
  console.log("[V5-PR20.4-TRANSFER-STEP] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-PR20.4-TRANSFER-STEP] Paket erzeugt:", ziel);
}
