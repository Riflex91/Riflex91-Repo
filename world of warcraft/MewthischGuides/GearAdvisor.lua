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
    local _, _, _, level = GetItemInfo and GetItemInfo(link)
    return tonumber(level)
end

local function equippable(link)
    if C_Item and C_Item.IsEquippableItem then
        local ok, value = pcall(C_Item.IsEquippableItem, link)
        if ok then return value and true or false end
    end
    if IsEquippableItem then
        local ok, value = pcall(IsEquippableItem, link)
        if ok then return value and true or false end
    end
    return false
end

function Gear:EvaluateItemLink(link)
    local itemID, equipLoc = itemBasics(link)
    local slot = equipLoc and EQUIP_SLOT[equipLoc] or nil
    if not itemID or not slot or not equippable(link) then
        return nil, "not_equippable"
    end

    local level = itemLevel(link)
    if not level then return nil, "item_level_unknown" end

    local equippedLink = GetInventoryItemLink and GetInventoryItemLink("player", slot) or nil
    local equippedLevel = itemLevel(equippedLink) or 0
    local delta = level - equippedLevel

    return {
        itemID = itemID,
        link = link,
        equipLoc = equipLoc,
        slot = slot,
        itemLevel = level,
        equippedLink = equippedLink,
        equippedItemLevel = equippedLevel,
        delta = delta,
        score = delta,
        isWeapon = WEAPON_LOC[equipLoc] and true or false,
        confidence = "high",
        upgrade = delta > 0,
    }
end

function Gear:Refresh(reason)
    local inventory = MG.Inventory and MG.Inventory:GetSnapshot() or nil
    if not inventory then return nil end

    local best = nil
    for _, item in ipairs(inventory.bags or {}) do
        local result = self:EvaluateItemLink(item.link)
        if result and result.upgrade then
            result.bag = item.bag
            result.bagSlot = item.slot
            result.isBound = item.isBound
            if not best or result.score > best.score then best = result end
        end
    end

    self.bestUpgrade = best
    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.gear = {
            reason = reason,
            recommendedItemID = best and best.itemID or nil,
            delta = best and best.delta or nil,
            confidence = best and best.confidence or nil,
        }
    end

    if best then self:TryAutoEquip(best) end
    return best
end

function Gear:TryAutoEquip(candidate)
    local settings = MG.db and MG.db.settings or {}
    if not settings.gearAutoEquip or not candidate then return false, "disabled" end
    if settings.gearRequireHighConfidence and candidate.confidence ~= "high" then return false, "confidence" end
    if candidate.isWeapon and not settings.gearAutoEquipWeapons then return false, "weapon_protected" end
    if settings.gearProtectBoE and candidate.isBound ~= true then return false, "boe_protected" end
    if InCombatLockdown and InCombatLockdown() then return false, "combat" end
    if CursorHasItem and CursorHasItem() then return false, "cursor_busy" end
    if not C_Container or not C_Container.PickupContainerItem or not EquipCursorItem then
        return false, "equip_api_missing"
    end

    local okPickup = pcall(C_Container.PickupContainerItem, candidate.bag, candidate.bagSlot)
    if not okPickup then return false, "pickup_failed" end
    local okEquip = pcall(EquipCursorItem, candidate.slot)
    if not okEquip then
        if ClearCursor then pcall(ClearCursor) end
        return false, "equip_failed"
    end

    MG:Log("INFO", "gear.auto_equip", "Sicheres Gear-Upgrade automatisch angelegt.", {
        itemID = candidate.itemID,
        slot = candidate.slot,
        delta = candidate.delta,
    })
    return true, "equipped"
end
