local addonName, MG = ...

MG.InventoryWindow = MG.InventoryWindow or {}
local I = MG.InventoryWindow
local UI = MG.UICompat

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND");UI:SetSolid(t,r,g,b,a);return t
end
local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end
local function button(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,26)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l);if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.19,.11,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,1) end)
    b:SetScript("OnClick",callback);b.label=l;return b
end

function I:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1Inventory",UIParent)
    UI:SetSize(frame,470,250);frame:SetPoint("CENTER",0,80)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self) if self.StartMoving then self:StartMoving() end end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)
    local bg=solid(frame,"BACKGROUND",.012,.015,.02,1);bg:SetAllPoints()
    local head=solid(frame,"BORDER",.035,.04,.05,1);head:SetPoint("TOPLEFT",1,-1);head:SetPoint("TOPRIGHT",-1,-1);head:SetHeight(38)
    local top=solid(frame,"ARTWORK",.95,.56,.06,1);top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)
    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",14,-11);title:SetText("Inventar & Händler");shadow(title);if title.SetTextColor then title:SetTextColor(1,.74,.1) end
    local close=button(frame,"x",26,function() frame:Hide() end);close:SetPoint("TOPRIGHT",-7,-7)

    local summary=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
    summary:SetPoint("TOPLEFT",16,-56);summary:SetPoint("RIGHT",-16,0);summary:SetJustifyH("LEFT");shadow(summary)
    local junk=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
    junk:SetPoint("TOPLEFT",16,-88);junk:SetPoint("RIGHT",-16,0);junk:SetJustifyH("LEFT");shadow(junk)
    local auto=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    auto:SetPoint("TOPLEFT",16,-118);auto:SetPoint("RIGHT",-16,0);auto:SetJustifyH("LEFT");shadow(auto)
    if auto.SetTextColor then auto:SetTextColor(.68,.68,.68) end
    local hint=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    hint:SetPoint("TOPLEFT",16,-145);hint:SetPoint("RIGHT",-16,0);hint:SetJustifyH("LEFT");shadow(hint)
    if hint.SetTextColor then hint:SetTextColor(.68,.68,.68) end

    local sell=button(frame,"GRAUES VERKAUFEN",136,function()
        if MG.MerchantAutomation then MG.MerchantAutomation:StartSellGray(true) end
        I:Refresh()
    end);sell:SetPoint("BOTTOMLEFT",14,14)
    local repair=button(frame,"REPARIEREN",100,function()
        if MG.MerchantAutomation then MG.MerchantAutomation:Repair(true) end
        I:Refresh()
    end);repair:SetPoint("LEFT",sell,"RIGHT",6,0)
    local sort=button(frame,"TASCHEN SORTIEREN",132,function()
        if MG.InventoryTools then
            local ok=MG.InventoryTools:SortBags()
            if ok and MG.NotificationCenter then MG.NotificationCenter:Notify("inventory","Taschen sortiert","Inventar wurde neu sortiert.") end
        end
        I:Refresh()
    end);sort:SetPoint("LEFT",repair,"RIGHT",6,0)

    self.frame=frame;self.summary=summary;self.junk=junk;self.auto=auto;self.hint=hint
    self.sell=sell;self.repair=repair
    frame:SetScript("OnShow",function() I:Refresh() end)
    frame:Hide()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return frame
end

function I:Refresh()
    if not self.frame then return end
    local snapshot=MG.InventoryTools and MG.InventoryTools:Refresh("inventory_window") or {}
    local junk=snapshot.junk or {}
    local merchant=MG.MerchantAutomation and MG.MerchantAutomation:IsMerchantOpen()
    local money=MG.MerchantAutomation and MG.MerchantAutomation:MoneyText(junk.value or 0) or tostring(junk.value or 0)
    local settings=MG:EnsureDB().settings
    self.summary:SetText("Freie Taschenplätze: "..tostring(snapshot.freeSlots or 0)..
        "   |   Händler: "..(merchant and "|cff55dd77OFFEN|r" or "|cffdd8844GESCHLOSSEN|r"))
    self.junk:SetText("Graue Gegenstände: "..tostring(junk.count or 0)..
        " in "..tostring(junk.stacks or 0).." Stapeln   |   Händlerwert: "..money)
    self.auto:SetText("Auto-Sell: "..(settings.autoSellGray and "AN" or "AUS")..
        "   |   Auto-Repair: "..(settings.autoRepair and "AN" or "AUS")..
        "   |   Warnschwelle: "..tostring(settings.inventoryLowSlotsThreshold or 4))
    self.hint:SetText(merchant and
        "Manuelle Händleraktionen sind jetzt verfügbar." or
        "Verkaufen und Reparieren werden nur bei geöffnetem Händler ausgeführt.")
    UI:SetShown(self.sell,merchant)
    UI:SetShown(self.repair,merchant)
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
end

function I:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then frame:Show();self:Refresh() else frame:Hide() end
end
