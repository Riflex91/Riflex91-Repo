local addonName, MG = ...

MG.GuideViewer = MG.GuideViewer or {}
local V = MG.GuideViewer
local UI = MG.UICompat

local FRAME_WIDTH = 390
local MAX_ROWS = 12
local ROW_HEIGHT = 24
local ROW_START_Y = 101
local BOTTOM_AREA = 42

local function makeSolid(parent, layer, r, g, b, a)
    local tex = parent:CreateTexture(nil, layer or "BACKGROUND")
    UI:SetSolid(tex, r, g, b, a)
    return tex
end

local function setFontShadow(font)
    if not font then return end
    if font.SetShadowColor then font:SetShadowColor(0, 0, 0, 1) end
    if font.SetShadowOffset then font:SetShadowOffset(1, -1) end
end

local function makeFlatButton(parent, text, width, height, callback)
    local button = CreateFrame("Button", nil, parent)
    UI:SetSize(button, width, height)

    local bg = makeSolid(button, "BACKGROUND", 0.12, 0.08, 0.03, 0.95)
    bg:SetAllPoints()

    local border = makeSolid(button, "BORDER", 0.92, 0.55, 0.08, 0.78)
    border:SetPoint("TOPLEFT", 0, 0)
    border:SetPoint("TOPRIGHT", 0, 0)
    border:SetHeight(1)

    local label = button:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormal", "GameFontNormal"))
    label:SetPoint("CENTER", 0, 0)
    label:SetText(text)
    if label.SetTextColor then label:SetTextColor(1, 0.72, 0.10) end
    setFontShadow(label)

    button:SetScript("OnEnter", function()
        UI:SetSolid(bg, 0.22, 0.13, 0.03, 0.98)
    end)
    button:SetScript("OnLeave", function()
        UI:SetSolid(bg, 0.12, 0.08, 0.03, 0.95)
    end)
    button:SetScript("OnClick", callback)
    button.label = label
    return button
end

local function savePosition(frame)
    if not MG.db then return end
    MG.db.ui = MG.db.ui or {}
    if not frame.GetCenter or not UIParent or not UIParent.GetCenter then return end
    local x, y = frame:GetCenter()
    local ux, uy = UIParent:GetCenter()
    if x and y and ux and uy then
        MG.db.ui.viewerX = x - ux
        MG.db.ui.viewerY = y - uy
    end
end

local function applyPosition(frame)
    if frame.ClearAllPoints then frame:ClearAllPoints() end
    local x = MG.db and MG.db.ui and tonumber(MG.db.ui.viewerX)
    local y = MG.db and MG.db.ui and tonumber(MG.db.ui.viewerY)
    if x and y then
        frame:SetPoint("CENTER", UIParent, "CENTER", x, y)
    else
        frame:SetPoint("LEFT", UIParent, "LEFT", 24, 80)
    end
end

local function markerFor(row)
    if row.stickyHeader then return "", 1.0, 0.74, 0.08 end
    if row.navigated then return ">", 1.0, 0.74, 0.08 end
    if row.status == "complete" or row.status == "complete_hidden" then
        return "v", 0.30, 0.90, 0.45
    end
    if row.status == "warning" or row.warning then
        return "!", 1.0, 0.48, 0.10
    end
    if row.passive then return "i", 0.40, 0.72, 1.0 end
    return "o", 0.80, 0.80, 0.80
end

local function rowTextColor(row)
    if row.stickyHeader then return 1.0, 0.74, 0.08 end
    if row.status == "complete" or row.status == "complete_hidden" then
        return 0.55, 0.75, 0.58
    end
    if row.status == "warning" or row.warning then
        return 1.0, 0.68, 0.25
    end
    if row.passive then return 0.70, 0.82, 1.0 end
    return 0.94, 0.94, 0.94
end

function V:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Viewer", UIParent)
    UI:SetSize(frame, FRAME_WIDTH, 185)
    UI:SetFrameStrata(frame, "HIGH")
    UI:SetClampedToScreen(frame, true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    applyPosition(frame)

    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then
            self:StartMoving()
        end
    end)
    frame:SetScript("OnDragStop", function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
        savePosition(self)
    end)

    local bg = makeSolid(frame, "BACKGROUND", 0.012, 0.015, 0.020, 0.94)
    bg:SetAllPoints()

    local header = makeSolid(frame, "BORDER", 0.035, 0.040, 0.050, 0.98)
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(32)

    local topLine = makeSolid(frame, "ARTWORK", 0.95, 0.56, 0.06, 0.95)
    topLine:SetPoint("TOPLEFT", 1, -1)
    topLine:SetPoint("TOPRIGHT", -1, -1)
    topLine:SetHeight(1)

    local bottomLine = makeSolid(frame, "ARTWORK", 0.45, 0.28, 0.06, 0.75)
    bottomLine:SetPoint("BOTTOMLEFT", 1, 1)
    bottomLine:SetPoint("BOTTOMRIGHT", -1, 1)
    bottomLine:SetHeight(1)

    local leftLine = makeSolid(frame, "ARTWORK", 0.30, 0.20, 0.06, 0.65)
    leftLine:SetPoint("TOPLEFT", 1, -1)
    leftLine:SetPoint("BOTTOMLEFT", 1, 1)
    leftLine:SetWidth(1)

    local rightLine = makeSolid(frame, "ARTWORK", 0.30, 0.20, 0.06, 0.65)
    rightLine:SetPoint("TOPRIGHT", -1, -1)
    rightLine:SetPoint("BOTTOMRIGHT", -1, 1)
    rightLine:SetWidth(1)

    local title = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 11, -8)
    title:SetText("Mewthisch Guides 1.0")
    if title.SetTextColor then title:SetTextColor(1, 0.73, 0.08) end
    setFontShadow(title)

    local errors = makeFlatButton(frame, "LOG", 38, 22, function()
        if MG.ErrorLogWindow then MG.ErrorLogWindow:Toggle() end
    end)
    errors:SetPoint("TOPRIGHT", -75, -5)

    local settings = makeFlatButton(frame, "OPT", 38, 22, function()
        if MG.SettingsWindow then MG.SettingsWindow:Toggle() end
    end)
    settings:SetPoint("TOPRIGHT", -33, -5)

    local close = makeFlatButton(frame, "x", 24, 22, function()
        if MG.db and MG.db.settings then MG.db.settings.showViewer = false end
        frame:Hide()
    end)
    close:SetPoint("TOPRIGHT", -5, -5)

    local guideTitle = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormal", "GameFontNormal"))
    guideTitle:SetPoint("TOPLEFT", 11, -41)
    guideTitle:SetPoint("RIGHT", -118, 0)
    guideTitle:SetJustifyH("LEFT")
    if guideTitle.SetTextColor then guideTitle:SetTextColor(1, 0.72, 0.10) end
    setFontShadow(guideTitle)

    local stepText = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    stepText:SetPoint("TOPRIGHT", -11, -42)
    stepText:SetJustifyH("RIGHT")
    if stepText.SetTextColor then stepText:SetTextColor(0.72, 0.72, 0.72) end
    setFontShadow(stepText)

    local barBg = makeSolid(frame, "BACKGROUND", 0.08, 0.08, 0.08, 0.95)
    barBg:SetPoint("TOPLEFT", 11, -63)
    UI:SetSize(barBg, FRAME_WIDTH - 22, 5)

    local bar = makeSolid(frame, "ARTWORK", 0.18, 0.78, 0.32, 1)
    bar:SetPoint("TOPLEFT", barBg, "TOPLEFT")
    bar:SetHeight(5)

    local separator = makeSolid(frame, "BORDER", 0.18, 0.14, 0.08, 0.60)
    separator:SetPoint("TOPLEFT", 11, -77)
    separator:SetPoint("TOPRIGHT", -11, -77)
    separator:SetHeight(1)

    local rows = {}
    for index = 1, MAX_ROWS do
        local rowFrame = CreateFrame("Frame", nil, frame)
        rowFrame:SetPoint("TOPLEFT", 8, -(ROW_START_Y + (index - 1) * ROW_HEIGHT))
        rowFrame:SetPoint("TOPRIGHT", -8, -(ROW_START_Y + (index - 1) * ROW_HEIGHT))
        rowFrame:SetHeight(ROW_HEIGHT)

        local highlight = makeSolid(rowFrame, "BACKGROUND", 0.95, 0.60, 0.08, 0.07)
        highlight:SetAllPoints()
        highlight:Hide()

        local marker = rowFrame:CreateFontString(nil, "OVERLAY",
            UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
        marker:SetPoint("LEFT", 4, 0)
        marker:SetWidth(16)
        marker:SetJustifyH("CENTER")
        setFontShadow(marker)

        local text = rowFrame:CreateFontString(nil, "OVERLAY",
            UI:SafeFont("GameFontHighlight", "GameFontNormal"))
        text:SetPoint("LEFT", marker, "RIGHT", 5, 0)
        text:SetPoint("RIGHT", -5, 0)
        text:SetJustifyH("LEFT")
        UI:SetWordWrap(text, false)
        setFontShadow(text)

        rows[index] = {
            frame = rowFrame,
            highlight = highlight,
            marker = marker,
            text = text,
        }
    end

    local prev = makeFlatButton(frame, "<", 30, 22, function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(-1, "viewer_prev") end
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    prev:SetPoint("BOTTOMLEFT", 9, 8)

    local nextButton = makeFlatButton(frame, ">", 30, 22, function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(1, "viewer_next") end
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    nextButton:SetPoint("BOTTOMRIGHT", -9, 8)

    local footer = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    footer:SetPoint("BOTTOM", 0, 13)
    footer:SetWidth(FRAME_WIDTH - 100)
    footer:SetJustifyH("CENTER")
    if footer.SetTextColor then footer:SetTextColor(0.70, 0.70, 0.70) end
    setFontShadow(footer)

    self.frame = frame
    self.guideTitle = guideTitle
    self.stepText = stepText
    self.bar = bar
    self.barBg = barBg
    self.rows = rows
    self.footer = footer

    UI:SetShown(frame, true)
    return frame
end

function V:Refresh()
    local frame = self:Create()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or nil

    if not runtime or not runtime.guide then
        self.guideTitle:SetText("Guide wird geladen ...")
        self.stepText:SetText("")
        self.bar:SetWidth(1)
        for _, row in ipairs(self.rows) do
            row.marker:SetText("")
            row.text:SetText("")
            row.highlight:Hide()
            row.frame:Hide()
        end
        self.rows[1].frame:Show()
        self.rows[1].marker:SetText("i")
        self.rows[1].text:SetText("RestedXP-Daten werden vorbereitet")
        self.footer:SetText("")
        UI:SetSize(frame, FRAME_WIDTH, 185)
        UI:SetShown(frame, MG.db and MG.db.settings and
            MG.db.settings.showViewer ~= false)
        return
    end

    self.guideTitle:SetText(tostring(runtime.guide.title or runtime.guideID))

    local total = #(runtime.guide.steps or {})
    local index = tonumber(runtime.stepIndex) or 1
    self.stepText:SetText(tostring(index) .. " / " .. tostring(total))

    local width = self.barBg.GetWidth and self.barBg:GetWidth() or (FRAME_WIDTH - 22)
    self.bar:SetWidth(math.max(1, width * (total > 0 and index / total or 0)))

    local visible = {}
    for _, row in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        visible[#visible + 1] = row
    end
    for _, sticky in ipairs(runtime.presentation and runtime.presentation.stickies or {}) do
        if #(sticky.rows or {}) > 0 then
            visible[#visible + 1] = {
                text = "Zusätzliche Ziele",
                stickyHeader = true,
                passive = true,
            }
            for _, row in ipairs(sticky.rows or {}) do
                visible[#visible + 1] = row
            end
        end
    end

    local visibleCount = math.min(MAX_ROWS, #visible)
    local rowCountForHeight = math.max(1, visibleCount)
    local desiredHeight = math.max(
        178,
        math.min(430, ROW_START_Y + rowCountForHeight * ROW_HEIGHT + BOTTOM_AREA))
    UI:SetSize(frame, FRAME_WIDTH, desiredHeight)

    for rowIndex, uiRow in ipairs(self.rows) do
        local row = visible[rowIndex]
        if row then
            uiRow.frame:Show()

            local marker, mr, mg, mb = markerFor(row)
            uiRow.marker:SetText(marker)
            if uiRow.marker.SetTextColor then
                uiRow.marker:SetTextColor(mr, mg, mb)
            end

            local progress = row.progress and ("  " .. row.progress) or ""
            uiRow.text:SetText(tostring(row.text or "") .. progress)
            local tr, tg, tb = rowTextColor(row)
            if uiRow.text.SetTextColor then
                uiRow.text:SetTextColor(tr, tg, tb)
            end

            if row.navigated then
                uiRow.highlight:Show()
            else
                uiRow.highlight:Hide()
            end
        else
            uiRow.marker:SetText("")
            uiRow.text:SetText("")
            uiRow.highlight:Hide()
            uiRow.frame:Hide()
        end
    end

    local state = runtime.stepState or {}
    if state.complete then
        self.footer:SetText("|cff55dd77Schritt abgeschlossen|r")
    elseif (state.unknownBlockingGoals or 0) > 0 then
        self.footer:SetText("|cffffa020Zielstatus wird geprüft|r")
    else
        self.footer:SetText("")
    end

    UI:SetShown(frame, MG.db and MG.db.settings and
        MG.db.settings.showViewer ~= false)
end

function MG:RefreshUI()
    if MG.GuideViewer then MG.GuideViewer:Refresh() end
    if MG.NavigatorFrame then MG.NavigatorFrame:Refresh() end
end
