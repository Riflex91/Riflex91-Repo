export interface BankSwapVorAuthorityCurrentFence {
  readonly schemaVersion: 1;
  readonly equipEinmalAuthorityOffen: boolean;
  readonly bankDepositEinmalAuthorityOffen: boolean;
  readonly bankWithdrawEinmalAuthorityOffen: boolean;
  readonly bankSwapEinmalAuthorityOffen: boolean;
  readonly offeneBankDepositTransaktionId: string | null;
  readonly offeneBankWithdrawTransaktionId: string | null;
  readonly offeneBankSwapTransaktionId: string | null;
  readonly aktiveBankLease: boolean;
}

export interface BankSwapCurrentFenceErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}

export function pruefeBankSwapVorAuthorityCurrentFence(
  snapshot: BankSwapVorAuthorityCurrentFence,
): BankSwapCurrentFenceErgebnis {
  if (!snapshot || snapshot.schemaVersion !== 1) {
    throw new Error("BANK_SWAP_CURRENT_FENCE_SCHEMA_UNGUELTIG");
  }
  const gruende: string[] = [];
  if (snapshot.equipEinmalAuthorityOffen) gruende.push("BANK_SWAP_EQUIP_AUTHORITY_OFFEN");
  if (snapshot.bankDepositEinmalAuthorityOffen) gruende.push("BANK_SWAP_DEPOSIT_AUTHORITY_OFFEN");
  if (snapshot.bankWithdrawEinmalAuthorityOffen) gruende.push("BANK_SWAP_WITHDRAW_AUTHORITY_OFFEN");
  if (snapshot.bankSwapEinmalAuthorityOffen) gruende.push("BANK_SWAP_SWAP_AUTHORITY_OFFEN");
  if (snapshot.offeneBankDepositTransaktionId !== null) gruende.push("BANK_SWAP_DEPOSIT_TX_OFFEN");
  if (snapshot.offeneBankWithdrawTransaktionId !== null) gruende.push("BANK_SWAP_WITHDRAW_TX_OFFEN");
  if (snapshot.offeneBankSwapTransaktionId !== null) gruende.push("BANK_SWAP_SWAP_TX_OFFEN");
  if (snapshot.aktiveBankLease) gruende.push("BANK_SWAP_BANK_LEASE_BEREITS_AKTIV");
  return Object.freeze({
    schemaVersion: 1,
    status: gruende.length === 0 ? "BEREIT" : "BLOCKIERT",
    gruende: Object.freeze(gruende),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
  });
}
