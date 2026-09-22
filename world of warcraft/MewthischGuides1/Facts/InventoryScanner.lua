local addonName, MG = ...

MG.InventoryScanner = MG.InventoryScanner or {}
local I = MG.InventoryScanner
I.snapshot={bags={},equipped={}}

local function slots(bag)
    if C_Container and C_Container.GetContainerNumSlots then
        local ok,value=pcall(C_Container.GetContainerNumSlots,bag)
        if ok then return tonumber(value) or 0 end
    end
    if GetContainerNumSlots then
        local ok,value=pcall(GetContainerNumSlots,bag)
        if ok then return tonumber(value) or 0 end
    end
    return 0
end

local function link(bag,slot)
    if C_Container and C_Container.GetContainerItemLink then
        local ok,value=pcall(C_Container.GetContainerItemLink,bag,slot)
        if ok then return value end
    end
    if GetContainerItemLink then
        local ok,value=pcall(GetContainerItemLink,bag,slot)
        if ok then return value end
    end
end

function I:Refresh(reason)
    local snapshot={bags={},equipped={},reason=reason,updatedAt=time and time() or 0}
    for bag=0,4 do
        for slot=1,slots(bag) do
            local itemLink=link(bag,slot)
            if itemLink then
                local itemID
                if GetItemInfoInstant then
                    local ok,value=pcall(GetItemInfoInstant,itemLink)
                    if ok then itemID=tonumber(value) end
                end
                local isBound
                if C_Container and C_Container.GetContainerItemInfo then
                    local ok,info=pcall(C_Container.GetContainerItemInfo,bag,slot)
                    if ok and type(info)=="table" then isBound=info.isBound end
                end
                snapshot.bags[#snapshot.bags+1]={
                    bag=bag,slot=slot,itemID=itemID,link=itemLink,isBound=isBound,
                }
            end
        end
    end
    for slot=1,19 do
        local itemID=GetInventoryItemID and GetInventoryItemID("player",slot) or nil
        if itemID then snapshot.equipped[slot]={
            slot=slot,itemID=itemID,
            link=GetInventoryItemLink and GetInventoryItemLink("player",slot) or nil,
        } end
    end
    self.snapshot=snapshot
    return snapshot
end

function I:GetSnapshot()
    return self.snapshot
end
