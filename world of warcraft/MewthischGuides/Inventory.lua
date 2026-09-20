local addonName, MG = ...

MG.Inventory = MG.Inventory or {}
local Inventory = MG.Inventory

Inventory.snapshot = Inventory.snapshot or { bags = {}, equipped = {} }

local function safeItemLink(bag, slot)
    if C_Container and C_Container.GetContainerItemLink then
        local ok, value = pcall(C_Container.GetContainerItemLink, bag, slot)
        if ok then return value end
    elseif GetContainerItemLink then
        local ok, value = pcall(GetContainerItemLink, bag, slot)
        if ok then return value end
    end
    return nil
end

local function bagSlots(bag)
    if C_Container and C_Container.GetContainerNumSlots then
        local ok, value = pcall(C_Container.GetContainerNumSlots, bag)
        return ok and tonumber(value) or 0
    elseif GetContainerNumSlots then
        local ok, value = pcall(GetContainerNumSlots, bag)
        return ok and tonumber(value) or 0
    end
    return 0
end

function Inventory:Refresh(reason)
    local snapshot = { bags = {}, equipped = {}, updatedAt = time and time() or 0 }

    for bag = 0, 4 do
        for slot = 1, bagSlots(bag) do
            local link = safeItemLink(bag, slot)
            if link then
                local itemID = nil
                if GetItemInfoInstant then
                    local ok, value = pcall(GetItemInfoInstant, link)
                    if ok then itemID = value end
                end

                local info = nil
                if C_Container and C_Container.GetContainerItemInfo then
                    local ok, value = pcall(C_Container.GetContainerItemInfo, bag, slot)
                    if ok and type(value) == "table" then info = value end
                end

                snapshot.bags[#snapshot.bags + 1] = {
                    bag = bag,
                    slot = slot,
                    itemID = tonumber(itemID),
                    link = link,
                    count = info and info.stackCount or 1,
                    isBound = info and info.isBound or nil,
                    quality = info and info.quality or nil,
                }
            end
        end
    end

    for inventorySlot = 1, 19 do
        local itemID = GetInventoryItemID and GetInventoryItemID("player", inventorySlot) or nil
        if itemID then
            snapshot.equipped[inventorySlot] = {
                slot = inventorySlot,
                itemID = itemID,
                link = GetInventoryItemLink and GetInventoryItemLink("player", inventorySlot) or nil,
            }
        end
    end

    self.snapshot = snapshot
    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        local equippedCount = 0
        for _ in pairs(snapshot.equipped) do equippedCount = equippedCount + 1 end
        MG.db.runtime.inventory = {
            bagItems = #snapshot.bags,
            equippedItems = equippedCount,
            updatedAt = snapshot.updatedAt,
            reason = reason,
        }
    end

    return snapshot
end

function Inventory:GetSnapshot()
    return self.snapshot
end
