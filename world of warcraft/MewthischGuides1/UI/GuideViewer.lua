local addonName, MG = ...

MG.GuideViewer = MG.GuideViewer or {}
local V = MG.GuideViewer
local UI = MG.UICompat
local MAX_ROWS = 12

local function makeButton(parent, text, width, callback)
    local button = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate")
    UI:SetSize(button, width, 24)
    button:SetText(text)
    button:SetScript("OnClick", callback)
    return button
end

local function statusPrefix(row)
    if row.navigated then return "|cffffc000>|r " end
    if row.status == "complete" or row.status == "complete_hidden" then return "|cff42d66bOK|r " end
    if row.status == "warning" then return "|cffff8c00!|r " end
    if row.passive then return "|cff66b8ffi|r " end
    return "|cffd6d6d6o|r "
end

function V:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Viewer", UIParent)
    UI:SetSize(frame, 430, 430)
    frame:SetPoint("LEFT", UIParent, "LEFT", 24, 80)
    UI:SetFrameStrata(frame, "HIGH")
    frame:SetMovable(true)
    UI:SetClampedToScreen(frame, true)
    frame:EnableMouse(true)
    if frame.RegisterForDrag then frame:RegisterForDrag("LeftButton") end
    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) and self.StartMoving then
            self:StartMoving()
        end
    end)
    frame:SetScript("OnDragStop", function(self)
        if self.StopMovingOrSizing then self:StopMovingOrSizing() end
    end)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    UI:SetSolid(bg, 0.015, 0.02, 0.025, 0.96)

    local header = frame:CreateTexture(nil, "BORDER")
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(38)
    UI:SetSolid(header, 0.04, 0.045, 0.055, 1)

    local title = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormalLarge", "GameFontNormal"))
    title:SetPoint("TOPLEFT", 12, -11)
    title:SetText("Mewthisch Guides 1.0")
    if title.SetTextColor then title:SetTextColor(1, 0.74, 0.08) end

    local errors = makeButton(frame, "!", 28, function()
        if MG.ErrorLogWindow then MG.ErrorLogWindow:Toggle(true) end
    end)
    errors:SetPoint("TOPRIGHT", -42, -7)

    local close = makeButton(frame, "X", 28, function() frame:Hide() end)
    close:SetPoint("TOPRIGHT", -8, -7)

    local guideTitle = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontNormal", "GameFontNormal"))
    guideTitle:SetPoint("TOPLEFT", 12, -50)
    guideTitle:SetPoint("RIGHT", -12, 0)
    guideTitle:SetJustifyH("LEFT")

    local stepText = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    stepText:SetPoint("TOPLEFT", 12, -73)

    local barBg = frame:CreateTexture(nil, "BACKGROUND")
    barBg:SetPoint("TOPLEFT", 12, -92)
    UI:SetSize(barBg, 406, 8)
    UI:SetSolid(barBg, 0.12, 0.12, 0.12, 1)

    local bar = frame:CreateTexture(nil, "ARTWORK")
    bar:SetPoint("TOPLEFT", barBg, "TOPLEFT")
    bar:SetHeight(8)
    UI:SetSolid(bar, 0.15, 0.75, 0.28, 1)

    local rows = {}
    for index = 1, MAX_ROWS do
        local row = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontHighlight", "GameFontNormal"))
        row:SetPoint("TOPLEFT", 14, -112 - (index - 1) * 23)
        row:SetPoint("RIGHT", -14, 0)
        row:SetHeight(21)
        row:SetJustifyH("LEFT")
        UI:SetWordWrap(row, false)
        rows[index] = row
    end

    local prev = makeButton(frame, "<", 38, function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(-1, "viewer_prev") end
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    prev:SetPoint("BOTTOMLEFT", 12, 12)

    local nextButton = makeButton(frame, ">", 38, function()
        if MG.RuntimeEngine then MG.RuntimeEngine:MoveStep(1, "viewer_next") end
        if MG.RefreshUI then MG:RefreshUI() end
    end)
    nextButton:SetPoint("BOTTOMRIGHT", -12, 12)

    local footer = frame:CreateFontString(nil, "OVERLAY", UI:SafeFont("GameFontHighlightSmall", "GameFontNormalSmall"))
    footer:SetPoint("BOTTOM", 0, 18)

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
        self.guideTitle:SetText("Mewthisch Guides bereit")
        self.stepText:SetText("RestedXP-Guide wird geladen ...")
        self.bar:SetWidth(1)
        for _, row in ipairs(self.rows) do row:SetText("") end
        self.rows[1]:SetText("|cffffb000i|r Falls dies stehen bleibt: /mg1 errors")
        UI:SetShown(frame, MG.db and MG.db.settings and MG.db.settings.showViewer ~= false)
        return
    end

    self.guideTitle:SetText(tostring(runtime.guide.title or runtime.guideID))
    local total = #(runtime.guide.steps or {})
    local index = tonumber(runtime.stepIndex) or 1
    self.stepText:SetText("Schritt " .. tostring(index) .. " / " .. tostring(total) ..
        "   -   Runtime " .. tostring(runtime.revision or 0))

    local width = self.barBg.GetWidth and self.barBg:GetWidth() or 406
    self.bar:SetWidth(math.max(1, width * (total > 0 and index / total or 0)))

    local visible = {}
    for _, row in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        visible[#visible + 1] = row
    end
    for _, sticky in ipairs(runtime.presentation and runtime.presentation.stickies or {}) do
        if #sticky.rows > 0 then
            visible[#visible + 1] = { text="-- Sticky --", status="passive", passive=true }
            for _, row in ipairs(sticky.rows) do visible[#visible + 1] = row end
        end
    end

    for rowIndex, font in ipairs(self.rows) do
        local row = visible[rowIndex]
        if row then
            local progress = row.progress and ("   " .. row.progress) or ""
            font:SetText(statusPrefix(row) .. tostring(row.text or "") .. progress)
        else
            font:SetText("")
        end
    end

    local state = runtime.stepState or {}
    self.footer:SetText(state.complete and "Schritt abgeschlossen" or
        (state.unknownBlockingGoals or 0) > 0 and
        ("Diagnose: " .. tostring(state.unknownBlockingGoals) .. " ungeloeste Ziele") or "")
    UI:SetShown(frame, MG.db.settings.showViewer ~= false)
end

function MG:RefreshUI()
    if MG.GuideViewer then MG.GuideViewer:Refresh() end
    if MG.NavigatorFrame then MG.NavigatorFrame:Refresh() end
end
