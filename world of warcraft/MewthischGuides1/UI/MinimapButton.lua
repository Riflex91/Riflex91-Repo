local addonName, MG = ...

MG.MinimapButton = MG.MinimapButton or {}
local M = MG.MinimapButton
local UI = MG.UICompat
local RADIUS = 82

local function atan2(y,x)
    if math.atan2 then return math.atan2(y,x) end
    if x>0 then return math.atan(y/x) end
    if x<0 and y>=0 then return math.atan(y/x)+math.pi end
    if x<0 and y<0 then return math.atan(y/x)-math.pi end
    if x==0 and y>0 then return math.pi/2 end
    if x==0 and y<0 then return -math.pi/2 end
    return 0
end

local function position(frame)
    if not frame or not Minimap or not frame.SetPoint then return end
    local db=MG:EnsureDB()
    local angle=math.rad(tonumber(db.settings.minimapAngle) or 215)
    frame:ClearAllPoints()
    frame:SetPoint("CENTER",Minimap,"CENTER",
        math.cos(angle)*RADIUS,math.sin(angle)*RADIUS)
end

function M:ApplyTheme(theme)
    if not self.frame then return end
    theme=theme or (MG.ThemeManager and MG.ThemeManager:GetCurrent())
    if not theme then return end
    if self.background then
        UI:SetSolid(self.background,
            theme.header[1],theme.header[2],theme.header[3],theme.header[4] or 1)
    end
    if self.border then
        UI:SetSolid(self.border,
            theme.accent[1],theme.accent[2],theme.accent[3],theme.accent[4] or 1)
    end
    if self.label and self.label.SetTextColor then
        pcall(self.label.SetTextColor,self.label,
            theme.title[1],theme.title[2],theme.title[3],theme.title[4] or 1)
    end
end

function M:Create()
    if self.frame then return self.frame end
    if not Minimap then return nil end

    local frame=CreateFrame("Button","MewthischGuides1MinimapButton",Minimap)
    UI:SetSize(frame,30,30)
    UI:SetFrameStrata(frame,"MEDIUM")
    UI:SetClampedToScreen(frame,true)

    local border=frame:CreateTexture(nil,"BACKGROUND");border:SetAllPoints()
    local bg=frame:CreateTexture(nil,"BORDER")
    bg:SetPoint("TOPLEFT",2,-2);bg:SetPoint("BOTTOMRIGHT",-2,2)
    local label=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalSmall","GameFontNormal"))
    label:SetPoint("CENTER",0,0);label:SetText("MG")
    local badge=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalSmall","GameFontNormal"))
    badge:SetPoint("TOPRIGHT",4,4);badge:SetText("");badge:Hide()
    if badge.SetTextColor then badge:SetTextColor(1,.74,.1) end

    if frame.RegisterForClicks then frame:RegisterForClicks("LeftButtonUp","RightButtonUp") end
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end

    frame:SetScript("OnClick",function(_,button)
        if button=="RightButton" then
            if MG.SettingsWindow then MG.SettingsWindow:Toggle(true) end
            return
        end
        local db=MG:EnsureDB()
        local viewer=MG.GuideViewer and MG.GuideViewer:Create() or nil
        local shown=viewer and viewer.IsShown and viewer:IsShown()
        db.settings.showViewer=not shown
        if MG.RefreshUI then MG:RefreshUI() end
    end)

    frame:SetScript("OnDragStart",function(self) self._mgDragging=true end)
    frame:SetScript("OnDragStop",function(self) self._mgDragging=false end)
    frame:SetScript("OnUpdate",function(self)
        if not self._mgDragging or not GetCursorPosition or not Minimap.GetCenter then return end
        local mx,my=Minimap:GetCenter()
        if not mx or not my then return end
        local scale=Minimap.GetEffectiveScale and Minimap:GetEffectiveScale() or 1
        if not scale or scale==0 then scale=1 end
        local cx,cy=GetCursorPosition();cx,cy=cx/scale,cy/scale
        MG:EnsureDB().settings.minimapAngle=math.deg(atan2(cy-my,cx-mx))
        position(self)
    end)

    frame:SetScript("OnEnter",function(self)
        if not GameTooltip then return end
        GameTooltip:SetOwner(self,"ANCHOR_LEFT")
        GameTooltip:AddLine("Mewthisch Guides")
        GameTooltip:AddLine("Linksklick: Guide ein-/ausblenden",1,1,1)
        GameTooltip:AddLine("Rechtsklick: Einstellungen",1,1,1)
        GameTooltip:AddLine("Ziehen: Position ändern",1,1,1)
        GameTooltip:Show()
    end)
    frame:SetScript("OnLeave",function() if GameTooltip then GameTooltip:Hide() end end)

    self.frame=frame;self.background=bg;self.border=border;self.label=label;self.badge=badge
    position(frame)
    if MG.ThemeManager then self:ApplyTheme(MG.ThemeManager:GetCurrent()) end
    self:Refresh()
    return frame
end

function M:Refresh()
    local frame=self.frame or self:Create()
    if not frame then return end
    local db=MG:EnsureDB()
    position(frame)
    local unread=MG.NotificationCenter and MG.NotificationCenter:GetUnreadCount() or 0
    if self.badge then
        if unread>0 then
            self.badge:SetText(unread>9 and "9+" or tostring(unread));self.badge:Show()
        else self.badge:Hide() end
    end
    UI:SetShown(frame,db.settings.showMinimapButton~=false)
end

local loader=CreateFrame("Frame")
if loader.RegisterEvent then pcall(loader.RegisterEvent,loader,"PLAYER_LOGIN") end
if loader.SetScript then
    loader:SetScript("OnEvent",function()
        MG:EnsureDB()
        M:Create()
        M:Refresh()
    end)
end
