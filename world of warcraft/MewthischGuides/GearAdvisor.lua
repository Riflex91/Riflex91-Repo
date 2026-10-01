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
    INVTYPE_SHIELD = true, INVTYPE_HOLDABLE = true,
    INVTYPE_RANGED = true, INVTYPE_RANGEDRIGHT = true,
}

local ARMOR_CLASS_ID =
    Enum and Enum.ItemClass and tonumber(Enum.ItemClass.Armor) or 4
local ITEM_BIND_ON_EQUIP =
    Enum and Enum.ItemBind and tonumber(Enum.ItemBind.OnEquip) or 2

local function itemIDFromLink(link)
    if tonumber(link) then return tonumber(link) end
    return tonumber(tostring(link or ""):match("item:(%d+)"))
end

local function instantBasics(itemRef)
    if not itemRef or not GetItemInfoInstant then return nil end
    local values = { pcall(GetItemInfoInstant, itemRef) }
    if not values[1] then return nil end
    return {
        itemID = tonumber(values[2]),
        equipLoc = values[5],
        classID = tonumber(values[7]),
        subclassID = tonumber(values[8]),
    }
end

local function fullBasics(itemRef)
    local getter = C_Item and C_Item.GetItemInfo or GetItemInfo
    if not itemRef or not getter then return nil end
    local values = { pcall(getter, itemRef) }
    if not values[1] or not values[2] then return nil end
    return {
        itemID = itemIDFromLink(values[3]) or itemIDFromLink(itemRef),
        equipLoc = values[10],
        classID = tonumber(values[13]),
        subclassID = tonumber(values[14]),
        bindingType = tonumber(values[15]),
    }
end

local function itemBasics(link)
    if not link then return nil end

    local parsedItemID = itemIDFromLink(link)
    local data = instantBasics(link) or {}

    if parsedItemID and
       (not data.itemID or data.equipLoc == nil or data.equipLoc == "" or
        data.classID == nil or data.subclassID == nil) then
        local byID = instantBasics(parsedItemID)
        if byID then
            data.itemID = data.itemID or byID.itemID
            if data.equipLoc == nil or data.equipLoc == "" then
                data.equipLoc = byID.equipLoc
            end
            data.classID = data.classID or byID.classID
            data.subclassID = data.subclassID or byID.subclassID
        end
    end

    if not data.itemID or data.equipLoc == nil or data.equipLoc == "" or
       data.classID == nil or data.subclassID == nil then
        local full = fullBasics(data.itemID or parsedItemID or link)
        if full then
            data.itemID = data.itemID or full.itemID
            if data.equipLoc == nil or data.equipLoc == "" then
                data.equipLoc = full.equipLoc
            end
            data.classID = data.classID or full.classID
            data.subclassID = data.subclassID or full.subclassID
            data.bindingType = full.bindingType
        end
    end

    data.itemID = data.itemID or parsedItemID
    return data
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

local function armorProficiencySafe(itemClassID, itemSubclassID)
    if tonumber(itemClassID) ~= ARMOR_CLASS_ID then return true end

    local subclass = tonumber(itemSubclassID)
    if not subclass or subclass < 1 or subclass > 4 then return true end

    local state = MG.BuildState and MG.BuildState:GetState() or {}
    local class = tostring(state.class or "")
    local level = tonumber(state.level) or 1
    local limit = nil

    if class == "MAGE" or class == "PRIEST" or class == "WARLOCK" then
        limit = 1
    elseif class == "DRUID" or class == "ROGUE" or
           class == "MONK" or class == "DEMONHUNTER" then
        limit = 2
    elseif class == "HUNTER" or class == "SHAMAN" then
        limit = level >= 40 and 3 or 2
    elseif class == "WARRIOR" or class == "PALADIN" then
        limit = level >= 40 and 4 or 3
    end

    return limit ~= nil and subclass <= limit
end

local function comparableItemStats(link)
    if not link or not GetItemStats then return nil end
    local ok, stats = pcall(GetItemStats, link)
    if not ok or type(stats) ~= "table" then return nil end

    local result = {}
    local count = 0
    for key, raw in pairs(stats) do
        local value = tonumber(raw)
        local comparable =
            type(key) == "string" and
            (string.match(key, "^ITEM_MOD_") or
             string.match(key, "^RESISTANCE%d+_NAME$"))

        if comparable and value and value >= 0 then
            result[key] = value
            count = count + 1
        end
    end

    return count > 0 and result or nil
end

local function strictStatDominance(candidateLink, equippedLink)
    if not candidateLink or not equippedLink then return false, nil end

    local candidate = comparableItemStats(candidateLink)
    local equipped = comparableItemStats(equippedLink)
    if not candidate or not equipped then return false, nil end

    local keys = {}
    for key in pairs(candidate) do keys[key] = true end
    for key in pairs(equipped) do keys[key] = true end

    local improved = false
    local positiveDelta = 0

    for key in pairs(keys) do
        local nextValue = tonumber(candidate[key]) or 0
        local currentValue = tonumber(equipped[key]) or 0

        if nextValue + 0.0001 < currentValue then
            return false, nil
        end
        if nextValue > currentValue + 0.0001 then
            improved = true
            positiveDelta = positiveDelta + (nextValue - currentValue)
        end
    end

    return improved, positiveDelta
end

local function equippable(itemID, link, equipLoc)
    local diagnostics = {
        itemID = itemID,
        equipLoc = equipLoc,
        modernByID = nil,
        modernByLink = nil,
        legacyByID = nil,
        legacyByLink = nil,
        usedEquipLocFallback = false,
    }

    if not equipLoc or not EQUIP_SLOT[equipLoc] then
        return false, diagnostics
    end

    local function probe(target, field, fn)
        if not target or not fn then return false end
        local ok, value = pcall(fn, target)
        if ok then
            diagnostics[field] = value and true or false
            return value and true or false
        end
        diagnostics[field] = "error"
        return false
    end

    if C_Item and C_Item.IsEquippableItem then
        if probe(itemID, "modernByID", C_Item.IsEquippableItem) then
            return true, diagnostics
        end
        if probe(link, "modernByLink", C_Item.IsEquippableItem) then
            return true, diagnostics
        end
    end

    if IsEquippableItem then
        if probe(itemID, "legacyByID", IsEquippableItem) then
            return true, diagnostics
        end
        if probe(link, "legacyByLink", IsEquippableItem) then
            return true, diagnostics
        end
    end

    -- Forever can report false here while GetItemInfoInstant already exposes a
    -- valid equipment slot. Treat INVTYPE_* as the primary equipment signal;
    -- class/proficiency, binding, weapon safety, combat and the actual equip
    -- operation are still checked separately.
    diagnostics.usedEquipLocFallback = true
    return true, diagnostics
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
    local basics = itemBasics(link) or {}
    local itemID = tonumber(basics.itemID)
    local equipLoc = basics.equipLoc
    local itemClassID = tonumber(basics.classID)
    local itemSubclassID = tonumber(basics.subclassID)

    if not itemID then
        return nil, "item_data_pending", {
            link = link,
            itemID = itemIDFromLink(link),
            equipLoc = equipLoc,
        }
    end

    if equipLoc == nil or equipLoc == "" then
        if C_Item and C_Item.RequestLoadItemDataByID then
            pcall(C_Item.RequestLoadItemDataByID, itemID)
        end
        return nil, "item_data_pending", {
            link = link,
            itemID = itemID,
            equipLoc = equipLoc,
        }
    end

    local slot = EQUIP_SLOT[equipLoc]
    if not slot then
        return nil, "not_equipment", {
            itemID = itemID,
            equipLoc = equipLoc,
        }
    end

    local canEquip, equipDiagnostics =
        equippable(itemID, link, equipLoc)
    if not canEquip then
        return nil, "not_safely_equippable", equipDiagnostics
    end

    if not armorProficiencySafe(itemClassID, itemSubclassID) then
        return nil, "armor_proficiency", {
            itemID = itemID,
            equipLoc = equipLoc,
            classID = itemClassID,
            subclassID = itemSubclassID,
        }
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
    local dominates, statDelta = strictStatDominance(link, equippedLink)
    local confidence = "medium"
    local score = itemLevelDelta
    local upgrade = itemLevelDelta > 0
    local scoreModel = "item-level-fallback"

    if profile and candidateScore ~= nil and equippedScore ~= nil then
        score = candidateScore - equippedScore
        upgrade = score > (tonumber(profile.minimumScoreDelta) or 0)
        confidence = "high"
        scoreModel = "data-backed-stat-weights"
    elseif itemLevelDelta == 0 and dominates and not WEAPON_LOC[equipLoc] then
        score = 0.25 + math.min(tonumber(statDelta) or 0, 999) / 10000
        upgrade = true
        confidence = "high"
        scoreModel = "strict-stat-dominance"
    end

    return {
        itemID = itemID,
        link = link,
        equipLoc = equipLoc,
        itemClassID = itemClassID,
        itemSubclassID = itemSubclassID,
        slot = targetSlot,
        itemLevel = level,
        equippedLink = equippedLink,
        equippedItemLevel = equippedLevel,
        delta = itemLevelDelta,
        statDelta = statDelta,
        score = score,
        scoreModel = scoreModel,
        gearProfileID = profile and profile.id or nil,
        isWeapon = WEAPON_LOC[equipLoc] and true or false,
        confidence = confidence,
        upgrade = upgrade,
        bindingType = basics.bindingType,
        equipDiagnostics = equipDiagnostics,
    }
end

function Gear:Refresh(reason)
    local inventory = MG.Inventory and MG.Inventory:GetSnapshot() or nil
    if not inventory then return nil end

    local best = nil
    local pendingItemData = false
    local rejected = {}
    local rejectionSamples = {}

    for _, item in ipairs(inventory.bags or {}) do
        local result, rejectReason, rejectDiagnostics =
            self:EvaluateItemLink(item.link)

        if result and result.upgrade then
            result.bag = item.bag
            result.bagSlot = item.slot
            result.isBound = item.isBound
            result.bindingType = item.bindingType or result.bindingType

            if result.bindingType == nil and
               C_Item and C_Item.RequestLoadItemDataByID then
                pcall(C_Item.RequestLoadItemDataByID, result.itemID)
            end

            if not best or result.score > best.score then best = result end
        elseif rejectReason then
            rejected[rejectReason] = (rejected[rejectReason] or 0) + 1
            if rejectReason == "item_level_unknown" or
               rejectReason == "item_data_pending" then
                pendingItemData = true
            end

            if #rejectionSamples < 8 then
                rejectionSamples[#rejectionSamples + 1] = {
                    itemID = item.itemID or itemIDFromLink(item.link),
                    bag = item.bag,
                    bagSlot = item.slot,
                    reason = rejectReason,
                    diagnostics = rejectDiagnostics,
                }
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

    if best and MG.db and MG.db.settings and
       MG.db.settings.gearProtectBoE and best.isBound ~= true and
       tonumber(best.bindingType) == nil then
        pendingItemData = true
        if C_Item and C_Item.RequestLoadItemDataByID then
            pcall(C_Item.RequestLoadItemDataByID, best.itemID)
        end
    end

    self.bestUpgrade = best

    local autoEquipRequested = false
    local autoEquipEnabled = MG.db and MG.db.settings and
        MG.db.settings.gearAutoEquip and true or false
    local autoEquipReason
    if not autoEquipEnabled then
        autoEquipReason = "disabled"
    else
        autoEquipReason = best and "not_attempted" or "no_upgrade"
    end

    if best then
        autoEquipRequested, autoEquipReason = self:TryAutoEquip(best)
    end
    local autoEquipped = autoEquipReason == "equipped_confirmed"

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        local previousGear = MG.db.runtime.gear or {}
        MG.db.runtime.gear = {
            reason = reason,
            recommendedItemID = best and best.itemID or nil,
            delta = best and best.delta or nil,
            statDelta = best and best.statDelta or nil,
            score = best and best.score or nil,
            scoreModel = best and best.scoreModel or nil,
            confidence = best and best.confidence or nil,
            gearProfileID = best and best.gearProfileID or nil,
            targetSlot = best and best.slot or nil,
            isBound = best and best.isBound or nil,
            bindingType = best and best.bindingType or nil,
            autoEquipRequested = autoEquipRequested,
            autoEquipped = autoEquipped,
            autoEquipReason = autoEquipReason,
            lastAutoEquip = previousGear.lastAutoEquip,
            rejected = rejected,
            rejectionSamples = rejectionSamples,
            pendingItemData = pendingItemData,
            autoEquipEnabled = autoEquipEnabled,
            equipDiagnostics = best and best.equipDiagnostics or nil,
        }
    end

    return best
end

local function candidateIsEquipped(candidate)
    if not candidate then return false end

    if GetInventoryItemID then
        local ok, itemID = pcall(GetInventoryItemID, "player", candidate.slot)
        if ok and tonumber(itemID) == tonumber(candidate.itemID) then
            return true
        end
    end

    if GetInventoryItemLink then
        local ok, link = pcall(GetInventoryItemLink, "player", candidate.slot)
        if ok and link and candidate.link and link == candidate.link then
            return true
        end
    end

    return false
end

function Gear:TryAutoEquip(candidate)
    local settings = MG.db and MG.db.settings or {}
    if not settings.gearAutoEquip or not candidate then return false, "disabled" end

    local safeItemLevelFallback =
        settings.gearAutoEquipItemLevelFallback ~= false and
        candidate.scoreModel == "item-level-fallback" and
        not candidate.isWeapon and
        tonumber(candidate.delta) and tonumber(candidate.delta) > 0
    local safeDominanceFallback =
        candidate.scoreModel == "strict-stat-dominance" and
        not candidate.isWeapon and
        tonumber(candidate.statDelta) and tonumber(candidate.statDelta) > 0

    if settings.gearRequireHighConfidence and candidate.confidence ~= "high" and
       not safeItemLevelFallback and not safeDominanceFallback then
        return false, "confidence"
    end
    if candidate.isWeapon and not settings.gearAutoEquipWeapons then
        return false, "weapon_protected"
    end

    if settings.gearProtectBoE and candidate.isBound ~= true then
        local bindingType = tonumber(candidate.bindingType)
        if bindingType == nil then
            return false, "binding_unknown"
        end
        if bindingType == ITEM_BIND_ON_EQUIP then
            return false, "boe_protected"
        end
    end

    if InCombatLockdown and InCombatLockdown() then return false, "combat" end
    if CursorHasItem and CursorHasItem() then return false, "cursor_busy" end

    local method = nil
    if EquipItemByName then
        local okEquip = pcall(EquipItemByName, candidate.link, candidate.slot)
        if okEquip then method = "EquipItemByName" end
    end

    if not method then
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
        method = "PickupContainerItem"
    end

    local detail = {
        itemID = candidate.itemID,
        slot = candidate.slot,
        itemLevelDelta = candidate.delta,
        statDelta = candidate.statDelta,
        score = candidate.score,
        scoreModel = candidate.scoreModel,
        bindingType = candidate.bindingType,
        profileID = candidate.gearProfileID,
        method = method,
    }

    if candidateIsEquipped(candidate) then
        MG:Log("INFO", "gear.auto_equip_confirmed",
            "Bessere Ausrüstung automatisch angelegt und bestätigt.", detail)
        if MG.ShowAutoEquipNotification then
            MG:ShowAutoEquipNotification(candidate)
        end
        return true, "equipped_confirmed"
    end

    MG:Log("INFO", "gear.auto_equip_requested",
        "Auto-Equip angefordert; Bestätigung steht noch aus.", detail)

    if C_Timer and C_Timer.After then
        local expected = {
            itemID = candidate.itemID,
            link = candidate.link,
            slot = candidate.slot,
        }

        C_Timer.After(0.25, function()
            local confirmed = candidateIsEquipped(expected)

            if MG.db then
                MG.db.runtime = MG.db.runtime or {}
                MG.db.runtime.gear = MG.db.runtime.gear or {}
                MG.db.runtime.gear.lastAutoEquip = {
                    itemID = expected.itemID,
                    slot = expected.slot,
                    confirmed = confirmed,
                    reason = confirmed and "equipped_confirmed" or
                        "equip_not_confirmed",
                    method = method,
                }
            end

            MG:Log(confirmed and "INFO" or "WARN",
                confirmed and "gear.auto_equip_confirmed" or
                    "gear.auto_equip_unconfirmed",
                confirmed and
                    "Auto-Equip nachträglich bestätigt." or
                    "Auto-Equip konnte nach der Anforderung nicht bestätigt werden.",
                detail)

            if confirmed and MG.ShowAutoEquipNotification then
                MG:ShowAutoEquipNotification(expected)
            end
        end)
    end

    return true, "equip_requested"
end
