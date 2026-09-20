import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 CAP-033/034 Live-Funktionstest
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/cap033-cap034-live-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/cap033-cap034-live-test-gui.js", "utf8");
const ziel = "werkzeuge/cap033-cap034-live-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) {
    throw new Error("CAP033034_LIVE_TEST_PAKET_FEHLT");
  }
  if (fs.readFileSync(ziel, "utf8") !== erwartet) {
    throw new Error("CAP033034_LIVE_TEST_PAKET_NICHT_SOURCE_LOCKED");
  }
  console.log("[V5-CAP033034-LIVE] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-CAP033034-LIVE] Paket erzeugt:", ziel);
}
