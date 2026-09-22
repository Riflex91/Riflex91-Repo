local addonName, MG = ...

MG.ErrorLogWindow = MG.ErrorLogWindow or {}
local E = MG.ErrorLogWindow
local UI = MG.UICompat
local AUTO_REFRESH_INTERVAL = 1.0

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

local function makeButton(parent, text, width, callback)
    local button = CreateFrame("Button", nil, parent)
    UI:SetSize(button, width, 24)

    local bg = makeSolid(button, "BACKGROUND", 0.10, 0.07, 0.03, 1)
    bg:SetAllPoints()

    local top = makeSolid(button, "BORDER", 0.78, 0.47, 0.08, 0.9)
    top:SetPoint("TOPLEFT")
    top:SetPoint("TOPRIGHT")
    top:SetHeight(1)

    local label = button:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormal", "GameFontNormal"))
    label:SetPoint("CENTER")
    label:SetText(text)
    if label.SetTextColor then label:SetTextColor(1, 0.74, 0.12) end
    setFontShadow(label)

    button:SetScript("OnEnter", function()
        UI:SetSolid(bg, 0.19, 0.11, 0.03, 1)
    end)
    button:SetScript("OnLeave", function()
        UI:SetSolid(bg, 0.10, 0.07, 0.03, 1)
    end)
    button:SetScript("OnClick", callback)
    button.label = label
    return button
end

local function saveWindowState()
    if not MG.db then return end
    MG.db.ui = MG.db.ui or {}
    MG.db.ui.errorLogIncludeInfo = E.includeInfo and true or false
    MG.db.ui.errorLogAutoRefresh = E.autoRefresh and true or false
end

function E:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1ErrorLog", UIParent)
    UI:SetSize(frame, 860, 620)
    frame:SetPoint("CENTER")
    UI:SetFrameStrata(frame, "FULLSCREEN_DIALOG")
    if frame.SetFrameLevel then frame:SetFrameLevel(250) end
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
    frame:EnableMouse(true)

    local bg = makeSolid(frame, "BACKGROUND", 0.012, 0.015, 0.020, 1)
    bg:SetAllPoints()

    local header = makeSolid(frame, "BORDER", 0.035, 0.040, 0.050, 1)
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(38)

    local topLine = makeSolid(frame, "ARTWORK", 0.95, 0.56, 0.06, 1)
    topLine:SetPoint("TOPLEFT", 1, -1)
    topLine:SetPoint("TOPRIGHT", -1, -1)
    topLine:SetHeight(1)

    local title = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 14, -11)
    title:SetText("Mewthisch Guides - Fehler & Diagnose")
    if title.SetTextColor then title:SetTextColor(1, 0.74, 0.10) end
    setFontShadow(title)

    local summary = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    summary:SetPoint("TOPLEFT", 14, -45)
    summary:SetPoint("RIGHT", -14, 0)
    summary:SetJustifyH("LEFT")
    setFontShadow(summary)

    local hint = frame:CreateFontString(nil, "OVERLAY",
        UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    hint:SetPoint("TOPLEFT", 14, -62)
    hint:SetText("Für Support: Alles markieren -> Strg+C. Der Block enthält Runtime, Navigator, Quests und API-Status.")
    if hint.SetTextColor then hint:SetTextColor(0.66, 0.66, 0.66) end
    setFontShadow(hint)

    local drag = CreateFrame("Frame", nil, frame)
    drag:SetPoint("TOPLEFT")
    drag:SetPoint("TOPRIGHT")
    drag:SetHeight(38)
    drag:EnableMouse(true)
    if drag.RegisterForDrag then drag:RegisterForDrag("LeftButton") end
    drag:SetScript("OnDragStart", function()
        if not (InCombatLockdown and InCombatLockdown()) and frame.StartMoving then
            frame:StartMoving()
        end
    end)
    drag:SetScript("OnDragStop", function()
        if frame.StopMovingOrSizing then frame:StopMovingOrSizing() end
    end)

    local closeTop = makeButton(frame, "x", 26, function() E:Toggle(false) end)
    closeTop:SetPoint("TOPRIGHT", -7, -7)

    local scroll = CreateFrame("ScrollFrame", nil, frame, "UIPanelScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT", 14, -86)
    scroll:SetPoint("BOTTOMRIGHT", -34, 52)

    local edit = CreateFrame("EditBox", nil, scroll)
    edit:SetMultiLine(true)
    edit:SetAutoFocus(false)
    if ChatFontNormal and edit.SetFontObject then edit:SetFontObject(ChatFontNormal) end
    edit:SetWidth(790)
    edit:SetHeight(10000)
    UI:SetTextInsets(edit, 5, 5, 5, 5)
    edit:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
    scroll:SetScrollChild(edit)

    local refresh = makeButton(frame, "Aktualisieren", 104, function()
        E:Refresh(true)
    end)
    refresh:SetPoint("BOTTOMLEFT", 14, 14)

    local mode = makeButton(frame, "Ansicht", 108, function()
        E.includeInfo = not E.includeInfo
        saveWindowState()
        E:Refresh(true)
    end)
    mode:SetPoint("LEFT", refresh, "RIGHT", 6, 0)

    local auto = makeButton(frame, "Auto", 96, function()
        E.autoRefresh = not E.autoRefresh
        saveWindowState()
        E:UpdateButtons()
    end)
    auto:SetPoint("LEFT", mode, "RIGHT", 6, 0)

    local selectAll = makeButton(frame, "Alles markieren", 120, function()
        edit:SetFocus()
        if edit.HighlightText then edit:HighlightText() end
    end)
    selectAll:SetPoint("LEFT", auto, "RIGHT", 6, 0)

    local clear = makeButton(frame, "Log leeren", 94, function()
        local db = MG:EnsureDB()
        db.logs = {}
        db.logSequence = 0
        MG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
        E:Refresh(true)
    end)
    clear:SetPoint("LEFT", selectAll, "RIGHT", 6, 0)

    local close = makeButton(frame, "Schließen", 92, function() E:Toggle(false) end)
    close:SetPoint("BOTTOMRIGHT", -14, 14)

    self.frame = frame
    self.edit = edit
    self.summary = summary
    self.modeButton = mode
    self.autoButton = auto
    self.elapsed = 0

    local db = MG:EnsureDB()
    self.includeInfo = db.ui and db.ui.errorLogIncludeInfo
    if self.includeInfo == nil then self.includeInfo = false end
    self.autoRefresh = db.ui and db.ui.errorLogAutoRefresh
    if self.autoRefresh == nil then self.autoRefresh = true end

    frame:SetScript("OnUpdate", function(_, delta)
        if not E.autoRefresh or not frame:IsShown() then return end
        E.elapsed = E.elapsed + (tonumber(delta) or 0)
        if E.elapsed < AUTO_REFRESH_INTERVAL then return end
        E.elapsed = 0
        if edit.HasFocus and edit:HasFocus() then return end
        E:Refresh(false)
    end)

    frame:Hide()
    self:UpdateButtons()
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return frame
end

function E:UpdateButtons()
    if not self.frame then return end
    if self.modeButton and self.modeButton.label then
        self.modeButton.label:SetText(
            self.includeInfo and "Alle Logs" or "Nur Probleme")
    end
    if self.autoButton and self.autoButton.label then
        self.autoButton.label:SetText(
            self.autoRefresh and "Auto: AN" or "Auto: AUS")
        if self.autoButton.label.SetTextColor then
            if self.autoRefresh then
                self.autoButton.label:SetTextColor(0.35, 0.95, 0.48)
            else
                self.autoButton.label:SetTextColor(0.95, 0.42, 0.32)
            end
        end
    end
end

function E:Refresh(forceCursorTop)
    self:Create()
    local counts = MG:GetLogCounts()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or {}
    self.summary:SetText(
        "Build " .. tostring(MG.BUILD or "-") ..
        "   |   Runtime " .. tostring(runtime.revision or 0) ..
        "   |   INFO " .. tostring(counts.INFO or 0) ..
        "   WARN " .. tostring(counts.WARN or 0) ..
        "   ERROR " .. tostring(counts.ERROR or 0))

    local text = MG:GetErrorLogText(self.includeInfo)
    if self.edit:GetText() ~= text then
        self.edit:SetText(text)
        if forceCursorTop and self.edit.SetCursorPosition then
            self.edit:SetCursorPosition(0)
        end
    end
    self:UpdateButtons()
end

function E:Toggle(force)
    local frame = self:Create()
    local show = force
    if show == nil then show = not frame:IsShown() end
    if show then
        self:Refresh(true)
        frame:Show()
    else
        frame:Hide()
    end
end
