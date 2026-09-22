local addonName, MG = ...

local function findGuide(query)
    query = tostring(query or "")
    local lower = string.lower(query)
    local partial = nil
    for _, guide in ipairs(MG.GuideCatalog:Load()) do
        if guide.id == query then return guide end
        local title = string.lower(tostring(guide.title or ""))
        if title == lower then return guide end
        if lower ~= "" and string.find(title, lower, 1, true) then
            partial = partial or guide
        end
    end
    return partial
end

local function chooseLoginGuide()
    local selectedID = MG.db and MG.db.guide and MG.db.guide.selectedID
    if selectedID then
        local selected = findGuide(selectedID)
        if selected and MG.GuideCatalog:IsApplicable(selected) then return selected end
    end
    return MG.GuideCatalog:Suggest()
end

local function startGuide(guide, reason)
    if not guide then return nil, "no_guide" end
    local facts = {
        quests = MG.QuestFacts:Snapshot(),
        inventory = MG.InventoryFacts and MG.InventoryFacts:Snapshot() or {},
        player = MG:GetPlayerProfile(),
    }
    local index, recoveryReason = MG.RecoveryPolicy:FindResumeIndex(guide, facts)
    MG.db.guide = MG.db.guide or {}
    MG.db.guide.selectedID = guide.id
    local runtime, err = MG.RuntimeEngine:StartGuide(guide, index)
    if runtime then
        MG:Log("INFO", "guide.recovered", "Guide-Position bestimmt.", {
            guideID = guide.id,
            index = index,
            reason = recoveryReason,
            trigger = reason,
        })
    end
    return runtime, err
end

local function refreshRuntime(reason, allowAdvance)
    if not MG.RuntimeEngine.session then return end
    local runtime = MG.RuntimeEngine:Refresh(reason)
    if runtime and allowAdvance and runtime.stepState and
       runtime.stepState.autoAdvanceSafe then
        local advanced = MG.RuntimeEngine:AutoAdvance()
        if advanced then runtime = MG.RuntimeStore:Get() end
    end
    if MG.RefreshUI then MG:RefreshUI() end
    return runtime
end

local function printStatus()
    local parser = MG.RestEDXPParser:GetStats()
    local compiled = MG.GuideCompiler:GetStats()
    local runtime = MG.RuntimeStore:Get()
    print("|cffffb000Mewthisch Guides 1.0|r")
    print(" RestedXP: " .. tostring(parser.guides) .. " Guides / " ..
        tostring(parser.steps) .. " Raw-Steps / " .. tostring(parser.actions) .. " Actions")
    print(" Compiled: " .. tostring(compiled.steps) .. " Steps / " ..
        tostring(compiled.goals) .. " Goals / " .. tostring(compiled.stickies) .. " Stickies")
    print(" Runtime: rev " .. tostring(runtime.revision or 0) ..
        " / Guide=" .. tostring(runtime.guide and runtime.guide.title or "-") ..
        " / Step=" .. tostring(runtime.stepIndex or "-"))
end

local function printGuides()
    local guides = MG.GuideCatalog:ListApplicable()
    print("|cffffb000Mewthisch Guides|r passende RestedXP-Guides: " .. tostring(#guides))
    for index = 1, math.min(#guides, 20) do
        local guide = guides[index]
        print(" " .. tostring(index) .. ". " .. tostring(guide.title) ..
            "  |cff888888" .. tostring(guide.id) .. "|r")
    end
end

local function slash(msg)
    MG:Safe("slash", function()
        msg = MG.Util:Trim(msg)
        local command, rest = msg:match("^(%S+)%s*(.-)$")
        command = string.lower(command or "")

        if command == "" or command == "toggle" then
            local frame = MG.GuideViewer:Create()
            frame:SetShown(not frame:IsShown())
        elseif command == "show" then
            MG.db.settings.showViewer = true
            MG.GuideViewer:Create():Show()
            MG:RefreshUI()
        elseif command == "hide" then
            MG.db.settings.showViewer = false
            MG.GuideViewer:Create():Hide()
        elseif command == "status" then
            printStatus()
        elseif command == "guides" then
            printGuides()
        elseif command == "start" then
            local guide = findGuide(rest)
            if not guide then
                print("|cffffb000Mewthisch Guides|r Guide nicht gefunden: " .. tostring(rest))
                return
            end
            local runtime, err = startGuide(guide, "slash")
            if not runtime then
                print("|cffff4040Mewthisch Guides|r Start fehlgeschlagen: " .. tostring(err))
            end
            MG:RefreshUI()
        elseif command == "next" then
            MG.RuntimeEngine:MoveStep(1, "slash_next")
            MG:RefreshUI()
        elseif command == "prev" then
            MG.RuntimeEngine:MoveStep(-1, "slash_prev")
            MG:RefreshUI()
        elseif command == "refresh" then
            refreshRuntime("slash_refresh", false)
        elseif command == "errors" or command == "errorlog" or command == "log" then
            MG.ErrorLogWindow:Toggle()
        elseif command == "settings" or command == "options" or command == "opt" then
            MG.SettingsWindow:Toggle()
        else
            print("|cffffb000Mewthisch Guides|r /mg1 [show|hide|status|guides|start <id/title>|next|prev|refresh|errors|settings]")
        end
    end)
end

SLASH_MEWTHISCHGUIDES1_1 = "/mg1"
SlashCmdList["MEWTHISCHGUIDES1"] = slash

local frame = CreateFrame("Frame")
local events = {
    "ADDON_LOADED",
    "PLAYER_LOGIN",
    "PLAYER_ENTERING_WORLD",
    "QUEST_LOG_UPDATE",
    "QUEST_ACCEPTED",
    "QUEST_TURNED_IN",
    "QUEST_REMOVED",
    "UNIT_QUEST_LOG_CHANGED",
    "BAG_UPDATE_DELAYED",
    "PLAYER_LEVEL_UP",
    "ZONE_CHANGED_NEW_AREA",
}
for _, event in ipairs(events) do pcall(frame.RegisterEvent, frame, event) end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }
    MG:Safe("event." .. event, function()
        if event == "ADDON_LOADED" then
            if args[1] == addonName then
                MG:EnsureDB()
                MG:Log("INFO", "addon.loaded", "Mewthisch Guides Build geladen.", {
                    version = MG.VERSION,
                    build = MG.BUILD,
                    interface = MG.INTERFACE,
                })
            end
            return
        end

        if event == "PLAYER_LOGIN" then
            MG:EnsureDB()

            -- UI first: a compiler/catalog problem must never make the whole
            -- addon look as if it did not load.
            MG.GuideViewer:Create()
            MG.NavigatorFrame:Create()
            MG:RefreshUI()
            print("|cffffb000Mewthisch Guides 1.0|r geladen - /mg1")

            local ok = MG:Safe("login.guide_catalog", function()
                MG.GuideCatalog:Load()
                local guide = chooseLoginGuide()
                if guide then
                    startGuide(guide, "login")
                else
                    MG:Log("WARN", "guide.none_applicable",
                        "Kein passender RestedXP-Guide für diesen Charakter gefunden.",
                        { player = MG:GetPlayerProfile() })
                end
            end)

            MG:RefreshUI()
            if not ok then
                print("|cffff4040Mewthisch Guides|r Guide-Datenfehler - /mg1 errors")
            end
            return
        end

        if event == "UNIT_QUEST_LOG_CHANGED" and args[1] and args[1] ~= "player" then
            return
        end

        local questEvent =
            event == "QUEST_LOG_UPDATE" or event == "QUEST_ACCEPTED" or
            event == "QUEST_TURNED_IN" or event == "QUEST_REMOVED" or
            event == "UNIT_QUEST_LOG_CHANGED"

        refreshRuntime(event, questEvent)
    end)
end)
