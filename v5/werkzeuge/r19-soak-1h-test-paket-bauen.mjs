import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 R19 SOAK_1H Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/r19-soak-1h-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/r19-soak-1h-test-gui.js", "utf8");
const ziel = "werkzeuge/r19-soak-1h-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("R19_SOAK_1H_TEST_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) throw new Error("R19_SOAK_1H_TEST_PAKET_NICHT_SOURCE_LOCKED");
  console.log("[V5-R19-SOAK-1H] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-R19-SOAK-1H] Paket erzeugt:", ziel);
}
