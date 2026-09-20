local addonName, FG = ...

local ui = {}
local NAV_UPDATE_INTERVAL = 0.12

local function setColorTexture(texture, r, g, b, a)
    if texture.SetColorTexture then
        texture:SetColorTexture(r, g, b, a)
    else
        texture:SetTexture(r, g, b, a)
    end
end

local function stylePanel(frame)
    frame:SetFrameStrata("DIALOG")

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints(frame)
    setColorTexture(bg, 0.025, 0.035, 0.055, 0.96)
    frame._fgBackground = bg

    local borderColor = { 0.22, 0.62, 0.78, 0.95 }
    local borderSize = 2

    local top = frame:CreateTexture(nil, "BORDER")
    top:SetPoint("TOPLEFT")
    top:SetPoint("TOPRIGHT")
    top:SetHeight(borderSize)
    setColorTexture(top, unpack(borderColor))

    local bottom = frame:CreateTexture(nil, "BORDER")
    bottom:SetPoint("BOTTOMLEFT")
    bottom:SetPoint("BOTTOMRIGHT")
    bottom:SetHeight(borderSize)
    setColorTexture(bottom, unpack(borderColor))

    local left = frame:CreateTexture(nil, "BORDER")
    left:SetPoint("TOPLEFT")
    left:SetPoint("BOTTOMLEFT")
    left:SetWidth(borderSize)
    setColorTexture(left, unpack(borderColor))

    local right = frame:CreateTexture(nil, "BORDER")
    right:SetPoint("TOPRIGHT")
    right:SetPoint("BOTTOMRIGHT")
    right:SetWidth(borderSize)
    setColorTexture(right, unpack(borderColor))
end

local function makeText(parent, template, size)
    local fs = parent:CreateFontString(nil, "OVERLAY", template or "GameFontNormal")

    if size and fs.SetFont then
        local font, _, flags = fs:GetFont()
        if font then fs:SetFont(font, size, flags) end
    end

    fs:SetJustifyH("LEFT")
    fs:SetWordWrap(true)
    return fs
end

local function makeButton(parent, text, width, callback)
    local b = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate")
    b:SetSize(width or 80, 24)
    b:SetText(text)
    b:SetScript("OnClick", callback)
    return b
end

local function setButtonEnabled(button, enabled)
    if not button then return end

    if button.SetEnabled then
        button:SetEnabled(enabled)
    elseif enabled and button.Enable then
        button:Enable()
    elseif not enabled and button.Disable then
        button:Disable()
    end
end

local function createPixelHeart(parent)
    local heart = CreateFrame("Frame", nil, parent)
    heart:SetSize(19, 16)

    local cells = {
        { 1, 0 }, { 3, 0 },
        { 0, 1 }, { 1, 1 }, { 2, 1 }, { 3, 1 }, { 4, 1 },
        { 1, 2 }, { 2, 2 }, { 3, 2 },
        { 2, 3 },
    }

    for _, cell in ipairs(cells) do
        local px = heart:CreateTexture(nil, "ARTWORK")
        px:SetSize(3, 3)
        px:SetPoint("TOPLEFT", cell[1] * 3 + 1, -(cell[2] * 3 + 1))
        setColorTexture(px, 1.0, 0.18, 0.34, 1.0)
    end

    return heart
end

local function makeCheck(parent, y, labelText, settingKey, onChanged)
    local check = CreateFrame("CheckButton", nil, parent, "UICheckButtonTemplate")
    check:SetSize(24, 24)
    check:SetPoint("TOPLEFT", 18, y)

    local label = makeText(parent, "GameFontHighlight", 12)
    label:SetPoint("LEFT", check, "RIGHT", 4, 0)
    label:SetPoint("RIGHT", parent, -18, 0)
    label:SetText(labelText)

    check._settingKey = settingKey
    check:SetScript("OnClick", function(self)
        local enabled = self:GetChecked() and true or false
        FG.db.settings[settingKey] = enabled

        FG:Log("INFO", "settings.changed", "ForeverGuide-Einstellung geaendert.", {
            setting = settingKey,
            enabled = enabled,
        })

        if onChanged then onChanged(enabled) end
        FG:RefreshInfo()
    end)

    return check
end

function FG:InitializeUI()
    if ui.frame then return end

    local frame = CreateFrame("Frame", "ForeverGuideMainFrame", UIParent)
    frame:SetSize(470, 342)
    frame:SetPoint("CENTER", UIParent, "CENTER",
        tonumber(self.db.settings.windowX) or 250,
        tonumber(self.db.settings.windowY) or 80)
    frame:SetClampedToScreen(true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    stylePanel(frame)
    ui.frame = frame

    frame:SetScript("OnDragStart", function(self)
        if not InCombatLockdown or not InCombatLockdown() then
            self:StartMoving()
        end
    end)

    frame:SetScript("OnDragStop", function(self)
        self:StopMovingOrSizing()

        local x, y = self:GetCenter()
        local ux, uy = UIParent:GetCenter()

        if x and y and ux and uy then
            FG.db.settings.windowX = x - ux
            FG.db.settings.windowY = y - uy
            FG:Log("INFO", "ui.moved", "Guide-Fenster verschoben.", {
                x = FG.db.settings.windowX,
                y = FG.db.settings.windowY,
            })
        end
    end)

    local title = makeText(frame, "GameFontNormalLarge", 18)
    title:SetPoint("TOPLEFT", 18, -16)
    title:SetText("|cff62d6ffForeverGuide|r")
    ui.title = title

    local version = makeText(frame, "GameFontHighlightSmall", 11)
    version:SetPoint("TOPRIGHT", -18, -18)
    version:SetText("v" .. FG.VERSION)
    ui.version = version

    local source = makeText(frame, "GameFontHighlightSmall", 11)
    source:SetPoint("TOPLEFT", title, "BOTTOMLEFT", 0, -7)
    source:SetPoint("RIGHT", frame, -18, 0)
    source:SetTextColor(0.62, 0.72, 0.82)
    ui.source = source

    local quest = makeText(frame, "GameFontNormal", 16)
    quest:SetPoint("TOPLEFT", source, "BOTTOMLEFT", 0, -13)
    quest:SetPoint("RIGHT", frame, -18, 0)
    quest:SetTextColor(1.0, 0.82, 0.18)
    ui.quest = quest

    local action = makeText(frame, "GameFontHighlight", 13)
    action:SetPoint("TOPLEFT", quest, "BOTTOMLEFT", 0, -7)
    action:SetPoint("RIGHT", frame, -18, 0)
    ui.action = action

    local objectiveBox = CreateFrame("Frame", nil, frame)
    objectiveBox:SetPoint("TOPLEFT", action, "BOTTOMLEFT", 0, -8)
    objectiveBox:SetPoint("TOPRIGHT", frame, -18, -96)
    objectiveBox:SetHeight(82)

    local objectiveBg = objectiveBox:CreateTexture(nil, "BACKGROUND")
    objectiveBg:SetAllPoints()
    setColorTexture(objectiveBg, 0.06, 0.075, 0.10, 0.80)

    local objective = makeText(objectiveBox, "GameFontHighlightSmall", 12)
    objective:SetPoint("TOPLEFT", 8, -7)
    objective:SetPoint("BOTTOMRIGHT", -8, 7)
    objective:SetJustifyV("TOP")
    ui.objective = objective

    local navBox = CreateFrame("Frame", nil, frame)
    navBox:SetPoint("TOPLEFT", objectiveBox, "BOTTOMLEFT", 0, -10)
    navBox:SetPoint("TOPRIGHT", objectiveBox, "BOTTOMRIGHT", 0, -10)
    navBox:SetHeight(82)

    local navBg = navBox:CreateTexture(nil, "BACKGROUND")
    navBg:SetAllPoints()
    setColorTexture(navBg, 0.035, 0.055, 0.075, 0.92)

    local arrowFrame = CreateFrame("Frame", nil, navBox)
    arrowFrame:SetSize(68, 68)
    arrowFrame:SetPoint("LEFT", 8, 0)

    local arrowBg = arrowFrame:CreateTexture(nil, "BACKGROUND")
    arrowBg:SetAllPoints()
    setColorTexture(arrowBg, 0.01, 0.015, 0.025, 0.95)

    local arrowTexture = arrowFrame:CreateTexture(nil, "ARTWORK")
    arrowTexture:SetTexture("Interface\\Minimap\\MinimapArrow")
    arrowTexture:SetSize(58, 58)
    arrowTexture:SetPoint("CENTER")
    ui.arrowTexture = arrowTexture

    local arrowFallback = makeText(arrowFrame, "GameFontNormalLarge", 14)
    arrowFallback:SetPoint("CENTER", 0, 0)
    arrowFallback:SetText("?")
    arrowFallback:Hide()
    ui.arrowFallback = arrowFallback

    local waypoint = makeText(navBox, "GameFontNormal", 12)
    waypoint:SetPoint("TOPLEFT", arrowFrame, "TOPRIGHT", 12, -2)
    waypoint:SetPoint("RIGHT", navBox, -8, 0)
    waypoint:SetHeight(34)
    waypoint:SetJustifyV("TOP")
    ui.waypoint = waypoint

    local distance = makeText(navBox, "GameFontHighlight", 15)
    distance:SetPoint("TOPLEFT", waypoint, "BOTTOMLEFT", 0, -4)
    distance:SetPoint("RIGHT", navBox, -8, 0)
    ui.distance = distance

    local direction = makeText(navBox, "GameFontHighlightSmall", 11)
    direction:SetPoint("TOPLEFT", distance, "BOTTOMLEFT", 0, -3)
    direction:SetPoint("RIGHT", navBox, -8, 0)
    direction:SetTextColor(0.62, 0.84, 1.0)
    ui.direction = direction

    local prev = makeButton(frame, "Zurueck", 70, function()
        FG:SelectRelativeStep(-1, "ui_prev")
    end)
    prev:SetPoint("BOTTOMLEFT", 18, 16)
    ui.prev = prev

    local next = makeButton(frame, "Weiter", 70, function()
        FG:SelectRelativeStep(1, "ui_next")
    end)
    next:SetPoint("LEFT", prev, "RIGHT", 6, 0)
    ui.next = next

    local info = makeButton(frame, "Info", 58, function()
        FG:ToggleInfo()
    end)
    info:SetPoint("LEFT", next, "RIGHT", 6, 0)
    ui.infoButton = info

    local settings = makeButton(frame, "Optionen", 82, function()
        FG:ToggleSettings()
    end)
    settings:SetPoint("LEFT", info, "RIGHT", 6, 0)
    ui.settingsButton = settings

    local close = makeButton(frame, "X", 34, function()
        FG:HideWindow()
    end)
    close:SetPoint("BOTTOMRIGHT", -16, 16)
    ui.close = close

    local infoFrame = CreateFrame("Frame", "ForeverGuideInfoFrame", UIParent)
    infoFrame:SetSize(455, 390)
    infoFrame:SetPoint("TOPLEFT", frame, "TOPRIGHT", 8, 0)
    infoFrame:SetClampedToScreen(true)
    stylePanel(infoFrame)
    infoFrame:Hide()
    ui.infoFrame = infoFrame

    local infoTitle = makeText(infoFrame, "GameFontNormalLarge", 17)
    infoTitle:SetPoint("TOPLEFT", 18, -16)
    infoTitle:SetText("|cff62d6ffForeverGuide - Info|r")

    local infoClose = makeButton(infoFrame, "X", 32, function()
        FG:ToggleInfo()
    end)
    infoClose:SetPoint("TOPRIGHT", -14, -12)

    local infoBody = makeText(infoFrame, "GameFontHighlightSmall", 12)
    infoBody:SetPoint("TOPLEFT", infoTitle, "BOTTOMLEFT", 0, -14)
    infoBody:SetPoint("BOTTOMRIGHT", -18, 52)
    infoBody:SetJustifyV("TOP")
    ui.infoBody = infoBody

    local heart = createPixelHeart(infoFrame)
    heart:SetPoint("BOTTOM", infoFrame, "BOTTOM", -38, 19)

    local creditLeft = makeText(infoFrame, "GameFontNormal", 11)
    creditLeft:SetPoint("RIGHT", heart, "LEFT", -5, 0)
    creditLeft:SetText("Programmiert mit")

    local creditRight = makeText(infoFrame, "GameFontNormal", 11)
    creditRight:SetPoint("LEFT", heart, "RIGHT", 5, 0)
    creditRight:SetText("von Riflex91 fuer die Gilde |cff62d6ffMewthisch|r")

    local settingsFrame = CreateFrame("Frame", "ForeverGuideSettingsFrame", UIParent)
    settingsFrame:SetSize(430, 360)
    settingsFrame:SetPoint("TOPLEFT", frame, "TOPRIGHT", 8, 0)
    settingsFrame:SetClampedToScreen(true)
    stylePanel(settingsFrame)
    settingsFrame:Hide()
    ui.settingsFrame = settingsFrame

    local settingsTitle = makeText(settingsFrame, "GameFontNormalLarge", 17)
    settingsTitle:SetPoint("TOPLEFT", 18, -16)
    settingsTitle:SetText("|cff62d6ffForeverGuide - Optionen|r")

    local settingsClose = makeButton(settingsFrame, "X", 32, function()
        FG:ToggleSettings()
    end)
    settingsClose:SetPoint("TOPRIGHT", -14, -12)

    local settingsIntro = makeText(settingsFrame, "GameFontHighlightSmall", 11)
    settingsIntro:SetPoint("TOPLEFT", settingsTitle, "BOTTOMLEFT", 0, -10)
    settingsIntro:SetPoint("RIGHT", settingsFrame, -18, 0)
    settingsIntro:SetText("Automatik und Diagnose fuer den aktuellen Testlauf.")

    ui.checkAutoAccept = makeCheck(settingsFrame, -72,
        "Quests bei Questgebern automatisch annehmen",
        "autoAcceptQuests")

    ui.checkAutoTurnIn = makeCheck(settingsFrame, -108,
        "Fertige Quests automatisch abgeben",
        "autoTurnInQuests")

    ui.checkSuperTrack = makeCheck(settingsFrame, -144,
        "Aktuelles Ziel automatisch super-tracken",
        "autoSuperTrack",
        function()
            FG:RefreshGuide("settings_supertrack")
        end)

    ui.checkMinimap = makeCheck(settingsFrame, -180,
        "ForeverGuide-Minimap-Button anzeigen",
        "showMinimapButton",
        function()
            FG:RefreshMinimapButton()
        end)

    ui.checkDiagnostics = makeCheck(settingsFrame, -216,
        "Diagnose-Logs in ForeverGuide.lua speichern",
        "diagnostics")

    local safety = makeText(settingsFrame, "GameFontHighlightSmall", 11)
    safety:SetPoint("TOPLEFT", 18, -260)
    safety:SetPoint("RIGHT", settingsFrame, -18, 0)
    safety:SetTextColor(1.0, 0.78, 0.22)
    safety:SetText("Sicherheitsregel: Hat eine Quest mehrere Belohnungen zur Auswahl, pausiert die Auto-Abgabe und du waehlst die Belohnung selbst.")

    local commands = makeText(settingsFrame, "GameFontHighlightSmall", 10)
    commands:SetPoint("TOPLEFT", safety, "BOTTOMLEFT", 0, -12)
    commands:SetPoint("RIGHT", settingsFrame, -18, 0)
    commands:SetText("/fg settings  /fg autoaccept on|off  /fg autoturnin on|off")

    if self.db.settings.showWindow == false then frame:Hide() end

    self:RefreshSettings()
    self:RefreshInfo()

    self:Log("INFO", "ui.initialized", "ForeverGuide v0.2 UI initialisiert.", {
        version = self.VERSION,
    })

    local elapsed = 0
    frame:SetScript("OnUpdate", function(_, delta)
        elapsed = elapsed + delta
        if elapsed >= NAV_UPDATE_INTERVAL then
            elapsed = 0

            FG:Safe("navigation.realtime", function()
                FG:UpdateNavigationRealtime()
                FG:RefreshNavigationUI()
            end)
        end
    end)
end

function FG:CreateMinimapButton()
    if ui.minimapButton or not Minimap then
        self:RefreshMinimapButton()
        return
    end

    local button = CreateFrame("Button", "ForeverGuideMinimapButton", Minimap, "UIPanelButtonTemplate")
    button:SetSize(34, 28)
    button:SetPoint("BOTTOMLEFT", Minimap, "BOTTOMLEFT", -8, -8)
    button:SetFrameStrata("HIGH")
    button:SetText("FG")
    button:RegisterForClicks("LeftButtonUp", "RightButtonUp")

    button:SetScript("OnClick", function(_, mouseButton)
        if mouseButton == "RightButton" then
            FG:ToggleSettings()
        else
            FG:ToggleWindow()
        end
    end)

    button:SetScript("OnEnter", function(self)
        if not GameTooltip then return end
        GameTooltip:SetOwner(self, "ANCHOR_LEFT")
        GameTooltip:AddLine("ForeverGuide")
        GameTooltip:AddLine("Linksklick: Guide ein/aus", 1, 1, 1)
        GameTooltip:AddLine("Rechtsklick: Optionen", 1, 1, 1)
        GameTooltip:Show()
    end)

    button:SetScript("OnLeave", function()
        if GameTooltip then GameTooltip:Hide() end
    end)

    ui.minimapButton = button
    self:RefreshMinimapButton()

    self:Log("INFO", "ui.minimap_created", "ForeverGuide-Minimap-Button erstellt.")
end

function FG:RefreshMinimapButton()
    if not ui.minimapButton then return end

    if self.db and self.db.settings.showMinimapButton then
        ui.minimapButton:Show()
    else
        ui.minimapButton:Hide()
    end
end

function FG:RefreshNavigationUI()
    if not ui.frame then return end

    local nav = self.navigation or {}
    local step = self.currentStep

    if not step then
        ui.waypoint:SetText("Kein aktives Questziel")
        ui.distance:SetText("Entfernung: -")
        ui.direction:SetText("Richtung: -")
        ui.arrowTexture:SetAlpha(0.20)
        return
    end

    local directionLabel = self:GetDirectionLabel(nav.relativeAngle)
    local distanceText = "Entfernung: unbekannt"

    if nav.distanceYards then
        if nav.distanceYards >= 1000 then
            distanceText = string.format("Entfernung: %.1f kyd", nav.distanceYards / 1000)
        else
            distanceText = string.format("Entfernung: %.0f yd", nav.distanceYards)
        end
    elseif nav.normalizedDistance then
        distanceText = string.format("Kartenabstand: %.1f%%", nav.normalizedDistance * 100)
    end

    ui.waypoint:SetText(nav.waypointText or step.detail or "Questziel")
    ui.distance:SetText(distanceText)
    ui.direction:SetText("Richtung: " .. tostring(directionLabel) ..
        "  |  Quelle: " .. tostring(nav.source or "Fallback"))

    if nav.relativeAngle ~= nil then
        ui.arrowTexture:SetAlpha(1.0)
        ui.arrowFallback:Hide()

        if ui.arrowTexture.SetRotation then
            local ok = pcall(ui.arrowTexture.SetRotation, ui.arrowTexture, nav.relativeAngle)
            if not ok then
                ui.arrowTexture:Hide()
                ui.arrowFallback:SetText(directionLabel)
                ui.arrowFallback:Show()
            else
                ui.arrowTexture:Show()
            end
        else
            ui.arrowTexture:Hide()
            ui.arrowFallback:SetText(directionLabel)
            ui.arrowFallback:Show()
        end
    else
        ui.arrowTexture:SetAlpha(0.25)
        ui.arrowTexture:Show()
        ui.arrowFallback:Hide()
    end
end

function FG:RefreshUI()
    if not ui.frame then return end

    local step = self.currentStep

    if not step then
        ui.source:SetText("Keine aktive Guide-Empfehlung")
        ui.quest:SetText("Keine aktive Quest gefunden")
        ui.action:SetText("Questgeber ansprechen - Auto-Annahme ist " ..
            (self.db.settings.autoAcceptQuests and "AKTIV" or "AUS"))
        ui.objective:SetText("ForeverGuide wartet auf eine aktive Quest.")
        self:RefreshNavigationUI()
        self:RefreshInfo()
        return
    end

    ui.source:SetText("Schritt " .. tostring(self.currentStepIndex) ..
        "/" .. tostring(#self.steps) ..
        "  |  Quelle: " .. tostring(step.source) ..
        "  |  Quest-ID " .. tostring(step.questID))

    ui.quest:SetText(step.title or ("Quest " .. tostring(step.questID)))
    ui.action:SetText(step.action or "Quest fortsetzen")
    ui.objective:SetText(step.detail or "")

    setButtonEnabled(ui.prev, self.currentStepIndex > 1)
    setButtonEnabled(ui.next, self.currentStepIndex < #self.steps)

    self:RefreshNavigationUI()
    self:RefreshInfo()
end

function FG:RefreshInfo()
    if not ui.infoBody then return end

    local build = self:GetBuildInfoTable()
    local profile = self:GetPlayerProfile()
    local logs = self:GetLogSummary()
    local step = self.currentStep
    local nav = self.navigation or {}
    local dataBuild = self.Data and self.Data.build or {}

    local tableCount = 0
    for _ in pairs(self.Data and self.Data.tableStats or {}) do
        tableCount = tableCount + 1
    end

    local distance = "-"
    if nav.distanceYards then
        distance = string.format("%.0f yd", nav.distanceYards)
    elseif nav.normalizedDistance then
        distance = string.format("%.1f%% Karte", nav.normalizedDistance * 100)
    end

    local lines = {
        "|cffffffffAddon-Version:|r " .. self.VERSION,
        "|cffffffffForever-Build:|r " .. tostring(build.version) .. " (" .. tostring(build.buildNumber) .. ")",
        "|cffffffffInterface:|r " .. tostring(build.interfaceVersion),
        "|cffffffffKompatibilitaet:|r " .. (self:IsSupportedBuild() and "|cff33ff99OK|r" or "|cffffcc00abweichend|r"),
        "|cffffffffDatenbasis:|r " .. tostring(dataBuild.version or "?"),
        "|cffffffffDB2-Tabellen:|r " .. tostring(tableCount),
        "",
        "|cffffffffCharakter:|r " .. tostring(profile.race or "?") .. " " ..
            tostring(profile.class or "?") .. " - Level " .. tostring(profile.level or "?"),
        "|cffffffffAktiver Schritt:|r " .. (step and tostring(step.title) or "keiner"),
        "|cffffffffQuest-ID:|r " .. (step and tostring(step.questID) or "-"),
        "|cffffffffQuestfortschritt:|r " .. (step and tostring(step.detail) or "-"),
        "",
        "|cffffffffNavigation:|r " .. tostring(nav.source or "kein Ziel"),
        "|cffffffffEntfernung:|r " .. distance,
        "|cffffffffRichtung:|r " .. tostring(self:GetDirectionLabel(nav.relativeAngle)),
        "",
        "|cffffffffAuto-Annahme:|r " .. (self.db.settings.autoAcceptQuests and "AN" or "AUS"),
        "|cffffffffAuto-Abgabe:|r " .. (self.db.settings.autoTurnInQuests and "AN" or "AUS"),
        "|cffffffffAutomatikstatus:|r " .. tostring(self.automationStatus or "bereit"),
        "",
        "|cffffffffDiagnose-Logs:|r " .. tostring(logs.total),
        "|cffffffffWarnungen:|r " .. tostring(logs.warnings),
        "|cffffffffFehler:|r " .. tostring(logs.errors),
        "",
        "|cff9da7b3Teststatus v0.2:|r",
        "- stabile eigene Panel-Hintergruende",
        "- Live-Questfortschritt",
        "- Richtungspfeil + Entfernung",
        "- automatische Questannahme/-abgabe",
        "- Minimap-Schalter + Optionen",
        "",
        "|cff9da7b3Nach dem Test /reload oder ausloggen und ForeverGuide.lua senden.|r",
    }

    ui.infoBody:SetText(table.concat(lines, "\n"))
end

function FG:RefreshSettings()
    if not ui.settingsFrame or not self.db then return end

    ui.checkAutoAccept:SetChecked(self.db.settings.autoAcceptQuests and true or false)
    ui.checkAutoTurnIn:SetChecked(self.db.settings.autoTurnInQuests and true or false)
    ui.checkSuperTrack:SetChecked(self.db.settings.autoSuperTrack and true or false)
    ui.checkMinimap:SetChecked(self.db.settings.showMinimapButton and true or false)
    ui.checkDiagnostics:SetChecked(self.db.settings.diagnostics and true or false)
end

function FG:ToggleInfo()
    if not ui.infoFrame then return end

    if ui.infoFrame:IsShown() then
        ui.infoFrame:Hide()
        self.db.settings.showInfo = false
    else
        if ui.settingsFrame then ui.settingsFrame:Hide() end
        ui.infoFrame:Show()
        self.db.settings.showInfo = true
        self.db.settings.showSettings = false
        self:RefreshInfo()
    end

    self:Log("INFO", "ui.info_toggle", "Info-Bereich umgeschaltet.", {
        shown = ui.infoFrame:IsShown(),
    })
end

function FG:ToggleSettings()
    if not ui.settingsFrame then return end

    if ui.settingsFrame:IsShown() then
        ui.settingsFrame:Hide()
        self.db.settings.showSettings = false
    else
        if ui.infoFrame then ui.infoFrame:Hide() end
        ui.settingsFrame:Show()
        self.db.settings.showSettings = true
        self.db.settings.showInfo = false
        self:RefreshSettings()
    end

    self:Log("INFO", "ui.settings_toggle", "Optionen umgeschaltet.", {
        shown = ui.settingsFrame:IsShown(),
    })
end

function FG:ToggleWindow()
    if not ui.frame then return end

    if ui.frame:IsShown() then
        self:HideWindow()
    else
        self:ShowWindow()
    end
end

function FG:ShowWindow()
    if not ui.frame then self:InitializeUI() end

    ui.frame:Show()
    self.db.settings.showWindow = true
    self:RefreshUI()
    self:Log("INFO", "ui.show", "Guide-Fenster angezeigt.")
end

function FG:HideWindow()
    if not ui.frame then return end

    ui.frame:Hide()
    if ui.infoFrame then ui.infoFrame:Hide() end
    if ui.settingsFrame then ui.settingsFrame:Hide() end

    self.db.settings.showWindow = false
    self.db.settings.showInfo = false
    self.db.settings.showSettings = false

    self:Log("INFO", "ui.hide", "Guide-Fenster ausgeblendet.")
end

function FG:PrintStatus()
    local build = self:GetBuildInfoTable()
    local logs = self:GetLogSummary()
    local step = self.currentStep
    local nav = self.navigation or {}

    local distance = nav.distanceYards and string.format("%.0fyd", nav.distanceYards) or "-"

    print("|cff62d6ffForeverGuide|r v" .. self.VERSION ..
        " - Build " .. tostring(build.buildNumber) ..
        " - Quest " .. (step and tostring(step.questID) or "-") ..
        " - Distanz " .. distance ..
        " - Logs " .. tostring(logs.total) ..
        " - W " .. tostring(logs.warnings) ..
        " - E " .. tostring(logs.errors))
end
