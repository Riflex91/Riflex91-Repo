local addonName, MG = ...

MG.SettingsWindow = MG.SettingsWindow or {}
local S = MG.SettingsWindow
local UI = MG.UICompat

local WIDTH,HEIGHT=570,610
local MAX_ROWS=14
local ROW_HEIGHT=30

local PAGES={
    display={
        title="Anzeige",
        subtitle="Viewer, Navigator, Karte und Skin",
        options={
            {key="showViewer",label="Hauptfenster anzeigen",type="bool"},
            {key="viewerLocked",label="Hauptfenster sperren",type="bool"},
            {key="viewerScale",label="Hauptfenster-Skalierung",type="cycle",values={.8,.9,1,1.1,1.2,1.3,1.4},suffix="x"},
            {key="viewerOpacity",label="Hauptfenster-Deckkraft",type="cycle",values={.45,.6,.75,.9,1},format="percent"},
            {key="hideViewerInCombat",label="Hauptfenster im Kampf ausblenden",type="bool"},
            {key="showGuideProgress",label="Guide-Fortschrittsbalken anzeigen",type="bool"},
            {key="showNextStepPreview",label="Vorschau auf nächsten Schritt",type="bool"},
            {key="showNavigator",label="Navigator anzeigen",type="bool"},
            {key="navigatorLocked",label="Navigator sperren",type="bool"},
            {key="navigatorScale",label="Navigator-Skalierung",type="cycle",values={.8,1,1.2,1.4},suffix="x"},
            {key="navigatorArrowCalibration",label="Pfeil-Kalibrierung",type="cycle",values={-90,0,90,180},suffix="°"},
            {key="showNavigatorDistance",label="Navigator: Distanz anzeigen",type="bool"},
            {key="showNavigatorTarget",label="Navigator: Zieltext anzeigen",type="bool"},
            {key="showNavigatorRoute",label="Navigator: Routenstatus anzeigen",type="bool"},
        },
    },
    notifications={
        title="Meldungen",
        subtitle="Popups, Archiv und Ereignisfilter",
        options={
            {key="notificationsEnabled",label="Benachrichtigungen aktiv",type="bool"},
            {key="notificationPopups",label="Popup-Meldungen anzeigen",type="bool"},
            {key="notificationChat",label="Meldungen zusätzlich im Chat",type="bool"},
            {key="notificationDuration",label="Popup-Dauer",type="cycle",values={3,5,6,8,10},suffix="s"},
            {key="notifyGuideEvents",label="Guide-Fortschritt melden",type="bool"},
            {key="notifyInventoryEvents",label="Inventar-Ereignisse melden",type="bool"},
            {key="notifyMerchantEvents",label="Händler-/Reparatur-Ereignisse melden",type="bool"},
            {key="notifyLowBagSpace",label="Bei wenig Taschenplatz warnen",type="bool"},
            {key="notifyMerchantSummary",label="Händler-Zusammenfassung anzeigen",type="bool"},
            {key="diagnostics",label="Diagnoseprotokoll aktivieren",type="bool"},
        },
    },
    convenience={
        title="Komfort",
        subtitle="Inventar, Händler und sichere Automationen",
        options={
            {key="autoSellGray",label="Graue Gegenstände automatisch verkaufen",type="bool",danger=true},
            {key="autoRepair",label="Beim Händler automatisch reparieren",type="bool"},
            {key="repairUseGuild",label="Wenn möglich Gildenreparatur verwenden",type="bool"},
            {key="repairFallbackOwnMoney",label="Sonst eigenes Gold für Reparatur",type="bool"},
            {key="inventoryLowSlotsThreshold",label="Warnschwelle freie Taschenplätze",type="cycle",values={1,2,3,4,5,6,8,10}},
            {key="inventoryOpenAtMerchant",label="Inventar-Komfortfenster beim Händler öffnen",type="bool"},
            {key="showGearAdvisor",label="Questbelohnungs-Berater anzeigen",type="bool"},
            {key="showBuildAdvisor",label="Build-/Training-Hinweise anzeigen",type="bool"},
            {key="autoSuperTrack",label="Questziel automatisch SuperTracken",type="bool"},
            {key="autoAcceptQuests",label="Quests automatisch annehmen",type="bool",danger=true},
            {key="autoTurnInQuests",label="Quests ohne Auswahl auto-abgeben",type="bool",danger=true},
            {key="autoSelectSingleReward",label="Einzelne Questbelohnung automatisch wählen",type="bool",danger=true},
        },
    },
    guide={
        title="Guide",
        subtitle="Guide-Verhalten und importierte Routendaten",
        options={
            {key="autoAdvance",label="Schritte automatisch weiterschalten",type="bool",guide=true},
            {key="showCompletedGoals",label="Abgeschlossene Ziele anzeigen",type="bool"},
            {key="showPassiveHints",label="Passive Hinweise anzeigen",type="bool"},
            {key="respectHideWindow",label="Guide-Anweisung zum Ausblenden beachten",type="bool"},
            {key="rxpEraMode",label="Era-Routen aktiv",type="bool",guide=true},
            {key="rxpSoMMode",label="Season-of-Mastery-Routen aktiv",type="bool",guide=true},
            {key="rxpSoDMode",label="Season-of-Discovery-Routen aktiv",type="bool",guide=true},
            {key="rxpHardcoreMode",label="Hardcore-Routen verwenden",type="bool",guide=true},
            {key="rxpSSFMode",label="Self-Found / SSF",type="bool",guide=true},
            {key="allowAuctionHouse",label="Auktionshaus-Schritte erlauben",type="bool",guide=true},
            {key="rxpPhase",label="Content-Phase",type="cycle",values={1,2,3,4,5,6},prefix="P",guide=true},
            {key="rxpRate",label="XP-Rate",type="cycle",values={1,1.5,2,3},suffix="x",guide=true},
            {key="theme",label="Skin",type="theme"},
            {key="showMinimapButton",label="Minimap-Button anzeigen",type="bool"},
        },
    },
}
local PAGE_ORDER={"display","notifications","convenience","guide"}

local function solid(parent,layer,r,g,b,a)
    local t=parent:CreateTexture(nil,layer or "BACKGROUND")
    UI:SetSolid(t,r,g,b,a);return t
end

local function shadow(font)
    if font.SetShadowColor then font:SetShadowColor(0,0,0,1) end
    if font.SetShadowOffset then font:SetShadowOffset(1,-1) end
end

local function button(parent,text,width,height,callback)
    local b=CreateFrame("Button",nil,parent);UI:SetSize(b,width,height)
    local bg=solid(b,"BACKGROUND",.10,.07,.03,1);bg:SetAllPoints()
    local top=solid(b,"BORDER",.78,.47,.08,.9)
    top:SetPoint("TOPLEFT");top:SetPoint("TOPRIGHT");top:SetHeight(1)
    local l=b:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    l:SetPoint("CENTER");l:SetText(text);shadow(l)
    if l.SetTextColor then l:SetTextColor(1,.74,.12) end
    b:SetScript("OnEnter",function() UI:SetSolid(bg,.19,.11,.03,1) end)
    b:SetScript("OnLeave",function() UI:SetSolid(bg,.10,.07,.03,1) end)
    b:SetScript("OnClick",callback);b.label=l;b.bg=bg;return b
end

local function modeChange()
    if MG.GuideCatalog then MG.GuideCatalog:Load(true) end
    if MG.RuntimeEngine and MG.RuntimeEngine.session then
        MG.RuntimeEngine:Refresh("settings_mode_changed")
    end
end

local function cycleValue(option,current)
    local values=option.values or {}
    local index=1
    for i,value in ipairs(values) do if value==current then index=i break end end
    return values[index%#values+1] or current
end

local function optionText(option,value)
    if option.type=="bool" then return value and "AN" or "AUS" end
    if option.type=="theme" then return tostring(value or "Mewthisch Classic") end
    if option.format=="percent" then return tostring(math.floor((tonumber(value) or 1)*100+.5)).."%" end
    return tostring(option.prefix or "")..tostring(value)..tostring(option.suffix or "")
end

local function changeOption(option)
    local db=MG:EnsureDB()
    local current=db.settings[option.key]
    if option.type=="bool" then
        db.settings[option.key]=not current
    elseif option.type=="cycle" then
        db.settings[option.key]=cycleValue(option,current)
    elseif option.type=="theme" and MG.ThemeManager then
        local order=MG.ThemeManager.order or {}
        local index=1
        for i,name in ipairs(order) do if name==current then index=i break end end
        MG.ThemeManager:Set(order[index%#order+1] or order[1])
    end

    if option.guide then modeChange() end
    if option.key=="showMinimapButton" and MG.MinimapButton then MG.MinimapButton:Refresh() end
    if MG.RefreshUI then MG:RefreshUI() end
    if MG.InventoryWindow then MG.InventoryWindow:Refresh() end
    S:Refresh()
end

function S:Create()
    if self.frame then return self.frame end
    local frame=CreateFrame("Frame","MewthischGuides1Settings",UIParent)
    UI:SetSize(frame,WIDTH,HEIGHT);frame:SetPoint("CENTER",0,10)
    UI:SetFrameStrata(frame,"FULLSCREEN_DIALOG");UI:SetClampedToScreen(frame,true)
    frame:SetMovable(true);frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart",function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop",function(self) if self.StopMovingOrSizing then self:StopMovingOrSizing() end end)

    local bg=solid(frame,"BACKGROUND",.012,.015,.02,1);bg:SetAllPoints()
    local header=solid(frame,"BORDER",.035,.04,.05,1)
    header:SetPoint("TOPLEFT",1,-1);header:SetPoint("TOPRIGHT",-1,-1);header:SetHeight(38)
    local top=solid(frame,"ARTWORK",.95,.56,.06,1)
    top:SetPoint("TOPLEFT",1,-1);top:SetPoint("TOPRIGHT",-1,-1);top:SetHeight(1)

    local title=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormalLarge","GameFontNormal"))
    title:SetPoint("TOPLEFT",12,-11);title:SetText("Mewthisch Guides - Einstellungen");shadow(title)
    if title.SetTextColor then title:SetTextColor(1,.74,.10) end
    local close=button(frame,"x",24,22,function() frame:Hide() end);close:SetPoint("TOPRIGHT",-7,-8)

    local pageTitle=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontNormal","GameFontNormal"))
    pageTitle:SetPoint("TOPLEFT",14,-50);shadow(pageTitle)
    local subtitle=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlightSmall","GameFontNormalSmall"))
    subtitle:SetPoint("TOPLEFT",14,-69);subtitle:SetWidth(WIDTH-28);subtitle:SetJustifyH("LEFT");shadow(subtitle)
    if subtitle.SetTextColor then subtitle:SetTextColor(.68,.68,.68) end

    local tabs={}
    local tabNames={display="ANZEIGE",notifications="MELDUNGEN",convenience="KOMFORT",guide="GUIDE"}
    for i,key in ipairs(PAGE_ORDER) do
        local tab=button(frame,tabNames[key],126,24,function() S.page=key;S:Refresh() end)
        tab:SetPoint("TOPLEFT",14+(i-1)*134,-91);tabs[key]=tab
    end

    local rows={}
    for i=1,MAX_ROWS do
        local y=-132-(i-1)*ROW_HEIGHT
        local label=frame:CreateFontString(nil,"OVERLAY",UI:SafeFont("GameFontHighlight","GameFontNormal"))
        label:SetPoint("TOPLEFT",18,y);label:SetWidth(385);label:SetJustifyH("LEFT");shadow(label)
        local toggle=button(frame,"",124,22,function()
            local row=rows[i]
            if row and row.option then changeOption(row.option) end
        end)
        toggle:SetPoint("TOPRIGHT",-18,y+4)
        rows[i]={label=label,button=toggle}
    end

    local guides=button(frame,"GUIDES",72,24,function() if MG.GuideBrowser then MG.GuideBrowser:Toggle(true) end end)
    guides:SetPoint("BOTTOMLEFT",14,14)
    local inventory=button(frame,"INVENTAR",82,24,function() if MG.InventoryWindow then MG.InventoryWindow:Toggle(true) end end)
    inventory:SetPoint("LEFT",guides,"RIGHT",6,0)
    local notify=button(frame,"MELDUNGEN",94,24,function() if MG.NotificationWindow then MG.NotificationWindow:Toggle(true) end end)
    notify:SetPoint("LEFT",inventory,"RIGHT",6,0)
    local log=button(frame,"LOG",54,24,function() if MG.ErrorLogWindow then MG.ErrorLogWindow:Toggle() end end)
    log:SetPoint("LEFT",notify,"RIGHT",6,0)
    local reset=button(frame,"POSITIONEN RESET",122,24,function()
        local db=MG:EnsureDB();db.ui={};db.settings.minimapAngle=215
        if MG.GuideViewer and MG.GuideViewer.ResetPosition then MG.GuideViewer:ResetPosition() end
        if MG.NavigatorFrame and MG.NavigatorFrame.ResetPosition then MG.NavigatorFrame:ResetPosition() end
        if MG.MinimapButton then MG.MinimapButton:Refresh() end
    end)
    reset:SetPoint("BOTTOMRIGHT",-14,14)

    self.frame=frame;self.rows=rows;self.tabs=tabs;self.pageTitle=pageTitle;self.subtitle=subtitle
    self.page=self.page or "display"
    frame:SetScript("OnShow",function() S:Refresh() end)
    frame:Hide()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return frame
end

function S:Refresh()
    self:Create()
    local page=PAGES[self.page] or PAGES.display
    local db=MG:EnsureDB()
    self.pageTitle:SetText(page.title)
    self.subtitle:SetText(page.subtitle)

    for key,tab in pairs(self.tabs or {}) do
        tab.label:SetText((key==self.page and "> " or "")..
            ({display="ANZEIGE",notifications="MELDUNGEN",convenience="KOMFORT",guide="GUIDE"})[key])
    end

    for i,row in ipairs(self.rows) do
        local option=page.options[i]
        row.option=option
        if option then
            row.label:Show();row.button:Show()
            row.label:SetText(option.label)
            local value=db.settings[option.key]
            row.button.label:SetText(optionText(option,value))
            if option.type=="bool" and row.button.label.SetTextColor then
                if value then row.button.label:SetTextColor(.35,.95,.48)
                else row.button.label:SetTextColor(.95,.42,.32) end
            elseif row.button.label.SetTextColor then
                local theme=MG.ThemeManager and MG.ThemeManager:GetCurrent()
                local color=theme and theme.title or {1,.74,.12,1}
                row.button.label:SetTextColor(color[1],color[2],color[3],color[4] or 1)
            end
        else
            row.label:Hide();row.button:Hide()
        end
    end
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
end

function S:Toggle(force)
    local frame=self:Create()
    local show=force;if show==nil then show=not frame:IsShown() end
    if show then self:Refresh();frame:Show() else frame:Hide() end
end
