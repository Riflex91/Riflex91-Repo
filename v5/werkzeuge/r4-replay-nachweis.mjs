import crypto from "node:crypto";
import fs from "node:fs";
import { fuehreDeterministischesSzenarioAus } from "../erzeugt/index.js";

const eingabe = Object.freeze({
  seed: 123456789,
  startZeitMs: 1700000000000,
  korrelationsId: "R4-CI-REPLAY",
  optionen: Object.freeze(["A", "B", "C", "D"]),
});

const eins = fuehreDeterministischesSzenarioAus(eingabe);
const zwei = fuehreDeterministischesSzenarioAus(eingabe);

if (eins !== zwei) {
  throw new Error("[V5-R4-REPLAY] NICHT_DETERMINISTISCH");
}

const sha256 = crypto.createHash("sha256").update(eins).digest("hex");
const nachweis = {
  schemaVersion: 1,
  status: "DETERMINISTISCH",
  eingabe,
  ausgabeSha256: sha256,
  byteLaenge: Buffer.byteLength(eins, "utf8"),
  identischeLaeufe: 2,
  runtimeAuthority: false,
};

fs.writeFileSync("r4-replay-nachweis.json", JSON.stringify(nachweis, null, 2) + "\n");
console.log("[V5-R4-REPLAY]", sha256);
