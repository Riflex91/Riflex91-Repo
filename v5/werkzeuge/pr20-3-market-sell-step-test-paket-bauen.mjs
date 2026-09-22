import fs from "node:fs";

const HEADER = `/* AUTO-GENERIERT: V5 PR20.3 Market NPC-Sell Stufentest
 * Quellen:
 * - v5/werkzeuge/v5-adventure-land-test-gui.js
 * - v5/werkzeuge/pr20-3-market-sell-step-test-gui.js
 * Nicht manuell bearbeiten.
 */

`;

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/pr20-3-market-sell-step-test-gui.js", "utf8");
const ziel = "werkzeuge/pr20-3-market-sell-step-test-paket.js";
const erwartet = HEADER + gui + "\n\n" + controller + "\n";

if (process.argv.includes("--check")) {
  if (!fs.existsSync(ziel)) throw new Error("PR20_3_MARKET_SELL_STEP_PAKET_FEHLT");
  if (fs.readFileSync(ziel, "utf8") !== erwartet) {
    throw new Error("PR20_3_MARKET_SELL_STEP_PAKET_NICHT_SOURCE_LOCKED");
  }
  console.log("[V5-PR20.3-MARKET-SELL-STEP] Source-Lock OK");
} else {
  fs.writeFileSync(ziel, erwartet, "utf8");
  console.log("[V5-PR20.3-MARKET-SELL-STEP] Paket erzeugt:", ziel);
}
