import fs from "node:fs";
import path from "node:path";

fs.rmSync(path.join(process.cwd(), "erzeugt"), { recursive: true, force: true });
console.log("[V5-R3-BUILD] erzeugt/ bereinigt");
