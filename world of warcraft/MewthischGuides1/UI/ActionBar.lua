local addonName, MG = ...

MG.ActionBar = MG.ActionBar or {}
local A = MG.ActionBar
local UI = MG.UICompat

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a);return t
end

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function flatButton(parent,text,width,callback)
    local b=CreateFrame("Button",nil,parent)
    UI:SetSize(b,width,28)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,.96);bg:SetAllPoints()
    local label=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    label:SetPoint("CENTER");label:SetText(text);shadow(label)
    if label.SetTextColor then label:SetTextColor(1,.75,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.20,.12,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,.96) end)
    b:SetScript("OnClick",function() if A.execute then A.execute() end end)
    b.label=label
    return b
end

local function itemIcon(itemID)
    if not itemID then return nil end
    if C_Item and C_Item.GetItemIconByID then
        local ok,value=pcall(C_Item.GetItemIconByID,itemID)
        if ok then return value end
    end
    if GetItemIcon then
        local ok,value=pcall(GetItemIcon,itemID)
        if ok then return value end
    end
    return nil
end

local function spellIcon(spellID)
    if not spellID then return nil end
    if C_Spell and C_Spell.GetSpellTexture then
        local ok,value=pcall(C_Spell.GetSpellTexture,spellID)
        if ok then return value end
    end
    if GetSpellTexture then
        local ok,value=pcall(GetSpellTexture,spellID)
        if ok then return value end
    end
    return nil
end

function A:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1ActionBar",UIParent)
    UI:SetSize(frame,340,70)
    frame:SetPoint("CENTER",UIParent,"CENTER",0,-250)
    UI:SetFrameStrata(frame,"HIGH");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)

    local bg=solid(frame,"BACKGROUND",.012,.015,.02,.94);bg:SetAllPoints()
    local top=solid(frame,"ARTWORK",.95,.56,.06,.9)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local icon=frame:CreateTexture(nil,"ARTWORK");UI:SetSize(icon,42,42);icon:SetPoint("LEFT",10,0)
    local iconBg=solid(frame,"BORDER",.05,.05,.05,1)
    iconBg:SetPoint("CENTER",icon,"CENTER");UI:SetSize(iconBg,44,44)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    title:SetPoint("TOPLEFT",60,-12);title:SetPoint("RIGHT",-102,0);title:SetJustifyH("LEFT");shadow(title)
    local hint=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    hint:SetPoint("TOPLEFT",60,-34);hint:SetPoint("RIGHT",-102,0);hint:SetJustifyH("LEFT");shadow(hint)
    if hint.SetTextColor then hint:SetTextColor(.68,.68,.68) end

    local action=flatButton(frame,"Erledigt",88,function() end)
    action:SetPoint("RIGHT",-10,0)

    self.frame=frame;self.icon=icon;self.title=title;self.hint=hint;self.button=action
    frame:Hide()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return frame
end

function A:Refresh()
    local frame=self:Create()
    local settings=MG.db and MG.db.settings or {}
    if settings.showActionBar==false then frame:Hide();return end

    local runtime=MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    local model=MG.ActionPolicy and MG.ActionPolicy:Build(runtime) or nil
    if not model then frame:Hide();return end

    self.title:SetText(tostring(model.text or model.action or "Aktion"))
    self.hint:SetText(tostring(model.hint or ""))
    self.execute=model.execute

    local texture=itemIcon(model.iconItemID) or spellIcon(model.iconSpellID)
    if texture then
        self.icon:SetTexture(texture);self.icon:Show()
    else
        self.icon:Hide()
    end

    if model.buttonLabel and model.execute then
        self.button.label:SetText(model.buttonLabel);self.button:Show()
    else
        self.button:Hide()
    end
    frame:Show()
end
