local addonName, MG = ...

local ui = {
    panels = {},
    buttons = {},
    labels = {},
    rows = {},
    progressBars = {},
    checks = {},
    updatingSettings = false,
}

local MAIN_WIDTH = 326
local MAIN_HEIGHT = 184
local MAIN_COLLAPSED_HEIGHT = 52
local VISIBLE_ROWS = 4

local function color(value, fallback)
    local c = type(value) == "table" and value or fallback or {1, 1, 1, 1}
    return c[1] or 1, c[2] or 1, c[3] or 1, c[4] or 1
end

local function setColorTexture(texture, value, fallback)
    if not texture then return end
    local r, g, b, a = color(value, fallback)
    if texture.SetColorTexture then texture:SetColorTexture(r, g, b, a)
    else texture:SetTexture(r, g, b, a) end
end

local function currentTheme()
    if MG.Themes and MG.Themes.GetCurrent then
        return MG.Themes:GetCurrent()
    end

    return {
        background = {0.04, 0.04, 0.04, 0.98},
        panel = {0.08, 0.08, 0.08, 0.98},
        header = {0.03, 0.03, 0.03, 1},
        border = {0.18, 0.18, 0.18, 1},
        accent = {0.20, 0.72, 0.88, 1},
        text = {0.94, 0.94, 0.94, 1},
        muted = {0.60, 0.60, 0.60, 1},
        active = {0.12, 0.16, 0.20, 1},
        complete = {0.08, 0.30, 0.16, 1},
        danger = {0.42, 0.08, 0.08, 1},
        progress = {0.20, 0.72, 0.88, 1},
        borderSize = 1,
    }, "Fallback"
end

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

local function registerLabel(label, role)
    if not label then return label end
    local font, size, flags = label:GetFont()
    label._mgDefaultFont = font
    label._mgFontSize = size
    label._mgFontFlags = flags
    label._mgRole = role or "text"
    ui.labels[#ui.labels + 1] = label
    return label
end

local function makeText(parent, template, size, role)
    local fs = parent:CreateFontString(nil, "OVERLAY", template or "GameFontNormal")
    if size and fs.SetFont then
        local font, _, flags = fs:GetFont()
        if font then fs:SetFont(font, size, flags) end
    end
    fs:SetJustifyH("LEFT")
    fs:SetWordWrap(true)
    registerLabel(fs, role)
    return fs
end

local function addBorder(frame)
    if frame._mgBorders then return end

    frame._mgBorders = {}
    for _, side in ipairs({"top", "bottom", "left", "right"}) do
        frame._mgBorders[side] = frame:CreateTexture(nil, "BORDER")
    end

    frame._mgBorders.top:SetPoint("TOPLEFT")
    frame._mgBorders.top:SetPoint("TOPRIGHT")
    frame._mgBorders.bottom:SetPoint("BOTTOMLEFT")
    frame._mgBorders.bottom:SetPoint("BOTTOMRIGHT")
    frame._mgBorders.left:SetPoint("TOPLEFT")
    frame._mgBorders.left:SetPoint("BOTTOMLEFT")
    frame._mgBorders.right:SetPoint("TOPRIGHT")
    frame._mgBorders.right:SetPoint("BOTTOMRIGHT")
end

local function stylePanel(frame, kind)
    frame._mgPanelKind = kind or "panel"
    frame._mgBackground = frame:CreateTexture(nil, "BACKGROUND")
    frame._mgBackground:SetAllPoints(frame)
    addBorder(frame)
    ui.panels[#ui.panels + 1] = frame
end

local function makeButton(parent, text, width, height, callback)
    local button = CreateFrame("Button", nil, parent)
    button:SetSize(width or 56, height or 20)

    button._mgBackground = button:CreateTexture(nil, "BACKGROUND")
    button._mgBackground:SetAllPoints(button)
    addBorder(button)

    button._mgLabel = makeText(button, "GameFontHighlightSmall", 10, "button")
    button._mgLabel:SetPoint("CENTER")
    button._mgLabel:SetJustifyH("CENTER")
    button._mgLabel:SetText(text or "")

    button:SetScript("OnClick", callback)
    button:SetScript("OnEnter", function(self)
        self._mgHovered = true
        if MG.RefreshTheme then MG:RefreshTheme() end
    end)
    button:SetScript("OnLeave", function(self)
        self._mgHovered = false
        if MG.RefreshTheme then MG:RefreshTheme() end
    end)

    function button:SetText(value)
        self._mgLabel:SetText(value or "")
    end

    ui.buttons[#ui.buttons + 1] = button
    return button
end

local function setButtonEnabled(button, enabled)
    if not button then return end
    button:SetEnabled(enabled and true or false)
    button:SetAlpha(enabled and 1 or 0.38)
end

local function makeCheck(parent, y, labelText, settingKey, onChanged)
    local check = CreateFrame("Button", nil, parent)
    check:SetSize(18, 18)
    check:SetPoint("TOPLEFT", 18, y)

    check._mgBackground = check:CreateTexture(nil, "BACKGROUND")
    check._mgBackground:SetAllPoints()
    addBorder(check)

    check._mgMark = check:CreateTexture(nil, "ARTWORK")
    check._mgMark:SetPoint("TOPLEFT", 4, -4)
    check._mgMark:SetPoint("BOTTOMRIGHT", -4, 4)

    local label = makeText(parent, "GameFontHighlight", 12, "text")
    label:SetPoint("LEFT", check, "RIGHT", 7, 0)
    label:SetPoint("RIGHT", parent, -18, 0)
    label:SetText(labelText)

    function check:SetChecked(value)
        self._mgChecked = value and true or false
        self._mgMark:SetShown(self._mgChecked)
    end

    function check:GetChecked()
        return self._mgChecked and true or false
    end

    check:SetScript("OnClick", function(self)
        self:SetChecked(not self:GetChecked())
        MG.db.settings[settingKey] = self:GetChecked()
        MG:Log("INFO", "settings.changed", "Mewthisch-Guides-Einstellung geändert.", {
            setting = settingKey,
            enabled = self:GetChecked(),
        })
        if onChanged then onChanged(self:GetChecked()) end
        MG:RefreshTheme()
        MG:RefreshInfo()
    end)

    ui.checks[#ui.checks + 1] = check
    return check
end

local function makeProgressBar(parent, height)
    local frame = CreateFrame("Frame", nil, parent)
    frame:SetHeight(height or 10)

    frame._mgBackground = frame:CreateTexture(nil, "BACKGROUND")
    frame._mgBackground:SetAllPoints()

    frame.fill = frame:CreateTexture(nil, "ARTWORK")
    frame.fill:SetPoint("TOPLEFT")
    frame.fill:SetPoint("BOTTOMLEFT")
    frame.fill:SetWidth(1)

    frame.text = makeText(frame, "GameFontHighlightSmall", 9, "text")
    frame.text:SetPoint("CENTER")
    frame.text:SetJustifyH("CENTER")

    frame.percent = 0

    function frame:SetProgress(percent, label)
        self.percent = math.max(0, math.min(1, tonumber(percent) or 0))
        local width = math.max(1, self:GetWidth() * self.percent)
        self.fill:SetWidth(width)
        self.text:SetText(label or "")
    end

    ui.progressBars[#ui.progressBars + 1] = frame
    return frame
end

local function makeStepRow(parent, index)
    local row = CreateFrame("Frame", nil, parent)
    row:SetHeight(20)

    row._mgBackground = row:CreateTexture(nil, "BACKGROUND")
    row._mgBackground:SetAllPoints()

    row._mgStatus = row:CreateTexture(nil, "ARTWORK")
    row._mgStatus:SetPoint("TOPLEFT", 0, 0)
    row._mgStatus:SetPoint("BOTTOMLEFT", 0, 0)
    row._mgStatus:SetWidth(3)

    row.text = makeText(row, "GameFontHighlightSmall", 11, "row")
    row.text:SetPoint("LEFT", 8, 0)
    row.text:SetPoint("RIGHT", -6, 0)
    row.text:SetJustifyV("MIDDLE")
    row.text:SetWordWrap(false)

    row.role = "muted"
    row.index = index
    ui.rows[#ui.rows + 1] = row
    return row
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

local function setFrameBorder(frame, theme)
    if not frame or not frame._mgBorders then return end
    local size = math.max(1, tonumber(theme.borderSize) or 1)
    frame._mgBorders.top:SetHeight(size)
    frame._mgBorders.bottom:SetHeight(size)
    frame._mgBorders.left:SetWidth(size)
    frame._mgBorders.right:SetWidth(size)

    for _, texture in pairs(frame._mgBorders) do
        setColorTexture(texture, theme.border)
    end
end

local function objectiveProgressColor(percent)
    percent = math.max(0, math.min(1, tonumber(percent) or 0))

    -- Continuous red -> yellow -> green feedback:
    -- 0/required = red, halfway = yellow, complete = green.
    if percent <= 0.5 then
        return 1, percent * 2, 0, 1
    end

    return (1 - percent) * 2, 1, 0, 1
end

local function rowColors(role, theme)
    if role == "complete" then return theme.complete, theme.complete end
    if role == "danger" then return theme.danger, theme.danger end
    if role == "active" then return theme.active, theme.accent end
    if role == "next" then return theme.panel, theme.muted end
    return theme.panel, theme.border
end

function MG:ApplyWindowTransparency()
    if not self.db or not self.db.settings then return end
    local transparency = clampTransparency(self.db.settings.windowTransparency)
    self.db.settings.windowTransparency = transparency
    local alpha = 1 - transparency

    for _, panel in ipairs(ui.panels) do
        if panel and panel._mgBackground then
            panel._mgBackground:SetAlpha(alpha)
        end
    end
end

function MG:RefreshTheme()
    if not self.db then return end
    local theme = currentTheme()

    for _, panel in ipairs(ui.panels) do
        if panel and panel._mgBackground then
            local bg = panel._mgPanelKind == "header" and theme.header or theme.background
            setColorTexture(panel._mgBackground, bg)
            setFrameBorder(panel, theme)
        end
    end

    for _, button in ipairs(ui.buttons) do
        if button and button._mgBackground then
            local bg = (button._mgHovered or button._mgSelected) and theme.active or theme.panel
            setColorTexture(button._mgBackground, bg)
            setFrameBorder(button, theme)
        end
    end

    for _, check in ipairs(ui.checks) do
        setColorTexture(check._mgBackground, theme.panel)
        setColorTexture(check._mgMark, theme.accent)
        setFrameBorder(check, theme)
    end

    for _, bar in ipairs(ui.progressBars) do
        setColorTexture(bar._mgBackground, theme.panel)
        setColorTexture(bar.fill, theme.progress)
    end

    for _, row in ipairs(ui.rows) do
        local bg, strip = rowColors(row.role, theme)
        setColorTexture(row._mgBackground, bg)
        setColorTexture(row._mgStatus, strip)
    end

    for _, label in ipairs(ui.labels) do
        if label and label.SetTextColor then
            local role = label._mgRole
            if role == "title" then
                label:SetTextColor(color(theme.accent))
            elseif role == "muted" then
                label:SetTextColor(color(theme.muted))
            else
                label:SetTextColor(color(theme.text))
            end

            if theme.font and label.SetFont then
                label:SetFont(theme.font, label._mgFontSize or 11, label._mgFontFlags)
            elseif label._mgDefaultFont and label.SetFont then
                label:SetFont(label._mgDefaultFont, label._mgFontSize or 11, label._mgFontFlags)
            end
        end
    end

    for _, row in ipairs(ui.rows) do
        if row and row.text and row.progressPercent ~= nil then
            row.text:SetTextColor(objectiveProgressColor(row.progressPercent))
        end
    end

    if ui.mainAccent then setColorTexture(ui.mainAccent, theme.accent) end
    if ui.minimapLabel then ui.minimapLabel:SetTextColor(color(theme.accent)) end
    if ui.sliderTrack then setColorTexture(ui.sliderTrack, theme.border) end
    if ui.sliderThumb then setColorTexture(ui.sliderThumb, theme.accent) end

    if ui.themeValue and self.Themes then
        local _, name = self.Themes:GetCurrent()
        ui.themeValue:SetText(name)
    end

    self:ApplyWindowTransparency()
end

local function phaseText(step)
    if not step then return "Warten" end
    if step.phase == MG.StepPhases.ACCEPT then return "Annehmen" end
    if step.phase == MG.StepPhases.TURNIN then return "Abgeben" end
    if step.phase == MG.StepPhases.OBJECTIVES then return "Questziel" end
    if step.phase == MG.StepPhases.COMPLETE then return "Erledigt" end
    return "Aktiv"
end

local function phaseRole(step)
    if not step then return "muted" end
    if step.phase == MG.StepPhases.ACCEPT then return "danger" end
    if step.phase == MG.StepPhases.TURNIN or step.phase == MG.StepPhases.COMPLETE then
        return "complete"
    end
    return "active"
end

function MG:SetViewerCollapsed(collapsed)
    if not ui.frame then return end
    collapsed = collapsed and true or false
    self.db.settings.viewerCollapsed = collapsed

    ui.frame:SetHeight(collapsed and MAIN_COLLAPSED_HEIGHT or MAIN_HEIGHT)

    for _, widget in ipairs({
        ui.progress, ui.rowsFrame, ui.footer, ui.stepCounter, ui.progressLabel,
    }) do
        if widget then widget:SetShown(not collapsed) end
    end

    if ui.collapseButton then ui.collapseButton:SetText(collapsed and "+" or "-") end
end

function MG:InitializeUI()
    if ui.frame then return end

    local frame = CreateFrame("Frame", "MewthischGuidesMainFrame", UIParent)
    frame:SetSize(MAIN_WIDTH, MAIN_HEIGHT)
    frame:SetPoint("CENTER", UIParent, "CENTER",
        tonumber(self.db.settings.viewerX) or 260,
        tonumber(self.db.settings.viewerY) or 80)
    frame:SetClampedToScreen(true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    stylePanel(frame, "panel")
    ui.frame = frame

    frame:SetScript("OnDragStart", function(self)
        if not InCombatLockdown or not InCombatLockdown() then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop", function(self)
        self:StopMovingOrSizing()
        saveViewerPosition(self)
    end)

    local header = CreateFrame("Frame", nil, frame)
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(23)
    stylePanel(header, "header")
    ui.header = header

    local accent = header:CreateTexture(nil, "ARTWORK")
    accent:SetPoint("BOTTOMLEFT")
    accent:SetPoint("BOTTOMRIGHT")
    accent:SetHeight(2)
    ui.mainAccent = accent

    local help = makeButton(header, "?", 20, 18, function() MG:ToggleInfo() end)
    help:SetPoint("LEFT", 3, 0)

    local title = makeText(header, "GameFontNormalLarge", 14, "title")
    title:SetPoint("CENTER", 0, 0)
    title:SetText("MEWTHISCH GUIDES")
    ui.title = title

    local collapse = makeButton(header, "-", 20, 18, function()
        MG:SetViewerCollapsed(not MG.db.settings.viewerCollapsed)
    end)
    collapse:SetPoint("RIGHT", -24, 0)
    ui.collapseButton = collapse

    local close = makeButton(header, "X", 20, 18, function() MG:HideWindow() end)
    close:SetPoint("RIGHT", -2, 0)

    local guideBar = CreateFrame("Frame", nil, frame)
    guideBar:SetPoint("TOPLEFT", header, "BOTTOMLEFT", 0, -1)
    guideBar:SetPoint("TOPRIGHT", header, "BOTTOMRIGHT", 0, -1)
    guideBar:SetHeight(25)
    stylePanel(guideBar, "panel")
    ui.guideBar = guideBar

    local prev = makeButton(guideBar, "<", 25, 21, function()
        MG:SelectRelativeStep(-1, "ui_prev")
    end)
    prev:SetPoint("LEFT", 2, 0)
    ui.prev = prev

    local guideTitle = makeText(guideBar, "GameFontHighlight", 11, "text")
    guideTitle:SetPoint("LEFT", prev, "RIGHT", 8, 0)
    guideTitle:SetPoint("RIGHT", guideBar, -57, 0)
    guideTitle:SetWordWrap(false)
    ui.guideTitle = guideTitle

    local next = makeButton(guideBar, ">", 25, 21, function()
        MG:SelectRelativeStep(1, "ui_next")
    end)
    next:SetPoint("RIGHT", -29, 0)
    ui.next = next

    local options = makeButton(guideBar, "O", 25, 21, function() MG:ToggleSettings() end)
    options:SetPoint("RIGHT", -2, 0)
    ui.settingsButton = options

    local progress = makeProgressBar(frame, 12)
    progress:SetPoint("TOPLEFT", guideBar, "BOTTOMLEFT", 5, -5)
    progress:SetPoint("TOPRIGHT", guideBar, "BOTTOMRIGHT", -5, -5)
    ui.progress = progress

    local stepCounter = makeText(frame, "GameFontHighlightSmall", 9, "muted")
    stepCounter:SetPoint("TOPLEFT", progress, "BOTTOMLEFT", 0, -4)
    ui.stepCounter = stepCounter

    local progressLabel = makeText(frame, "GameFontHighlightSmall", 9, "muted")
    progressLabel:SetPoint("TOPRIGHT", progress, "BOTTOMRIGHT", 0, -4)
    progressLabel:SetJustifyH("RIGHT")
    ui.progressLabel = progressLabel

    local rowsFrame = CreateFrame("Frame", nil, frame)
    rowsFrame:SetPoint("TOPLEFT", stepCounter, "BOTTOMLEFT", 0, -4)
    rowsFrame:SetPoint("TOPRIGHT", progressLabel, "BOTTOMRIGHT", 0, -4)
    rowsFrame:SetHeight(83)
    ui.rowsFrame = rowsFrame

    for index = 1, VISIBLE_ROWS do
        local row = makeStepRow(rowsFrame, index)
        row:SetPoint("TOPLEFT", 0, -((index - 1) * 21))
        row:SetPoint("TOPRIGHT", 0, -((index - 1) * 21))
        ui["row" .. index] = row
    end

    local footer = CreateFrame("Frame", nil, frame)
    footer:SetPoint("BOTTOMLEFT", 5, 5)
    footer:SetPoint("BOTTOMRIGHT", -5, 5)
    footer:SetHeight(19)
    ui.footer = footer

    local status = makeText(footer, "GameFontHighlightSmall", 9, "muted")
    status:SetPoint("LEFT", 0, 0)
    status:SetPoint("RIGHT", -62, 0)
    status:SetWordWrap(false)
    ui.footerStatus = status

    local configButton = makeButton(footer, "Config", 54, 18, function()
        MG:ToggleSettings()
    end)
    configButton:SetPoint("RIGHT", 0, 0)
    ui.configButton = configButton

    local infoFrame = CreateFrame("Frame", "MewthischGuidesInfoFrame", UIParent)
    infoFrame:SetSize(480, 570)
    centerOverlay(infoFrame)
    infoFrame:SetClampedToScreen(true)
    stylePanel(infoFrame, "panel")
    infoFrame:Hide()
    ui.infoFrame = infoFrame

    local infoHeader = CreateFrame("Frame", nil, infoFrame)
    infoHeader:SetPoint("TOPLEFT", 1, -1)
    infoHeader:SetPoint("TOPRIGHT", -1, -1)
    infoHeader:SetHeight(26)
    stylePanel(infoHeader, "header")

    local infoTitle = makeText(infoHeader, "GameFontNormalLarge", 14, "title")
    infoTitle:SetPoint("LEFT", 10, 0)
    infoTitle:SetText("Mewthisch Guides – Info")
    ui.infoTitle = infoTitle

    local infoClose = makeButton(infoHeader, "X", 22, 20, function() MG:ToggleInfo() end)
    infoClose:SetPoint("RIGHT", -3, 0)

    local infoBody = makeText(infoFrame, "GameFontHighlightSmall", 11, "text")
    infoBody:SetPoint("TOPLEFT", infoHeader, "BOTTOMLEFT", 12, -12)
    infoBody:SetPoint("BOTTOMRIGHT", -12, 12)
    infoBody:SetJustifyV("TOP")
    ui.infoBody = infoBody

    local settingsFrame = CreateFrame("Frame", "MewthischGuidesSettingsFrame", UIParent)
    settingsFrame:SetSize(440, 620)
    centerOverlay(settingsFrame)
    settingsFrame:SetClampedToScreen(true)
    stylePanel(settingsFrame, "panel")
    settingsFrame:Hide()
    ui.settingsFrame = settingsFrame

    local settingsHeader = CreateFrame("Frame", nil, settingsFrame)
    settingsHeader:SetPoint("TOPLEFT", 1, -1)
    settingsHeader:SetPoint("TOPRIGHT", -1, -1)
    settingsHeader:SetHeight(26)
    stylePanel(settingsHeader, "header")

    local settingsTitle = makeText(settingsHeader, "GameFontNormalLarge", 14, "title")
    settingsTitle:SetPoint("LEFT", 10, 0)
    settingsTitle:SetText("Mewthisch Guides – Optionen")
    ui.settingsTitle = settingsTitle

    local settingsClose = makeButton(settingsHeader, "X", 22, 20, function()
        MG:ToggleSettings()
    end)
    settingsClose:SetPoint("RIGHT", -3, 0)

    local routeModeLabel = makeText(settingsFrame, "GameFontHighlight", 11, "text")
    routeModeLabel:SetPoint("TOPLEFT", 18, -48)
    routeModeLabel:SetText("Routenmodus")

    local manualMode = makeButton(settingsFrame, "Manuell", 82, 21, function()
        MG:SetRouteMode("manual")
    end)
    manualMode:SetPoint("TOPLEFT", 110, -41)
    ui.routeManualButton = manualMode

    local presetMode = makeButton(settingsFrame, "Vorgegeben", 92, 21, function()
        MG:SetRouteMode("preset")
    end)
    presetMode:SetPoint("LEFT", manualMode, "RIGHT", 8, 0)
    ui.routePresetButton = presetMode

    local routeModeValue = makeText(settingsFrame, "GameFontHighlightSmall", 9, "muted")
    routeModeValue:SetPoint("LEFT", presetMode, "RIGHT", 8, 0)
    routeModeValue:SetPoint("RIGHT", -14, 0)
    routeModeValue:SetWordWrap(false)
    ui.routeModeValue = routeModeValue

    ui.checkAutoAccept = makeCheck(settingsFrame, -82,
        "Quests bei Questgebern automatisch annehmen", "autoAcceptQuests")
    ui.checkAutoTurnIn = makeCheck(settingsFrame, -110,
        "Fertige Quests automatisch abgeben", "autoTurnInQuests")
    ui.checkSuperTrack = makeCheck(settingsFrame, -138,
        "Aktuelles Ziel automatisch super-tracken", "autoSuperTrack",
        function() MG:RefreshGuide("settings_supertrack") end)
    ui.checkNavigator = makeCheck(settingsFrame, -166,
        "Separaten Navigator anzeigen", "showNavigator",
        function() MG:RefreshNavigator() end)
    ui.checkNavigatorLocked = makeCheck(settingsFrame, -194,
        "Navigator sperren", "navigatorLocked")
    ui.checkMinimap = makeCheck(settingsFrame, -222,
        "Minimap-Button anzeigen", "showMinimapButton",
        function() MG:RefreshMinimapButton() end)
    ui.checkWorldMapMarker = makeCheck(settingsFrame, -250,
        "Aktuelles Ziel auf der Weltkarte markieren", "showWorldMapMarker",
        function()
            if MG.RefreshWorldMapMarker then
                MG:RefreshWorldMapMarker(MG.navigation and MG.navigation.target or nil)
            end
        end)
    ui.checkDiagnostics = makeCheck(settingsFrame, -278,
        "Diagnose-Logs speichern", "diagnostics")
    ui.checkGearAuto = makeCheck(settingsFrame, -306,
        "Bessere Ausrüstung automatisch anlegen",
        "gearAutoEquip",
        function() if MG.Sync then MG.Sync:Inventory("settings_gear_auto") end end)

    local transparencyLabel = makeText(settingsFrame, "GameFontHighlight", 11, "text")
    transparencyLabel:SetPoint("TOPLEFT", 18, -348)
    transparencyLabel:SetText("Fenster-Transparenz")

    local transparencyValue = makeText(settingsFrame, "GameFontHighlight", 10, "muted")
    transparencyValue:SetPoint("TOPRIGHT", -20, -348)
    transparencyValue:SetWidth(55)
    transparencyValue:SetJustifyH("RIGHT")
    ui.transparencyValue = transparencyValue

    local slider = CreateFrame("Slider", "MewthischGuidesTransparencySlider", settingsFrame)
    slider:SetOrientation("HORIZONTAL")
    slider:SetSize(280, 18)
    slider:SetPoint("TOPLEFT", 18, -368)
    slider:SetMinMaxValues(0, 80)
    slider:SetValueStep(5)
    if slider.SetObeyStepOnDrag then slider:SetObeyStepOnDrag(true) end

    local sliderTrack = slider:CreateTexture(nil, "BACKGROUND")
    sliderTrack:SetPoint("LEFT")
    sliderTrack:SetPoint("RIGHT")
    sliderTrack:SetHeight(4)
    ui.sliderTrack = sliderTrack

    slider:SetThumbTexture("Interface\\Buttons\\WHITE8X8")
    local sliderThumb = slider:GetThumbTexture()
    if sliderThumb then sliderThumb:SetSize(10, 16) end
    ui.sliderThumb = sliderThumb

    slider:SetScript("OnValueChanged", function(_, value)
        if ui.updatingSettings then return end
        local rounded = math.floor((tonumber(value) or 0) / 5 + 0.5) * 5
        local transparency = clampTransparency(rounded / 100)
        local current = clampTransparency(MG.db.settings.windowTransparency)

        if math.abs(current - transparency) >= 0.0001 then
            MG.db.settings.windowTransparency = transparency
            MG:ApplyWindowTransparency()
            MG:Log("INFO", "settings.window_transparency",
                "Fenster-Transparenz geändert.", {
                    transparency = transparency,
                    percent = math.floor(transparency * 100 + 0.5),
                })
        end

        ui.transparencyValue:SetText(
            tostring(math.floor(transparency * 100 + 0.5)) .. "%")
    end)
    ui.transparencySlider = slider

    local scaleLabel = makeText(settingsFrame, "GameFontHighlight", 11, "text")
    scaleLabel:SetPoint("TOPLEFT", 18, -408)
    scaleLabel:SetText("Navigator-Größe")

    local scaleDown = makeButton(settingsFrame, "-", 28, 20, function()
        MG:SetNavigatorScale((MG.db.settings.navigatorScale or 1) - 0.05)
    end)
    scaleDown:SetPoint("TOPLEFT", 150, -401)

    local scaleValue = makeText(settingsFrame, "GameFontHighlight", 11, "text")
    scaleValue:SetPoint("LEFT", scaleDown, "RIGHT", 8, 0)
    scaleValue:SetWidth(55)
    scaleValue:SetJustifyH("CENTER")
    ui.navigatorScaleValue = scaleValue

    local scaleUp = makeButton(settingsFrame, "+", 28, 20, function()
        MG:SetNavigatorScale((MG.db.settings.navigatorScale or 1) + 0.05)
    end)
    scaleUp:SetPoint("LEFT", scaleValue, "RIGHT", 8, 0)

    local resetNavigator = makeButton(settingsFrame, "Pfeil zurücksetzen", 145, 21, function()
        MG:ResetNavigatorPosition()
    end)
    resetNavigator:SetPoint("TOPLEFT", 18, -441)

    local themeLabel = makeText(settingsFrame, "GameFontHighlight", 11, "text")
    themeLabel:SetPoint("TOPLEFT", 18, -482)
    themeLabel:SetText("Design")

    local themeButton = makeButton(settingsFrame, "Nächstes Theme", 125, 21, function()
        if MG.Themes then MG.Themes:Next() end
        MG:RefreshSettings()
        MG:RefreshUI()
    end)
    themeButton:SetPoint("TOPLEFT", 80, -475)
    ui.themeButton = themeButton

    local themeValue = makeText(settingsFrame, "GameFontHighlightSmall", 10, "muted")
    themeValue:SetPoint("LEFT", themeButton, "RIGHT", 10, 0)
    themeValue:SetPoint("RIGHT", -16, 0)
    themeValue:SetWordWrap(false)
    ui.themeValue = themeValue

    local elvNote = makeText(settingsFrame, "GameFontHighlightSmall", 9, "muted")
    elvNote:SetPoint("TOPLEFT", 18, -516)
    elvNote:SetPoint("RIGHT", -18, 0)
    elvNote:SetText("ElvUI übernimmt bei erkanntem ElvUI automatisch dessen Hintergrund-, Rahmen-, Akzentfarben und Standardschrift.")

    local safety = makeText(settingsFrame, "GameFontHighlightSmall", 9, "muted")
    safety:SetPoint("TOPLEFT", 18, -552)
    safety:SetPoint("RIGHT", -18, 0)
    safety:SetText("Auto-Equip schützt Waffen und bindet keine erkannten BoE-Gegenstände. Mehrfachbelohnungen und Talente bleiben manuell.")

    if self.db.settings.showWindow == false then frame:Hide() end

    self:SetViewerCollapsed(self.db.settings.viewerCollapsed)
    self:RefreshSettings()
    self:RefreshTheme()
    self:RefreshInfo()
    self:Log("INFO", "ui.initialized",
        "Kompakter Mewthisch-Guides-Viewer initialisiert.", {
            version = self.VERSION,
            layout = "compact-guide-widget",
        })
end

function MG:CreateMinimapButton()
    if ui.minimapButton or not Minimap then
        self:RefreshMinimapButton()
        return
    end

    local button = CreateFrame("Button", "MewthischGuidesMinimapButton", Minimap)
    button:SetSize(30, 30)
    button:SetFrameStrata("MEDIUM")
    button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
    button:RegisterForDrag("LeftButton")
    button:SetMovable(true)

    local bg = button:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    button._mgBackground = bg
    addBorder(button)
    ui.buttons[#ui.buttons + 1] = button

    local label = makeText(button, "GameFontNormal", 10, "title")
    label:SetPoint("CENTER")
    label:SetText("MG")
    label:SetJustifyH("CENTER")
    ui.minimapLabel = label

    local dragging = false

    local function atan2(y, x)
        if math.atan2 then return math.atan2(y, x) end
        if x > 0 then return math.atan(y / x) end
        if x < 0 and y >= 0 then return math.atan(y / x) + math.pi end
        if x < 0 and y < 0 then return math.atan(y / x) - math.pi end
        if x == 0 and y > 0 then return math.pi / 2 end
        if x == 0 and y < 0 then return -math.pi / 2 end
        return 0
    end

    local function positionFromAngle()
        local angle = math.rad(tonumber(MG.db.settings.minimapAngle) or 215)
        button:ClearAllPoints()
        button:SetPoint("CENTER", Minimap, "CENTER",
            math.cos(angle) * 80, math.sin(angle) * 80)
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
        GameTooltip:AddLine("Linksklick: Guide ein-/ausblenden", 1, 1, 1)
        GameTooltip:AddLine("Rechtsklick: Optionen", 1, 1, 1)
        GameTooltip:AddLine("Ziehen: Position ändern", 1, 1, 1)
        GameTooltip:Show()
    end)
    button:SetScript("OnLeave", function()
        if GameTooltip then GameTooltip:Hide() end
    end)

    ui.minimapButton = button
    ui.positionMinimapButton = positionFromAngle
    positionFromAngle()
    self:RefreshMinimapButton()
    self:RefreshTheme()
    self:Log("INFO", "ui.minimap_created",
        "Mewthisch-Guides-Minimap-Button erstellt.")
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

local function clearRows()
    for index = 1, VISIBLE_ROWS do
        local row = ui["row" .. index]
        row.text:SetText("")
        row.role = "muted"
        row.progressPercent = nil
        row:Hide()
    end
end

local function addRow(models, text, role, progressPercent)
    if not text or text == "" or #models >= VISIBLE_ROWS then return end
    models[#models + 1] = {
        text = text,
        role = role or "muted",
        progressPercent = progressPercent,
    }
end

local function goalRowText(goal)
    local name = tostring(goal.name or "Questziel")
    local current = tonumber(goal.current)
    local required = tonumber(goal.required)
    local progress = current and required and
        (tostring(current) .. "/" .. tostring(required)) or
        tostring(goal.progressText or "")

    local instruction
    if goal.type == "collect" or goal.type == "collect_currency" then
        instruction = "Sammle " .. name
    elseif goal.type == "kill" then
        instruction = "Töte " .. name
    elseif goal.type == "kill_player" then
        instruction = "Besiege " .. name
    elseif goal.type == "interact" then
        instruction = "Interagiere mit " .. name
    else
        instruction = tostring(goal.instruction or name)
    end

    if progress ~= "" then
        instruction = instruction .. "  " .. progress
    end

    return instruction
end

function MG:RefreshUI()
    if not ui.frame then return end

    local step = self.currentStep
    local guide = self.GetActiveGuideDefinition and self:GetActiveGuideDefinition() or nil
    local routeMode = self.GetRouteMode and self:GetRouteMode() or "preset"
    local guideName
    if routeMode == "manual" then
        guideName = "Manuell – aktive Quests / kurze Laufwege"
    else
        guideName = guide and (guide.title or guide.id) or "Kein Guide ausgewählt"
    end

    ui.guideTitle:SetText(guideName)
    clearRows()

    if not step then
        ui.stepCounter:SetText("0 / 0")
        ui.progressLabel:SetText("Warte auf Guide-Schritt")
        ui.progress:SetProgress(0, "")
        ui.footerStatus:SetText("Keine aktive Quest")

        local row = ui.row1
        row.text:SetText("Warte auf den nächsten passenden Guide-Schritt")
        row.role = "muted"
        row:Show()

        setButtonEnabled(ui.prev, false)
        setButtonEnabled(ui.next, false)
        self:RefreshTheme()
        return
    end

    local stepCount = #self.steps
    local currentIndex = math.max(1, tonumber(self.currentStepIndex) or 1)
    local goalProgress = step.goal and tonumber(step.goal.percent) or 0
    local routeProgress = stepCount > 0 and
        math.min(1, ((currentIndex - 1) + math.max(0, math.min(1, goalProgress or 0))) / stepCount) or 0

    ui.stepCounter:SetText(tostring(currentIndex) .. " / " .. tostring(stepCount))
    ui.progressLabel:SetText(phaseText(step))
    ui.progress:SetProgress(routeProgress, string.format("%d%%", math.floor(routeProgress * 100 + 0.5)))

    local models = {}
    addRow(models,
        phaseText(step) .. ": " .. tostring(step.title or ("Quest " .. tostring(step.questID))),
        phaseRole(step))

    for _, goal in ipairs(step.goals or {}) do
        local role = goal.state == self.GoalStates.COMPLETE and "complete" or
            goal.state == self.GoalStates.ACTIVE and "active" or "muted"
        local prefix = goal.state == self.GoalStates.COMPLETE and "✓ " or
            goal.state == self.GoalStates.ACTIVE and "> " or "  "
        local progressPercent = nil
        if tonumber(goal.required) and tonumber(goal.required) > 0 and
           tonumber(goal.current) then
            progressPercent = math.max(0, math.min(1,
                tonumber(goal.current) / tonumber(goal.required)))
        elseif tonumber(goal.percent) then
            progressPercent = math.max(0, math.min(1, tonumber(goal.percent)))
        end
        addRow(models, prefix .. goalRowText(goal), role, progressPercent)
    end

    for _, hint in ipairs(step.routeHints or {}) do
        addRow(models, "• " .. tostring(hint.text or ""), "next")
    end

    local nextStep = self.steps and self.steps[currentIndex + 1]
    if nextStep then
        addRow(models, "Danach: " .. tostring(nextStep.title or "nächster Schritt"), "next")
    end

    for index, model in ipairs(models) do
        local row = ui["row" .. index]
        row.text:SetText(model.text)
        row.role = model.role
        row.progressPercent = model.progressPercent
        row:Show()
    end

    local nav = self.navigation or {}
    local distance = nav.distanceMeters and
        (nav.distanceMeters >= 1000 and string.format("%.1f km", nav.distanceMeters / 1000) or
            string.format("%.0f m", nav.distanceMeters)) or "–"
    ui.footerStatus:SetText("Ziel: " .. distance .. "  •  " ..
        tostring(self.automationStatus or "bereit"))

    setButtonEnabled(ui.prev, currentIndex > 1)
    setButtonEnabled(ui.next, currentIndex < stepCount)

    self:RefreshTheme()
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
    local restedXP = self.db.runtime and self.db.runtime.restedXP or {}
    local theme, themeName = currentTheme()

    local tableCount = 0
    for _ in pairs(self.Data and self.Data.tableStats or {}) do tableCount = tableCount + 1 end

    local distance = "–"
    if nav.distanceMeters then
        distance = nav.distanceMeters >= 1000 and
            string.format("%.2f km", nav.distanceMeters / 1000) or
            string.format("%.0f m", nav.distanceMeters)
    end

    local lines = {
        "Addon: Mewthisch Guides v" .. self.VERSION,
        "Forever-Build: " .. tostring(build.version) .. " (" .. tostring(build.buildNumber) .. ")",
        "Interface: " .. tostring(build.interfaceVersion),
        "Datenbasis: " .. tostring(dataBuild.version or "?"),
        "DB2-Tabellen: " .. tostring(tableCount),
        "API-Modus: " .. tostring(self.ForeverAPI and self.ForeverAPI.MODE or "nicht initialisiert"),
        "QuestMap-POI: " .. (questCaps.getQuestsOnMap and "OK" or "fehlt"),
        "World-Koordinaten: " .. (mapCaps.worldFromMap and "OK" or "fehlt"),
        "Secret-System: " .. (securityCaps.secretsNamespace and "aktiv" or "nicht erkannt"),
        "",
        "Charakter: " .. tostring(profile.race or "?") .. " " ..
            tostring(profile.class or "?") .. " – Level " .. tostring(profile.level or "?"),
        "Aktiver Schritt: " .. (step and tostring(step.title) or "keiner"),
        "Guide-Phase: " .. (step and tostring(step.phase or "–") or "–"),
        "Zielinfo: " .. (step and step.goal and tostring(step.goal.instruction) or "–"),
        "Resync-Grund: " .. tostring(self.db.runtime.guide and
            self.db.runtime.guide.selectedReason or "–"),
        "RouteEngine: " .. tostring(route.source or nav.source or "kein Ziel"),
        "Route-Kandidaten: " .. tostring(route.candidates or nav.candidateCount or 0),
        "Route-Score: " .. tostring(route.score or nav.routeScore or "–"),
        "Richtungsquelle: " .. tostring(nav.directionSource or "–"),
        "Entfernung: " .. distance,
        "",
        "Auto-Annahme: " .. (self.db.settings.autoAcceptQuests and "AN" or "AUS"),
        "Auto-Abgabe: " .. (self.db.settings.autoTurnInQuests and "AN" or "AUS"),
        "Routenmodus: " .. ((self.GetRouteMode and self:GetRouteMode() == "manual") and
            "Manuell / kürzeste aktuelle Ziele" or "Vorgegebene Route"),
        "Weltkarten-Marker: " .. (self.db.settings.showWorldMapMarker and "AN" or "AUS"),
        "Navigator: " .. (self.db.settings.showNavigator and "AN" or "AUS") ..
            (self.db.settings.navigatorLocked and " / gesperrt" or " / frei"),
        "Theme: " .. tostring(themeName),
        "ElvUI erkannt: " .. ((self.Themes and self.Themes:IsElvUIAvailable()) and "ja" or "nein"),
        "EllesmereUI erkannt: " .. ((self.Themes and self.Themes:IsEllesmereUIAvailable()) and "ja" or "nein"),
        "ToxiUI erkannt: " .. ((self.Themes and self.Themes:IsToxiUIAvailable()) and "ja" or "nein"),
        "Guide-Validierung: " .. (validation.valid and "OK" or "prüfen") ..
            " (" .. tostring(validation.errors or 0) .. " Fehler)",
        "TravelGraph: " .. tostring(travel.nodes or 0) .. " Knoten / " ..
            tostring(travel.edges or 0) .. " Kanten",
        "Gear-Empfehlung: " .. tostring(gear.recommendedItemID or "–"),
        "Gear-Auto-Equip: " .. tostring(gear.autoEquipReason or "–"),
        "Talent-Empfehlung: " .. tostring(talent.recommendedSpellID or "–"),
        "Reward-Empfehlung: " .. tostring(reward.recommendedItemID or "–"),
        "RestedXP-Guidequellen: " .. tostring(restedXP.rawGuides or 0) ..
            " / Questdefinitionen: " .. tostring(restedXP.normalizedQuestDefinitions or 0),
        "RestedXP-Quelldaten: " .. tostring(restedXP.structuredActions or 0) ..
            " strukturierte Aktionen",
        "RestedXP-Aktionsabdeckung: " ..
            tostring(restedXP.knownActionKinds or 0) .. "/" ..
            tostring(restedXP.catalogActionKinds or 0) ..
            " Typen, unbekannt: " .. tostring(restedXP.unknownActionKinds or 0),
        "RestedXP-Commit: " .. tostring(restedXP.sourceCommit or "–"),
        "",
        "Diagnose-Logs: " .. tostring(logs.total),
        "Warnungen: " .. tostring(logs.warnings),
        "Fehler: " .. tostring(logs.errors),
        "SV-Boot-Zähler: " .. tostring(persistence.currentBootCount or "–"),
        "SV vorher geladen: " .. (persistence.hadSentinel and "ja" or "nein/erster Start"),
    }

    ui.infoBody:SetText(table.concat(lines, "\n"))
end

function MG:RefreshSettings()
    if not ui.settingsFrame or not self.db then return end

    ui.checkAutoAccept:SetChecked(self.db.settings.autoAcceptQuests)
    ui.checkAutoTurnIn:SetChecked(self.db.settings.autoTurnInQuests)
    ui.checkSuperTrack:SetChecked(self.db.settings.autoSuperTrack)
    ui.checkNavigator:SetChecked(self.db.settings.showNavigator)
    ui.checkNavigatorLocked:SetChecked(self.db.settings.navigatorLocked)
    ui.checkMinimap:SetChecked(self.db.settings.showMinimapButton)
    ui.checkWorldMapMarker:SetChecked(self.db.settings.showWorldMapMarker)
    ui.checkDiagnostics:SetChecked(self.db.settings.diagnostics)
    ui.checkGearAuto:SetChecked(self.db.settings.gearAutoEquip)

    local routeMode = self.GetRouteMode and self:GetRouteMode() or "preset"
    ui.routeManualButton._mgSelected = routeMode == "manual"
    ui.routePresetButton._mgSelected = routeMode == "preset"
    ui.routeModeValue:SetText(routeMode == "manual" and "aktiv: Manuell" or "aktiv: Vorgegeben")

    ui.navigatorScaleValue:SetText(string.format("%d%%",
        math.floor((self.db.settings.navigatorScale or 1) * 100 + 0.5)))

    local transparency = clampTransparency(self.db.settings.windowTransparency)
    ui.updatingSettings = true
    ui.transparencySlider:SetValue(math.floor(transparency * 100 + 0.5))
    ui.updatingSettings = false
    ui.transparencyValue:SetText(
        tostring(math.floor(transparency * 100 + 0.5)) .. "%")

    if self.Themes then
        local _, themeName = self.Themes:GetCurrent()
        ui.themeValue:SetText(themeName)
    end

    self:RefreshTheme()
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
        self:RefreshTheme()
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
    local distance = nav.distanceMeters and string.format("%.0f m", nav.distanceMeters) or "–"
    local _, themeName = currentTheme()

    print("|cff62d6ffMewthisch Guides|r v" .. self.VERSION ..
        " – Build " .. tostring(build.buildNumber) ..
        " – Quest " .. (step and tostring(step.questID) or "–") ..
        " – Entfernung " .. distance ..
        " – Theme " .. tostring(themeName) ..
        " – Logs " .. tostring(logs.total) ..
        " – W " .. tostring(logs.warnings) ..
        " – E " .. tostring(logs.errors))
end
