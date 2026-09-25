export interface Pr208SeashellFarmMarketEvidence {
  readonly notificationId: number;
  readonly status: "BLOCKIERT" | "BESTANDEN" | "FEHLER";
  readonly blocker: readonly string[];
  readonly eligibleListingCount: number;
  readonly tradeBuyAuthority: boolean;
  readonly farmAuthority: boolean;
  readonly rawWriteCalls: number;
  readonly sameIntentRetry: boolean;
}

export interface Pr208SeashellFarmItemDefinition {
  readonly name: string;
  readonly exchangeQuantity: number;
  readonly baseGold: number;
  readonly questMarker: boolean | string | null;
  readonly cash: boolean;
  readonly event: boolean;
  readonly exclusive: boolean;
  readonly specialProperty: boolean;
}

export interface Pr208SeashellFarmSourceEvidence {
  readonly monster: string;
  readonly dropContainsTarget: boolean;
}

export interface Pr208SeashellFarmPreparationRequest {
  readonly schemaVersion: 1;
  readonly marketDiscovery: Pr208SeashellFarmMarketEvidence;
  readonly item: Pr208SeashellFarmItemDefinition;
  readonly source: Pr208SeashellFarmSourceEvidence;
}

export interface Pr208SeashellFarmPreparationPlan {
  readonly schemaVersion: 1;
  readonly status: "READY_NO_WRITE" | "BLOCKED";
  readonly blocker: readonly string[];
  readonly target: {
    readonly itemName: "seashell";
    readonly exchangeQuantity: 20;
    readonly sourceMonster: "croc";
  } | null;
  readonly movementAuthority: false;
  readonly combatAuthority: false;
  readonly skillAuthority: false;
  readonly lootAuthority: false;
  readonly farmAuthority: false;
  readonly exchangeAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly sameIntentRetry: false;
  readonly anniversaryGiftAllowed: false;
  readonly freshExistingExchangeScannerRequiredAfterAcquisition: true;
  readonly normalRuntimeAllowed: false;
  readonly nextAction:
    | "PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE"
    | "REMAIN_BLOCKED";
}

const EXPECTED_NOTIFICATION_ID = 2673;
const EXPECTED_ITEM = "seashell";
const EXPECTED_EXCHANGE_QUANTITY = 20;
const EXPECTED_BASE_GOLD = 800;
const MAX_EXCHANGE_BASE_GOLD = 50_000;
const EXPECTED_MONSTER = "croc";
const EXPECTED_MARKET_BLOCKER = "PR20_8_ACQUISITION_KEIN_MARKET_KANDIDAT";

function text(value:string,error:string):void{
  if(value.trim().length===0||value.length>192) throw new Error(error);
}

function safeInt(value:number,min:number,max:number,error:string):void{
  if(!Number.isSafeInteger(value)||value<min||value>max) throw new Error(error);
}

function result(blocker:readonly string[]):Pr208SeashellFarmPreparationPlan{
  const ready=blocker.length===0;
  return Object.freeze({
    schemaVersion:1,
    status:ready?"READY_NO_WRITE":"BLOCKED",
    blocker:Object.freeze([...blocker]),
    target:ready?Object.freeze({
      itemName:"seashell",
      exchangeQuantity:20,
      sourceMonster:"croc",
    }):null,
    movementAuthority:false,
    combatAuthority:false,
    skillAuthority:false,
    lootAuthority:false,
    farmAuthority:false,
    exchangeAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    gameplayWrites:0,
    publicFunctionCalls:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    anniversaryGiftAllowed:false,
    freshExistingExchangeScannerRequiredAfterAcquisition:true,
    normalRuntimeAllowed:false,
    nextAction:ready
      ?"PREPARE_SEASHELL_FARM_SHADOW_NO_WRITE"
      :"REMAIN_BLOCKED",
  });
}

export function planePr208SeashellFarmPreparation(
  request:Pr208SeashellFarmPreparationRequest,
):Pr208SeashellFarmPreparationPlan{
  if(request.schemaVersion!==1) throw new Error("PR20_8_SEASHELL_FARM_SCHEMA_UNGUELTIG");

  safeInt(
    request.marketDiscovery.notificationId,
    1,
    Number.MAX_SAFE_INTEGER,
    "PR20_8_SEASHELL_FARM_NOTIFICATION_UNGUELTIG",
  );
  safeInt(
    request.marketDiscovery.eligibleListingCount,
    0,
    1_000_000,
    "PR20_8_SEASHELL_FARM_LISTING_COUNT_UNGUELTIG",
  );
  safeInt(
    request.marketDiscovery.rawWriteCalls,
    0,
    1_000_000,
    "PR20_8_SEASHELL_FARM_RAW_WRITES_UNGUELTIG",
  );
  text(request.item.name,"PR20_8_SEASHELL_FARM_ITEM_UNGUELTIG");
  safeInt(
    request.item.exchangeQuantity,
    1,
    Number.MAX_SAFE_INTEGER,
    "PR20_8_SEASHELL_FARM_EXCHANGE_QUANTITY_UNGUELTIG",
  );
  if(!Number.isFinite(request.item.baseGold)||request.item.baseGold<0){
    throw new Error("PR20_8_SEASHELL_FARM_BASE_GOLD_UNGUELTIG");
  }
  text(request.source.monster,"PR20_8_SEASHELL_FARM_MONSTER_UNGUELTIG");

  const blocker:string[]=[];
  const market=request.marketDiscovery;
  if(market.notificationId!==EXPECTED_NOTIFICATION_ID){
    blocker.push("PR20_8_SEASHELL_FARM_MARKET_EVIDENCE_DRIFT");
  }
  if(market.status!=="BLOCKIERT"
      ||!market.blocker.includes(EXPECTED_MARKET_BLOCKER)
      ||market.eligibleListingCount!==0){
    blocker.push("PR20_8_SEASHELL_FARM_MARKET_OUTCOME_UNGUELTIG");
  }
  if(market.tradeBuyAuthority
      ||market.farmAuthority
      ||market.rawWriteCalls!==0
      ||market.sameIntentRetry){
    blocker.push("PR20_8_SEASHELL_FARM_MARKET_SAFETY_DRIFT");
  }

  const item=request.item;
  if(item.name!==EXPECTED_ITEM
      ||item.exchangeQuantity!==EXPECTED_EXCHANGE_QUANTITY
      ||item.baseGold!==EXPECTED_BASE_GOLD
      ||item.baseGold>MAX_EXCHANGE_BASE_GOLD){
    blocker.push("PR20_8_SEASHELL_FARM_TARGET_DEFINITION_DRIFT");
  }
  // Scanner v1.0.6 blocks only the boolean literal true. The live item
  // definition uses quest:"seashell", which intentionally remains compatible.
  if(item.questMarker===true
      ||item.cash
      ||item.event
      ||item.exclusive
      ||item.specialProperty){
    blocker.push("PR20_8_SEASHELL_FARM_TARGET_SCANNER_UNSAFE");
  }

  if(request.source.monster!==EXPECTED_MONSTER
      ||!request.source.dropContainsTarget){
    blocker.push("PR20_8_SEASHELL_FARM_SOURCE_EVIDENCE_FEHLT");
  }

  return result(blocker);
}
