local addonName, MG = ...

MG.InventoryTools = MG.InventoryTools or {}
local I = MG.InventoryTools
I.state=I.state or {}

local function maxBag()
    return tonumber(NUM_BAG_SLOTS) or 4
end

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

local function freeSlots(bag)
    if C_Container and C_Container.GetContainerNumFreeSlots then
        local ok,value=pcall(C_Container.GetContainerNumFreeSlots,bag)
        if ok then return tonumber(value) or 0 end
    end
    if GetContainerNumFreeSlots then
        local ok,value=pcall(GetContainerNumFreeSlots,bag)
        if ok then return tonumber(value) or 0 end
    end
    return 0
end

local function itemInfo(bag,slot)
    if C_Container and C_Container.GetContainerItemInfo then
        local ok,info=pcall(C_Container.GetContainerItemInfo,bag,slot)
        if ok and type(info)=="table" then
            return {
                count=tonumber(info.stackCount) or 1,
                locked=info.isLocked and true or false,
                quality=tonumber(info.quality),
                link=info.hyperlink,
                hasNoValue=info.hasNoValue and true or false,
                itemID=tonumber(info.itemID),
            }
        end
    end
    if GetContainerItemInfo then
        local ok,texture,count,locked,quality,readable,lootable,link=
            pcall(GetContainerItemInfo,bag,slot)
        if ok and texture then
            return {
                count=tonumber(count) or 1,
                locked=locked and true or false,
                quality=tonumber(quality),
                link=link,
            }
        end
    end
    return nil
end

local function itemID(bag,slot,info)
    if info and info.itemID then return info.itemID end
    if C_Container and C_Container.GetContainerItemID then
        local ok,value=pcall(C_Container.GetContainerItemID,bag,slot)
        if ok and tonumber(value) then return tonumber(value) end
    end
    if GetContainerItemID then
        local ok,value=pcall(GetContainerItemID,bag,slot)
        if ok and tonumber(value) then return tonumber(value) end
    end
    if info and info.link and GetItemInfoInstant then
        local ok,value=pcall(GetItemInfoInstant,info.link)
        if ok and tonumber(value) then return tonumber(value) end
    end
    return nil
end

local function questItem(bag,slot)
    if C_Container and C_Container.GetContainerItemQuestInfo then
        local ok,a,b=pcall(C_Container.GetContainerItemQuestInfo,bag,slot)
        if ok then
            if type(a)=="table" then
                return a.isQuestItem or tonumber(a.questID)~=nil
            end
            return tonumber(a)~=nil or b==true
        end
    end
    if GetContainerItemQuestInfo then
        local ok,questID,isActive=pcall(GetContainerItemQuestInfo,bag,slot)
        if ok then return tonumber(questID)~=nil or isActive==true end
    end
    return false
end

local function vendorValue(id,link)
    if not GetItemInfo then return nil,nil end
    local ok,name,_,quality,_,_,_,_,_,_,sellPrice=pcall(GetItemInfo,id or link)
    if not ok then return nil,nil end
    return tonumber(quality),tonumber(sellPrice) or 0,name
end

function I:CountFreeSlots()
    local total=0
    for bag=0,maxBag() do total=total+freeSlots(bag) end
    return total
end

function I:ScanJunk()
    local items,totalValue,totalCount={},{},0
    totalValue=0
    for bag=0,maxBag() do
        for slot=1,slots(bag) do
            local info=itemInfo(bag,slot)
            if info and not info.locked and not questItem(bag,slot) then
                local id=itemID(bag,slot,info)
                local quality,price,name=vendorValue(id,info.link)
                quality=quality or info.quality
                if quality==0 and price and price>0 and not info.hasNoValue then
                    local count=tonumber(info.count) or 1
                    items[#items+1]={
                        bag=bag,slot=slot,itemID=id,link=info.link,name=name,
                        count=count,unitValue=price,value=price*count,
                    }
                    totalValue=totalValue+price*count
                    totalCount=totalCount+count
                end
            end
        end
    end
    return {items=items,stacks=#items,count=totalCount,value=totalValue}
end

function I:SortBags()
    if InCombatLockdown and InCombatLockdown() then return false,"in_combat" end
    if C_Container and C_Container.SortBags then
        local ok=pcall(C_Container.SortBags)
        return ok,ok and "sorted" or "failed"
    end
    if SortBags then
        local ok=pcall(SortBags)
        return ok,ok and "sorted" or "failed"
    end
    return false,"api_missing"
end

function I:Refresh(reason)
    local snapshot={
        reason=reason,
        freeSlots=self:CountFreeSlots(),
        junk=self:ScanJunk(),
        updatedAt=time and time() or 0,
    }
    self.state.snapshot=snapshot
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.inventory=MG.Util:Copy(snapshot)
    end
    return snapshot
end

function I:CheckLowSlots(reason)
    local snapshot=self:Refresh(reason or "bag_update")
    local settings=MG:EnsureDB().settings
    if settings.notifyLowBagSpace==false then return snapshot end
    local threshold=tonumber(settings.inventoryLowSlotsThreshold) or 4
    local low=snapshot.freeSlots<=threshold
    if low and not self.state.wasLow and MG.NotificationCenter then
        MG.NotificationCenter:Notify("inventory","Taschen fast voll",
            tostring(snapshot.freeSlots).." freie Plätze verbleiben.",{
                freeSlots=snapshot.freeSlots,threshold=threshold,
            })
    end
    self.state.wasLow=low
    return snapshot
end

function I:GetSnapshot()
    return self.state.snapshot or self:Refresh("snapshot")
end
