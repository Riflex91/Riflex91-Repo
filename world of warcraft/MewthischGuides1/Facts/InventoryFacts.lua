local addonName, MG = ...

MG.InventoryFacts = MG.InventoryFacts or {}
local I = MG.InventoryFacts

function I:GetItemCount(itemID)
    itemID = tonumber(itemID)
    if not itemID then return 0 end
    if C_Item and C_Item.GetItemCount then
        local ok, value = pcall(C_Item.GetItemCount, itemID, false, false, false)
        if ok and tonumber(value) then return tonumber(value) end
    end
    if GetItemCount then
        local ok, value = pcall(GetItemCount, itemID)
        if ok and tonumber(value) then return tonumber(value) end
    end
    return 0
end

function I:Snapshot(itemIDs)
    local out = {}
    for itemID in pairs(itemIDs or {}) do
        out[tonumber(itemID)] = self:GetItemCount(itemID)
    end
    return out
end
