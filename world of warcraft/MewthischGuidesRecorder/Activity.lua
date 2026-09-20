local addonName, MGR = ...

local frame = CreateFrame("Frame")
local lastMoney
local lastXP
local lastTargetSignature

local function register(event)
    pcall(frame.RegisterEvent, frame, event)
end

local function call(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h, i = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h, i
end

local function currentActivityState()
    return {
        position = MGR:GetPosition(),
        facing = GetPlayerFacing and GetPlayerFacing() or nil,
        speed = GetUnitSpeed and GetUnitSpeed("player") or nil,
        inCombat = UnitAffectingCombat and UnitAffectingCombat("player") and true or false,
        dead = UnitIsDeadOrGhost and UnitIsDeadOrGhost("player") and true or false,
        mounted = IsMounted and IsMounted() and true or false,
        swimming = IsSwimming and IsSwimming() and true or false,
        flying = IsFlying and IsFlying() and true or false,
        indoors = IsIndoors and IsIndoors() and true or false,
        resting = IsResting and IsResting() and true or false,
    }
end

local function itemIDFromLink(link)
    if not link then return nil end
    return tonumber(tostring(link):match("item:(%d+)"))
end

local function lootSnapshot()
    local result = {}
    local count = tonumber(call(GetNumLootItems)) or 0

    for slot = 1, count do
        local texture, itemName, quantity, currencyID, quality, locked, isQuestItem, questID, isActive =
            call(GetLootSlotInfo, slot)
        local link = call(GetLootSlotLink, slot)

        result[#result + 1] = {
            slot = slot,
            itemID = itemIDFromLink(link),
            itemLink = link,
            itemName = itemName,
            quantity = quantity,
            quality = quality,
            currencyID = currencyID,
            locked = locked,
            isQuestItem = isQuestItem,
            questID = questID,
            isActive = isActive,
        }
    end

    return result
end

local function merchantSnapshot()
    local result = {}
    local count = tonumber(call(GetMerchantNumItems)) or 0

    for index = 1, count do
        local name, texture, price, quantity, numAvailable, isPurchasable, isUsable, extendedCost =
            call(GetMerchantItemInfo, index)
        local link = call(GetMerchantItemLink, index)

        result[#result + 1] = {
            index = index,
            itemID = itemIDFromLink(link),
            itemLink = link,
            name = name,
            price = price,
            quantity = quantity,
            numAvailable = numAvailable,
            isPurchasable = isPurchasable,
            isUsable = isUsable,
            extendedCost = extendedCost,
        }
    end

    return result
end

local function trainerSnapshot()
    local result = {}
    local count = tonumber(call(GetNumTrainerServices)) or 0

    for index = 1, count do
        local name, rank, category, expanded, serviceType, numAbilityReq, spellID =
            call(GetTrainerServiceInfo, index)

        result[#result + 1] = {
            index = index,
            name = name,
            rank = rank,
            category = category,
            expanded = expanded,
            serviceType = serviceType,
            numAbilityReq = numAbilityReq,
            spellID = spellID,
        }
    end

    return result
end

local function taxiSnapshot()
    local result = {}
    local count = tonumber(call(NumTaxiNodes)) or 0

    for index = 1, count do
        local x, y = call(TaxiNodePosition, index)
        result[#result + 1] = {
            index = index,
            name = call(TaxiNodeName, index),
            type = call(TaxiNodeGetType, index),
            cost = call(TaxiNodeCost, index),
            x = x,
            y = y,
        }
    end

    return result
end

local function spellName(spellID)
    if C_Spell and C_Spell.GetSpellName then
        local value = call(C_Spell.GetSpellName, spellID)
        if value then return value end
    end

    local name = call(GetSpellInfo, spellID)
    return name
end

local function targetSnapshot()
    local target = MGR:GetUnitRef("target")
    if not target then return nil end

    if target.isPlayer then
        return {
            unit = "target",
            isPlayer = true,
            level = target.level,
        }
    end

    return target
end

local function targetSignature(target)
    if not target then return "none" end
    return table.concat({
        tostring(target.isPlayer),
        tostring(target.guidType),
        tostring(target.id),
        tostring(target.level),
    }, ":")
end

local events = {
    "PLAYER_TARGET_CHANGED",
    "PLAYER_REGEN_DISABLED",
    "PLAYER_REGEN_ENABLED",
    "UNIT_SPELLCAST_SUCCEEDED",
    "LOOT_READY",
    "LOOT_OPENED",
    "LOOT_CLOSED",
    "MERCHANT_SHOW",
    "MERCHANT_CLOSED",
    "TRAINER_SHOW",
    "TRAINER_CLOSED",
    "TAXIMAP_OPENED",
    "BANKFRAME_OPENED",
    "BANKFRAME_CLOSED",
    "TRADE_SKILL_SHOW",
    "TRADE_SKILL_CLOSE",
    "PLAYER_MONEY",
    "PLAYER_XP_UPDATE",
    "UPDATE_FACTION",
    "SKILL_LINES_CHANGED",
    "PLAYER_ALIVE",
    "PLAYER_UNGHOST",
    "PLAYER_STARTED_MOVING",
    "PLAYER_STOPPED_MOVING",
    "PLAYER_CONTROL_LOST",
    "PLAYER_CONTROL_GAINED",
    "PLAYER_MOUNT_DISPLAY_CHANGED",
    "ZONE_CHANGED",
    "ZONE_CHANGED_INDOORS",
    "ZONE_CHANGED_NEW_AREA",
    "PLAYER_INTERACTION_MANAGER_FRAME_SHOW",
    "PLAYER_INTERACTION_MANAGER_FRAME_HIDE",
}

for _, event in ipairs(events) do
    register(event)
end

frame:SetScript("OnEvent", function(_, event, ...)
    if event == "PLAYER_TARGET_CHANGED" then
        local target = targetSnapshot()
        local signature = targetSignature(target)

        if signature ~= lastTargetSignature then
            lastTargetSignature = signature
            MGR:Record("player.target_changed", target and target.id or nil, {
                target = target,
                activity = currentActivityState(),
            }, "gameplay-event")
        end
        return
    end

    if event == "PLAYER_REGEN_DISABLED" or event == "PLAYER_REGEN_ENABLED" then
        MGR:Record("player.combat_state", nil, {
            inCombat = event == "PLAYER_REGEN_DISABLED",
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    if event == "UNIT_SPELLCAST_SUCCEEDED" then
        local unit, castGUID, spellID = ...
        if unit ~= "player" then return end

        MGR:Record("player.spell_succeeded", tonumber(spellID), {
            castGUID = castGUID,
            spellID = tonumber(spellID),
            spellName = spellName(tonumber(spellID)),
            target = targetSnapshot(),
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    if event == "LOOT_READY" or event == "LOOT_OPENED" then
        MGR:Record("loot.open", nil, {
            event = event,
            items = lootSnapshot(),
            activity = currentActivityState(),
        }, "gameplay-api")
        return
    end

    if event == "LOOT_CLOSED" then
        MGR:Record("loot.closed", nil, {
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    if event == "MERCHANT_SHOW" then
        MGR:Record("npc.merchant_open", nil, {
            npc = MGR:GetNpc(),
            items = merchantSnapshot(),
            money = GetMoney and GetMoney() or nil,
            activity = currentActivityState(),
        }, "gameplay-api")
        return
    end

    if event == "MERCHANT_CLOSED" then
        MGR:Record("npc.merchant_close", nil, {
            npc = MGR:GetNpc(),
            money = GetMoney and GetMoney() or nil,
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    if event == "TRAINER_SHOW" then
        MGR:Record("npc.trainer_open", nil, {
            npc = MGR:GetNpc(),
            services = trainerSnapshot(),
            activity = currentActivityState(),
        }, "gameplay-api")
        return
    end

    if event == "TRAINER_CLOSED" then
        MGR:Record("npc.trainer_close", nil, {
            npc = MGR:GetNpc(),
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    if event == "TAXIMAP_OPENED" then
        MGR:Record("travel.taxi_map", nil, {
            npc = MGR:GetNpc(),
            nodes = taxiSnapshot(),
            activity = currentActivityState(),
        }, "gameplay-api")
        return
    end

    if event == "PLAYER_MONEY" then
        local money = GetMoney and GetMoney() or nil
        MGR:Record("player.money", nil, {
            before = lastMoney,
            current = money,
            delta = lastMoney and money and (money - lastMoney) or nil,
            activity = currentActivityState(),
        }, "gameplay-event")
        lastMoney = money
        return
    end

    if event == "PLAYER_XP_UPDATE" then
        local xp = UnitXP and UnitXP("player") or nil
        local maxXP = UnitXPMax and UnitXPMax("player") or nil

        MGR:Record("player.xp", nil, {
            before = lastXP,
            current = xp,
            maximum = maxXP,
            delta = lastXP and xp and (xp - lastXP) or nil,
            level = UnitLevel("player"),
            activity = currentActivityState(),
        }, "gameplay-event")

        lastXP = xp
        return
    end

    if event == "PLAYER_INTERACTION_MANAGER_FRAME_SHOW" or
       event == "PLAYER_INTERACTION_MANAGER_FRAME_HIDE" then
        local interactionType = ...

        MGR:Record("player.interaction", tonumber(interactionType), {
            event = event,
            interactionType = interactionType,
            npc = MGR:GetNpc(),
            activity = currentActivityState(),
        }, "gameplay-event")
        return
    end

    MGR:Record("player.activity", event, {
        event = event,
        npc = MGR:GetNpc(),
        activity = currentActivityState(),
    }, "gameplay-event")
end)

local init = CreateFrame("Frame")
register = nil
init:RegisterEvent("PLAYER_LOGIN")
init:SetScript("OnEvent", function()
    lastMoney = GetMoney and GetMoney() or nil
    lastXP = UnitXP and UnitXP("player") or nil
    lastTargetSignature = targetSignature(targetSnapshot())
end)
