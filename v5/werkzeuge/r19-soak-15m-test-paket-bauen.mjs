import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 R19 SOAK_15M Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/r19-soak-15m-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/r19-soak-15m-test-gui.js", "utf8");
const ziel = "werkzeuge/r19-soak-15m-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("R19_SOAK_15M_TEST_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) throw new Error("R19_SOAK_15M_TEST_PAKET_NICHT_SOURCE_LOCKED");
  console.log("[V5-R19-SOAK-15M] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-R19-SOAK-15M] Paket erzeugt:", ziel);
}
