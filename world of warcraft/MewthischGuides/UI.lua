local addonName, MG = ...

local ui = {
    panels = {},
    updatingSettings = false,
}

local function clampTransparency(value)
    value = tonumber(value) or 0.05
    if value < 0 then value = 0 end
    if value > 0.80 then value = 0.80 end
    return value
end

local function centerOverlay(frame)
    if not frame then return end
    frame:ClearAllPoints()
    frame:SetPoint("CENTER", UIParent, "CENTER", 0, 0)
end

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
    setColorTexture(bg, 0.025, 0.032, 0.045, 1.0)
    if bg.SetAlpha then
        bg:SetAlpha(1.0 - clampTransparency(MG.db and MG.db.settings.windowTransparency))
    end
    frame._mgBackground = bg
    ui.panels[#ui.panels + 1] = frame

    local top = frame:CreateTexture(nil, "BORDER")
    top:SetPoint("TOPLEFT")
    top:SetPoint("TOPRIGHT")
    top:SetHeight(2)
    setColorTexture(top, 0.20, 0.72, 0.88, 1)
    frame._mgTopAccent = top

    local bottom = frame:CreateTexture(nil, "BORDER")
    bottom:SetPoint("BOTTOMLEFT")
    bottom:SetPoint("BOTTOMRIGHT")
    bottom:SetHeight(1)
    setColorTexture(bottom, 0.12, 0.18, 0.24, 0.9)
end

function MG:ApplyWindowTransparency()
    if not self.db or not self.db.settings then return end

    local transparency = clampTransparency(self.db.settings.windowTransparency)
    self.db.settings.windowTransparency = transparency
    local alpha = 1.0 - transparency

    for _, panel in ipairs(ui.panels) do
        if panel and panel._mgBackground and panel._mgBackground.SetAlpha then
            panel._mgBackground:SetAlpha(alpha)
        end
    end
end

function MG:RefreshTheme()
    if not self.db or not self.Themes then return end
    local theme = self.Themes:GetCurrent()
    local accent = theme and theme.accent or {0.20, 0.72, 0.88}
    local text = theme and theme.text or {0.92, 0.95, 1.00}

    for _, panel in ipairs(ui.panels) do
        if panel and panel._mgTopAccent then
            setColorTexture(panel._mgTopAccent, accent[1], accent[2], accent[3], 1)
        end
    end

    for _, label in ipairs({ui.title, ui.infoTitle, ui.settingsTitle}) do
        if label and label.SetTextColor then
            label:SetTextColor(text[1], text[2], text[3], 1)
        end
    end

    if ui.themeValue then
        local _, name = self.Themes:GetCurrent()
        ui.themeValue:SetText(name)
    end
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
    b:SetSize(width or 58, 21)
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

    check:SetScript("OnClick", function(self)
        local enabled = self:GetChecked() and true or false
        MG.db.settings[settingKey] = enabled
        MG:Log("INFO", "settings.changed", "Mewthisch-Guides-Einstellung geaendert.", {
            setting = settingKey,
            enabled = enabled,
        })
        if onChanged then onChanged(enabled) end
        MG:RefreshInfo()
    end)

    return check
end

local function saveViewerPosition(frame)
    local x, y = frame:GetCenter()
    local ux, uy = UIParent:GetCenter()
    if x and y and ux and uy then
        MG.db.settings.viewerX = x - ux
        MG.db.settings.viewerY = y - uy
        MG:Log("INFO", "ui.moved", "Guide-Viewer verschoben.", {
            x = MG.db.settings.viewerX,
            y = MG.db.settings.viewerY,
        })
    end
end

local function progressBar(parent)
    local frame = CreateFrame("Frame", nil, parent)
    frame:SetHeight(12)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    setColorTexture(bg, 0.07, 0.09, 0.12, 1)

    local fill = frame:CreateTexture(nil, "ARTWORK")
    fill:SetPoint("TOPLEFT")
    fill:SetPoint("BOTTOMLEFT")
    fill:SetWidth(1)
    setColorTexture(fill, 0.19, 0.72, 0.42, 1)
    frame.fill = fill

    local text = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    text:SetPoint("CENTER")
    text:SetText("")
    frame.text = text

    function frame:SetProgress(percent, label)
        percent = math.max(0, math.min(1, tonumber(percent) or 0))
        local width = math.max(1, self:GetWidth() * percent)
        self.fill:SetWidth(width)
        self.text:SetText(label or "")
    end

    return frame
end

function MG:InitializeUI()
    if ui.frame then return end

    local frame = CreateFrame("Frame", "MewthischGuidesMainFrame", UIParent)
    frame:SetSize(348, 194)
    frame:SetPoint("CENTER", UIParent, "CENTER",
        tonumber(self.db.settings.viewerX) or 260,
        tonumber(self.db.settings.viewerY) or 80)
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
        saveViewerPosition(self)
    end)

    local title = makeText(frame, "GameFontNormalLarge", 16)
    title:SetPoint("TOPLEFT", 14, -11)
    title:SetText("Mewthisch Guides")
    ui.title = title

    local stepCount = makeText(frame, "GameFontHighlightSmall", 10)
    stepCount:SetPoint("TOPRIGHT", -13, -13)
    stepCount:SetTextColor(0.55, 0.64, 0.72)
    ui.stepCount = stepCount

    local quest = makeText(frame, "GameFontNormal", 15)
    quest:SetPoint("TOPLEFT", 14, -39)
    quest:SetPoint("RIGHT", frame, -14, 0)
    quest:SetTextColor(1.0, 0.82, 0.18)
    ui.quest = quest

    local instruction = makeText(frame, "GameFontHighlight", 13)
    instruction:SetPoint("TOPLEFT", quest, "BOTTOMLEFT", 0, -7)
    instruction:SetPoint("RIGHT", frame, -14, 0)
    instruction:SetHeight(37)
    instruction:SetJustifyV("TOP")
    ui.instruction = instruction

    local bar = progressBar(frame)
    bar:SetPoint("TOPLEFT", instruction, "BOTTOMLEFT", 0, -5)
    bar:SetPoint("TOPRIGHT", frame, -14, -104)
    ui.progress = bar

    local goalSummary = makeText(frame, "GameFontHighlightSmall", 10)
    goalSummary:SetPoint("TOPLEFT", bar, "BOTTOMLEFT", 0, -6)
    goalSummary:SetPoint("RIGHT", frame, -14, 0)
    goalSummary:SetHeight(20)
    goalSummary:SetTextColor(0.67, 0.76, 0.82)
    ui.goalSummary = goalSummary

    local nextText = makeText(frame, "GameFontHighlightSmall", 10)
    nextText:SetPoint("TOPLEFT", goalSummary, "BOTTOMLEFT", 0, -4)
    nextText:SetPoint("RIGHT", frame, -14, 0)
    nextText:SetTextColor(0.55, 0.64, 0.72)
    ui.nextText = nextText

    local prev = makeButton(frame, "<", 30, function()
        MG:SelectRelativeStep(-1, "ui_prev")
    end)
    prev:SetPoint("BOTTOMLEFT", 14, 10)
    ui.prev = prev

    local next = makeButton(frame, ">", 30, function()
        MG:SelectRelativeStep(1, "ui_next")
    end)
    next:SetPoint("LEFT", prev, "RIGHT", 4, 0)
    ui.next = next

    local info = makeButton(frame, "Info", 50, function()
        MG:ToggleInfo()
    end)
    info:SetPoint("LEFT", next, "RIGHT", 8, 0)
    ui.infoButton = info

    local settings = makeButton(frame, "Optionen", 70, function()
        MG:ToggleSettings()
    end)
    settings:SetPoint("LEFT", info, "RIGHT", 4, 0)
    ui.settingsButton = settings

    local navigatorButton = makeButton(frame, "Pfeil", 52, function()
        MG:ToggleNavigator()
    end)
    navigatorButton:SetPoint("LEFT", settings, "RIGHT", 4, 0)
    ui.navigatorButton = navigatorButton

    local close = makeButton(frame, "X", 30, function()
        MG:HideWindow()
    end)
    close:SetPoint("BOTTOMRIGHT", -12, 10)
    ui.close = close

    local infoFrame = CreateFrame("Frame", "MewthischGuidesInfoFrame", UIParent)
    infoFrame:SetSize(470, 430)
    centerOverlay(infoFrame)
    infoFrame:SetClampedToScreen(true)
    stylePanel(infoFrame)
    infoFrame:Hide()
    ui.infoFrame = infoFrame

    local infoTitle = makeText(infoFrame, "GameFontNormalLarge", 17)
    infoTitle:SetPoint("TOPLEFT", 18, -16)
    infoTitle:SetText("Mewthisch Guides - Info")
    ui.infoTitle = infoTitle

    local infoClose = makeButton(infoFrame, "X", 30, function()
        MG:ToggleInfo()
    end)
    infoClose:SetPoint("TOPRIGHT", -14, -12)

    local infoBody = makeText(infoFrame, "GameFontHighlightSmall", 12)
    infoBody:SetPoint("TOPLEFT", infoTitle, "BOTTOMLEFT", 0, -14)
    infoBody:SetPoint("BOTTOMRIGHT", -18, 52)
    infoBody:SetJustifyV("TOP")
    ui.infoBody = infoBody

    local heart = createPixelHeart(infoFrame)
    heart:SetPoint("BOTTOM", infoFrame, "BOTTOM", -40, 19)

    local creditLeft = makeText(infoFrame, "GameFontNormal", 11)
    creditLeft:SetPoint("RIGHT", heart, "LEFT", -5, 0)
    creditLeft:SetText("Programmiert mit")

    local creditRight = makeText(infoFrame, "GameFontNormal", 11)
    creditRight:SetPoint("LEFT", heart, "RIGHT", 5, 0)
    creditRight:SetText("von Riflex91 fuer die Gilde |cff62d6ffMewthisch|r")

    local settingsFrame = CreateFrame("Frame", "MewthischGuidesSettingsFrame", UIParent)
    settingsFrame:SetSize(430, 560)
    centerOverlay(settingsFrame)
    settingsFrame:SetClampedToScreen(true)
    stylePanel(settingsFrame)
    settingsFrame:Hide()
    ui.settingsFrame = settingsFrame

    local settingsTitle = makeText(settingsFrame, "GameFontNormalLarge", 17)
    settingsTitle:SetPoint("TOPLEFT", 18, -16)
    settingsTitle:SetText("Mewthisch Guides - Optionen")
    ui.settingsTitle = settingsTitle

    local settingsClose = makeButton(settingsFrame, "X", 30, function()
        MG:ToggleSettings()
    end)
    settingsClose:SetPoint("TOPRIGHT", -14, -12)

    ui.checkAutoAccept = makeCheck(settingsFrame, -58,
        "Quests bei Questgebern automatisch annehmen",
        "autoAcceptQuests")

    ui.checkAutoTurnIn = makeCheck(settingsFrame, -92,
        "Fertige Quests automatisch abgeben",
        "autoTurnInQuests")

    ui.checkSuperTrack = makeCheck(settingsFrame, -126,
        "Aktuelles Ziel automatisch super-tracken",
        "autoSuperTrack",
        function() MG:RefreshGuide("settings_supertrack") end)

    ui.checkNavigator = makeCheck(settingsFrame, -160,
        "Separaten Navigator anzeigen",
        "showNavigator",
        function() MG:RefreshNavigator() end)

    ui.checkNavigatorLocked = makeCheck(settingsFrame, -194,
        "Navigator sperren",
        "navigatorLocked")

    ui.checkMinimap = makeCheck(settingsFrame, -228,
        "Minimap-Button anzeigen",
        "showMinimapButton",
        function() MG:RefreshMinimapButton() end)

    ui.checkDiagnostics = makeCheck(settingsFrame, -262,
        "Diagnose-Logs speichern",
        "diagnostics")

    ui.checkGearAuto = makeCheck(settingsFrame, -296,
        "Sichere High-Confidence-Gear-Upgrades automatisch anlegen",
        "gearAutoEquip",
        function()
            if MG.Sync then MG.Sync:Inventory("settings_gear_auto") end
        end)

    local transparencyLabel = makeText(settingsFrame, "GameFontHighlight", 12)
    transparencyLabel:SetPoint("TOPLEFT", 18, -338)
    transparencyLabel:SetText("Fenster-Transparenz")

    local transparencyValue = makeText(settingsFrame, "GameFontHighlight", 11)
    transparencyValue:SetPoint("TOPRIGHT", -22, -338)
    transparencyValue:SetWidth(48)
    transparencyValue:SetJustifyH("RIGHT")
    ui.transparencyValue = transparencyValue

    local transparencySlider = CreateFrame("Slider", "MewthischGuidesTransparencySlider", settingsFrame)
    transparencySlider:SetOrientation("HORIZONTAL")
    transparencySlider:SetSize(250, 18)
    transparencySlider:SetPoint("TOPLEFT", 18, -358)
    transparencySlider:SetMinMaxValues(0, 80)
    transparencySlider:SetValueStep(5)
    if transparencySlider.SetObeyStepOnDrag then
        transparencySlider:SetObeyStepOnDrag(true)
    end

    local sliderTrack = transparencySlider:CreateTexture(nil, "BACKGROUND")
    sliderTrack:SetPoint("LEFT", 0, 0)
    sliderTrack:SetPoint("RIGHT", 0, 0)
    sliderTrack:SetHeight(4)
    setColorTexture(sliderTrack, 0.12, 0.18, 0.24, 1)

    if transparencySlider.SetThumbTexture then
        transparencySlider:SetThumbTexture("Interface\\Buttons\\UI-SliderBar-Button-Horizontal")
    end
    local thumb = transparencySlider.GetThumbTexture and transparencySlider:GetThumbTexture() or nil
    if thumb then thumb:SetSize(24, 24) end

    transparencySlider:SetScript("OnValueChanged", function(_, value)
        if ui.updatingSettings then return end

        local rounded = math.floor((tonumber(value) or 0) / 5 + 0.5) * 5
        local transparency = clampTransparency(rounded / 100)
        local current = clampTransparency(MG.db.settings.windowTransparency)

        if math.abs(current - transparency) < 0.0001 then
            if ui.transparencyValue then
                ui.transparencyValue:SetText(
                    tostring(math.floor(transparency * 100 + 0.5)) .. "%")
            end
            return
        end

        MG.db.settings.windowTransparency = transparency
        MG:ApplyWindowTransparency()

        if ui.transparencyValue then
            ui.transparencyValue:SetText(tostring(math.floor(transparency * 100 + 0.5)) .. "%")
        end

        MG:Log("INFO", "settings.window_transparency",
            "Fenster-Transparenz geaendert.", {
                transparency = transparency,
                percent = math.floor(transparency * 100 + 0.5),
            })
    end)
    ui.transparencySlider = transparencySlider

    local scaleLabel = makeText(settingsFrame, "GameFontHighlight", 12)
    scaleLabel:SetPoint("TOPLEFT", 18, -396)
    scaleLabel:SetText("Navigator-Groesse")

    local scaleDown = makeButton(settingsFrame, "-", 30, function()
        MG:SetNavigatorScale((MG.db.settings.navigatorScale or 1.0) - 0.05)
    end)
    scaleDown:SetPoint("TOPLEFT", 155, -388)

    local scaleValue = makeText(settingsFrame, "GameFontHighlight", 12)
    scaleValue:SetPoint("LEFT", scaleDown, "RIGHT", 8, 0)
    scaleValue:SetWidth(52)
    scaleValue:SetJustifyH("CENTER")
    ui.navigatorScaleValue = scaleValue

    local scaleUp = makeButton(settingsFrame, "+", 30, function()
        MG:SetNavigatorScale((MG.db.settings.navigatorScale or 1.0) + 0.05)
    end)
    scaleUp:SetPoint("LEFT", scaleValue, "RIGHT", 8, 0)

    local resetNavigator = makeButton(settingsFrame, "Pfeil zuruecksetzen", 150, function()
        MG:ResetNavigatorPosition()
    end)
    resetNavigator:SetPoint("TOPLEFT", 18, -432)

    local themeButton = makeButton(settingsFrame, "Theme wechseln", 140, function()
        local names = {"Forever Classic", "Obsidian", "Arcane", "Warcraft", "Skyborne"}
        local _, current = MG.Themes:GetCurrent()
        local index = 1
        for i, name in ipairs(names) do
            if name == current then index = i break end
        end
        index = index + 1
        if index > #names then index = 1 end
        MG.Themes:Set(names[index])
        MG:RefreshSettings()
    end)
    themeButton:SetPoint("TOPLEFT", 18, -468)
    ui.themeButton = themeButton

    local themeValue = makeText(settingsFrame, "GameFontHighlight", 11)
    themeValue:SetPoint("LEFT", themeButton, "RIGHT", 10, 0)
    themeValue:SetWidth(180)
    themeValue:SetText("")
    ui.themeValue = themeValue

    local safety = makeText(settingsFrame, "GameFontHighlightSmall", 10)
    safety:SetPoint("TOPLEFT", 18, -510)
    safety:SetPoint("RIGHT", settingsFrame, -18, 0)
    safety:SetTextColor(1.0, 0.78, 0.22)
    safety:SetText("Mehrfachbelohnungen und Talente bleiben manuell. Gear-Auto-Equip arbeitet nur fail-closed mit gebundenen High-Confidence-Upgrades.")

    if self.db.settings.showWindow == false then frame:Hide() end

    self:ApplyWindowTransparency()
    self:RefreshTheme()
    self:RefreshSettings()
    self:RefreshInfo()
    self:Log("INFO", "ui.initialized", "Kompakter Mewthisch-Guides-Viewer initialisiert.", {
        version = self.VERSION,
    })
end

function MG:CreateMinimapButton()
    if ui.minimapButton or not Minimap then
        self:RefreshMinimapButton()
        return
    end

    local button = CreateFrame("Button", "MewthischGuidesMinimapButton", Minimap)
    button:SetSize(32, 32)
    button:SetFrameStrata("MEDIUM")
    button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
    button:RegisterForDrag("LeftButton")
    button:SetMovable(true)

    local icon = button:CreateTexture(nil, "BACKGROUND")
    icon:SetTexture("Interface\\Icons\\INV_Misc_Map_01")
    icon:SetSize(20, 20)
    icon:SetPoint("CENTER")
    button.icon = icon

    local border = button:CreateTexture(nil, "OVERLAY")
    border:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")
    border:SetSize(54, 54)
    border:SetPoint("TOPLEFT", 0, 0)

    local label = button:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
    label:SetPoint("CENTER", 0, 0)
    label:SetText("MG")
    label:SetTextColor(0.70, 0.95, 1.0)

    local dragging = false

    local function positionFromAngle()
        local angle = math.rad(tonumber(MG.db.settings.minimapAngle) or 215)
        button:ClearAllPoints()
        button:SetPoint("CENTER", Minimap, "CENTER", math.cos(angle) * 80, math.sin(angle) * 80)
    end

    local function atan2(y, x)
        if math.atan2 then return math.atan2(y, x) end
        if x > 0 then return math.atan(y / x) end
        if x < 0 and y >= 0 then return math.atan(y / x) + math.pi end
        if x < 0 and y < 0 then return math.atan(y / x) - math.pi end
        if x == 0 and y > 0 then return math.pi / 2 end
        if x == 0 and y < 0 then return -math.pi / 2 end
        return 0
    end

    local function updateDrag()
        if not dragging then return end
        local mx, my = Minimap:GetCenter()
        local cx, cy = GetCursorPosition()
        local scale = UIParent:GetEffectiveScale()
        cx, cy = cx / scale, cy / scale
        MG.db.settings.minimapAngle = math.deg(atan2(cy - my, cx - mx))
        positionFromAngle()
    end

    button:SetScript("OnDragStart", function(self)
        dragging = true
        self:SetScript("OnUpdate", updateDrag)
    end)

    button:SetScript("OnDragStop", function(self)
        dragging = false
        self:SetScript("OnUpdate", nil)
        MG:Log("INFO", "ui.minimap_moved", "Minimap-Button verschoben.", {
            angle = MG.db.settings.minimapAngle,
        })
    end)

    button:SetScript("OnClick", function(_, mouseButton)
        if mouseButton == "RightButton" then MG:ToggleSettings()
        else MG:ToggleWindow() end
    end)

    button:SetScript("OnEnter", function(self)
        if not GameTooltip then return end
        GameTooltip:SetOwner(self, "ANCHOR_LEFT")
        GameTooltip:AddLine("Mewthisch Guides")
        GameTooltip:AddLine("Linksklick: Guide ein/aus", 1, 1, 1)
        GameTooltip:AddLine("Rechtsklick: Optionen", 1, 1, 1)
        GameTooltip:AddLine("Ziehen: Position aendern", 1, 1, 1)
        GameTooltip:Show()
    end)

    button:SetScript("OnLeave", function()
        if GameTooltip then GameTooltip:Hide() end
    end)

    ui.minimapButton = button
    ui.positionMinimapButton = positionFromAngle
    positionFromAngle()
    self:RefreshMinimapButton()
    self:Log("INFO", "ui.minimap_created", "Mewthisch-Guides-Minimap-Button erstellt.")
end

function MG:RefreshMinimapButton()
    if not ui.minimapButton then return end
    if self.db and self.db.settings.showMinimapButton then
        ui.minimapButton:Show()
        if ui.positionMinimapButton then ui.positionMinimapButton() end
    else
        ui.minimapButton:Hide()
    end
end

function MG:RefreshUI()
    if not ui.frame then return end

    local step = self.currentStep

    if not step then
        ui.stepCount:SetText("0/0")
        ui.quest:SetText("Keine aktive Quest")
        ui.instruction:SetText("Sprich mit einem Questgeber. Auto-Annahme ist " ..
            (self.db.settings.autoAcceptQuests and "aktiv" or "aus"))
        ui.progress:SetProgress(0, "")
        ui.goalSummary:SetText("")
        ui.nextText:SetText("Mewthisch Guides wartet auf den naechsten Guide-Schritt.")
        return
    end

    ui.stepCount:SetText(tostring(self.currentStepIndex) .. "/" .. tostring(#self.steps))
    ui.quest:SetText(step.title or ("Quest " .. tostring(step.questID)))
    ui.instruction:SetText(step.goal and step.goal.instruction or step.detail or "Questziel erledigen")

    local progress = step.goal and step.goal.percent or (step.complete and 1 or 0)
    local progressText = step.goal and step.goal.progressText or ""
    ui.progress:SetProgress(progress or 0, progressText)
    ui.goalSummary:SetText(step.goalSummary or "")

    local nextStep = self.steps and self.steps[self.currentStepIndex + 1]
    if nextStep then
        ui.nextText:SetText("Danach: " .. tostring(nextStep.title or "naechster Schritt"))
    else
        ui.nextText:SetText(step.complete and "Bereit zur Abgabe" or "Aktuelles Questziel")
    end

    setButtonEnabled(ui.prev, self.currentStepIndex > 1)
    setButtonEnabled(ui.next, self.currentStepIndex < #self.steps)
    self:RefreshInfo()
end

function MG:RefreshInfo()
    if not ui.infoBody then return end

    local build = self:GetBuildInfoTable()
    local profile = self:GetPlayerProfile()
    local logs = self:GetLogSummary()
    local step = self.currentStep
    local nav = self.navigation or {}
    local dataBuild = self.Data and self.Data.build or {}
    local caps = self.ForeverAPI and self.ForeverAPI.capabilities or {}
    local questCaps = caps.quest or {}
    local mapCaps = caps.map or {}
    local securityCaps = caps.security or {}
    local route = self.RouteEngine and self.RouteEngine:GetStatus() or {}
    local persistence = self.db.runtime and self.db.runtime.persistence or {}
    local validation = self.Validation and self.Validation:GetStatus() or {}
    local travel = self.db.runtime and self.db.runtime.travelGraph or {}
    local gear = self.db.runtime and self.db.runtime.gear or {}
    local talent = self.db.runtime and self.db.runtime.talent or {}
    local reward = self.db.runtime and self.db.runtime.reward or {}
    local _, themeName = self.Themes and self.Themes:GetCurrent() or nil, nil
    if self.Themes then _, themeName = self.Themes:GetCurrent() end

    local tableCount = 0
    for _ in pairs(self.Data and self.Data.tableStats or {}) do tableCount = tableCount + 1 end

    local distance = "-"
    if nav.distanceMeters then
        distance = nav.distanceMeters >= 1000 and
            string.format("%.2f km", nav.distanceMeters / 1000) or
            string.format("%.0f m", nav.distanceMeters)
    end

    local lines = {
        "|cffffffffAddon:|r Mewthisch Guides v" .. self.VERSION,
        "|cffffffffForever-Build:|r " .. tostring(build.version) .. " (" .. tostring(build.buildNumber) .. ")",
        "|cffffffffInterface:|r " .. tostring(build.interfaceVersion),
        "|cffffffffDatenbasis:|r " .. tostring(dataBuild.version or "?"),
        "|cffffffffDB2-Tabellen:|r " .. tostring(tableCount),
        "|cffffffffAPI-Modus:|r " .. tostring(self.ForeverAPI and self.ForeverAPI.MODE or "nicht initialisiert"),
        "|cffffffffQuestMap-POI:|r " .. (questCaps.getQuestsOnMap and "|cff33ff99OK|r" or "|cffffcc00fehlt|r"),
        "|cffffffffWorld-Koordinaten:|r " .. (mapCaps.worldFromMap and "|cff33ff99OK|r" or "|cffffcc00fehlt|r"),
        "|cffffffffSecret-System:|r " .. (securityCaps.secretsNamespace and "aktiv" or "nicht erkannt"),
        "",
        "|cffffffffCharakter:|r " .. tostring(profile.race or "?") .. " " .. tostring(profile.class or "?") .. " - Level " .. tostring(profile.level or "?"),
        "|cffffffffAktiver Schritt:|r " .. (step and tostring(step.title) or "keiner"),
        "|cffffffffGuide-Phase:|r " .. (step and tostring(step.phase or "-") or "-"),
        "|cffffffffZielinfo:|r " .. (step and step.goal and tostring(step.goal.instruction) or "-"),
        "|cffffffffResync-Grund:|r " .. tostring(self.db.runtime.guide and self.db.runtime.guide.selectedReason or "-"),
        "|cffffffffRouteEngine:|r " .. tostring(route.source or nav.source or "kein Ziel"),
        "|cffffffffRoute-Kandidaten:|r " .. tostring(route.candidates or nav.candidateCount or 0),
        "|cffffffffRoute-Score:|r " .. tostring(route.score or nav.routeScore or "-"),
        "|cffffffffRichtungsquelle:|r " .. tostring(nav.directionSource or "-"),
        "|cffffffffEntfernung:|r " .. distance,
        "",
        "|cffffffffAuto-Annahme:|r " .. (self.db.settings.autoAcceptQuests and "AN" or "AUS"),
        "|cffffffffAuto-Abgabe:|r " .. (self.db.settings.autoTurnInQuests and "AN" or "AUS"),
        "|cffffffffNavigator:|r " .. (self.db.settings.showNavigator and "AN" or "AUS") ..
            (self.db.settings.navigatorLocked and " / gesperrt" or " / frei"),
        "|cffffffffTheme:|r " .. tostring(themeName or "Forever Classic"),
        "|cffffffffGuide-Validierung:|r " .. (validation.valid and "|cff33ff99OK|r" or "|cffffcc00prüfen|r") ..
            " (" .. tostring(validation.errors or 0) .. " Fehler)",
        "|cffffffffTravelGraph:|r " .. tostring(travel.nodes or 0) .. " Knoten / " ..
            tostring(travel.edges or 0) .. " Kanten",
        "|cffffffffGear-Empfehlung:|r " .. tostring(gear.recommendedItemID or "-") ..
            (gear.delta and (" (+" .. tostring(gear.delta) .. " ilvl)") or ""),
        "|cffffffffTalent-Empfehlung:|r " .. tostring(talent.recommendedSpellID or "-"),
        "|cffffffffReward-Empfehlung:|r " .. tostring(reward.recommendedItemID or "-"),
        "",
        "|cffffffffDiagnose-Logs:|r " .. tostring(logs.total),
        "|cffffffffWarnungen:|r " .. tostring(logs.warnings),
        "|cffffffffFehler:|r " .. tostring(logs.errors),
        "|cffffffffSV-Boot-Zaehler:|r " .. tostring(persistence.currentBootCount or "-"),
        "|cffffffffSV-vorher geladen:|r " .. (persistence.hadSentinel and "ja" or "nein/erster Start"),
        "",
        "|cff9da7b3v0.9 Roadmap-Complete Engine|r",
        "- QuestTracking + DataLoader + Validation",
        "- RouteEngine + TravelGraph + Navigator",
        "- Inventory + GearAdvisor + RewardAdvisor",
        "- BuildState + TalentAdvisor",
        "- Sync + State + lokale Telemetrie + 5 Themes",
    }

    ui.infoBody:SetText(table.concat(lines, "\n"))
end

function MG:RefreshSettings()
    if not ui.settingsFrame or not self.db then return end

    ui.checkAutoAccept:SetChecked(self.db.settings.autoAcceptQuests and true or false)
    ui.checkAutoTurnIn:SetChecked(self.db.settings.autoTurnInQuests and true or false)
    ui.checkSuperTrack:SetChecked(self.db.settings.autoSuperTrack and true or false)
    ui.checkNavigator:SetChecked(self.db.settings.showNavigator and true or false)
    ui.checkNavigatorLocked:SetChecked(self.db.settings.navigatorLocked and true or false)
    ui.checkMinimap:SetChecked(self.db.settings.showMinimapButton and true or false)
    ui.checkDiagnostics:SetChecked(self.db.settings.diagnostics and true or false)
    if ui.checkGearAuto then
        ui.checkGearAuto:SetChecked(self.db.settings.gearAutoEquip and true or false)
    end
    if ui.themeValue and self.Themes then
        local _, themeName = self.Themes:GetCurrent()
        ui.themeValue:SetText(themeName)
    end
    ui.navigatorScaleValue:SetText(string.format("%d%%", math.floor((self.db.settings.navigatorScale or 1) * 100 + 0.5)))

    local transparency = clampTransparency(self.db.settings.windowTransparency)
    ui.updatingSettings = true
    if ui.transparencySlider then
        ui.transparencySlider:SetValue(math.floor(transparency * 100 + 0.5))
    end
    ui.updatingSettings = false

    if ui.transparencyValue then
        ui.transparencyValue:SetText(tostring(math.floor(transparency * 100 + 0.5)) .. "%")
    end
end

function MG:ToggleInfo()
    if not ui.infoFrame then return end

    if ui.infoFrame:IsShown() then
        ui.infoFrame:Hide()
        self.db.settings.showInfo = false
    else
        if ui.settingsFrame then ui.settingsFrame:Hide() end
        centerOverlay(ui.infoFrame)
        ui.infoFrame:Show()
        self.db.settings.showInfo = true
        self.db.settings.showSettings = false
        self:RefreshInfo()
    end
end

function MG:ToggleSettings()
    if not ui.settingsFrame then return end

    if ui.settingsFrame:IsShown() then
        ui.settingsFrame:Hide()
        self.db.settings.showSettings = false
    else
        if ui.infoFrame then ui.infoFrame:Hide() end
        centerOverlay(ui.settingsFrame)
        ui.settingsFrame:Show()
        self.db.settings.showSettings = true
        self.db.settings.showInfo = false
        self:RefreshSettings()
    end
end

function MG:ToggleWindow()
    if not ui.frame then return end
    if ui.frame:IsShown() then self:HideWindow() else self:ShowWindow() end
end

function MG:ShowWindow()
    if not ui.frame then self:InitializeUI() end
    ui.frame:Show()
    self.db.settings.showWindow = true
    self:RefreshUI()
end

function MG:HideWindow()
    if not ui.frame then return end
    ui.frame:Hide()
    if ui.infoFrame then ui.infoFrame:Hide() end
    if ui.settingsFrame then ui.settingsFrame:Hide() end
    self.db.settings.showWindow = false
    self.db.settings.showInfo = false
    self.db.settings.showSettings = false
end

function MG:PrintStatus()
    local build = self:GetBuildInfoTable()
    local logs = self:GetLogSummary()
    local step = self.currentStep
    local nav = self.navigation or {}
    local distance = nav.distanceMeters and string.format("%.0fm", nav.distanceMeters) or "-"

    print("|cff62d6ffMewthisch Guides|r v" .. self.VERSION ..
        " - Build " .. tostring(build.buildNumber) ..
        " - Quest " .. (step and tostring(step.questID) or "-") ..
        " - Distanz " .. distance ..
        " - Logs " .. tostring(logs.total) ..
        " - W " .. tostring(logs.warnings) ..
        " - E " .. tostring(logs.errors))
end
