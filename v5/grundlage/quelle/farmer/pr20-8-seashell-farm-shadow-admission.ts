export interface Pr208SeashellFarmShadowRequest {
  readonly schemaVersion: 1;
  readonly characterId: string;
  readonly ctype: string;
  readonly sessionFresh: boolean;
  readonly serverMatchesEvidence: boolean;
  readonly rosterFresh: boolean;
  readonly lifecycleActive: boolean;
  readonly restartReconciled: boolean;
  readonly safetyPreempted: boolean;
  readonly movementOwnershipFresh: boolean;
  readonly arrivalEvidenceFresh: boolean;
  readonly targetOwnershipFresh: boolean;
  readonly targetEvidenceFresh: boolean;
  readonly equipmentEvidenceFresh: boolean;
  readonly conditionEvidenceFresh: boolean;
  readonly lootEvidenceFresh: boolean;
  readonly inventoryCapacityAvailable: boolean;
  readonly targetMonster: string;
  readonly currentSeashellQuantity: number;
  readonly requiredSeashellQuantity: number;
  readonly hp: number;
  readonly maxHp: number;
}

export interface Pr208SeashellFarmShadowAdmission {
  readonly schemaVersion: 1;
  readonly status:
    | "READY_NO_WRITE"
    | "ALREADY_SATISFIED_NO_WRITE"
    | "BLOCKED";
  readonly blocker: readonly string[];
  readonly characterId: string;
  readonly target: {
    readonly itemName: "seashell";
    readonly monster: "croc";
    readonly requiredQuantity: 20;
    readonly currentQuantity: number;
    readonly remainingQuantity: number;
  };
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
  readonly normalRuntimeAllowed: false;
  readonly freshExistingExchangeScannerRequiredAfterAcquisition: true;
  readonly nextAction:
    | "PREPARE_SEASHELL_FARM_SHADOW_RUNNER_READ_ONLY"
    | "RUN_EXISTING_EXCHANGE_SCANNER"
    | "REMAIN_BLOCKED";
}

const EXPECTED_TARGET = "croc";
const REQUIRED_QUANTITY = 20;
const MIN_HP_RATIO = 0.8;

function safeText(value:string,error:string):void{
  if(value.trim().length===0||value.length>192) throw new Error(error);
}

function safeInt(value:number,min:number,max:number,error:string):void{
  if(!Number.isSafeInteger(value)||value<min||value>max) throw new Error(error);
}

export function pruefePr208SeashellFarmShadowAdmission(
  request:Pr208SeashellFarmShadowRequest,
):Pr208SeashellFarmShadowAdmission{
  if(request.schemaVersion!==1) throw new Error("PR20_8_SEASHELL_SHADOW_SCHEMA_UNGUELTIG");
  safeText(request.characterId,"PR20_8_SEASHELL_SHADOW_CHARACTER_UNGUELTIG");
  safeText(request.ctype,"PR20_8_SEASHELL_SHADOW_CTYPE_UNGUELTIG");
  safeText(request.targetMonster,"PR20_8_SEASHELL_SHADOW_TARGET_UNGUELTIG");
  safeInt(
    request.currentSeashellQuantity,
    0,
    Number.MAX_SAFE_INTEGER,
    "PR20_8_SEASHELL_SHADOW_CURRENT_Q_UNGUELTIG",
  );
  safeInt(
    request.requiredSeashellQuantity,
    1,
    Number.MAX_SAFE_INTEGER,
    "PR20_8_SEASHELL_SHADOW_REQUIRED_Q_UNGUELTIG",
  );
  if(!Number.isFinite(request.hp)
      ||!Number.isFinite(request.maxHp)
      ||request.maxHp<=0
      ||request.hp<0
      ||request.hp>request.maxHp){
    throw new Error("PR20_8_SEASHELL_SHADOW_HP_UNGUELTIG");
  }

  const blocker:string[]=[];
  if(!request.sessionFresh) blocker.push("PR20_8_SEASHELL_SHADOW_SESSION_STALE");
  if(!request.serverMatchesEvidence) blocker.push("PR20_8_SEASHELL_SHADOW_SERVER_DRIFT");
  if(!request.rosterFresh) blocker.push("PR20_8_SEASHELL_SHADOW_ROSTER_STALE");
  if(!request.lifecycleActive) blocker.push("PR20_8_SEASHELL_SHADOW_LIFECYCLE_NICHT_AKTIV");
  if(!request.restartReconciled) blocker.push("PR20_8_SEASHELL_SHADOW_RESTART_NICHT_RECONCILED");
  if(request.safetyPreempted) blocker.push("PR20_8_SEASHELL_SHADOW_SAFETY_PREEMPTED");
  if(request.ctype==="merchant") blocker.push("PR20_8_SEASHELL_SHADOW_MERCHANT_KEIN_FARM_WORKER");

  if(request.targetMonster!==EXPECTED_TARGET
      ||request.requiredSeashellQuantity!==REQUIRED_QUANTITY){
    blocker.push("PR20_8_SEASHELL_SHADOW_TARGET_DRIFT");
  }

  const alreadySatisfied=request.currentSeashellQuantity>=REQUIRED_QUANTITY;
  if(!alreadySatisfied){
    if(!request.inventoryCapacityAvailable){
      blocker.push("PR20_8_SEASHELL_SHADOW_INVENTORY_CAPACITY_FEHLT");
    }
    if(!request.movementOwnershipFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_MOVEMENT_OWNER_STALE");
    }
    if(!request.arrivalEvidenceFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_ARRIVAL_EVIDENCE_FEHLT");
    }
    if(!request.targetOwnershipFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_TARGET_OWNER_STALE");
    }
    if(!request.targetEvidenceFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_TARGET_EVIDENCE_STALE");
    }
    if(!request.equipmentEvidenceFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_EQUIPMENT_EVIDENCE_STALE");
    }
    if(!request.conditionEvidenceFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_CONDITION_EVIDENCE_STALE");
    }
    if(!request.lootEvidenceFresh){
      blocker.push("PR20_8_SEASHELL_SHADOW_LOOT_EVIDENCE_STALE");
    }
    if(request.hp/request.maxHp<MIN_HP_RATIO){
      blocker.push("PR20_8_SEASHELL_SHADOW_HP_HARD_CAP");
    }
  }

  const status=blocker.length>0
    ?"BLOCKED"
    :alreadySatisfied
      ?"ALREADY_SATISFIED_NO_WRITE"
      :"READY_NO_WRITE";
  const remaining=Math.max(0,REQUIRED_QUANTITY-request.currentSeashellQuantity);

  return Object.freeze({
    schemaVersion:1,
    status,
    blocker:Object.freeze(blocker),
    characterId:request.characterId,
    target:Object.freeze({
      itemName:"seashell",
      monster:"croc",
      requiredQuantity:REQUIRED_QUANTITY,
      currentQuantity:request.currentSeashellQuantity,
      remainingQuantity:remaining,
    }),
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
    normalRuntimeAllowed:false,
    freshExistingExchangeScannerRequiredAfterAcquisition:true,
    nextAction:status==="READY_NO_WRITE"
      ?"PREPARE_SEASHELL_FARM_SHADOW_RUNNER_READ_ONLY"
      :status==="ALREADY_SATISFIED_NO_WRITE"
        ?"RUN_EXISTING_EXCHANGE_SCANNER"
        :"REMAIN_BLOCKED",
  });
}
