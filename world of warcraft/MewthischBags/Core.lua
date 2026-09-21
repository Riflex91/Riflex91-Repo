local addonName, MB = ...

MB.VERSION = "0.1.0"

local defaults = {
    positionX = 0,
    positionY = 0,
    panelOpen = false,
}

local function applyDefaults(target, source)
    for key, value in pairs(source) do
        if target[key] == nil then
            target[key] = value
        end
    end
end

function MB:InitializeDB()
    MewthischBagsDB = type(MewthischBagsDB) == "table" and MewthischBagsDB or {}
    applyDefaults(MewthischBagsDB, defaults)
    self.db = MewthischBagsDB
end

function MB:SuppressBlizzardFrame(frame)
    if not frame then return end

    if not frame._mewthischBagsHooked and frame.HookScript then
        frame._mewthischBagsHooked = true
        frame:HookScript("OnShow", function(self)
            if MB._suppressingBlizzardFrames then return end
            MB._suppressingBlizzardFrames = true
            self:Hide()
            MB._suppressingBlizzardFrames = false
            MB:QueueBagAction("show")
        end)
    end

    if frame.IsShown and frame:IsShown() then
        self._suppressingBlizzardFrames = true
        frame:Hide()
        self._suppressingBlizzardFrames = false
    end
end

function MB:HideBlizzardBagFrames()
    self:SuppressBlizzardFrame(_G.ContainerFrameCombinedBags)

    for i = 1, 13 do
        self:SuppressBlizzardFrame(_G["ContainerFrame" .. i])
    end
end

local actionPriority = {
    toggle = 1,
    show = 2,
    hide = 2,
}

function MB:QueueBagAction(action)
    action = action or "show"

    local pending = self._pendingBagAction
    if not pending or (actionPriority[action] or 0) >= (actionPriority[pending] or 0) then
        if pending == "show" and action == "toggle" then
            -- Keep the explicit show requested by an inner OpenAllBags call.
        elseif pending == "hide" and action == "toggle" then
            -- Keep the explicit hide requested by an inner CloseAllBags call.
        else
            self._pendingBagAction = action
        end
    end

    if self._bagActionScheduled then return end
    self._bagActionScheduled = true

    local function run()
        MB._bagActionScheduled = false
        local requested = MB._pendingBagAction or "show"
        MB._pendingBagAction = nil

        MB:HideBlizzardBagFrames()

        if not MB.UI then return end
        if requested == "hide" then
            MB.UI:Hide()
        elseif requested == "toggle" then
            MB.UI:Toggle()
        else
            MB.UI:Show()
        end
    end

    if C_Timer and C_Timer.After then
        C_Timer.After(0, run)
    else
        run()
    end
end

function MB:InstallBagFunctionHooks()
    if type(hooksecurefunc) ~= "function" then return end
    self._functionHooks = self._functionHooks or {}

    local hooks = {
        ToggleAllBags = "toggle",
        OpenAllBags = "show",
        CloseAllBags = "hide",
        ToggleBackpack = "toggle",
        OpenBackpack = "show",
        CloseBackpack = "hide",
    }

    for functionName, action in pairs(hooks) do
        if not self._functionHooks[functionName] and type(_G[functionName]) == "function" then
            hooksecurefunc(functionName, function()
                MB:QueueBagAction(action)
            end)
            self._functionHooks[functionName] = true
        end
    end
end

function MB:RefreshVisible()
    if self.UI and self.UI:IsShown() then
        self.UI:RefreshAll()
        self:HideBlizzardBagFrames()
    end
end

local eventFrame = CreateFrame("Frame")
MB.eventFrame = eventFrame

eventFrame:RegisterEvent("ADDON_LOADED")
eventFrame:RegisterEvent("PLAYER_LOGIN")
eventFrame:RegisterEvent("BAG_UPDATE_DELAYED")
eventFrame:RegisterEvent("PLAYER_MONEY")
eventFrame:RegisterEvent("PLAYER_EQUIPMENT_CHANGED")
eventFrame:RegisterEvent("GET_ITEM_INFO_RECEIVED")
eventFrame:RegisterEvent("PLAYER_REGEN_DISABLED")
eventFrame:RegisterEvent("PLAYER_REGEN_ENABLED")
eventFrame:RegisterEvent("DISPLAY_SIZE_CHANGED")
eventFrame:RegisterEvent("UI_SCALE_CHANGED")

eventFrame:SetScript("OnEvent", function(_, event, arg1)
    if event == "ADDON_LOADED" then
        if arg1 == addonName then
            MB:InitializeDB()
        end
        MB:InstallBagFunctionHooks()
        MB:HideBlizzardBagFrames()
        return
    end

    if event == "PLAYER_LOGIN" then
        if not MB.db then MB:InitializeDB() end
        MB.UI:Create()
        MB:InstallBagFunctionHooks()
        MB:HideBlizzardBagFrames()
        return
    end

    if event == "GET_ITEM_INFO_RECEIVED" then
        if MB.API then MB.API.capacityCache = {} end
        MB:RefreshVisible()
        return
    end

    if event == "DISPLAY_SIZE_CHANGED" or event == "UI_SCALE_CHANGED" then
        if MB.UI and MB.UI.frame then
            MB.UI:UpdateBagPanelSide()
        end
        return
    end

    if event == "BAG_UPDATE_DELAYED" or
        event == "PLAYER_MONEY" or
        event == "PLAYER_EQUIPMENT_CHANGED" or
        event == "PLAYER_REGEN_DISABLED" or
        event == "PLAYER_REGEN_ENABLED" then
        MB:RefreshVisible()
    end
end)

SLASH_MEWTHISCHBAGS1 = "/mbags"
SLASH_MEWTHISCHBAGS2 = "/mewthischbags"

SlashCmdList.MEWTHISCHBAGS = function(message)
    message = tostring(message or ""):match("^%s*(.-)%s*$") or ""

    if message == "reset" then
        if not MB.db then MB:InitializeDB() end
        MB.UI:Create()
        MB.UI:ResetPosition()
        if DEFAULT_CHAT_FRAME then
            DEFAULT_CHAT_FRAME:AddMessage("|cffd6ad58Mewthisch Bags|r: " .. MB.L.RESET_DONE)
        end
        return
    end

    MB:QueueBagAction("toggle")
end
