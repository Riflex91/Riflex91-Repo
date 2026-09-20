import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 CAP-045 Production Live Ingame-Testpaket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/cap045-production-live-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/cap045-production-live-test-gui.js", "utf8");
const ziel = "werkzeuge/cap045-production-live-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("CAP045_PRODUCTION_LIVE_TEST_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) {
    throw new Error("CAP045_PRODUCTION_LIVE_TEST_PAKET_NICHT_SOURCE_LOCKED");
  }
  console.log("[V5-CAP045-LIVE] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-CAP045-LIVE] Paket erzeugt:", ziel);
}
