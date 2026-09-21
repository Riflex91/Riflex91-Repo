local addonName, MG = ...

MG.Bootstrap = MG.Bootstrap or {}
local B = MG.Bootstrap

local function hasEvent(snapshot, eventType)
    for _, event in ipairs(snapshot and snapshot.events or {}) do
        if event.type == eventType then return true end
    end
    return false
end

function B:StartSuggestedGuide(reason)
    local guide = MG.GuideCatalog:Suggest(MG:GetPlayerProfile())
    if not guide then
        MG:Log("WARN", "guide.no_suggestion", "Kein passender RestedXP-Guide gefunden.")
        return nil
    end
    local facts = MG.FactSnapshot:Build(nil, nil)
    local index, recoveryReason = MG.RecoveryPolicy:FindResumeIndex(guide, facts)
    MG:Log("INFO", "guide.resume", "Guide-Einstieg bestimmt.", {
        guideID=guide.id,index=index,reason=recoveryReason,
    })
    return MG.RuntimeEngine:StartGuide(guide, index)
end

function B:Refresh(reason)
    if not MG.RuntimeEngine.session then return self:StartSuggestedGuide(reason) end
    local snapshot = MG.RuntimeEngine:Refresh(reason)
    if snapshot and hasEvent(snapshot, "STEP_COMPLETE") then
        local advanced = MG.RuntimeEngine:AutoAdvance()
        if advanced then snapshot = MG.RuntimeStore:Get() end
    end
    MG:RefreshUI()
    return snapshot
end

function B:PrintStatus()
    local parser = MG.RestedXPParser:GetStats()
    local compiled = MG.GuideCompiler:GetStats()
    local runtime = MG.RuntimeStore:Get()
    print("|cffffb51bMewthisch Guides 1.0|r")
    print(" RestedXP: " .. tostring(parser.guides) .. " Guides / " ..
        tostring(parser.steps) .. " Raw-Steps / " .. tostring(parser.actions) .. " Actions")
    print(" Compiled: " .. tostring(compiled.steps) .. " Steps / " ..
        tostring(compiled.goals) .. " Goals / " .. tostring(compiled.stickySteps) .. " Stickies")
    print(" Runtime: Revision " .. tostring(runtime.revision or 0) ..
        " / Guide " .. tostring(runtime.guideID or "-") ..
        " / Step " .. tostring(runtime.stepIndex or "-"))
end

local function slash(message)
    MG:Safe("slash", function()
        local command, rest = tostring(message or ""):match("^%s*(%S*)%s*(.-)%s*$")
        command = string.lower(command or "")
        if command == "" or command == "toggle" then
            local viewer = MG.GuideViewer:Create()
            if viewer:IsShown() then viewer:Hide() else viewer:Show() end
        elseif command == "status" then
            B:PrintStatus()
        elseif command == "errors" or command == "errorlog" or command == "fehler" then
            MG.ErrorLogWindow:Toggle(true)
        elseif command == "next" then
            MG.RuntimeEngine:MoveStep(1, "slash_next")
            MG:RefreshUI()
        elseif command == "prev" then
            MG.RuntimeEngine:MoveStep(-1, "slash_prev")
            MG:RefreshUI()
        elseif command == "refresh" then
            B:Refresh("slash_refresh")
        elseif command == "guides" then
            local list = MG.GuideCatalog:ListApplicable(MG:GetPlayerProfile())
            print("|cffffb51bMewthisch Guides|r passende RestedXP-Guides: " .. tostring(#list))
            for index = 1, math.min(#list, 12) do
                print(" " .. tostring(index) .. ". " .. tostring(list[index].id) ..
                    " - " .. tostring(list[index].title))
            end
        elseif command == "start" then
            local guide = MG.GuideCompiler:Get(rest)
            if guide then
                local facts = MG.FactSnapshot:Build(nil, nil)
                local index = MG.RecoveryPolicy:FindResumeIndex(guide, facts)
                MG.RuntimeEngine:StartGuide(guide, index)
                MG:RefreshUI()
            else
                print("|cffff5050Mewthisch Guides:|r Guide-ID nicht gefunden: " .. tostring(rest))
            end
        else
            print("/mg1 | status | guides | start <guide-id> | next | prev | refresh | errors")
        end
    end)
end

SLASH_MEWTHISCHGUIDESONE1 = "/mg1"
SlashCmdList.MEWTHISCHGUIDESONE = slash

local frame = CreateFrame("Frame")
local events = {
    "ADDON_LOADED", "PLAYER_LOGIN", "PLAYER_ENTERING_WORLD",
    "QUEST_LOG_UPDATE", "QUEST_ACCEPTED", "QUEST_TURNED_IN", "QUEST_REMOVED",
    "BAG_UPDATE_DELAYED", "PLAYER_LEVEL_UP", "ZONE_CHANGED_NEW_AREA",
}
for _, event in ipairs(events) do pcall(frame.RegisterEvent, frame, event) end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }
    MG:Safe("event." .. event, function()
        if event == "ADDON_LOADED" then
            if args[1] ~= addonName then return end
            MG:EnsureDB()
            MG.RuntimeStore:Reset("addon_loaded")
            return
        end

        if event == "PLAYER_LOGIN" then
            MG:EnsureDB()
            local parserStats = MG.RestedXPParser:GetStats()
            local compilerStats = MG.GuideCompiler:GetStats()
            MG:Log("INFO", "addon.ready", "Mewthisch Guides 1.0 Entwicklungsstand geladen.", {
                sourceCommit=parserStats.sourceCommit,
                guides=parserStats.guides,
                rawSteps=parserStats.steps,
                compiledSteps=compilerStats.steps,
                goals=compilerStats.goals,
                stickies=compilerStats.stickySteps,
            })
            MG.GuideViewer:Create()
            MG.NavigatorFrame:Create()
            B:StartSuggestedGuide("player_login")
            MG:RefreshUI()
            print("|cffffb51bMewthisch Guides|r 1.0-dev geladen - /mg1")
            return
        end

        if event == "PLAYER_ENTERING_WORLD" or event == "QUEST_LOG_UPDATE" or
           event == "QUEST_ACCEPTED" or event == "QUEST_TURNED_IN" or
           event == "QUEST_REMOVED" or event == "BAG_UPDATE_DELAYED" or
           event == "PLAYER_LEVEL_UP" or event == "ZONE_CHANGED_NEW_AREA" then
            B:Refresh(event)
        end
    end)
end)
