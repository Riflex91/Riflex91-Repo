local addonName, MG = ...

MG.MerchantAutomation = MG.MerchantAutomation or {}
local M = MG.MerchantAutomation
M.queue=M.queue or {}

local function moneyText(copper)
    copper=math.max(0,math.floor(tonumber(copper) or 0))
    local gold=math.floor(copper/10000)
    local silver=math.floor((copper%10000)/100)
    local bronze=copper%100
    if gold>0 then return string.format("%dg %ds %dc",gold,silver,bronze) end
    if silver>0 then return string.format("%ds %dc",silver,bronze) end
    return string.format("%dc",bronze)
end

local function merchantVisible()
    if MerchantFrame and MerchantFrame.IsShown then
        local ok,value=pcall(MerchantFrame.IsShown,MerchantFrame)
        if ok then return value and true or false end
    end
    return M.merchantOpen and true or false
end

local function useItem(bag,slot)
    if C_Container and C_Container.UseContainerItem then
        return pcall(C_Container.UseContainerItem,bag,slot)
    end
    if UseContainerItem then return pcall(UseContainerItem,bag,slot) end
    return false
end

function M:CanRepair()
    if not merchantVisible() then return false,"merchant_closed" end
    if CanMerchantRepair then
        local ok,value=pcall(CanMerchantRepair)
        if ok and value==false then return false,"merchant_cannot_repair" end
    end
    if not RepairAllItems or not GetRepairAllCost then return false,"repair_api_missing" end
    return true
end

function M:Repair(manual)
    local ok,reason=self:CanRepair()
    if not ok then return false,reason end
    local success,cost,canRepair=pcall(GetRepairAllCost)
    if not success then return false,"repair_cost_failed" end
    cost=tonumber(cost) or 0
    if cost<=0 then return true,"nothing_to_repair",0 end
    if canRepair==false then return false,"cannot_repair",cost end

    local settings=MG:EnsureDB().settings
    local useGuild=false
    if settings.repairUseGuild and CanGuildBankRepair then
        local guildOK,allowed=pcall(CanGuildBankRepair)
        useGuild=guildOK and allowed and true or false
    end

    local repaired=false
    if useGuild then repaired=pcall(RepairAllItems,true) end
    if not repaired and (not useGuild or settings.repairFallbackOwnMoney~=false) then
        local money=GetMoney and tonumber(GetMoney()) or 0
        if money<cost then return false,"not_enough_money",cost end
        repaired=pcall(RepairAllItems,false)
        useGuild=false
    end
    if not repaired then return false,"repair_failed",cost end

    if MG.NotificationCenter and settings.notifyMerchantSummary~=false then
        MG.NotificationCenter:Notify("repair","Ausrüstung repariert",
            moneyText(cost)..(useGuild and " aus Gildenmitteln." or " bezahlt."),{
                cost=cost,guild=useGuild,manual=manual and true or false,
            })
    end
    if MG.Telemetry then MG.Telemetry:Count("merchant.repair",{cost=cost,guild=useGuild}) end
    return true,useGuild and "guild" or "personal",cost
end

function M:StartSellGray(manual)
    if not merchantVisible() then return false,"merchant_closed" end
    local scan=MG.InventoryTools and MG.InventoryTools:ScanJunk() or nil
    if not scan or #scan.items==0 then
        if manual and MG.NotificationCenter then
            MG.NotificationCenter:Notify("merchant","Keine grauen Gegenstände",
                "Es gibt aktuell nichts Sicheres zu verkaufen.")
        end
        return true,"nothing_to_sell",0
    end

    self.queue={}
    for _,item in ipairs(scan.items) do self.queue[#self.queue+1]=item end
    self.sellExpected=scan.value
    self.sellStacks=scan.stacks
    self.sellCount=scan.count
    self.sellManual=manual and true or false
    self.moneyBefore=GetMoney and tonumber(GetMoney()) or nil
    self.soldAttempted=0
    self.pendingRepair=MG:EnsureDB().settings.autoRepair and true or false
    self:EnsureDriver()
    self.driver:Show()
    return true,"queued",scan.value
end

function M:EnsureDriver()
    if self.driver then return self.driver end
    local frame=CreateFrame("Frame")
    local elapsed=0
    frame:SetScript("OnUpdate",function(self,delta)
        elapsed=elapsed+(tonumber(delta) or 0)
        if elapsed<0.06 then return end
        elapsed=0
        if not merchantVisible() then
            M.queue={};M.pendingRepair=false;self:Hide();return
        end
        local item=table.remove(M.queue,1)
        if item then
            if useItem(item.bag,item.slot) then M.soldAttempted=M.soldAttempted+1 end
            return
        end
        self:Hide()
        local settings=MG:EnsureDB().settings
        local moneyAfter=GetMoney and tonumber(GetMoney()) or nil
        local actualGain=M.moneyBefore and moneyAfter and math.max(0,moneyAfter-M.moneyBefore) or nil
        local shownValue=actualGain or M.sellExpected or 0
        if MG.NotificationCenter and settings.notifyMerchantSummary~=false and
           (M.sellStacks or 0)>0 then
            MG.NotificationCenter:Notify("merchant","Graue Gegenstände verkauft",
                tostring(M.sellStacks or 0).." Stapel · "..moneyText(shownValue),{
                    stacks=M.sellStacks,count=M.sellCount,value=shownValue,
                    expectedValue=M.sellExpected,manual=M.sellManual,
                })
        end
        if MG.Telemetry then MG.Telemetry:Count("merchant.sell_gray",{
            stacks=M.sellStacks,value=M.sellExpected,
        }) end
        if M.pendingRepair then M.pendingRepair=false;M:Repair(false) end
        if MG.InventoryTools then MG.InventoryTools:Refresh("merchant_sale") end
        if MG.InventoryWindow then MG.InventoryWindow:Refresh() end
    end)
    frame:Hide();self.driver=frame;return frame
end

function M:OnMerchantShow()
    self.merchantOpen=true
    local settings=MG:EnsureDB().settings
    local snapshot=MG.InventoryTools and MG.InventoryTools:Refresh("merchant_show") or nil

    if settings.inventoryOpenAtMerchant and MG.InventoryWindow then
        MG.InventoryWindow:Toggle(true)
    end

    if settings.autoSellGray then
        local ok,status=self:StartSellGray(false)
        if settings.autoRepair and (not ok or status~="queued") then self:Repair(false) end
    elseif settings.autoRepair then
        self:Repair(false)
    elseif settings.notifyMerchantSummary~=false and MG.NotificationCenter and snapshot then
        local junk=snapshot.junk or {}
        if (junk.stacks or 0)>0 then
            MG.NotificationCenter:Notify("merchant","Händler geöffnet",
                tostring(junk.stacks or 0).." graue Stapel können verkauft werden · "..
                moneyText(junk.value or 0),{preview=true})
        end
    end
end

function M:OnMerchantClosed()
    self.merchantOpen=false
    self.queue={}
    self.pendingRepair=false
    if self.driver then self.driver:Hide() end
    if MG.InventoryWindow then MG.InventoryWindow:Refresh() end
end

function M:IsMerchantOpen()
    return merchantVisible()
end

function M:MoneyText(value)
    return moneyText(value)
end
