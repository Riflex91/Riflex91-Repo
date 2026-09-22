local addonName, MG = ...

MG.SettingsWindow = MG.SettingsWindow or {}
local S = MG.SettingsWindow
local UI = MG.UICompat

local WIDTH = 430
local ROW_HEIGHT = 28

local BOOL_OPTIONS = {
    { key="showViewer", label="Hauptfenster anzeigen" },
    { key="showNavigator", label="Navigator anzeigen" },
    { key="showMinimapButton", label="Minimap-Button anzeigen" },
    { key="navigatorLocked", label="Navigator sperren" },
    { key="autoSuperTrack", label="Questziel automatisch SuperTracken" },
    { key="showWorldMapMarker", label="Weltkartenmarker anzeigen" },
    { key="showActionBar", label="Aktionsleiste anzeigen" },
    { key="showGearAdvisor", label="Questbelohnungs-Berater anzeigen" },
    { key="showBuildAdvisor", label="Build-/Training-Hinweise anzeigen" },
    { key="showPassiveHints", label="Passive Hinweise anzeigen" },
    { key="showCompletedGoals", label="Abgeschlossene Ziele anzeigen" },
    { key="respectHideWindow", label="RestedXP hidewindow beachten" },
    { key="autoAdvance", label="Schritte automatisch weiterschalten" },
    { key="autoAcceptQuests", label="Quests automatisch annehmen" },
    { key="autoTurnInQuests", label="Quests ohne Belohnungswahl auto-abgeben" },
    { key="diagnostics", label="Diagnoseprotokoll aktivieren" },
    { key="rxpEraMode", label="RestedXP: Era aktiv" },
    { key="rxpSoMMode", label="RestedXP: Season of Mastery" },
    { key="rxpSoDMode", label="RestedXP: Season of Discovery" },
    { key="rxpHardcoreMode", label="RestedXP: Hardcore-Guide" },
    { key="rxpSSFMode", label="Self-Found / SSF" },
    { key="allowAuctionHouse", label="Auktionshaus-Schritte erlauben" },
}

local function makeSolid(parent, layer, r, g, b, a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a);return t
end

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function button(parent,text,width,height,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,height)
    local bg=makeSolid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local top=makeSolid(b,"BORDER",.78,.47,.08,.9)
    top:SetPoint("TOPLEFT");top:SetPoint("TOPRIGHT");top:SetHeight(1)
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.19,.11,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,1) end)
    b:SetScript("OnClick",callback);b.label=l;return b
end

local function modeChange()
    if MG.GuideCatalog then MG.GuideCatalog:Load(true) end
    if MG.RuntimeEngine and MG.RuntimeEngine.session then
        MG.RuntimeEngine:Refresh("settings_mode_changed")
    end
    if MG.RefreshUI then MG:RefreshUI() end
end

function S:Create()
    if self.frame then return self.frame end

    local height=180+#BOOL_OPTIONS*ROW_HEIGHT+84
    local frame=CreateFrame("Frame","MewthischGuides1Settings",UIParent)
    UI:SetSize(frame,WIDTH,height);frame:SetPoint("CENTER",0,10)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)

    local bg=makeSolid(frame,"BACKGROUND",.012,.015,.02,1);bg:SetAllPoints()
    local header=makeSolid(frame,"BORDER",.035,.04,.05,1)
    header:SetPoint("TOPLEFT",1,-1);header:SetPoint("TOPRIGHT",-1,-1);header:SetHeight(36)
    local top=makeSolid(frame,"ARTWORK",.95,.56,.06,1)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",12,-10);title:SetText("Mewthisch Guides - Einstellungen");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.10) end

    local close=button(frame,"x",24,22,function() frame:Hide() end)
    close:SetPoint("TOPRIGHT",-6,-7)

    local subtitle=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    subtitle:SetPoint("TOPLEFT",12,-47)
    subtitle:SetText("Änderungen gelten sofort. Automationen sind standardmäßig AUS.")
    if subtitle.SetTextColor then subtitle:SetTextColor(.72,.72,.72) end;shadow(subtitle)

    local quickBrowser=button(frame,"GUIDES",82,24,function()
        if MG.GuideBrowser then MG.GuideBrowser:Toggle(true) end
    end)
    quickBrowser:SetPoint("TOPLEFT",12,-68)
    local quickBuild=button(frame,"BUILD",72,24,function()
        if MG.BuildWindow then MG.BuildWindow:Toggle(true) end
    end)
    quickBuild:SetPoint("LEFT",quickBrowser,"RIGHT",6,0)
    local quickLog=button(frame,"LOG",62,24,function()
        if MG.ErrorLogWindow then MG.ErrorLogWindow:Toggle() end
    end)
    quickLog:SetPoint("LEFT",quickBuild,"RIGHT",6,0)
    local themeButton=button(frame,"THEME",84,24,function()
        if MG.ThemeManager then
            MG.ThemeManager:Next()
            S:Refresh()
        end
    end)
    themeButton:SetPoint("LEFT",quickLog,"RIGHT",6,0)

    local phaseLabel=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    phaseLabel:SetPoint("TOPLEFT",12,-105);phaseLabel:SetText("RestedXP Phase");shadow(phaseLabel)
    local phase=button(frame,"",66,22,function()
        local db=MG:EnsureDB()
        local value=(tonumber(db.settings.rxpPhase) or 6)+1
        if value>6 then value=1 end
        db.settings.rxpPhase=value
        S:Refresh();modeChange()
    end)
    phase:SetPoint("TOPLEFT",112,-100)

    local scaleLabel=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    scaleLabel:SetPoint("TOPLEFT",338,-105);scaleLabel:SetText("Pfeil");shadow(scaleLabel)
    local scale=button(frame,"",58,22,function()
        local db=MG:EnsureDB()
        local values={0.8,1,1.2,1.4}
        local current=tonumber(db.settings.navigatorScale) or 1
        local index=1
        for i,v in ipairs(values) do if v==current then index=i break end end
        index=index%#values+1
        db.settings.navigatorScale=values[index]
        S:Refresh()
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    scale:SetPoint("TOPLEFT",368,-100)

    local rateLabel=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    rateLabel:SetPoint("TOPLEFT",198,-105);rateLabel:SetText("XP-Rate");shadow(rateLabel)
    local rate=button(frame,"",70,22,function()
        local db=MG:EnsureDB()
        local values={1,1.5,2,3}
        local current=tonumber(db.settings.rxpRate) or 1
        local index=1
        for i,v in ipairs(values) do if v==current then index=i break end end
        index=index%#values+1
        db.settings.rxpRate=values[index]
        S:Refresh();modeChange()
    end)
    rate:SetPoint("TOPLEFT",260,-100)

    local calibration=button(frame,"",58,22,function()
        local db=MG:EnsureDB()
        local values={-90,0,90,180}
        local current=tonumber(db.settings.navigatorArrowCalibration) or -90
        local index=1
        for i,v in ipairs(values) do if v==current then index=i break end end
        index=index%#values+1
        db.settings.navigatorArrowCalibration=values[index]
        S:Refresh()
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    calibration:SetPoint("TOPRIGHT",-14,-128)
    local calibrationLabel=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    calibrationLabel:SetPoint("RIGHT",calibration,"LEFT",-8,0)
    calibrationLabel:SetText("Pfeil-Kalibrierung");shadow(calibrationLabel)

    local rows={}
    for i,option in ipairs(BOOL_OPTIONS) do
        local y=-166-(i-1)*ROW_HEIGHT
        local label=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
        label:SetPoint("TOPLEFT",14,y);label:SetWidth(310);label:SetJustifyH("LEFT")
        label:SetText(option.label);shadow(label)

        local toggle=button(frame,"",64,22,function()
            local db=MG:EnsureDB()
            db.settings[option.key]=not db.settings[option.key]
            S:Refresh()
            if string.sub(option.key,1,3)=="rxp" or option.key=="allowAuctionHouse" then
                modeChange()
            elseif option.key=="showMinimapButton" and MG.MinimapButton then
                MG.MinimapButton:Refresh()
            elseif MG.RefreshUI then
                MG:RefreshUI()
            end
        end)
        toggle:SetPoint("TOPRIGHT",-14,y+4)
        rows[#rows+1]={option=option,button=toggle}
    end

    local reset=button(frame,"Fenster-/Minimap-Positionen zurücksetzen",260,26,function()
        local db=MG:EnsureDB();db.ui={};db.settings.minimapAngle=215
        if MG.GuideViewer and MG.GuideViewer.ResetPosition then MG.GuideViewer:ResetPosition() end
        if MG.NavigatorFrame and MG.NavigatorFrame.ResetPosition then MG.NavigatorFrame:ResetPosition() end
        if MG.MinimapButton then MG.MinimapButton:Refresh() end
    end)
    reset:SetPoint("BOTTOM",0,14)

    self.frame=frame;self.rows=rows;self.phaseButton=phase;self.rateButton=rate
    self.scaleButton=scale;self.calibrationButton=calibration;self.themeButton=themeButton
    frame:Hide();return frame
end

function S:Refresh()
    self:Create()
    local db=MG:EnsureDB()
    self.phaseButton.label:SetText("P"..tostring(db.settings.rxpPhase or 6))
    self.rateButton.label:SetText(tostring(db.settings.rxpRate or 1).."x")
    self.scaleButton.label:SetText(tostring(db.settings.navigatorScale or 1).."x")
    self.calibrationButton.label:SetText(tostring(db.settings.navigatorArrowCalibration or -90).."°")
    self.themeButton.label:SetText(tostring(db.settings.theme or "Forever Classic"))

    for _,row in ipairs(self.rows or {}) do
        local enabled=db.settings[row.option.key] and true or false
        row.button.label:SetText(enabled and "AN" or "AUS")
        if row.button.label.SetTextColor then
            if enabled then row.button.label:SetTextColor(.35,.95,.48)
            else row.button.label:SetTextColor(.95,.42,.32) end
        end
    end
end

function S:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then self:Refresh();frame:Show() else frame:Hide() end
end
