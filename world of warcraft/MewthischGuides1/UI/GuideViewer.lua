local addonName, MG = ...

MG.GuideViewer = MG.GuideViewer or {}
local V = MG.GuideViewer
local MAX_ROWS = 12

local function makeButton(parent, text, width, callback)
    local button = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate")
    button:SetSize(width, 24)
    button:SetText(text)
    button:SetScript("OnClick", callback)
    return button
end

local function statusPrefix(row)
    if row.navigated then return "|cffffc000→|r " end
    if row.status == "complete" then return "|cff42d66b✓|r " end
    if row.status == "warning" then return "|cffff8c00!|r " end
    if row.passive then return "|cff66b8ff i|r " end
    return "|cffd6d6d6○|r "
end

function V:Create()
    if self.frame then return self.frame end

    local frame = CreateFrame("Frame", "MewthischGuides1Viewer", UIParent)
    frame:SetSize(430, 430)
    frame:SetPoint("LEFT", UIParent, "LEFT", 24, 80)
    frame:SetFrameStrata("HIGH")
    frame:SetMovable(true)
    frame:SetClampedToScreen(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", function(self)
        if not (InCombatLockdown and InCombatLockdown()) then self:StartMoving() end
    end)
    frame:SetScript("OnDragStop", function(self) self:StopMovingOrSizing() end)

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    bg:SetColorTexture(0.015, 0.02, 0.025, 0.96)

    local header = frame:CreateTexture(nil, "BORDER")
    header:SetPoint("TOPLEFT", 1, -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(38)
    header:SetColorTexture(0.04, 0.045, 0.055, 1)

    local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
    title:SetPoint("TOPLEFT", 12, -11)
    title:SetText("Mewthisch Guides 1.0")
    title:SetTextColor(1, 0.74, 0.08)

    local errors = makeButton(frame, "!", 28, function()
        MG.ErrorLogWindow:Toggle(true)
    end)
    errors:SetPoint("TOPRIGHT", -42, -7)

    local close = makeButton(frame, "X", 28, function() frame:Hide() end)
    close:SetPoint("TOPRIGHT", -8, -7)

    local guideTitle = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    guideTitle:SetPoint("TOPLEFT", 12, -50)
    guideTitle:SetPoint("RIGHT", -12, 0)
    guideTitle:SetJustifyH("LEFT")

    local stepText = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    stepText:SetPoint("TOPLEFT", 12, -73)

    local barBg = frame:CreateTexture(nil, "BACKGROUND")
    barBg:SetPoint("TOPLEFT", 12, -92)
    barBg:SetSize(406, 8)
    barBg:SetColorTexture(0.12, 0.12, 0.12, 1)

    local bar = frame:CreateTexture(nil, "ARTWORK")
    bar:SetPoint("TOPLEFT", barBg, "TOPLEFT")
    bar:SetHeight(8)
    bar:SetColorTexture(0.15, 0.75, 0.28, 1)

    local rows = {}
    for index = 1, MAX_ROWS do
        local row = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlight")
        row:SetPoint("TOPLEFT", 14, -112 - (index - 1) * 23)
        row:SetPoint("RIGHT", -14, 0)
        row:SetHeight(21)
        row:SetJustifyH("LEFT")
        row:SetWordWrap(false)
        rows[index] = row
    end

    local prev = makeButton(frame, "<", 38, function()
        MG.RuntimeEngine:MoveStep(-1, "viewer_prev")
        MG:RefreshUI()
    end)
    prev:SetPoint("BOTTOMLEFT", 12, 12)

    local next = makeButton(frame, ">", 38, function()
        MG.RuntimeEngine:MoveStep(1, "viewer_next")
        MG:RefreshUI()
    end)
    next:SetPoint("BOTTOMRIGHT", -12, 12)

    local footer = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    footer:SetPoint("BOTTOM", 0, 18)

    self.frame = frame
    self.guideTitle = guideTitle
    self.stepText = stepText
    self.bar = bar
    self.barBg = barBg
    self.rows = rows
    self.footer = footer
    return frame
end

function V:Refresh()
    local frame = self:Create()
    local runtime = MG.RuntimeStore:Get()
    if not runtime or not runtime.guide then
        self.guideTitle:SetText("Kein Guide aktiv")
        self.stepText:SetText("")
        for _, row in ipairs(self.rows) do row:SetText("") end
        return
    end

    self.guideTitle:SetText(tostring(runtime.guide.title or runtime.guideID))
    local total = #(runtime.guide.steps or {})
    local index = tonumber(runtime.stepIndex) or 1
    self.stepText:SetText("Schritt " .. tostring(index) .. " / " .. tostring(total) ..
        "   ·   Runtime " .. tostring(runtime.revision or 0))

    local width = self.barBg:GetWidth()
    self.bar:SetWidth(math.max(1, width * (total > 0 and index / total or 0)))

    local visible = {}
    for _, row in ipairs(runtime.presentation and runtime.presentation.rows or {}) do
        visible[#visible + 1] = row
    end
    for _, sticky in ipairs(runtime.presentation and runtime.presentation.stickies or {}) do
        if #sticky.rows > 0 then
            visible[#visible + 1] = { text="— Sticky —", status="passive", passive=true }
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
        ("Diagnose: " .. tostring(state.unknownBlockingGoals) .. " ungelöste Ziele") or "")
    frame:SetShown(MG.db.settings.showViewer ~= false)
end

function MG:RefreshUI()
    if MG.GuideViewer then MG.GuideViewer:Refresh() end
    if MG.NavigatorFrame then MG.NavigatorFrame:Refresh() end
end
