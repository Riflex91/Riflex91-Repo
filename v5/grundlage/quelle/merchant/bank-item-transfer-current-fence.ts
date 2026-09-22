export interface BankItemTransferVorAuthorityCurrentFence {
  readonly schemaVersion: 1;
  readonly equipEinmalAuthorityOffen: boolean;
  readonly bankDepositEinmalAuthorityOffen: boolean;
  readonly bankWithdrawEinmalAuthorityOffen: boolean;
  readonly bankSwapEinmalAuthorityOffen: boolean;
  readonly bankRetrieveEinmalAuthorityOffen: boolean;
  readonly bankStoreEinmalAuthorityOffen: boolean;
  readonly offeneBankDepositTransaktionId: string | null;
  readonly offeneBankWithdrawTransaktionId: string | null;
  readonly offeneBankSwapTransaktionId: string | null;
  readonly offeneBankRetrieveTransaktionId: string | null;
  readonly offeneBankStoreTransaktionId: string | null;
  readonly aktiveBankLease: boolean;
}
export interface BankItemTransferCurrentFenceErgebnis {
  readonly schemaVersion: 1;
  readonly status: "BEREIT" | "BLOCKIERT";
  readonly gruende: readonly string[];
  readonly gameplayAutoritaet: false;
  readonly rawWriteAutoritaet: false;
  readonly actionAuthority: false;
}
export function pruefeBankItemTransferVorAuthorityCurrentFence(
  snapshot: BankItemTransferVorAuthorityCurrentFence,
): BankItemTransferCurrentFenceErgebnis {
  if (!snapshot || snapshot.schemaVersion !== 1) throw new Error("BANK_ITEM_TRANSFER_CURRENT_FENCE_SCHEMA_UNGUELTIG");
  const g: string[] = [];
  if (snapshot.equipEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_EQUIP_AUTHORITY_OFFEN");
  if (snapshot.bankDepositEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_DEPOSIT_AUTHORITY_OFFEN");
  if (snapshot.bankWithdrawEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_WITHDRAW_AUTHORITY_OFFEN");
  if (snapshot.bankSwapEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_SWAP_AUTHORITY_OFFEN");
  if (snapshot.bankRetrieveEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_RETRIEVE_AUTHORITY_OFFEN");
  if (snapshot.bankStoreEinmalAuthorityOffen) g.push("BANK_ITEM_TRANSFER_STORE_AUTHORITY_OFFEN");
  if (snapshot.offeneBankDepositTransaktionId !== null) g.push("BANK_ITEM_TRANSFER_DEPOSIT_TX_OFFEN");
  if (snapshot.offeneBankWithdrawTransaktionId !== null) g.push("BANK_ITEM_TRANSFER_WITHDRAW_TX_OFFEN");
  if (snapshot.offeneBankSwapTransaktionId !== null) g.push("BANK_ITEM_TRANSFER_SWAP_TX_OFFEN");
  if (snapshot.offeneBankRetrieveTransaktionId !== null) g.push("BANK_ITEM_TRANSFER_RETRIEVE_TX_OFFEN");
  if (snapshot.offeneBankStoreTransaktionId !== null) g.push("BANK_ITEM_TRANSFER_STORE_TX_OFFEN");
  if (snapshot.aktiveBankLease) g.push("BANK_ITEM_TRANSFER_BANK_LEASE_AKTIV");
  return Object.freeze({
    schemaVersion: 1,
    status: g.length === 0 ? "BEREIT" : "BLOCKIERT",
    gruende: Object.freeze(g),
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    actionAuthority: false,
  });
}
