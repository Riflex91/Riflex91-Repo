import {
  beobachteBankDepositRohReadOnly,
  validiereBankDepositShadowMountBeobachtung,
} from "./bank-deposit-produktions-browser.mjs";

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

function pruefeBindung(bindung) {
  if (!bindung || typeof bindung !== "object") {
    throw new Error("BANK_DEPOSIT_WRITE_BINDUNG_FEHLT");
  }
  for (const [wert, max, fehler] of [
    [bindung.accountId, 192, "BANK_DEPOSIT_WRITE_ACCOUNT_UNGUELTIG"],
    [bindung.charakterName, 192, "BANK_DEPOSIT_WRITE_CHARACTER_UNGUELTIG"],
    [bindung.sessionId, 192, "BANK_DEPOSIT_WRITE_SESSION_UNGUELTIG"],
    [bindung.serverRegion, 32, "BANK_DEPOSIT_WRITE_REGION_UNGUELTIG"],
    [bindung.serverKennung, 32, "BANK_DEPOSIT_WRITE_SERVER_UNGUELTIG"],
    [bindung.fingerprint, 192, "BANK_DEPOSIT_WRITE_FINGERPRINT_UNGUELTIG"],
  ]) {
    text(wert, max, fehler);
  }
  if (!Number.isSafeInteger(bindung.characterGold)
      || bindung.characterGold < 1
      || !Number.isSafeInteger(bindung.bankGold)
      || bindung.bankGold < 0
      || bindung.bankGemountet !== true) {
    throw new Error("BANK_DEPOSIT_WRITE_GOLD_ODER_MOUNT_UNGUELTIG");
  }
  return bindung;
}

export function erstelleBankDepositEinGoldVorherBindung(
  mountBeobachtung,
  leaseEpoche,
) {
  const mount = pruefeBindung(mountBeobachtung);
  if (!Number.isSafeInteger(leaseEpoche) || leaseEpoche < 1) {
    throw new Error("BANK_DEPOSIT_WRITE_LEASE_EPOCHE_UNGUELTIG");
  }
  if (!Number.isSafeInteger(mount.beobachtetAmMs)
      || mount.beobachtetAmMs < 1) {
    throw new Error("BANK_DEPOSIT_WRITE_MOUNT_ZEIT_UNGUELTIG");
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

export function erstelleProduktivenBankDepositBeobachter(
  session,
  contextId,
  erwarteteBindung,
) {
  pruefeBindung(erwarteteBindung);
  return Object.freeze({
    async beobachte(leaseEpoche, mountEpoche) {
      if (!Number.isSafeInteger(leaseEpoche) || leaseEpoche < 1
          || !Number.isSafeInteger(mountEpoche) || mountEpoche < 1) {
        throw new Error("BANK_DEPOSIT_WRITE_BEOBACHTER_EPOCHE_UNGUELTIG");
      }
      const roh = await beobachteBankDepositRohReadOnly(
        session,
        contextId,
      );
      const mount = validiereBankDepositShadowMountBeobachtung(
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

export class ProduktionsCdpBankDepositEinGoldAdapter {
  constructor(session, contextId, erwarteteBindung) {
    if (!session || typeof session.evaluate !== "function"
        || !Number.isInteger(contextId)) {
      throw new Error("BANK_DEPOSIT_WRITE_CDP_KONTEXT_UNGUELTIG");
    }
    pruefeBindung(erwarteteBindung);
    this.adapterId = "v5-production-cdp-bank-deposit-one-gold-once";
    this.actionContractId = ACTION;
    this.recoveryContractId = RECOVERY;
    this.verifierId = VERIFIER;
    this.session = session;
    this.contextId = contextId;
    this.erwarteteBindung = Object.freeze({ ...erwarteteBindung });
    this.adapterAufrufe = 0;
    this.gameWrites = 0;
    this.moeglicherSend = false;
  }

  async sende(_freigabe, anfrage) {
    if (this.adapterAufrufe !== 0) {
      throw new Error("BANK_DEPOSIT_WRITE_MEHR_ALS_EIN_ADAPTER_AUFRUF");
    }
    this.adapterAufrufe += 1;

    const e = this.erwarteteBindung;
    if (!anfrage
        || anfrage.betrag !== 1
        || anfrage.accountId !== e.accountId
        || anfrage.characterId !== e.charakterName
        || anfrage.sessionId !== e.sessionId
        || anfrage.serverRegion !== e.serverRegion
        || anfrage.serverIdentifier !== e.serverKennung
        || anfrage.erwartetesCharacterGold !== e.characterGold
        || anfrage.erwartetesBankGold !== e.bankGold
        || anfrage.erwarteterFingerprint !== e.fingerprint) {
      return Object.freeze({
        art: "NICHT_GESENDET",
        grund: "BANK_DEPOSIT_WRITE_ADAPTER_ANFRAGE_DRIFT",
      });
    }

    const expr = [
      "(async () => {",
      "  const roots=[globalThis];",
      "  try { if (globalThis.parent && globalThis.parent!==globalThis) roots.push(globalThis.parent); } catch {}",
      "  let root=null;",
      "  for (const r of roots) { try { if (r&&r.character&&typeof r.bank_deposit==='function') { root=r; break; } } catch {} }",
      "  if (!root) return {sent:false,reason:'CONTEXT_FEHLT'};",
      "  const c=root.character;",
      "  let accountId='';",
      "  for (const r of roots) { try { accountId=String(r?.user_id||r?.character?.owner||''); if(accountId) break; } catch {} }",
      "  const region=[root?.server_region,root?.server?.region].map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
      "  const sid=[root?.server_identifier,root?.server?.id].map(x=>typeof x==='string'?x.trim():'').find(Boolean)||'';",
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
      "    const result=await Promise.resolve(root.bank_deposit(1));",
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
          grund: String(result?.reason || "BANK_DEPOSIT_WRITE_PRESTATE_DRIFT"),
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
