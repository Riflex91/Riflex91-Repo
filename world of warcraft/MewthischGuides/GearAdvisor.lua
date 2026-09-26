local addonName, MG = ...

MG.GearAdvisor = MG.GearAdvisor or {}
local Gear = MG.GearAdvisor

local EQUIP_SLOT = {
    INVTYPE_HEAD = 1, INVTYPE_NECK = 2, INVTYPE_SHOULDER = 3,
    INVTYPE_BODY = 4, INVTYPE_CHEST = 5, INVTYPE_ROBE = 5,
    INVTYPE_WAIST = 6, INVTYPE_LEGS = 7, INVTYPE_FEET = 8,
    INVTYPE_WRIST = 9, INVTYPE_HAND = 10, INVTYPE_FINGER = 11,
    INVTYPE_TRINKET = 13, INVTYPE_CLOAK = 15,
    INVTYPE_WEAPON = 16, INVTYPE_2HWEAPON = 16, INVTYPE_WEAPONMAINHAND = 16,
    INVTYPE_SHIELD = 17, INVTYPE_WEAPONOFFHAND = 17, INVTYPE_HOLDABLE = 17,
    INVTYPE_RANGED = 18, INVTYPE_RANGEDRIGHT = 18,
}

local MULTI_SLOT = {
    INVTYPE_FINGER = {11, 12},
    INVTYPE_TRINKET = {13, 14},
}

local WEAPON_LOC = {
    INVTYPE_WEAPON = true, INVTYPE_2HWEAPON = true,
    INVTYPE_WEAPONMAINHAND = true, INVTYPE_WEAPONOFFHAND = true,
    INVTYPE_RANGED = true, INVTYPE_RANGEDRIGHT = true,
}

local function itemBasics(link)
    if not link or not GetItemInfoInstant then return nil end
    local ok, itemID, _, _, equipLoc = pcall(GetItemInfoInstant, link)
    if not ok then return nil end
    return tonumber(itemID), equipLoc
end

local function itemLevel(link)
    if not link then return nil end
    if C_Item and C_Item.GetDetailedItemLevelInfo then
        local ok, value = pcall(C_Item.GetDetailedItemLevelInfo, link)
        if ok and tonumber(value) then return tonumber(value) end
    end
    if GetDetailedItemLevelInfo then
        local ok, value = pcall(GetDetailedItemLevelInfo, link)
        if ok and tonumber(value) then return tonumber(value) end
    end
    if GetItemInfo then
        local ok, _, _, _, level = pcall(GetItemInfo, link)
        if ok and tonumber(level) then return tonumber(level) end
    end
    return nil
end

local function equippable(link, equipLoc)
    if C_Item and C_Item.IsEquippableItem then
        local ok, value = pcall(C_Item.IsEquippableItem, link)
        if ok then return value and true or false end
    end
    if IsEquippableItem then
        local ok, value = pcall(IsEquippableItem, link)
        if ok then return value and true or false end
    end

    -- Forever builds may omit the helper while still exposing a valid
    -- inventory type. In that case the equip location is the capability-safe
    -- fallback; the actual equip call remains outside combat and can still
    -- fail without damaging the item.
    return equipLoc and EQUIP_SLOT[equipLoc] ~= nil or false
end

local function activeProfile()
    local state = MG.BuildState and MG.BuildState:GetState() or {}
    for _, profile in ipairs(MG.Data and MG.Data.gearProfiles or {}) do
        if (not profile.class or profile.class == state.class) and
           (not profile.specializationID or profile.specializationID == state.specializationID) then
            return profile
        end
    end
    return nil
end

local function weightedScore(link, profile)
    if not link or not profile or type(profile.weights) ~= "table" or not GetItemStats then
        return nil
    end

    local ok, stats = pcall(GetItemStats, link)
    if not ok or type(stats) ~= "table" then return nil end

    local total, matched = 0, 0
    for key, weight in pairs(profile.weights) do
        local value = tonumber(stats[key])
        local numericWeight = tonumber(weight)
        if value and numericWeight then
            total = total + value * numericWeight
            matched = matched + 1
        end
    end

    if matched == 0 then return nil end
    return total
end

function Gear:EvaluateItemLink(link)
    local itemID, equipLoc = itemBasics(link)
    local slot = equipLoc and EQUIP_SLOT[equipLoc] or nil
    if not itemID or not slot or not equippable(link, equipLoc) then
        return nil, "not_safely_equippable"
    end

    local level = itemLevel(link)
    if not level then
        if C_Item and C_Item.RequestLoadItemDataByID then
            pcall(C_Item.RequestLoadItemDataByID, itemID)
        end
        return nil, "item_level_unknown"
    end

    local profile = activeProfile()
    local candidateSlots = MULTI_SLOT[equipLoc] or { slot }

    local equippedLink = nil
    local equippedLevel = nil
    local equippedScore = nil
    local targetSlot = slot

    for _, candidateSlot in ipairs(candidateSlots) do
        local currentLink = GetInventoryItemLink and
            GetInventoryItemLink("player", candidateSlot) or nil
        local currentLevel = itemLevel(currentLink) or 0
        local currentScore = currentLink and weightedScore(currentLink, profile) or 0

        if equippedLevel == nil or currentLevel < equippedLevel then
            equippedLevel = currentLevel
            equippedLink = currentLink
            targetSlot = candidateSlot
        end

        if profile and (equippedScore == nil or currentScore < equippedScore) then
            equippedScore = currentScore
            equippedLink = currentLink
            targetSlot = candidateSlot
            equippedLevel = currentLevel
        end
    end

    equippedLevel = equippedLevel or 0
    equippedScore = equippedScore or 0
    local itemLevelDelta = level - equippedLevel

    local candidateScore = weightedScore(link, profile)
    local confidence = "medium"
    local score = itemLevelDelta
    local upgrade = itemLevelDelta > 0
    local scoreModel = "item-level-fallback"

    if profile and candidateScore ~= nil and equippedScore ~= nil then
        score = candidateScore - equippedScore
        upgrade = score > (tonumber(profile.minimumScoreDelta) or 0)
        confidence = "high"
        scoreModel = "data-backed-stat-weights"
    end

    return {
        itemID = itemID,
        link = link,
        equipLoc = equipLoc,
        slot = targetSlot,
        itemLevel = level,
        equippedLink = equippedLink,
        equippedItemLevel = equippedLevel,
        delta = itemLevelDelta,
        score = score,
        scoreModel = scoreModel,
        gearProfileID = profile and profile.id or nil,
        isWeapon = WEAPON_LOC[equipLoc] and true or false,
        confidence = confidence,
        upgrade = upgrade,
    }
end

function Gear:Refresh(reason)
    local inventory = MG.Inventory and MG.Inventory:GetSnapshot() or nil
    if not inventory then return nil end

    local best = nil
    local pendingItemData = false
    local rejected = {}

    for _, item in ipairs(inventory.bags or {}) do
        local result, rejectReason = self:EvaluateItemLink(item.link)
        if result and result.upgrade then
            result.bag = item.bag
            result.bagSlot = item.slot
            result.isBound = item.isBound
            if not best or result.score > best.score then best = result end
        elseif rejectReason then
            rejected[rejectReason] = (rejected[rejectReason] or 0) + 1
            if rejectReason == "item_level_unknown" then
                pendingItemData = true
            end
        end
    end

    if pendingItemData and C_Timer and C_Timer.After and
       not self.itemDataRetryScheduled then
        self.itemDataRetryScheduled = true
        C_Timer.After(0.40, function()
            self.itemDataRetryScheduled = false
            if MG.Sync then MG.Sync:Inventory("gear_item_data_retry") end
        end)
    end

    self.bestUpgrade = best

    local autoEquipped = false
    local autoEquipReason = best and "not_attempted" or "no_upgrade"
    if best then
        autoEquipped, autoEquipReason = self:TryAutoEquip(best)
    end

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.gear = {
            reason = reason,
            recommendedItemID = best and best.itemID or nil,
            delta = best and best.delta or nil,
            score = best and best.score or nil,
            scoreModel = best and best.scoreModel or nil,
            confidence = best and best.confidence or nil,
            gearProfileID = best and best.gearProfileID or nil,
            targetSlot = best and best.slot or nil,
            isBound = best and best.isBound or nil,
            autoEquipped = autoEquipped,
            autoEquipReason = autoEquipReason,
            rejected = rejected,
            pendingItemData = pendingItemData,
        }
    end

    return best
end

function Gear:TryAutoEquip(candidate)
    local settings = MG.db and MG.db.settings or {}
    if not settings.gearAutoEquip or not candidate then return false, "disabled" end
    local safeItemLevelFallback =
        settings.gearAutoEquipItemLevelFallback ~= false and
        candidate.scoreModel == "item-level-fallback" and
        not candidate.isWeapon and
        tonumber(candidate.delta) and tonumber(candidate.delta) > 0

    if settings.gearRequireHighConfidence and candidate.confidence ~= "high" and
       not safeItemLevelFallback then
        return false, "confidence"
    end
    if candidate.isWeapon and not settings.gearAutoEquipWeapons then
        return false, "weapon_protected"
    end
    if settings.gearProtectBoE and candidate.isBound ~= true then
        return false, candidate.isBound == false and
            "boe_protected" or "binding_unknown"
    end
    if InCombatLockdown and InCombatLockdown() then return false, "combat" end
    if CursorHasItem and CursorHasItem() then return false, "cursor_busy" end
    local usedEquipByName = false

    if EquipItemByName then
        local okEquip = pcall(EquipItemByName, candidate.link, candidate.slot)
        if okEquip then
            usedEquipByName = true
        end
    end

    if not usedEquipByName then
        local pickup = C_Container and C_Container.PickupContainerItem or
            PickupContainerItem
        if not pickup or not EquipCursorItem then
            return false, "equip_api_missing"
        end

        local okPickup = pcall(pickup, candidate.bag, candidate.bagSlot)
        if not okPickup then return false, "pickup_failed" end

        local okEquip = pcall(EquipCursorItem, candidate.slot)
        if not okEquip then
            if ClearCursor then pcall(ClearCursor) end
            return false, "equip_failed"
        end
    end

    if C_Timer and C_Timer.After then
        C_Timer.After(0.20, function()
            if MG.Sync then MG.Sync:Inventory("gear_auto_equip_confirm") end
        end)
    end

    MG:Log("INFO", "gear.auto_equip", "Bessere Ausrüstung automatisch angelegt.", {
        itemID = candidate.itemID,
        slot = candidate.slot,
        itemLevelDelta = candidate.delta,
        score = candidate.score,
        scoreModel = candidate.scoreModel,
        profileID = candidate.gearProfileID,
        method = usedEquipByName and "EquipItemByName" or "PickupContainerItem",
    })
    return true, "equipped"
end
