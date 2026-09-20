local addonName, FG = ...

local ui = {}

local function createBackdrop(frame)
    if frame.SetBackdrop then
        frame:SetBackdrop({
            bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
            edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border",
            tile = true, tileSize = 32, edgeSize = 24,
            insets = { left = 8, right = 8, top = 8, bottom = 8 },
        })
        frame:SetBackdropColor(0.04, 0.05, 0.08, 0.96)
    end
end

local function makeText(parent, template, size)
    local fs = parent:CreateFontString(nil, "OVERLAY", template or "GameFontNormal")
    if size and fs.SetFont then local font, _, flags = fs:GetFont(); fs:SetFont(font, size, flags) end
    fs:SetJustifyH("LEFT"); fs:SetWordWrap(true)
    return fs
end

local function makeButton(parent, text, width, callback)
    local b = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate")
    b:SetSize(width or 80, 24); b:SetText(text); b:SetScript("OnClick", callback)
    return b
end

function FG:InitializeUI()
    if ui.frame then return end
    local frame = CreateFrame("Frame", "ForeverGuideMainFrame", UIParent)
    frame:SetSize(390, 248); frame:SetPoint("CENTER", UIParent, "CENTER", 280, 80)
    frame:SetClampedToScreen(true); frame:SetMovable(true); frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", function(self) if not InCombatLockdown or not InCombatLockdown() then self:StartMoving() end end)
    frame:SetScript("OnDragStop", function(self) self:StopMovingOrSizing() end)
    createBackdrop(frame); ui.frame = frame

    local title = makeText(frame, "GameFontNormalLarge", 17); title:SetPoint("TOPLEFT", 18, -16); title:SetText("|cff62d6ffForeverGuide|r"); ui.title = title
    local version = makeText(frame, "GameFontHighlightSmall", 11); version:SetPoint("TOPRIGHT", -18, -18); version:SetText("v" .. FG.VERSION); ui.version = version
    local source = makeText(frame, "GameFontHighlightSmall", 11); source:SetPoint("TOPLEFT", title, "BOTTOMLEFT", 0, -6); source:SetPoint("RIGHT", frame, -18, 0); ui.source = source
    local quest = makeText(frame, "GameFontNormal", 15); quest:SetPoint("TOPLEFT", source, "BOTTOMLEFT", 0, -14); quest:SetPoint("RIGHT", frame, -18, 0); ui.quest = quest
    local action = makeText(frame, "GameFontHighlight", 13); action:SetPoint("TOPLEFT", quest, "BOTTOMLEFT", 0, -10); action:SetPoint("RIGHT", frame, -18, 0); ui.action = action
    local objective = makeText(frame, "GameFontHighlightSmall", 12); objective:SetPoint("TOPLEFT", action, "BOTTOMLEFT", 0, -8); objective:SetPoint("RIGHT", frame, -18, 0); objective:SetHeight(45); ui.objective = objective
    local nav = makeText(frame, "GameFontHighlightSmall", 12); nav:SetPoint("TOPLEFT", objective, "BOTTOMLEFT", 0, -8); nav:SetPoint("RIGHT", frame, -18, 0); ui.nav = nav
    local arrow = makeText(frame, "GameFontNormalHuge", 26); arrow:SetPoint("BOTTOMLEFT", 18, 18); arrow:SetWidth(34); arrow:SetJustifyH("CENTER"); arrow:SetText("▲"); ui.arrow = arrow
    local prev = makeButton(frame, "Zurück", 72, function() FG:SelectRelativeStep(-1, "ui_prev") end); prev:SetPoint("BOTTOMLEFT", arrow, "BOTTOMRIGHT", 8, -1); ui.prev = prev
    local next = makeButton(frame, "Weiter", 72, function() FG:SelectRelativeStep(1, "ui_next") end); next:SetPoint("LEFT", prev, "RIGHT", 6, 0); ui.next = next
    local info = makeButton(frame, "Info", 64, function() FG:ToggleInfo() end); info:SetPoint("LEFT", next, "RIGHT", 6, 0); ui.infoButton = info
    local close = makeButton(frame, "×", 32, function() FG:HideWindow() end); close:SetPoint("BOTTOMRIGHT", -16, 17); ui.close = close

    local infoFrame = CreateFrame("Frame", "ForeverGuideInfoFrame", UIParent)
    infoFrame:SetSize(430, 330); infoFrame:SetPoint("LEFT", frame, "RIGHT", 8, 0); infoFrame:SetClampedToScreen(true)
    createBackdrop(infoFrame); infoFrame:Hide(); ui.infoFrame = infoFrame
    local infoTitle = makeText(infoFrame, "GameFontNormalLarge", 17); infoTitle:SetPoint("TOPLEFT", 18, -16); infoTitle:SetText("|cff62d6ffForeverGuide – Info|r")
    local infoBody = makeText(infoFrame, "GameFontHighlightSmall", 12); infoBody:SetPoint("TOPLEFT", infoTitle, "BOTTOMLEFT", 0, -14); infoBody:SetPoint("BOTTOMRIGHT", -18, 50); infoBody:SetJustifyV("TOP"); ui.infoBody = infoBody
    local credit = makeText(infoFrame, "GameFontNormal", 12); credit:SetPoint("BOTTOM", 0, 18)
    credit:SetText("Programmiert mit |cffff4f81♥|r von |cffffffffRiflex91|r für die Gilde |cff62d6ffMewthisch|r")
    credit:SetJustifyH("CENTER"); ui.credit = credit

    if FG.db.settings.showWindow == false then frame:Hide() end
    FG:Log("INFO", "ui.initialized", "ForeverGuide UI initialisiert.", { version = FG.VERSION })
    FG:RefreshInfo()
end

function FG:DirectionSymbol(angle)
    if not angle then return "◆" end
    local sector = math.floor(((angle + math.pi) / (math.pi * 2)) * 8 + 0.5) % 8
    local symbols = { "▼", "↙", "←", "↖", "▲", "↗", "→", "↘" }
    return symbols[sector + 1] or "◆"
end

function FG:RefreshUI()
    if not ui.frame then return end
    local step = self.currentStep
    if not step then
        ui.source:SetText("Keine aktive Guide-Empfehlung"); ui.quest:SetText("Keine aktive Quest gefunden")
        ui.action:SetText("Nimm eine Quest an oder aktualisiere den Questlog."); ui.objective:SetText("")
        ui.nav:SetText(""); ui.arrow:SetText("◆"); self:RefreshInfo(); return
    end
    ui.source:SetText("Schritt " .. tostring(self.currentStepIndex) .. "/" .. tostring(#self.steps) .. " · Quelle: " .. tostring(step.source) .. " · Quest-ID " .. tostring(step.questID))
    ui.quest:SetText(step.title or ("Quest " .. tostring(step.questID)))
    ui.action:SetText(step.action or "Quest fortsetzen"); ui.objective:SetText(step.detail or "")
    local nav = self.navigation or {}
    if nav.available and nav.target then
        local target = nav.target
        local distance = nav.normalizedDistance and string.format(" · Distanz %.1f%%", nav.normalizedDistance * 100) or ""
        ui.nav:SetText("Waypoint: Map " .. tostring(target.mapID) .. " · " .. string.format("%.1f / %.1f", (target.x or 0) * 100, (target.y or 0) * 100) .. distance)
        ui.arrow:SetText(self:DirectionSymbol(nav.relativeAngle))
    else
        ui.nav:SetText("Navigation: Blizzard-SuperTrack aktiv"); ui.arrow:SetText("◆")
    end
    ui.prev:SetEnabled(self.currentStepIndex > 1); ui.next:SetEnabled(self.currentStepIndex < #self.steps)
    self:RefreshInfo()
end

function FG:RefreshInfo()
    if not ui.infoBody then return end
    local build, profile, logs, step = self:GetBuildInfoTable(), self:GetPlayerProfile(), self:GetLogSummary(), self.currentStep
    local dataBuild = self.Data and self.Data.build or {}
    local tableCount = 0; for _ in pairs(self.Data and self.Data.tableStats or {}) do tableCount = tableCount + 1 end
    local lines = {
        "|cffffffffAddon-Version:|r " .. self.VERSION,
        "|cffffffffForever-Build:|r " .. tostring(build.version) .. " (" .. tostring(build.buildNumber) .. ")",
        "|cffffffffInterface:|r " .. tostring(build.interfaceVersion),
        "|cffffffffDatenbasis:|r " .. tostring(dataBuild.version or "?"),
        "|cffffffffDB2-Tabellen:|r " .. tostring(tableCount), "",
        "|cffffffffCharakter:|r " .. tostring(profile.race or "?") .. " " .. tostring(profile.class or "?") .. " · Level " .. tostring(profile.level or "?"),
        "|cffffffffAktiver Schritt:|r " .. (step and tostring(step.title) or "keiner"),
        "|cffffffffQuest-ID:|r " .. (step and tostring(step.questID) or "-"),
        "|cffffffffNavigation:|r " .. ((self.navigation and self.navigation.available) and "Waypoint" or "SuperTrack/Fallback"), "",
        "|cffffffffDiagnose-Logs:|r " .. tostring(logs.total),
        "|cffffffffWarnungen:|r " .. tostring(logs.warnings),
        "|cffffffffFehler:|r " .. tostring(logs.errors), "",
        "|cff9da7b3Teststatus v0.1:|r",
        "• Live-Questlog + automatische Schrittwahl",
        "• Blizzard-SuperTrack + Waypoint-Fallback",
        "• Build-/API-/UI-Diagnoselog in SavedVariables",
        "• Recorder-Quests zunächst RECORDED, noch nicht als Route VERIFIED", "",
        "|cff9da7b3Nach dem Test bitte /reload oder ausloggen und ForeverGuide.lua senden.|r",
    }
    ui.infoBody:SetText(table.concat(lines, "\n"))
end

function FG:ToggleInfo()
    if not ui.infoFrame then return end
    if ui.infoFrame:IsShown() then ui.infoFrame:Hide(); self.db.settings.showInfo = false
    else ui.infoFrame:Show(); self.db.settings.showInfo = true; self:RefreshInfo() end
    self:Log("INFO", "ui.info_toggle", "Info-Bereich umgeschaltet.", { shown = ui.infoFrame:IsShown() })
end

function FG:ToggleWindow() if not ui.frame then return end; if ui.frame:IsShown() then self:HideWindow() else self:ShowWindow() end end
function FG:ShowWindow() if not ui.frame then self:InitializeUI() end; ui.frame:Show(); self.db.settings.showWindow = true; self:Log("INFO", "ui.show", "Guide-Fenster angezeigt.") end
function FG:HideWindow() if not ui.frame then return end; ui.frame:Hide(); if ui.infoFrame then ui.infoFrame:Hide() end; self.db.settings.showWindow = false; self:Log("INFO", "ui.hide", "Guide-Fenster ausgeblendet.") end
function FG:PrintStatus()
    local build, logs, step = self:GetBuildInfoTable(), self:GetLogSummary(), self.currentStep
    print("|cff62d6ffForeverGuide|r v" .. self.VERSION .. " · Build " .. tostring(build.buildNumber) .. " · Step " .. (step and tostring(step.questID) or "-") .. " · Logs " .. tostring(logs.total) .. " · W " .. tostring(logs.warnings) .. " · E " .. tostring(logs.errors))
end
