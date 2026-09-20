import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 R12 Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/r12-controlled-live-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/r12-controlled-live-test-gui.js", "utf8");
const ziel = "werkzeuge/r12-controlled-live-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("R12_TEST_GUI_PAKET_FEHLT");
  const ist = fs.readFileSync(ziel, "utf8");
  if (ist !== erwartet) throw new Error("R12_TEST_GUI_PAKET_NICHT_SOURCE_LOCKED");
  console.log("[V5-R12-TEST-GUI] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-R12-TEST-GUI] Paket erzeugt:", ziel);
}
