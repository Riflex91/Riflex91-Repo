import {
  beobachteBankWithdrawRohReadOnly,
  validiereBankWithdrawShadowMountBeobachtung,
} from "./bank-withdraw-produktions-browser.mjs";

const ACTION = "AL-ACTION-BANK-DEPOSIT";
const RECOVERY = "AL-RECOVERY-BANK-DEPOSIT";
const VERIFIER = "AL-VERIFIER-BANK-DEPOSIT";

function text(wert, max, fehler) {
  if (typeof wert !== "string"
      || wert.trim().length === 0
      || wert.length > max) {
    throw new Error(fehler);
  }
}

function pruefeIdentitaet(bindung) {
  if (!bindung || typeof bindung !== "object") {
    throw new Error("BANK_WITHDRAW_WRITE_BINDUNG_FEHLT");
  }
  for (const [wert, max, fehler] of [
    [bindung.accountId, 192, "BANK_WITHDRAW_WRITE_ACCOUNT_UNGUELTIG"],
    [bindung.charakterName, 192, "BANK_WITHDRAW_WRITE_CHARACTER_UNGUELTIG"],
    [bindung.sessionId, 192, "BANK_WITHDRAW_WRITE_SESSION_UNGUELTIG"],
    [bindung.serverRegion, 32, "BANK_WITHDRAW_WRITE_REGION_UNGUELTIG"],
    [bindung.serverKennung, 32, "BANK_WITHDRAW_WRITE_SERVER_UNGUELTIG"],
  ]) {
    text(wert, max, fehler);
  }
  return bindung;
}

function pruefeBindung(bindung) {
  pruefeIdentitaet(bindung);
  text(
    bindung.fingerprint,
    192,
    "BANK_WITHDRAW_WRITE_FINGERPRINT_UNGUELTIG",
  );
  if (!Number.isSafeInteger(bindung.characterGold)
      || bindung.characterGold < 1
      || !Number.isSafeInteger(bindung.bankGold)
      || bindung.bankGold < 0
      || bindung.bankGemountet !== true) {
    throw new Error("BANK_WITHDRAW_WRITE_GOLD_ODER_MOUNT_UNGUELTIG");
  }
  return bindung;
}

export function erstelleBankWithdrawEinGoldVorherBindung(
  mountBeobachtung,
  leaseEpoche,
) {
  const mount = pruefeBindung(mountBeobachtung);
  if (!Number.isSafeInteger(leaseEpoche) || leaseEpoche < 1) {
    throw new Error("BANK_WITHDRAW_WRITE_LEASE_EPOCHE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(mount.beobachtetAmMs)
      || mount.beobachtetAmMs < 1) {
    throw new Error("BANK_WITHDRAW_WRITE_MOUNT_ZEIT_UNGUELTIG");
  }
  return Object.freeze({
    schemaVersion: 1,
    characterId: mount.charakterName,
    sessionId: mount.sessionId,
    serverRegion: mount.serverRegion,
    serverKennung: mount.serverKennung,
    leaseEpoche,
    mountEpoche: mount.beobachtetAmMs,
    beobachtetAmMs: mount.beobachtetAmMs,
    characterGold: mount.characterGold,
    bankGold: mount.bankGold,
    fingerprint: mount.fingerprint,
  });
}

export function erstelleProduktivenBankWithdrawBeobachter(
  session,
  contextId,
  erwarteteBindung,
) {
  pruefeIdentitaet(erwarteteBindung);
  return Object.freeze({
    async beobachte(leaseEpoche, mountEpoche) {
      if (!Number.isSafeInteger(leaseEpoche) || leaseEpoche < 1
          || !Number.isSafeInteger(mountEpoche) || mountEpoche < 1) {
        throw new Error("BANK_WITHDRAW_WRITE_BEOBACHTER_EPOCHE_UNGUELTIG");
      }
      const roh = await beobachteBankWithdrawRohReadOnly(
        session,
        contextId,
      );
      const mount = validiereBankWithdrawShadowMountBeobachtung(
        roh,
        erwarteteBindung,
        Date.now(),
      );
      return Object.freeze({
        schemaVersion: 1,
        characterId: mount.charakterName,
        sessionId: mount.sessionId,
        serverRegion: mount.serverRegion,
        serverKennung: mount.serverKennung,
        leaseEpoche,
        mountEpoche,
        beobachtetAmMs: mount.beobachtetAmMs,
        characterGold: mount.characterGold,
        bankGold: mount.bankGold,
        fingerprint: mount.fingerprint,
      });
    },
  });
}

export class ProduktionsCdpBankWithdrawEinGoldAdapter {
  constructor(session, contextId) {
    if (!session || typeof session.evaluate !== "function"
        || !Number.isInteger(contextId)) {
      throw new Error("BANK_WITHDRAW_WRITE_CDP_KONTEXT_UNGUELTIG");
    }
    this.adapterId = "v5-production-cdp-bank-withdraw-one-gold-once";
    this.actionContractId = ACTION;
    this.recoveryContractId = RECOVERY;
    this.verifierId = VERIFIER;
    this.session = session;
    this.contextId = contextId;
    this.adapterAufrufe = 0;
    this.gameWrites = 0;
    this.moeglicherSend = false;
  }

  async sende(_freigabe, anfrage) {
    if (this.adapterAufrufe !== 0) {
      throw new Error("BANK_WITHDRAW_WRITE_MEHR_ALS_EIN_ADAPTER_AUFRUF");
    }
    this.adapterAufrufe += 1;

    if (!anfrage
        || anfrage.betrag !== 1
        || !Number.isSafeInteger(anfrage.erwartetesCharacterGold)
        || anfrage.erwartetesCharacterGold < 0
        || !Number.isSafeInteger(anfrage.erwartetesBankGold)
        || anfrage.erwartetesBankGold < 1) {
      return Object.freeze({
        art: "NICHT_GESENDET",
        grund: "BANK_WITHDRAW_WRITE_ADAPTER_ANFRAGE_DRIFT",
      });
    }
    for (const wert of [
      anfrage.accountId,
      anfrage.characterId,
      anfrage.sessionId,
      anfrage.serverRegion,
      anfrage.serverIdentifier,
      anfrage.erwarteterFingerprint,
    ]) {
      if (typeof wert !== "string" || wert.trim().length === 0) {
        return Object.freeze({
          art: "NICHT_GESENDET",
          grund: "BANK_WITHDRAW_WRITE_ADAPTER_BINDUNG_FEHLT",
        });
      }
    }
    const e = Object.freeze({
      accountId: anfrage.accountId,
      charakterName: anfrage.characterId,
      sessionId: anfrage.sessionId,
      serverRegion: anfrage.serverRegion,
      serverKennung: anfrage.serverIdentifier,
      characterGold: anfrage.erwartetesCharacterGold,
      bankGold: anfrage.erwartetesBankGold,
      fingerprint: anfrage.erwarteterFingerprint,
    });

    const expr = [
      "(async () => {",
      "  const roots=[globalThis];",
      "  try { if (globalThis.parent && globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
      "  let root=null;",
      "  for (const r of roots) { try { if (r&&r.character&&typeof r.bank_withdraw==='function') { root=r; break; } } catch {} }",
      "  if (!root) return {sent:false,reason:'CONTEXT_FEHLT'};",
      "  const c=root.character;",
      "  let accountId='';",
      "  for (const r of roots) { try { accountId=String(r?.user_id||r?.character?.owner||''); if(accountId) break; } catch {} }",
      "  const regionKandidaten=[root?.server_region,root?.server?.region];",
      "  const idKandidaten=[root?.server_identifier,root?.server?.id];",
      "  try { regionKandidaten.push(root?.parent?.server_region,root?.parent?.server?.region); } catch {}",
      "  try { idKandidaten.push(root?.parent?.server_identifier,root?.parent?.server?.id); } catch {}",
      "  const region=regionKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
      "  const sid=idKandidaten.map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
      "  if (accountId!==" + JSON.stringify(e.accountId) + ") return {sent:false,reason:'ACCOUNT_DRIFT'};",
      "  if (String(c.name||'')!==" + JSON.stringify(e.charakterName) + ") return {sent:false,reason:'CHARACTER_DRIFT'};",
      "  if (String(c.id||'')!==" + JSON.stringify(e.sessionId) + ") return {sent:false,reason:'SESSION_DRIFT'};",
      "  if (region!==" + JSON.stringify(e.serverRegion) + "||sid!==" + JSON.stringify(e.serverKennung) + ") return {sent:false,reason:'SERVER_DRIFT'};",
      "  if (String(c.ctype||c.type||'').toLowerCase()!=='merchant') return {sent:false,reason:'MERCHANT_ERFORDERLICH'};",
      "  if (c.rip||c.moving||c.target!=null) return {sent:false,reason:'CHARAKTER_NICHT_IDLE'};",
      "  if (c.q&&typeof c.q==='object'&&Object.keys(c.q).length) return {sent:false,reason:'QUEUE_AKTIV'};",
      "  let alt=false;",
      "  for (const r of roots) {",
      "    try { const x=r&&r.AIO_V3&&r.AIO_V3.__runtime; const s=x&&typeof x.status==='function'?x.status():null; if(x&&(x.timer||(s&&s.running===true))) alt=true; } catch { alt=true; }",
      "    try { const x=r&&(r.AIO_V4||r.V4Runtime); const s=x&&typeof x.status==='function'?x.status():null; if(s&&(s.running===true||s.aktivFreigegeben===true)) alt=true; } catch { alt=true; }",
      "  }",
      "  if (alt) return {sent:false,reason:'ALTERNATIVE_RUNTIME_AKTIV'};",
      "  const bank=c.bank&&typeof c.bank==='object'&&!Array.isArray(c.bank)?c.bank:null;",
      "  if (!bank) return {sent:false,reason:'BANK_NICHT_GEMOUNTET'};",
      "  if (Number(c.gold)!==" + e.characterGold + ") return {sent:false,reason:'CHARACTER_GOLD_DRIFT'};",
      "  if (Number(bank.gold)!==" + e.bankGold + ") return {sent:false,reason:'BANK_GOLD_DRIFT'};",
      "  try {",
      "    const result=await Promise.resolve(root.bank_withdraw(1));",
      "    return {sent:true,result:result==null?null:result};",
      "  } catch(error) {",
      "    return {sent:true,error:String(error&&error.message||error).slice(0,240)};",
      "  }",
      "})()",
    ].join("\n");

    try {
      this.moeglicherSend = true;
      const result = await this.session.evaluate(
        expr,
        this.contextId,
        { userGesture: true },
      );
      if (!result?.sent) {
        this.moeglicherSend = false;
        return Object.freeze({
          art: "NICHT_GESENDET",
          grund: String(result?.reason || "BANK_WITHDRAW_WRITE_PRESTATE_DRIFT"),
        });
      }
      this.gameWrites = 1;
      return Object.freeze({
        art: "SERVER_ERGEBNIS",
        korrelationId: "V5-BANK-DEPOSIT-ONE-GOLD",
        ergebnis: result,
      });
    } catch {
      return Object.freeze({
        art: "UNBEKANNT",
        grund: "DISCONNECT_NACH_MOEGLICHEM_SEND",
        korrelationId: null,
      });
    }
  }
}
