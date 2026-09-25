export interface Pr208ExchangeAcquisitionItem {
  readonly name: string;
  readonly quantity: number;
  readonly baseGold: number;
  readonly exchangeQuantity: number | null;
  readonly locked: boolean;
  readonly blocked: boolean;
  readonly specialProperty: boolean;
  readonly gift: boolean;
  readonly cash: boolean;
  readonly event: boolean;
  readonly quest: boolean;
  readonly exclusive: boolean;
}

export interface Pr208ExchangeAcquisitionInventoryRow
  extends Pr208ExchangeAcquisitionItem {
  readonly inventorySlot: number;
}

export interface Pr208ExchangeAcquisitionBankRow
  extends Pr208ExchangeAcquisitionItem {
  readonly pack: string;
  readonly bankSlot: number;
}

export interface Pr208ExchangeAcquisitionRequest {
  readonly schemaVersion: 1;
  readonly inventoryCapacity: number;
  readonly inventory: readonly (Pr208ExchangeAcquisitionInventoryRow | null)[];
  readonly bankSnapshotAvailable: boolean;
  readonly bank: readonly Pr208ExchangeAcquisitionBankRow[];
}

export interface Pr208ExchangeAcquisitionCandidate {
  readonly source: "INVENTORY" | "BANK";
  readonly name: string;
  readonly quantity: number;
  readonly exchangeQuantity: number;
  readonly baseGold: number;
  readonly inventorySlot: number | null;
  readonly pack: string | null;
  readonly bankSlot: number | null;
}

export interface Pr208ExchangeAcquisitionPlan {
  readonly schemaVersion: 1;
  readonly status:
    | "INVENTORY_CANDIDATE_PRESENT"
    | "BANK_CANDIDATE_FOUND"
    | "BANK_SNAPSHOT_REQUIRED"
    | "NO_CANDIDATE_INVENTORY_OR_BANK";
  readonly selected: Pr208ExchangeAcquisitionCandidate | null;
  readonly rejectedCount: number;
  readonly emptyInventorySlot: number | null;
  readonly bankRetrieveRequired: boolean;
  readonly bankRetrieveAllowedByThisPlan: false;
  readonly buyAllowedByThisPlan: false;
  readonly farmAllowedByThisPlan: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly sameIntentRetry: false;
  readonly nextAction:
    | "RUN_EXISTING_EXCHANGE_SCANNER"
    | "PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT"
    | "ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY"
    | "PREPARE_BUY_OR_FARM_ACQUISITION_STAGE";
}

const MAX_EXCHANGE_BASE_GOLD = 50_000;
const SPECIAL_EXCHANGE_NAMES = Object.freeze(new Set(["sixcake"]));

function safeInt(value:number,min:number,max:number,error:string):void{
  if(!Number.isSafeInteger(value)||value<min||value>max) throw new Error(error);
}
function text(value:string,error:string):void{
  if(value.trim().length===0||value.length>128) throw new Error(error);
}
function validateItem(x:Pr208ExchangeAcquisitionItem):void{
  text(x.name,"PR20_8_ACQUISITION_ITEM_NAME_UNGUELTIG");
  safeInt(x.quantity,1,Number.MAX_SAFE_INTEGER,"PR20_8_ACQUISITION_QUANTITY_UNGUELTIG");
  if(!Number.isFinite(x.baseGold)||x.baseGold<0) throw new Error("PR20_8_ACQUISITION_BASE_GOLD_UNGUELTIG");
  if(x.exchangeQuantity!==null) safeInt(x.exchangeQuantity,1,Number.MAX_SAFE_INTEGER,"PR20_8_ACQUISITION_EXCHANGE_QUANTITY_UNGUELTIG");
}
function accepted(x:Pr208ExchangeAcquisitionItem):boolean{
  return x.exchangeQuantity!==null
    && x.quantity>=x.exchangeQuantity
    && x.baseGold<=MAX_EXCHANGE_BASE_GOLD
    && !SPECIAL_EXCHANGE_NAMES.has(x.name)
    && !x.locked
    && !x.blocked
    && !x.specialProperty
    && !x.gift
    && !x.cash
    && !x.event
    && !x.quest
    && !x.exclusive;
}
function sortCandidates(a:Pr208ExchangeAcquisitionCandidate,b:Pr208ExchangeAcquisitionCandidate):number{
  return a.baseGold-b.baseGold
    || a.exchangeQuantity-b.exchangeQuantity
    || a.name.localeCompare(b.name)
    || (a.pack??"").localeCompare(b.pack??"")
    || (a.bankSlot??a.inventorySlot??0)-(b.bankSlot??b.inventorySlot??0);
}
function candidateFromInventory(x:Pr208ExchangeAcquisitionInventoryRow):Pr208ExchangeAcquisitionCandidate{
  if(x.exchangeQuantity===null) throw new Error("PR20_8_ACQUISITION_INTERNAL_EXCHANGE_Q_FEHLT");
  return Object.freeze({
    source:"INVENTORY",
    name:x.name,
    quantity:x.quantity,
    exchangeQuantity:x.exchangeQuantity,
    baseGold:x.baseGold,
    inventorySlot:x.inventorySlot,
    pack:null,
    bankSlot:null,
  });
}
function candidateFromBank(x:Pr208ExchangeAcquisitionBankRow):Pr208ExchangeAcquisitionCandidate{
  if(x.exchangeQuantity===null) throw new Error("PR20_8_ACQUISITION_INTERNAL_EXCHANGE_Q_FEHLT");
  return Object.freeze({
    source:"BANK",
    name:x.name,
    quantity:x.quantity,
    exchangeQuantity:x.exchangeQuantity,
    baseGold:x.baseGold,
    inventorySlot:null,
    pack:x.pack,
    bankSlot:x.bankSlot,
  });
}

export function planePr208ExchangeCandidateAcquisition(
  request:Pr208ExchangeAcquisitionRequest,
):Pr208ExchangeAcquisitionPlan{
  if(request.schemaVersion!==1) throw new Error("PR20_8_ACQUISITION_SCHEMA_UNGUELTIG");
  safeInt(request.inventoryCapacity,1,64,"PR20_8_ACQUISITION_INVENTORY_CAPACITY_UNGUELTIG");
  if(!Array.isArray(request.inventory)||request.inventory.length>request.inventoryCapacity){
    throw new Error("PR20_8_ACQUISITION_INVENTORY_UNGUELTIG");
  }
  if(!Array.isArray(request.bank)||request.bank.length>4096){
    throw new Error("PR20_8_ACQUISITION_BANK_UNGUELTIG");
  }

  let rejectedCount=0;
  let emptyInventorySlot:number|null=null;
  const inventoryCandidates:Pr208ExchangeAcquisitionCandidate[]=[];
  for(let i=0;i<request.inventoryCapacity;i+=1){
    const row=request.inventory[i]??null;
    if(row===null){
      if(emptyInventorySlot===null) emptyInventorySlot=i;
      continue;
    }
    validateItem(row);
    safeInt(row.inventorySlot,0,request.inventoryCapacity-1,"PR20_8_ACQUISITION_INVENTORY_SLOT_UNGUELTIG");
    if(row.inventorySlot!==i) throw new Error("PR20_8_ACQUISITION_INVENTORY_SLOT_DRIFT");
    if(accepted(row)) inventoryCandidates.push(candidateFromInventory(row));
    else rejectedCount+=1;
  }
  inventoryCandidates.sort(sortCandidates);
  const inventorySelected=inventoryCandidates[0]??null;
  if(inventorySelected!==null){
    return Object.freeze({
      schemaVersion:1,
      status:"INVENTORY_CANDIDATE_PRESENT",
      selected:inventorySelected,
      rejectedCount,
      emptyInventorySlot,
      bankRetrieveRequired:false,
      bankRetrieveAllowedByThisPlan:false,
      buyAllowedByThisPlan:false,
      farmAllowedByThisPlan:false,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      nextAction:"RUN_EXISTING_EXCHANGE_SCANNER",
    });
  }

  if(!request.bankSnapshotAvailable){
    return Object.freeze({
      schemaVersion:1,
      status:"BANK_SNAPSHOT_REQUIRED",
      selected:null,
      rejectedCount,
      emptyInventorySlot,
      bankRetrieveRequired:false,
      bankRetrieveAllowedByThisPlan:false,
      buyAllowedByThisPlan:false,
      farmAllowedByThisPlan:false,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      nextAction:"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY",
    });
  }

  const bankCandidates:Pr208ExchangeAcquisitionCandidate[]=[];
  for(const row of request.bank){
    validateItem(row);
    if(!/^items[0-9]+$/.test(row.pack)) throw new Error("PR20_8_ACQUISITION_BANK_PACK_UNGUELTIG");
    safeInt(row.bankSlot,0,41,"PR20_8_ACQUISITION_BANK_SLOT_UNGUELTIG");
    if(accepted(row)) bankCandidates.push(candidateFromBank(row));
    else rejectedCount+=1;
  }
  bankCandidates.sort(sortCandidates);
  const bankSelected=bankCandidates[0]??null;
  if(bankSelected!==null && emptyInventorySlot!==null){
    return Object.freeze({
      schemaVersion:1,
      status:"BANK_CANDIDATE_FOUND",
      selected:bankSelected,
      rejectedCount,
      emptyInventorySlot,
      bankRetrieveRequired:true,
      bankRetrieveAllowedByThisPlan:false,
      buyAllowedByThisPlan:false,
      farmAllowedByThisPlan:false,
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      nextAction:"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT",
    });
  }

  return Object.freeze({
    schemaVersion:1,
    status:"NO_CANDIDATE_INVENTORY_OR_BANK",
    selected:null,
    rejectedCount,
    emptyInventorySlot,
    bankRetrieveRequired:false,
    bankRetrieveAllowedByThisPlan:false,
    buyAllowedByThisPlan:false,
    farmAllowedByThisPlan:false,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    nextAction:"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE",
  });
}
