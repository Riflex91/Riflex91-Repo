import crypto from "node:crypto";

const READ_ONLY_BANK_WITHDRAW_EXPR = [
  "(() => {",
  "  const roots = [globalThis];",
  "  try { if (globalThis.parent && globalThis.parent !== globalThis) roots.push(globalThis.parent); } catch {}",
  "  let root = null;",
  "  for (const kandidat of roots) {",
  "    try { if (kandidat && kandidat.character) { root = kandidat; break; } } catch {}",
  "  }",
  "  if (!root) return { status:'BLOCKIERT', grund:'BANK_WITHDRAW_SPIELKONTEXT_FEHLT' };",
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
  "  const inventoryMaterial = Array.isArray(c.items) ? c.items.slice(0,64).map((item,index) => {",
  "    if (!item || typeof item !== 'object') return index + ':_';",
  "    return index + ':' + String(item.name || '') + ':' + String(item.level ?? 0) + ':' + String(item.q ?? 1) + ':' + String(item.p ?? '');",
  "  }).join('|') : '';",
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
  "    bankGold:Number.isSafeInteger(bankGold)&&bankGold>=0?bankGold:null,",
  "    inventoryMaterial",
  "  };",
  "})()",
].join("\n");

function text(wert, max, fehler) {
  if (typeof wert !== "string" || wert.trim().length === 0 || wert.length > max) {
    throw new Error(fehler);
  }
}


function hash(wert) {
  return crypto.createHash("sha256").update(String(wert)).digest("hex");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validiereBasis(value) {
  if (!value || typeof value !== "object" || value.status !== "OK") {
    throw new Error(String(value?.grund || "BANK_WITHDRAW_BEOBACHTUNG_UNGUELTIG"));
  }
  text(value.accountId, 192, "BANK_WITHDRAW_ACCOUNT_BINDUNG_FEHLT");
  text(value.charakterName, 192, "BANK_WITHDRAW_CHARACTER_BINDUNG_FEHLT");
  text(value.sessionId, 192, "BANK_WITHDRAW_SESSION_BINDUNG_FEHLT");
  text(value.serverRegion, 32, "BANK_WITHDRAW_SERVER_REGION_FEHLT");
  text(value.serverKennung, 32, "BANK_WITHDRAW_SERVER_KENNUNG_FEHLT");
  if (value.ctype !== "merchant") throw new Error("BANK_WITHDRAW_MERCHANT_ERFORDERLICH");
  if (value.rip === true) throw new Error("BANK_WITHDRAW_CHARACTER_TOT");
  if (value.alternativeRuntimeAktiv === true) {
    throw new Error("BANK_WITHDRAW_ALTERNATIVE_RUNTIME_AKTIV");
  }
  if (!Number.isSafeInteger(value.characterGold) || value.characterGold < 0) {
    throw new Error("BANK_WITHDRAW_CHARACTER_GOLD_NICHT_LESBAR");
  }
  const inventoryMaterial = value.inventoryMaterial === undefined
    ? ""
    : value.inventoryMaterial;
  if (typeof inventoryMaterial !== "string"
      || inventoryMaterial.length > 20_000) {
    throw new Error("BANK_WITHDRAW_INVENTORY_BEOBACHTUNG_UNGUELTIG");
  }
  return Object.freeze({ ...value, inventoryMaterial });
}

function gleicheBindung(a, b) {
  return a.accountId === b.accountId
    && a.charakterName === b.charakterName
    && a.sessionId === b.sessionId
    && a.serverRegion === b.serverRegion
    && a.serverKennung === b.serverKennung
    && a.ctype === b.ctype;
}

function shadowBeobachtung(value, beobachtetAmMs) {
  const basis = validiereBasis(value);
  if (!Number.isSafeInteger(beobachtetAmMs) || beobachtetAmMs < 0) {
    throw new Error("BANK_WITHDRAW_SHADOW_BEOBACHTUNGSZEIT_UNGUELTIG");
  }
  return Object.freeze({
    ...basis,
    beobachtetAmMs,
    fingerprint: hash(JSON.stringify({
      accountId: basis.accountId,
      charakterName: basis.charakterName,
      sessionId: basis.sessionId,
      serverRegion: basis.serverRegion,
      serverKennung: basis.serverKennung,
      map: basis.map,
      bankGemountet: basis.bankGemountet,
      characterGold: basis.characterGold,
      bankGold: basis.bankGold,
      inventorySha256: hash(basis.inventoryMaterial),
    })),
    inventorySha256: hash(basis.inventoryMaterial),
  });
}

export function validiereBankWithdrawShadowAusgangsBeobachtung(value) {
  const basis = validiereBasis(value);
  if (basis.bewegtSich === true) {
    throw new Error("BANK_WITHDRAW_SHADOW_START_CHARACTER_BEWEGT_SICH");
  }
  if (basis.queueAktiv === true) {
    throw new Error("BANK_WITHDRAW_SHADOW_START_CHARACTER_QUEUE_AKTIV");
  }
  if (basis.bankGemountet === true) {
    throw new Error("BANK_WITHDRAW_SHADOW_START_MUSS_AUSSERHALB_BANK_SEIN");
  }
  return Object.freeze({ ...basis });
}

export function validiereBankWithdrawShadowMountBeobachtung(
  value,
  ausgang,
  beobachtetAmMs,
) {
  const basis = shadowBeobachtung(value, beobachtetAmMs);
  if (!gleicheBindung(basis, ausgang)) {
    throw new Error("BANK_WITHDRAW_SHADOW_BINDUNG_DRIFT");
  }
  if (basis.bankGemountet !== true) {
    throw new Error("BANK_WITHDRAW_SHADOW_BANK_NOCH_NICHT_GEMOUNTET");
  }
  if (basis.bewegtSich === true || basis.queueAktiv === true) {
    throw new Error("BANK_WITHDRAW_SHADOW_MOUNT_NOCH_NICHT_STABIL");
  }
  if (!Number.isSafeInteger(basis.bankGold) || basis.bankGold < 0) {
    throw new Error("BANK_WITHDRAW_BANK_GOLD_NICHT_LESBAR");
  }
  if (basis.bankGold < 1) {
    throw new Error("BANK_WITHDRAW_BANK_GOLD_ZU_NIEDRIG");
  }
  return basis;
}

export async function beobachteBankWithdrawRohReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("BANK_WITHDRAW_CDP_KONTEXT_UNGUELTIG");
  }
  return validiereBasis(
    await session.evaluate(READ_ONLY_BANK_WITHDRAW_EXPR, contextId),
  );
}

export async function warteAufStabilenStartAusserhalbBankReadOnly(
  session,
  contextId,
  {
    timeoutMs = 90_000,
    pollMs = 500,
    onPhase = () => {},
  } = {},
) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) {
    throw new Error("BANK_WITHDRAW_START_AUSSERHALB_TIMEOUT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(pollMs) || pollMs < 100 || pollMs > 5_000) {
    throw new Error("BANK_WITHDRAW_START_AUSSERHALB_POLL_UNGUELTIG");
  }

  const start = Date.now();
  let bindung = null;
  let ausserhalbKandidat = null;
  let exitHinweisGesendet = false;

  while (Date.now() - start <= timeoutMs) {
    const roh = await beobachteBankWithdrawRohReadOnly(session, contextId);

    if (bindung !== null && !gleicheBindung(roh, bindung)) {
      throw new Error("BANK_WITHDRAW_START_AUSSERHALB_BINDUNG_DRIFT");
    }
    if (bindung === null) bindung = roh;

    if (roh.bankGemountet === true) {
      ausserhalbKandidat = null;
      if (!exitHinweisGesendet) {
        onPhase("START_BANK_AKTIV_BANK_MANUELL_VERLASSEN");
        exitHinweisGesendet = true;
      }
    } else if (roh.bewegtSich !== true && roh.queueAktiv !== true) {
      const kandidat = validiereBankWithdrawShadowAusgangsBeobachtung(roh);
      if (ausserhalbKandidat !== null) {
        onPhase("START_AUSSERHALB_BANK_STABIL_BEOBACHTET");
        return kandidat;
      }
      ausserhalbKandidat = kandidat;
    } else {
      ausserhalbKandidat = null;
    }

    await sleep(pollMs);
  }

  throw new Error("BANK_WITHDRAW_START_AUSSERHALB_TIMEOUT");
}

export async function warteAufManuellenBankMountReadOnly(
  session,
  contextId,
  ausgang,
  {
    timeoutMs = 90_000,
    pollMs = 500,
    onPhase = () => {},
  } = {},
) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) {
    throw new Error("BANK_WITHDRAW_SHADOW_MOUNT_TIMEOUT_UNGUELTIG");
  }
  if (!Number.isSafeInteger(pollMs) || pollMs < 100 || pollMs > 5_000) {
    throw new Error("BANK_WITHDRAW_SHADOW_POLL_UNGUELTIG");
  }
  const start = Date.now();
  onPhase("LEASE_ERWORBEN_BANK_MANUELL_BETRETEN");
  let mountKandidat = null;
  while (Date.now() - start <= timeoutMs) {
    const roh = await beobachteBankWithdrawRohReadOnly(session, contextId);
    if (!gleicheBindung(roh, ausgang)) {
      throw new Error("BANK_WITHDRAW_SHADOW_BINDUNG_DRIFT");
    }
    if (roh.bankGemountet === true) {
      const kandidat = validiereBankWithdrawShadowMountBeobachtung(
        roh,
        ausgang,
        Date.now(),
      );
      if (mountKandidat !== null
          && mountKandidat.fingerprint === kandidat.fingerprint) {
        onPhase("BANK_MOUNT_STABIL_BEOBACHTET");
        return kandidat;
      }
      mountKandidat = kandidat;
    } else {
      mountKandidat = null;
    }
    await sleep(pollMs);
  }
  throw new Error("BANK_WITHDRAW_SHADOW_MANUELLER_MOUNT_TIMEOUT");
}

export function erstelleBankWithdrawShadowLiveVoraussetzungen(
  mountBeobachtung,
  ausgestelltAmMs,
  gueltigBisMs,
) {
  if (!Number.isSafeInteger(ausgestelltAmMs)
      || !Number.isSafeInteger(gueltigBisMs)
      || mountBeobachtung.beobachtetAmMs > ausgestelltAmMs
      || gueltigBisMs < ausgestelltAmMs) {
    throw new Error("BANK_WITHDRAW_SHADOW_LIVE_EVIDENCE_ZEIT_UNGUELTIG");
  }
  return Object.freeze({
    async pruefe(ids, zeitMs) {
      if (zeitMs !== ausgestelltAmMs
          || !Array.isArray(ids)
          || ids.length < 1
          || ids.length > 16) {
        return Object.freeze([]);
      }
      return Object.freeze(ids.map(id => Object.freeze({
        voraussetzungId: id,
        fingerprint: hash(
          id + ":" + mountBeobachtung.fingerprint
          + ":" + mountBeobachtung.inventorySha256,
        ),
        beobachtetAmMs: mountBeobachtung.beobachtetAmMs,
        gueltigBisMs,
      })));
    },
  });
}

export function erstelleBankWithdrawShadowReleaseBeobachter(
  session,
  contextId,
  mountBeobachtung,
  {
    timeoutMs = 90_000,
    pollMs = 500,
    onPhase = () => {},
    exitPhaseText = "ADMISSION_BESTANDEN_BANK_MANUELL_VERLASSEN",
  } = {},
) {
  return Object.freeze({
    async beobachte() {
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) {
        throw new Error("BANK_WITHDRAW_SHADOW_EXIT_TIMEOUT_UNGUELTIG");
      }
      const start = Date.now();
      onPhase(exitPhaseText);
      while (Date.now() - start <= timeoutMs) {
        const roh = await beobachteBankWithdrawRohReadOnly(session, contextId);
        if (!gleicheBindung(roh, mountBeobachtung)) {
          throw new Error("BANK_WITHDRAW_SHADOW_EXIT_BINDUNG_DRIFT");
        }
        if (roh.bankGemountet !== true
            && roh.bewegtSich !== true
            && roh.queueAktiv !== true) {
          onPhase("BANK_EXIT_STABIL_BEOBACHTET");
          return Object.freeze({
            offeneTransaktionen: 0,
            backendInProgress: false,
            bankActionInFlight: false,
            characterBankAktiv: false,
            erwarteterExitBeobachtet: true,
          });
        }
        await sleep(pollMs);
      }
      throw new Error("BANK_WITHDRAW_SHADOW_MANUELLER_EXIT_TIMEOUT");
    },
  });
}

export const BANK_WITHDRAW_REAL_SHADOW_BROWSER_READ_ONLY = true;
export const BANK_WITHDRAW_REAL_SHADOW_GAMEPLAY_WRITES = 0;

export function validiereBankWithdrawPreflightBeobachtung(value) {
  const basis = validiereBasis(value);
  if (basis.bewegtSich === true) throw new Error("BANK_WITHDRAW_CHARACTER_BEWEGT_SICH");
  if (basis.queueAktiv === true) throw new Error("BANK_WITHDRAW_CHARACTER_QUEUE_AKTIV");
  if (basis.bankGemountet !== true) throw new Error("BANK_WITHDRAW_BANK_NICHT_GEMOUNTET");
  if (!Number.isSafeInteger(basis.bankGold) || basis.bankGold < 0) {
    throw new Error("BANK_WITHDRAW_BANK_GOLD_NICHT_LESBAR");
  }
  if (basis.bankGold < 1) {
    throw new Error("BANK_WITHDRAW_BANK_GOLD_ZU_NIEDRIG");
  }
  return Object.freeze({ ...basis });
}

export async function beobachteBankWithdrawPreflightReadOnly(session, contextId) {
  if (!session || typeof session.evaluate !== "function" || !Number.isInteger(contextId)) {
    throw new Error("BANK_WITHDRAW_CDP_KONTEXT_UNGUELTIG");
  }
  return validiereBankWithdrawPreflightBeobachtung(
    await session.evaluate(READ_ONLY_BANK_WITHDRAW_EXPR, contextId),
  );
}

export const BANK_WITHDRAW_PREFLIGHT_BROWSER_READ_ONLY = true;
export const BANK_WITHDRAW_PREFLIGHT_GAMEPLAY_WRITES = 0;
