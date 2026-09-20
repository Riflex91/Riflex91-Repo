local addonName, MGR = ...

local lastGearSignature
local lastBagCounts

local function itemStats(itemLink)
    if not itemLink or not C_Item or not C_Item.GetItemStats then return nil end
    local ok, stats = pcall(C_Item.GetItemStats, itemLink)
    return ok and stats or nil
end

local function itemMetadata(itemID, itemLink)
    local data = {
        itemID = itemID,
        itemLink = itemLink,
        stats = itemStats(itemLink),
    }

    if GetItemInfo and (itemLink or itemID) then
        local ok, name, link, quality, itemLevel, requiredLevel, itemType, itemSubType,
            stackCount, equipLoc, icon, sellPrice, classID, subclassID, bindType, expacID,
            setID, isCraftingReagent = pcall(GetItemInfo, itemLink or itemID)

        if ok then
            data.name = name
            data.itemLink = link or data.itemLink
            data.quality = quality
            data.itemLevel = itemLevel
            data.requiredLevel = requiredLevel
            data.itemType = itemType
            data.itemSubType = itemSubType
            data.stackCount = stackCount
            data.equipLoc = equipLoc
            data.icon = icon
            data.sellPrice = sellPrice
            data.classID = classID
            data.subclassID = subclassID
            data.bindType = bindType
            data.expacID = expacID
            data.setID = setID
            data.isCraftingReagent = isCraftingReagent
        end
    end

    return data
end

local function observeItem(itemID, itemLink, source)
    if not itemID then return end
    MGR:EnsureDB()
    MGR.db.seenItems = MGR.db.seenItems or {}

    local key = tostring(itemLink or itemID)
    if MGR.db.seenItems[key] then return end
    MGR.db.seenItems[key] = true

    local data = itemMetadata(itemID, itemLink)
    data.source = source
    MGR:Record("item.observed", itemID, data, "gameplay-api")
end

local function scanGear(reason)
    local slots, signatureParts = {}, {}

    for slot = 1, 19 do
        local itemID = GetInventoryItemID("player", slot)
        local itemLink = GetInventoryItemLink("player", slot)
        if itemID then
            observeItem(itemID, itemLink, "equipped")
            local currentDurability, maximumDurability = GetInventoryItemDurability(slot)
            slots[#slots + 1] = {
                slot = slot,
                itemID = itemID,
                itemLink = itemLink,
                durability = currentDurability and {
                    current = currentDurability,
                    maximum = maximumDurability,
                } or nil,
            }
        end
        signatureParts[#signatureParts + 1] = tostring(slot) .. ":" .. tostring(itemLink or itemID or "")
    end

    local current = table.concat(signatureParts, "|")
    if current ~= lastGearSignature or reason == "login" then
        lastGearSignature = current
        MGR:Record("gear.snapshot", nil, {
            reason = reason,
            slots = slots,
            position = MGR:GetPosition(),
        }, "gameplay-api")
    end
end

local function getContainerSlots(bag)
    if C_Container and C_Container.GetContainerNumSlots then
        local ok, value = pcall(C_Container.GetContainerNumSlots, bag)
        if ok then return value or 0 end
    end
    if GetContainerNumSlots then
        local ok, value = pcall(GetContainerNumSlots, bag)
        if ok then return value or 0 end
    end
    return 0
end

local function getContainerInfo(bag, slot)
    if C_Container and C_Container.GetContainerItemInfo then
        local ok, info = pcall(C_Container.GetContainerItemInfo, bag, slot)
        if ok and info then
            return info.itemID, info.hyperlink, info.stackCount or 1
        end
    end

    if GetContainerItemInfo then
        local ok, _, count, _, _, _, _, link, _, _, itemID = pcall(GetContainerItemInfo, bag, slot)
        if ok and itemID then return itemID, link, count or 1 end
    end
end

local function scanBags(reason)
    local counts, items = {}, {}

    for bag = 0, 4 do
        for slot = 1, getContainerSlots(bag) do
            local itemID, itemLink, count = getContainerInfo(bag, slot)
            if itemID then
                observeItem(itemID, itemLink, "bag")
                local key = tostring(itemID)
                counts[key] = (counts[key] or 0) + (count or 1)
                items[#items + 1] = {
                    bag = bag,
                    slot = slot,
                    itemID = itemID,
                    itemLink = itemLink,
                    count = count or 1,
                }
            end
        end
    end

    if not lastBagCounts or reason == "login" then
        MGR:Record("inventory.snapshot", nil, {
            reason = reason,
            items = items,
            position = MGR:GetPosition(),
        }, "gameplay-api")
    else
        local keys, delta = {}, {}
        for key in pairs(lastBagCounts) do keys[key] = true end
        for key in pairs(counts) do keys[key] = true end

        for key in pairs(keys) do
            local before, after = lastBagCounts[key] or 0, counts[key] or 0
            if before ~= after then
                delta[#delta + 1] = {
                    itemID = tonumber(key),
                    before = before,
                    after = after,
                    delta = after - before,
                }
            end
        end

        if #delta > 0 then
            MGR:Record("inventory.delta", nil, {
                reason = reason,
                changes = delta,
                position = MGR:GetPosition(),
            }, "gameplay-api")
        end
    end

    lastBagCounts = counts
end

local frame = CreateFrame("Frame")
for _, event in ipairs({
    "PLAYER_LOGIN",
    "PLAYER_EQUIPMENT_CHANGED",
    "BAG_UPDATE_DELAYED",
}) do
    frame:RegisterEvent(event)
end

frame:SetScript("OnEvent", function(_, event, ...)
    if event == "PLAYER_LOGIN" then
        C_Timer.After(4, function()
            scanGear("login")
            scanBags("login")
        end)
    elseif event == "PLAYER_EQUIPMENT_CHANGED" then
        local slot = ...
        C_Timer.After(0.2, function() scanGear("slot:" .. tostring(slot)) end)
    elseif event == "BAG_UPDATE_DELAYED" then
        C_Timer.After(0.2, function() scanBags(event) end)
    end
end)
