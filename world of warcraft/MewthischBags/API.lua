local addonName, MB = ...

MB.API = MB.API or {}
local API = MB.API

local function safeCall(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h, i, j = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h, i, j
end

local function safeInvoke(fn, ...)
    if type(fn) ~= "function" then return false end
    return pcall(fn, ...)
end

function API:GetContainerNumSlots(bagID)
    local value
    if C_Container and C_Container.GetContainerNumSlots then
        value = safeCall(C_Container.GetContainerNumSlots, bagID)
    elseif GetContainerNumSlots then
        value = safeCall(GetContainerNumSlots, bagID)
    end
    return math.max(0, tonumber(value) or 0)
end

function API:GetContainerItemLink(bagID, slotID)
    if C_Container and C_Container.GetContainerItemLink then
        return safeCall(C_Container.GetContainerItemLink, bagID, slotID)
    elseif GetContainerItemLink then
        return safeCall(GetContainerItemLink, bagID, slotID)
    end
    return nil
end

function API:GetContainerItemInfo(bagID, slotID)
    local result = {
        bagID = bagID,
        slotID = slotID,
        icon = nil,
        count = 0,
        quality = nil,
        link = nil,
        itemID = nil,
        locked = false,
    }

    if C_Container and C_Container.GetContainerItemInfo then
        local info = safeCall(C_Container.GetContainerItemInfo, bagID, slotID)
        if type(info) == "table" then
            result.icon = info.iconFileID
            result.count = tonumber(info.stackCount) or 0
            result.quality = info.quality
            result.link = info.hyperlink
            result.itemID = info.itemID
            result.locked = info.isLocked and true or false
        end
    elseif GetContainerItemInfo then
        local texture, count, locked, quality, _, _, link, _, _, itemID =
            safeCall(GetContainerItemInfo, bagID, slotID)
        result.icon = texture
        result.count = tonumber(count) or 0
        result.quality = quality
        result.link = link
        result.itemID = itemID
        result.locked = locked and true or false
    end

    if not result.link then
        result.link = self:GetContainerItemLink(bagID, slotID)
    end

    if result.link and not result.itemID and GetItemInfoInstant then
        result.itemID = safeCall(GetItemInfoInstant, result.link)
    end

    if result.link and not result.icon and GetItemInfoInstant then
        local _, _, _, _, icon = safeCall(GetItemInfoInstant, result.link)
        result.icon = icon
    end

    if result.link and result.count == 0 then
        result.count = 1
    end

    return result
end

function API:GetItemName(linkOrID)
    if not linkOrID then return nil end
    if GetItemInfo then
        local name = safeCall(GetItemInfo, linkOrID)
        if type(name) == "string" and name ~= "" then return name end
    end
    if C_Item and C_Item.GetItemNameByID then
        local name = safeCall(C_Item.GetItemNameByID, linkOrID)
        if type(name) == "string" and name ~= "" then return name end
    end
    return nil
end

function API:GetItemIcon(linkOrID)
    if not linkOrID then return nil end
    if C_Item and C_Item.GetItemIconByID then
        local icon = safeCall(C_Item.GetItemIconByID, linkOrID)
        if icon then return icon end
    end
    if GetItemInfoInstant then
        local _, _, _, _, icon = safeCall(GetItemInfoInstant, linkOrID)
        if icon then return icon end
    end
    if GetItemIcon then
        return safeCall(GetItemIcon, linkOrID)
    end
    return nil
end

function API:PickupContainerItem(bagID, slotID)
    if self:IsInCombat() then return false end
    if C_Container and C_Container.PickupContainerItem then
        return safeInvoke(C_Container.PickupContainerItem, bagID, slotID)
    elseif PickupContainerItem then
        return safeInvoke(PickupContainerItem, bagID, slotID)
    end
    return false
end

function API:UseContainerItem(bagID, slotID)
    if C_Container and C_Container.UseContainerItem then
        return safeInvoke(C_Container.UseContainerItem, bagID, slotID)
    elseif UseContainerItem then
        return safeInvoke(UseContainerItem, bagID, slotID)
    end
    return false
end

function API:GetBagInventorySlot(bagID)
    if ContainerIDToInventoryID then
        local slot = safeCall(ContainerIDToInventoryID, bagID)
        if tonumber(slot) then return tonumber(slot) end
    end

    if bagID >= 1 and bagID <= 4 then
        return 19 + bagID
    end

    return nil
end

function API:GetEquippedBagInfo(bagID)
    local inventorySlot = self:GetBagInventorySlot(bagID)
    if not inventorySlot then return nil end

    local link = GetInventoryItemLink and safeCall(GetInventoryItemLink, "player", inventorySlot) or nil
    local icon = GetInventoryItemTexture and safeCall(GetInventoryItemTexture, "player", inventorySlot) or nil

    return {
        bagID = bagID,
        inventorySlot = inventorySlot,
        link = link,
        icon = icon,
        capacity = self:GetContainerNumSlots(bagID),
    }
end

function API:PickupInventoryBag(bagID)
    if self:IsInCombat() then return false end
    local inventorySlot = self:GetBagInventorySlot(bagID)
    if not inventorySlot or type(PickupInventoryItem) ~= "function" then return false end
    return safeInvoke(PickupInventoryItem, inventorySlot)
end

function API:IsBagLink(link)
    if not link then return false end

    local equipLoc
    local classID
    if GetItemInfoInstant then
        local _, _, _, itemEquipLoc, _, itemClassID = safeCall(GetItemInfoInstant, link)
        equipLoc = itemEquipLoc
        classID = tonumber(itemClassID)
    end

    if equipLoc == "INVTYPE_BAG" then return true end

    local containerClass = 1
    if Enum and Enum.ItemClass and Enum.ItemClass.Container ~= nil then
        containerClass = Enum.ItemClass.Container
    elseif LE_ITEM_CLASS_CONTAINER ~= nil then
        containerClass = LE_ITEM_CLASS_CONTAINER
    end

    return classID == tonumber(containerClass)
end

local function lowerText(value)
    value = tostring(value or "")
    if strlower then
        local ok, lowered = pcall(strlower, value)
        if ok and lowered then return lowered end
    end
    return string.lower(value)
end

local function extractCapacity(text)
    if type(text) ~= "string" or text == "" then return nil end

    local lowered = lowerText(text)
    local containsSlotWord = false
    for _, word in ipairs((MB.Locale and MB.Locale.slotWords) or {}) do
        if lowered:find(lowerText(word), 1, true) then
            containsSlotWord = true
            break
        end
    end

    if not containsSlotWord then return nil end

    local best
    for digits in text:gmatch("(%d+)") do
        local n = tonumber(digits)
        if n and n >= 4 and n <= 200 and (not best or n > best) then
            best = n
        end
    end
    return best
end

API.capacityCache = API.capacityCache or {}

function API:GetUnequippedBagCapacity(link)
    if not link then return 0 end
    if self.capacityCache[link] ~= nil then
        return self.capacityCache[link]
    end

    local capacity

    if C_TooltipInfo and C_TooltipInfo.GetHyperlink then
        local tooltip = safeCall(C_TooltipInfo.GetHyperlink, link)
        if type(tooltip) == "table" and type(tooltip.lines) == "table" then
            for _, line in ipairs(tooltip.lines) do
                capacity = extractCapacity(line.leftText) or extractCapacity(line.rightText)
                if capacity then break end
            end
        end
    end

    if not capacity and CreateFrame and UIParent then
        if not self.scannerTooltip then
            self.scannerTooltip = CreateFrame(
                "GameTooltip",
                "MewthischBagsScannerTooltip",
                UIParent,
                "GameTooltipTemplate"
            )
            self.scannerTooltip:SetOwner(UIParent, "ANCHOR_NONE")
        end

        local tooltip = self.scannerTooltip
        tooltip:ClearLines()
        local ok = pcall(tooltip.SetHyperlink, tooltip, link)
        if ok then
            local count = tooltip:NumLines() or 0
            for i = 1, count do
                local left = _G["MewthischBagsScannerTooltipTextLeft" .. i]
                local right = _G["MewthischBagsScannerTooltipTextRight" .. i]
                capacity = extractCapacity(left and left:GetText()) or
                    extractCapacity(right and right:GetText())
                if capacity then break end
            end
        end
        tooltip:Hide()
    end

    capacity = tonumber(capacity) or 0
    self.capacityCache[link] = capacity
    return capacity
end

function API:GetAvailableBags()
    local bags = {}

    for bagID = 0, 4 do
        local numSlots = self:GetContainerNumSlots(bagID)
        for slotID = 1, numSlots do
            local info = self:GetContainerItemInfo(bagID, slotID)
            if info.link and self:IsBagLink(info.link) then
                bags[#bags + 1] = {
                    bagID = bagID,
                    slotID = slotID,
                    link = info.link,
                    itemID = info.itemID,
                    icon = info.icon or self:GetItemIcon(info.link),
                    name = self:GetItemName(info.link),
                    capacity = self:GetUnequippedBagCapacity(info.link),
                }
            end
        end
    end

    table.sort(bags, function(a, b)
        local ac = tonumber(a.capacity) or 0
        local bc = tonumber(b.capacity) or 0
        if ac ~= bc then return ac > bc end
        return tostring(a.name or a.link or "") < tostring(b.name or b.link or "")
    end)

    return bags
end

function API:GetMoney()
    local total = 0
    if type(GetMoney) == "function" then
        total = tonumber(safeCall(GetMoney)) or 0
    end

    local gold = math.floor(total / 10000)
    local silver = math.floor((total % 10000) / 100)
    local copper = total % 100
    return gold, silver, copper
end

function API:FormatLargeNumber(value)
    value = tonumber(value) or 0
    if type(BreakUpLargeNumbers) == "function" then
        local formatted = safeCall(BreakUpLargeNumbers, value)
        if formatted then return tostring(formatted) end
    end
    return tostring(value)
end

function API:GetMoneySymbol(kind)
    local globalName
    local fallback
    if kind == "gold" then
        globalName = "GOLD_AMOUNT_SYMBOL"
        fallback = "|TInterface\\MoneyFrame\\UI-GoldIcon:14:14:2:0|t"
    elseif kind == "silver" then
        globalName = "SILVER_AMOUNT_SYMBOL"
        fallback = "|TInterface\\MoneyFrame\\UI-SilverIcon:14:14:2:0|t"
    else
        globalName = "COPPER_AMOUNT_SYMBOL"
        fallback = "|TInterface\\MoneyFrame\\UI-CopperIcon:14:14:2:0|t"
    end

    local value = _G and _G[globalName]
    if type(value) == "string" and value ~= "" then
        return value
    end
    return fallback
end

function API:IsInCombat()
    if type(InCombatLockdown) ~= "function" then return false end
    return safeCall(InCombatLockdown) and true or false
end
