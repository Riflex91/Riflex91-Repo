const VERBOTENE_DOMAENENNAMEN = [
  "ActionRequest",
  "ActionResult",
  "ResourceClaim",
  "ExecutionChannel",
  "Postcondition",
  "Capability",
  "Workflow",
  "Health",
  "MessageEnvelope",
  "StoragePort",
];

const RAW_WRITE_MUSTER = [
  /\b(?:attack|smart_move|move|use_skill|equip|unequip|buy|sell|trade_buy|trade_sell)\s*\(/,
  /\b(?:bank_store|bank_retrieve|upgrade|compound|exchange|craft|dismantle)\s*\(/,
  /\b(?:send_cm|send_gold|send_item)\s*\(/,
  /\b(?:parent\.)?socket\.emit\s*\(/,
];

export function pruefeQuelltext(relativerPfad, quelltext) {
  const fehler = [];
  const pfad = relativerPfad.replaceAll("\\", "/");

  if (/(?:from\s+|import\s*\(|require\s*\()\s*["'][^"']*v[34]\//.test(quelltext)) {
    fehler.push("LEGACY_RUNTIME_IMPORT");
  }

  if (/\.prototype\s*\.|Object\.setPrototypeOf\s*\(|__proto__/.test(quelltext)) {
    fehler.push("MONKEY_PATCH");
  }

  for (const muster of RAW_WRITE_MUSTER) {
    if (muster.test(quelltext) && !pfad.startsWith("ausfuehrung/quelle/adapter/")) {
      fehler.push("RAW_GAME_WRITE");
      break;
    }
  }

  if (/(?:from\s+["'](?:node:)?fs(?:\/promises)?["']|require\s*\(\s*["'](?:node:)?fs)/.test(quelltext)
      && !pfad.startsWith("persistenz/quelle/adapter/")
      && !pfad.startsWith("grundlage/adapter/persistenz/")) {
    fehler.push("DIREKTER_DATEISYSTEMZUGRIFF");
  }

  if (/\bfetch\s*\(|\bnew\s+WebSocket\s*\(/.test(quelltext)
      && !pfad.startsWith("host/quelle/adapter/")
      && !pfad.startsWith("ausfuehrung/quelle/adapter/")) {
    fehler.push("DIREKTER_NETZWERKZUGRIFF");
  }

  const istHotPath = [
    "kampf/quelle/",
    "bewegung/quelle/",
    "scheduler/quelle/",
    "ausfuehrung/quelle/",
  ].some(prefix => pfad.startsWith(prefix));

  if (istHotPath
      && /(?:from\s+|import\s*\()\s*["'][^"']*(?:grundlage\/adapter\/persistenz|persistenz\/adapter)\//.test(quelltext)) {
    fehler.push("SSD_HOT_PATH_ZUGRIFF");
  }

  if (/\bDate\.now\s*\(|\bnew\s+Date\s*\(/.test(quelltext)
      && !pfad.startsWith("grundlage/quelle/determinismus/adapter/")) {
    fehler.push("DIREKTE_SYSTEMZEIT");
  }

  if (/\bMath\.random\s*\(/.test(quelltext)
      && !pfad.startsWith("grundlage/quelle/determinismus/adapter/")) {
    fehler.push("DIREKTE_UNKONTROLLIERTE_ZUFALLSQUELLE");
  }

  if (/wissensbasis\/(?:datenbank|live)\//.test(quelltext)
      || /(?:from\s+|import\s*\()\s*["'][^"']*wissensbasis\//.test(quelltext)) {
    fehler.push("ROH_SNAPSHOT_ZUGRIFF");
  }

  if (/\bnew\s+(?:Map|Set|WeakMap|WeakSet|Array)\s*\(|\.push\s*\(/.test(quelltext)) {
    fehler.push("UNBEGRENZTE_SAMMLUNG");
  }

  for (const name of VERBOTENE_DOMAENENNAMEN) {
    if (new RegExp("\\b" + name + "\\b").test(quelltext)) {
      fehler.push("ENGLISCHER_DOMAENENBEZEICHNER:" + name);
    }
  }

  if (pfad.startsWith("host/quelle/") && /\b(?:eval|evaluate|invoke)\s*\(/i.test(quelltext)) {
    fehler.push("GENERISCHER_HOST_AUFRUF");
  }

  if (/\b(?:password|passwort|secret|credential|accessToken|apiKey)\s*[:=]\s*["'][^"']{8,}["']/i.test(quelltext)) {
    fehler.push("GEHEIMNIS_LITERAL");
  }

  return [...new Set(fehler)];
}
