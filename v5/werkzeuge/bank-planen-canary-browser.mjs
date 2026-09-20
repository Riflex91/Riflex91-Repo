const READ_ONLY_BANK_EXPR = [
  "(() => {",
  "  const roots = [globalThis];",
  "  try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root = null;",
  "  for (const kandidat of roots) {",
  "    try { if (kandidat && kandidat.character && kandidat.G && kandidat.G.items) { root = kandidat; break; } } catch {}",
  "  }",
  "  if (!root) return { status:'BLOCKIERT', grund:'BANK_CANARY_SPIELKONTEXT_FEHLT' };",
  "  const c = root.character;",
  "  let accountId = '';",
  "  for (const kandidat of roots) {",
  "    try {",
  "      accountId = String(kandidat?.user_id || kandidat?.character?.owner || '');",
  "      if (accountId) break;",
  "    } catch {}",
  "  }",
  "  const ctype = String(c.ctype || c.type || '').toLowerCase();",
  "  let alternativeRuntimeAktiv = false;",
  "  try {",
  "    const v3 = root.AIO_V3 && root.AIO_V3.__runtime;",
  "    const s3 = v3 && typeof v3.status === 'function' ? v3.status() : null;",
  "    alternativeRuntimeAktiv = !!(v3 && (v3.timer || (s3 && s3.running === true)));",
  "  } catch { alternativeRuntimeAktiv = true; }",
  "  try {",
  "    const v4 = root.AIO_V4 || root.V4Runtime;",
  "    const s4 = v4 && typeof v4.status === 'function' ? v4.status() : null;",
  "    if (s4 && (s4.running === true || s4.aktivFreigegeben === true)) alternativeRuntimeAktiv = true;",
  "  } catch { alternativeRuntimeAktiv = true; }",
  "  const bank = c.bank && typeof c.bank === 'object' && !Array.isArray(c.bank) ? c.bank : null;",
  "  const packNamen = bank ? Object.keys(bank).filter(x => /^items\\d+$/.test(x) && Array.isArray(bank[x])).sort() : [];",
  "  const packs = packNamen.slice(0,128).map(pack => {",
  "    const slots = bank[pack].slice(0,4096);",
  "    const eintraege = [];",
  "    for (let slot = 0; slot < slots.length && eintraege.length < 2048; slot += 1) {",
  "      const item = slots[slot];",
  "      if (!item || !item.name) continue;",
  "      const name = String(item.name);",
  "      const def = root.G.items[name] || {};",
  "      const menge = Number.isInteger(item.q) && item.q > 0 ? item.q : 1;",
  "      const level = Number.isInteger(item.level) && item.level >= 0 ? item.level : 0;",
  "      const stackMax = Number.isInteger(def.s) && def.s > 0 ? def.s : 1;",
  "      eintraege.push({",
  "        slot, name, level, menge, stackMax,",
  "        gesperrt:item.l === true || item.locked === true || item.lock === true,",
  "        spezial:item.p == null ? '' : String(item.p).slice(0,80)",
  "      });",
  "    }",
  "    return { pack, gesamtSlots:slots.length, eintraege };",
  "  });",
  "  const inventar = Array.isArray(c.items) ? c.items : [];",
  "  const inventarKapazitaet = Number.isInteger(c.isize) && c.isize >= inventar.length ? c.isize : inventar.length;",
  "  const inventarBelegt = inventar.filter(x => !!x).length;",
  "  return {",
  "    status:'OK',",
  "    accountId,",
  "    charakterName:String(c.name || ''),",
  "    charakterSessionId:String(c.id || ''),",
  "    ctype,",
  "    map:String(c.map || ''),",
  "    rip:c.rip === true,",
  "    bewegtSich:c.moving === true,",
  "    alternativeRuntimeAktiv,",
  "    bankVerfuegbar:!!bank && packs.length > 0,",
  "    packs,",
  "    freieInventarSlots:Math.max(0, inventarKapazitaet - inventarBelegt)",
  "  };",
  "})()",
].join("\n");

function pruefeText(wert, maximum, fehler) {
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > maximum) {
    throw new Error(fehler);
  }
}

export function validiereBankCanaryBeobachtung(value) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "BANK_CANARY_BEOBACHTUNG_UNGUELTIG"));
  }
  pruefeText(value.accountId, 192, "BANK_CANARY_ACCOUNT_BINDUNG_FEHLT");
  if (value.ctype !== "merchant") throw new Error("BANK_CANARY_MERCHANT_ERFORDERLICH");
  if (value.rip === true) throw new Error("BANK_CANARY_CHARAKTER_TOT");
  if (value.alternativeRuntimeAktiv === true) {
    throw new Error("BANK_CANARY_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (value.bankVerfuegbar !== true || !Array.isArray(value.packs) || value.packs.length < 1) {
    throw new Error("BANK_CANARY_BANK_KONTEXT_FEHLT");
  }
  if (value.packs.length > 128) throw new Error("BANK_CANARY_ZU_VIELE_PACKS");
  if (!Number.isInteger(value.freieInventarSlots)
      || value.freieInventarSlots < 0
      || value.freieInventarSlots > 256) {
    throw new Error("BANK_CANARY_INVENTAR_SLOTS_UNGUELTIG");
  }

  let gesamtEintraege = 0;
  for (const pack of value.packs) {
    pruefeText(pack.pack, 128, "BANK_CANARY_PACK_NAME_UNGUELTIG");
    if (!Number.isInteger(pack.gesamtSlots)
        || pack.gesamtSlots < 1
        || pack.gesamtSlots > 4096
        || !Array.isArray(pack.eintraege)
        || pack.eintraege.length > pack.gesamtSlots) {
      throw new Error("BANK_CANARY_PACK_UNGUELTIG");
    }
    gesamtEintraege += pack.eintraege.length;
    if (gesamtEintraege > 2048) throw new Error("BANK_CANARY_EINTRAEGE_ZU_GROSS");
    for (const item of pack.eintraege) {
      pruefeText(item.name, 128, "BANK_CANARY_ITEM_NAME_UNGUELTIG");
      if (!Number.isInteger(item.slot) || item.slot < 0 || item.slot >= pack.gesamtSlots
          || !Number.isInteger(item.level) || item.level < 0 || item.level > 99
          || !Number.isInteger(item.menge) || item.menge < 1 || item.menge > 1_000_000
          || !Number.isInteger(item.stackMax) || item.stackMax < 1 || item.stackMax > 1_000_000
          || typeof item.gesperrt !== "boolean"
          || typeof item.spezial !== "string" || item.spezial.length > 80) {
        throw new Error("BANK_CANARY_ITEM_UNGUELTIG");
      }
    }
  }
  return value;
}

export async function beobachteBankCanaryReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("BANK_CANARY_CDP_KONTEXT_UNGUELTIG");
  }
  const value = await session.evaluate(READ_ONLY_BANK_EXPR, contextId);
  return validiereBankCanaryBeobachtung(value);
}

export const BANK_CANARY_BROWSER_READ_ONLY = true;
export const BANK_CANARY_GAMEPLAY_WRITES = 0;
