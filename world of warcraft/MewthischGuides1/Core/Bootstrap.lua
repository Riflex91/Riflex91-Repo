local addonName, MG = ...

local function findGuide(query)
    return MG.GuideCatalog:Find(query)
end

local function chooseLoginGuide()
    local selectedID = MG.db and MG.db.guide and MG.db.guide.selectedID
    if selectedID then
        local selected = findGuide(selectedID)
        if selected and MG.GuideCatalog:IsApplicable(selected) then return selected end
    end
    return MG.GuideCatalog:Suggest()
end

local function refreshRuntime(reason, allowAdvance)
    if not MG.RuntimeEngine.session then return nil, "no_active_session" end

    local runtime = MG.RuntimeEngine:Refresh(reason)
    if runtime and allowAdvance and MG.db.settings.autoAdvance then
        local advanced = MG.RuntimeEngine:AdvanceWhileSafe(25)
        if advanced > 0 then runtime = MG.RuntimeStore:Get() end
    end

    if MG.RefreshUI then MG:RefreshUI() end
    return runtime
end

local function printStatus()
    local parser = MG.RestEDXPParser:GetStats()
    local compiled = MG.GuideCompiler:GetStats()
    local runtime = MG.RuntimeStore:Get()
    local counts = MG:GetLogCounts()

    print("|cffffb000Mewthisch Guides 1.0|r Build " .. tostring(MG.BUILD or "-"))
    print(" RestedXP: " .. tostring(parser.guides) .. " Guides / " ..
        tostring(parser.steps) .. " Raw-Steps / " .. tostring(parser.actions) .. " Actions")
    print(" Compiled: " .. tostring(compiled.steps) .. " Steps / " ..
        tostring(compiled.goals) .. " Goals / " .. tostring(compiled.stickies) ..
        " Stickies / " .. tostring(compiled.deferred or 0) .. " CompleteWith")
    print(" Runtime: rev " .. tostring(runtime.revision or 0) ..
        " / Guide=" .. tostring(runtime.guide and runtime.guide.title or "-") ..
        " / Step=" .. tostring(runtime.stepIndex or "-") ..
        " / Ziel=" .. tostring(runtime.destinationGoal and runtime.destinationGoal.action or "-"))
    print(" Diagnose: INFO=" .. tostring(counts.INFO or 0) ..
        " WARN=" .. tostring(counts.WARN or 0) ..
        " ERROR=" .. tostring(counts.ERROR or 0))
end

local function printGuides()
    local guides = MG.GuideCatalog:ListApplicable()
    print("|cffffb000Mewthisch Guides|r passende RestedXP-Guides: " .. tostring(#guides))
    for index = 1, math.min(#guides, 20) do
        local guide = guides[index]
        print(" " .. tostring(index) .. ". " .. tostring(guide.title) ..
            "  |cff888888" .. tostring(guide.id) .. "|r")
    end
    if #guides > 20 then print(" ... weitere im /mg1 browser") end
end

local function slash(msg)
    MG:Safe("slash", function()
        msg = MG.Util:Trim(msg)
        local command, rest = msg:match("^(%S+)%s*(.-)$")
        command = string.lower(command or "")

        if command == "" or command == "toggle" then
            local db = MG:EnsureDB()
            db.settings.showViewer = not (MG.GuideViewer:Create():IsShown())
            MG:RefreshUI()
        elseif command == "show" then
            MG.db.settings.showViewer = true
            MG:RefreshUI()
        elseif command == "hide" then
            MG.db.settings.showViewer = false
            MG.GuideViewer:Create():Hide()
        elseif command == "status" then
            printStatus()
        elseif command == "guides" then
            printGuides()
        elseif command == "browser" then
            MG.GuideBrowser:Toggle()
        elseif command == "build" or command == "talents" then
            MG.BuildWindow:Toggle()
        elseif command == "start" then
            local runtime, err = MG.GuideController:StartByQuery(rest, "slash")
            if not runtime then
                print("|cffff4040Mewthisch Guides|r Start fehlgeschlagen: " .. tostring(err))
            end
        elseif command == "next" then
            MG.RuntimeEngine:MoveStep(1, "slash_next")
            MG:RefreshUI()
        elseif command == "prev" then
            MG.RuntimeEngine:MoveStep(-1, "slash_prev")
            MG:RefreshUI()
        elseif command == "refresh" then
            refreshRuntime("slash_refresh", false)
        elseif command == "done" then
            local runtime = MG.RuntimeStore:Get()
            local goal = runtime and runtime.destinationGoal
            if goal and goal.manualCompletable and MG.ActionMemory then
                MG.ActionMemory:MarkManual(goal.id, "slash_done")
                refreshRuntime("slash_done", true)
            else
                print("|cffffb000Mewthisch Guides|r Aktuelles Ziel ist nicht manuell abschließbar.")
            end
        elseif command == "errors" or command == "errorlog" or command == "log" then
            MG.ErrorLogWindow:Toggle()
        elseif command == "settings" or command == "options" or command == "opt" then
            MG.SettingsWindow:Toggle()
        else
            print("|cffffb000Mewthisch Guides|r /mg1 [show|hide|status|browser|guides|start <id/title>|next|prev|refresh|done|build|errors|settings]")
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
    "QUEST_DETAIL",
    "QUEST_PROGRESS",
    "QUEST_COMPLETE",
    "QUEST_FINISHED",
    "UNIT_QUEST_LOG_CHANGED",
    "BAG_UPDATE_DELAYED",
    "PLAYER_LEVEL_UP",
    "PLAYER_XP_UPDATE",
    "PLAYER_MONEY",
    "ZONE_CHANGED",
    "ZONE_CHANGED_INDOORS",
    "ZONE_CHANGED_NEW_AREA",
    "PLAYER_EQUIPMENT_CHANGED",
    "SKILL_LINES_CHANGED",
    "UPDATE_FACTION",
    "UNIT_AURA",
    "SPELL_UPDATE_USABLE",
    "LEARNED_SPELL_IN_TAB",
    "UNIT_SPELLCAST_SUCCEEDED",
    "HEARTHSTONE_BOUND",
    "PLAYER_CONTROL_GAINED",
    "TAXIMAP_OPENED",
    "MERCHANT_SHOW",
    "TRAINER_SHOW",
    "GOSSIP_SHOW",
    "BANKFRAME_OPENED",
    "UNIT_ENTERED_VEHICLE",
    "CHAT_MSG_TEXT_EMOTE",
}
for _, event in ipairs(events) do pcall(frame.RegisterEvent, frame, event) end

local function recordEvent(event, args)
    if not MG.ActionMemory then return end

    if event == "UNIT_SPELLCAST_SUCCEEDED" and args[1] == "player" then
        local spellID = tonumber(args[3]) or tonumber(args[2])
        if spellID then MG.ActionMemory:Record("spell", spellID, { event=event }) end
    elseif event == "MERCHANT_SHOW" then
        MG.ActionMemory:Record("vendor", "*", { event=event })
    elseif event == "TRAINER_SHOW" then
        MG.ActionMemory:Record("trainer", "*", { event=event })
    elseif event == "GOSSIP_SHOW" then
        MG.ActionMemory:Record("gossipoption", "*", { event=event })
    elseif event == "BANKFRAME_OPENED" then
        MG.ActionMemory:Record("bank", "*", { event=event })
        MG.ActionMemory:Record("bankdeposit", "*", { event=event })
        MG.ActionMemory:Record("bankwithdraw", "*", { event=event })
    elseif event == "HEARTHSTONE_BOUND" then
        MG.ActionMemory:Record("bindlocation", "*", { event=event })
    elseif event == "PLAYER_CONTROL_GAINED" then
        MG.ActionMemory:Record("travel", "*", { event=event })
    elseif event == "TAXIMAP_OPENED" then
        MG.ActionMemory:Record("fp", "*", { event=event })
    elseif event == "PLAYER_EQUIPMENT_CHANGED" then
        MG.ActionMemory:Record("equip", tonumber(args[1]) or "*", { event=event })
    elseif event == "UNIT_ENTERED_VEHICLE" and (not args[1] or args[1] == "player") then
        MG.ActionMemory:Record("vehicle", "*", { event=event })
    elseif event == "CHAT_MSG_TEXT_EMOTE" then
        MG.ActionMemory:Record("emote", "*", { event=event })
    end
end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }
    MG:Safe("event." .. event, function()
        if event == "ADDON_LOADED" then
            if args[1] == addonName then
                MG:EnsureDB()
                MG:Log("INFO", "addon.loaded", "Mewthisch Guides Build geladen.", {
                    version=MG.VERSION,
                    build=MG.BUILD,
                    interface=MG.INTERFACE,
                })
            end
            return
        end

        if event == "PLAYER_LOGIN" then
            MG:EnsureDB()

            MG.GuideViewer:Create()
            MG.NavigatorFrame:Create()
            MG.ActionBar:Create()
            MG.WorldMapOverlay:Create()
            if MG.TravelGraph then MG.TravelGraph:Load() end
            if MG.BuildState then MG.BuildState:Refresh("login") end
            if MG.TalentAdvisor then MG.TalentAdvisor:Refresh("login") end
            MG:RefreshUI()
            print("|cffffb000Mewthisch Guides 1.0|r geladen - /mg1")

            local ok = MG:Safe("login.guide_catalog", function()
                MG.GuideCatalog:Load()
                local guide = chooseLoginGuide()
                if guide then
                    MG.GuideController:Start(guide, "login", true)
                else
                    MG:Log("WARN", "guide.none_applicable",
                        "Kein passender RestedXP-Guide für diesen Charakter gefunden.",
                        { player=MG:GetPlayerProfile() })
                end
            end)

            MG:RefreshUI()
            if not ok then
                print("|cffff4040Mewthisch Guides|r Guide-Datenfehler - /mg1 errors")
            end
            return
        end

        if event == "UNIT_QUEST_LOG_CHANGED" and args[1] and args[1] ~= "player" then return end
        if event == "UNIT_AURA" and args[1] and args[1] ~= "player" then return end

        recordEvent(event, args)

        if event == "QUEST_DETAIL" then
            MG.AutomationPolicy:OnQuestDetail()
        elseif event == "QUEST_PROGRESS" then
            MG.AutomationPolicy:OnQuestProgress()
        elseif event == "QUEST_COMPLETE" then
            MG.RewardAdvisorFrame:Refresh(true)
            MG.AutomationPolicy:OnQuestComplete()
        elseif event == "QUEST_FINISHED" then
            MG.RewardAdvisorFrame:Hide()
        end

        if event == "PLAYER_LEVEL_UP" or event == "LEARNED_SPELL_IN_TAB" or
           event == "SPELL_UPDATE_USABLE" then
            if MG.BuildState then MG.BuildState:Refresh(event) end
            if MG.TalentAdvisor then MG.TalentAdvisor:Refresh(event) end
        end

        local canAdvance =
            event == "QUEST_LOG_UPDATE" or
            event == "QUEST_ACCEPTED" or
            event == "QUEST_TURNED_IN" or
            event == "QUEST_REMOVED" or
            event == "UNIT_QUEST_LOG_CHANGED" or
            event == "BAG_UPDATE_DELAYED" or
            event == "PLAYER_LEVEL_UP" or
            event == "PLAYER_XP_UPDATE" or
            event == "PLAYER_MONEY" or
            event == "PLAYER_EQUIPMENT_CHANGED" or
            event == "SKILL_LINES_CHANGED" or
            event == "UPDATE_FACTION" or
            event == "UNIT_AURA" or
            event == "LEARNED_SPELL_IN_TAB" or
            event == "UNIT_SPELLCAST_SUCCEEDED" or
            event == "ZONE_CHANGED" or
            event == "ZONE_CHANGED_INDOORS" or
            event == "ZONE_CHANGED_NEW_AREA"

        refreshRuntime(event, canAdvance)
    end)
end)
