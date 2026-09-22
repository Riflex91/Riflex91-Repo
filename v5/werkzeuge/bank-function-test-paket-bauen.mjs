import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 Bank-Funktionstest Ingame-Paket
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/bank-function-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/bank-function-test-gui.js", "utf8");
const ziel = "werkzeuge/bank-function-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("BANK_FUNCTION_TEST_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) {
    throw new Error("BANK_FUNCTION_TEST_PAKET_NICHT_SOURCE_LOCKED");
  }
  console.log("[V5-BANK-FUNCTION-TEST] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-BANK-FUNCTION-TEST] Paket erzeugt:", ziel);
}
