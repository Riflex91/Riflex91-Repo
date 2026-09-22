local addonName, MG = ...

MG.GearScore = MG.GearScore or {}
local G = MG.GearScore

local SLOT_BY_EQUIPLOC = {
    INVTYPE_HEAD=1, INVTYPE_NECK=2, INVTYPE_SHOULDER=3, INVTYPE_BODY=4,
    INVTYPE_CHEST=5, INVTYPE_ROBE=5, INVTYPE_WAIST=6, INVTYPE_LEGS=7,
    INVTYPE_FEET=8, INVTYPE_WRIST=9, INVTYPE_HAND=10, INVTYPE_FINGER=11,
    INVTYPE_TRINKET=13, INVTYPE_CLOAK=15, INVTYPE_WEAPON=16,
    INVTYPE_2HWEAPON=16, INVTYPE_WEAPONMAINHAND=16, INVTYPE_WEAPONOFFHAND=17,
    INVTYPE_HOLDABLE=17, INVTYPE_SHIELD=17, INVTYPE_RANGED=18,
    INVTYPE_RANGEDRIGHT=18, INVTYPE_THROWN=18, INVTYPE_RELIC=18,
}

local function detailedLevel(link)
    if not link then return 0 end
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
    return 0
end

local function itemInfo(link)
    if not link or not GetItemInfo then return nil end
    local ok, name, _, quality, itemLevel, _, _, _, equipLoc, icon = pcall(GetItemInfo, link)
    if not ok then return nil end
    return {
        name=name,quality=quality,itemLevel=tonumber(itemLevel) or 0,
        equipLoc=equipLoc,icon=icon,slot=SLOT_BY_EQUIPLOC[equipLoc],
    }
end

function G:ScoreLink(link)
    local info = itemInfo(link) or {}
    return detailedLevel(link), info
end

function G:CompareToEquipped(link)
    local score, info = self:ScoreLink(link)
    local equippedScore, equippedLink = 0, nil
    if info.slot and GetInventoryItemLink then
        local ok, value = pcall(GetInventoryItemLink, "player", info.slot)
        if ok then equippedLink = value end
        equippedScore = detailedLevel(equippedLink)
    end
    return {
        link=link,
        name=info.name,
        icon=info.icon,
        equipLoc=info.equipLoc,
        slot=info.slot,
        score=score,
        equippedLink=equippedLink,
        equippedScore=equippedScore,
        delta=score-equippedScore,
    }
end
