local addonName, MG = ...

local navigator = {}
local UPDATE_INTERVAL = 0.08

local function setColorTexture(texture, r, g, b, a)
    if texture.SetColorTexture then texture:SetColorTexture(r, g, b, a)
    else texture:SetTexture(r, g, b, a) end
end

local function savePosition(frame)
    local x, y = frame:GetCenter()
    local ux, uy = UIParent:GetCenter()
    if x and y and ux and uy then
        MG.db.settings.navigatorX = x - ux
        MG.db.settings.navigatorY = y - uy
        MG:Log("INFO", "navigator.moved", "Navigator verschoben.", {
            x = MG.db.settings.navigatorX,
            y = MG.db.settings.navigatorY,
        })
    end
end

local function applyPosition(frame)
    frame:ClearAllPoints()
    frame:SetPoint("CENTER", UIParent, "CENTER",
        tonumber(MG.db.settings.navigatorX) or 0,
        tonumber(MG.db.settings.navigatorY) or 235)
end

local function applyScale(frame)
    local scale = tonumber(MG.db.settings.navigatorScale) or 1.0
    if scale < 0.7 then scale = 0.7 end
    if scale > 1.5 then scale = 1.5 end
    MG.db.settings.navigatorScale = scale
    frame:SetScale(scale)
end

function MG:InitializeNavigator()
    if navigator.frame then
        self:RefreshNavigator()
        return
    end

    local frame = CreateFrame("Frame", "MewthischGuidesNavigatorFrame", UIParent)
    frame:SetSize(160, 112)
    frame:SetClampedToScreen(true)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:EnableMouseWheel(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetFrameStrata("HIGH")
    navigator.frame = frame

    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints()
    setColorTexture(bg, 0.015, 0.02, 0.03, 0.78)

    local accent = frame:CreateTexture(nil, "BORDER")
    accent:SetPoint("TOPLEFT")
    accent:SetPoint("TOPRIGHT")
    accent:SetHeight(2)
    setColorTexture(accent, 0.20, 0.72, 0.88, 1)

    local arrow = frame:CreateTexture(nil, "ARTWORK")
    arrow:SetTexture("Interface\\Minimap\\MinimapArrow")
    arrow:SetSize(58, 58)
    arrow:SetPoint("TOP", 0, -8)
    navigator.arrow = arrow

    local distance = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
    distance:SetPoint("TOP", arrow, "BOTTOM", 0, -1)
    distance:SetText("-")
    navigator.distance = distance

    local target = frame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    target:SetPoint("TOPLEFT", 8, -88)
    target:SetPoint("TOPRIGHT", -8, -88)
    target:SetJustifyH("CENTER")
    target:SetWordWrap(false)
    target:SetText("")
    navigator.target = target

    frame:SetScript("OnDragStart", function(self)
        if MG.db.settings.navigatorLocked then return end
        if InCombatLockdown and InCombatLockdown() then return end
        self:StartMoving()
    end)

    frame:SetScript("OnDragStop", function(self)
        self:StopMovingOrSizing()
        savePosition(self)
    end)

    frame:SetScript("OnMouseWheel", function(self, delta)
        if MG.db.settings.navigatorLocked then return end
        local scale = (tonumber(MG.db.settings.navigatorScale) or 1.0) + (delta > 0 and 0.05 or -0.05)
        if scale < 0.7 then scale = 0.7 end
        if scale > 1.5 then scale = 1.5 end
        MG.db.settings.navigatorScale = scale
        applyScale(self)
        MG:RefreshSettings()
        MG:Log("INFO", "navigator.scale", "Navigator-Skalierung geaendert.", { scale = scale })
    end)

    frame:SetScript("OnMouseUp", function(_, button)
        if button == "RightButton" then MG:ToggleSettings() end
    end)

    frame:SetScript("OnEnter", function(self)
        if not GameTooltip then return end
        GameTooltip:SetOwner(self, "ANCHOR_RIGHT")
        GameTooltip:AddLine("Mewthisch Guides Navigator")
        if MG.db.settings.navigatorLocked then
            GameTooltip:AddLine("Navigator ist gesperrt", 1, 0.82, 0.2)
        else
            GameTooltip:AddLine("Ziehen: verschieben", 1, 1, 1)
            GameTooltip:AddLine("Mausrad: skalieren", 1, 1, 1)
        end
        GameTooltip:AddLine("Rechtsklick: Optionen", 1, 1, 1)
        GameTooltip:Show()
    end)

    frame:SetScript("OnLeave", function()
        if GameTooltip then GameTooltip:Hide() end
    end)

    local elapsed = 0
    frame:SetScript("OnUpdate", function(_, delta)
        elapsed = elapsed + delta
        if elapsed < UPDATE_INTERVAL then return end
        elapsed = 0
        MG:Safe("navigator.update", function()
            MG:UpdateNavigationRealtime()
            MG:RefreshNavigator()
        end)
    end)

    applyPosition(frame)
    applyScale(frame)
    self:RefreshNavigator()
    self:Log("INFO", "navigator.initialized", "Separater Navigator initialisiert.")
end

function MG:SetNavigatorScale(scale)
    scale = tonumber(scale) or 1.0
    if scale < 0.7 then scale = 0.7 end
    if scale > 1.5 then scale = 1.5 end
    self.db.settings.navigatorScale = scale
    if navigator.frame then applyScale(navigator.frame) end
    self:RefreshSettings()
end

function MG:ResetNavigatorPosition()
    self.db.settings.navigatorX = 0
    self.db.settings.navigatorY = 235
    self.db.settings.navigatorScale = 1.0
    if navigator.frame then
        applyPosition(navigator.frame)
        applyScale(navigator.frame)
    end
    self:Log("INFO", "navigator.reset", "Navigator-Position zurueckgesetzt.")
end

function MG:ToggleNavigator()
    self.db.settings.showNavigator = not self.db.settings.showNavigator
    self:RefreshNavigator()
    self:RefreshSettings()
    self:Log("INFO", "navigator.toggle", "Navigator umgeschaltet.", {
        shown = self.db.settings.showNavigator,
    })
end

function MG:RefreshNavigator()
    if not navigator.frame or not self.db then return end

    if not self.db.settings.showNavigator then
        navigator.frame:Hide()
        return
    end

    navigator.frame:Show()

    local step = self.currentStep
    local nav = self.navigation or {}

    if not step then
        navigator.arrow:SetAlpha(0.18)
        navigator.distance:SetText("Kein Ziel")
        navigator.target:SetText("Mewthisch Guides")
        return
    end

    local meters = nav.distanceMeters
    if meters then
        if meters >= 1000 then
            navigator.distance:SetText(string.format("%.2f km", meters / 1000))
        else
            navigator.distance:SetText(string.format("%.0f m", meters))
        end
    elseif nav.normalizedDistance then
        navigator.distance:SetText(string.format("%.1f%% Karte", nav.normalizedDistance * 100))
    else
        navigator.distance:SetText("Distanz -")
    end

    local text = step.goal and step.goal.instruction or step.title or "Questziel"
    if string.len(text) > 30 then text = string.sub(text, 1, 27) .. "..." end
    navigator.target:SetText(text)

    if nav.relativeAngle ~= nil and navigator.arrow.SetRotation then
        navigator.arrow:SetAlpha(1)
        pcall(navigator.arrow.SetRotation, navigator.arrow, nav.relativeAngle)
    else
        navigator.arrow:SetAlpha(0.28)
    end
end
