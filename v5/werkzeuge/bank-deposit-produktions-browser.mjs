const READ_ONLY_BANK_DEPOSIT_EXPR = [
  "(() => {",
  "  const roots = [globalThis];",
  "  try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root = null;",
  "  for (const kandidat of roots) {",
  "    try { if (kandidat && kandidat.character) { root = kandidat; break; } } catch {}",
  "  }",
  "  if (!root) return { status:'BLOCKIERT', grund:'BANK_DEPOSIT_SPIELKONTEXT_FEHLT' };",
  "  const c = root.character;",
  "  let accountId = '';",
  "  for (const kandidat of roots) {",
  "    try { accountId = String(kandidat?.user_id || kandidat?.character?.owner || ''); if (accountId) break; } catch {}",
  "  }",
  "  const regionKandidaten = [root?.server_region, root?.server?.region];",
  "  const idKandidaten = [root?.server_identifier, root?.server?.id];",
  "  try { regionKandidaten.push(root?.parent?.server_region, root?.parent?.server?.region); } catch {}",
  "  try { idKandidaten.push(root?.parent?.server_identifier, root?.parent?.server?.id); } catch {}",
  "  const serverRegion = regionKandidaten.map(x => typeof x === 'string' ? x.trim() : '').find(Boolean) || '';",
  "  const serverKennung = idKandidaten.map(x => typeof x === 'string' ? x.trim() : '').find(Boolean) || '';",
  "  let alternativeRuntimeAktiv = false;",
  "  try { const v3=root.AIO_V3&&root.AIO_V3.__runtime; const s3=v3&&typeof v3.status==='function'?v3.status():null; alternativeRuntimeAktiv=!!(v3&&(v3.timer||(s3&&s3.running===true))); } catch { alternativeRuntimeAktiv=true; }",
  "  try { const v4=root.AIO_V4||root.V4Runtime; const s4=v4&&typeof v4.status==='function'?v4.status():null; if(s4&&(s4.running===true||s4.aktivFreigegeben===true)) alternativeRuntimeAktiv=true; } catch { alternativeRuntimeAktiv=true; }",
  "  const bank = c.bank && typeof c.bank === 'object' && !Array.isArray(c.bank) ? c.bank : null;",
  "  const characterGold = Number(c.gold);",
  "  const bankGold = bank ? Number(bank.gold) : NaN;",
  "  return {",
  "    status:'OK',",
  "    accountId,",
  "    charakterName:String(c.name || ''),",
  "    sessionId:String(c.id || ''),",
  "    ctype:String(c.ctype || c.type || '').toLowerCase(),",
  "    map:String(c.map || ''),",
  "    serverRegion,",
  "    serverKennung,",
  "    rip:c.rip===true,",
  "    bewegtSich:c.moving===true,",
  "    queueAktiv:!!(c.q && typeof c.q === 'object' && Object.keys(c.q).length),",
  "    alternativeRuntimeAktiv,",
  "    bankGemountet:!!bank,",
  "    characterGold:Number.isSafeInteger(characterGold)&&characterGold>=0?characterGold:null,",
  "    bankGold:Number.isSafeInteger(bankGold)&&bankGold>=0?bankGold:null",
  "  };",
  "})()",
].join("\n");

function text(wert, max, fehler) {
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > max) {
    throw new Error(fehler);
  }
}

export function validiereBankDepositPreflightBeobachtung(value) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "BANK_DEPOSIT_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId, 192, "BANK_DEPOSIT_ACCOUNT_BINDUNG_FEHLT");
  text(value.charakterName, 192, "BANK_DEPOSIT_CHARACTER_BINDUNG_FEHLT");
  text(value.sessionId, 192, "BANK_DEPOSIT_SESSION_BINDUNG_FEHLT");
  text(value.serverRegion, 32, "BANK_DEPOSIT_SERVER_REGION_FEHLT");
  text(value.serverKennung, 32, "BANK_DEPOSIT_SERVER_KENNUNG_FEHLT");
  if (value.ctype !== "merchant") throw new Error("BANK_DEPOSIT_MERCHANT_ERFORDERLICH");
  if (value.rip === true) throw new Error("BANK_DEPOSIT_CHARACTER_TOT");
  if (value.bewegtSich === true) throw new Error("BANK_DEPOSIT_CHARACTER_BEWEGT_SICH");
  if (value.queueAktiv === true) throw new Error("BANK_DEPOSIT_CHARACTER_QUEUE_AKTIV");
  if (value.alternativeRuntimeAktiv === true) {
    throw new Error("BANK_DEPOSIT_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (value.bankGemountet !== true) throw new Error("BANK_DEPOSIT_BANK_NICHT_GEMOUNTET");
  if (!Number.isSafeInteger(value.characterGold) || value.characterGold < 1) {
    throw new Error("BANK_DEPOSIT_CHARACTER_GOLD_ZU_NIEDRIG");
  }
  if (!Number.isSafeInteger(value.bankGold) || value.bankGold < 0) {
    throw new Error("BANK_DEPOSIT_BANK_GOLD_NICHT_LESBAR");
  }
  return Object.freeze({ ...value });
}

export async function beobachteBankDepositPreflightReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("BANK_DEPOSIT_CDP_KONTEXT_UNGUELTIG");
  }
  return validiereBankDepositPreflightBeobachtung(
    await session.evaluate(READ_ONLY_BANK_DEPOSIT_EXPR, contextId),
  );
}

export const BANK_DEPOSIT_PREFLIGHT_BROWSER_READ_ONLY = true;
export const BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES = 0;
