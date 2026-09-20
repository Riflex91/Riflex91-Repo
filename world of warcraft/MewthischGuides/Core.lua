local addonName, MG = ...
_G.MewthischGuides = MG
_G.ForeverGuide = MG

MG.VERSION = "0.5.0"
MG.INTERFACE = 16001
MG.NAME = "Mewthisch Guides"
MG.heartbeatTicker = nil
MG.progressTicker = nil

function MG:GetPlayerProfile()
    local _, classFile, classID = UnitClass("player")
    local _, raceFile, raceID = UnitRace("player")
    return {
        level = UnitLevel("player"),
        class = classFile,
        classID = classID,
        race = raceFile,
        raceID = raceID,
        faction = UnitFactionGroup("player"),
    }
end

function MG:GetBuildInfoTable()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()
    return {
        version = tostring(version or ""),
        buildNumber = tostring(build or ""),
        buildDate = tostring(buildDate or ""),
        interfaceVersion = tonumber(interfaceVersion),
    }
end

function MG:IsSupportedBuild()
    return self:GetBuildInfoTable().interfaceVersion == self.INTERFACE
end

function MG:GetPosition()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then return nil end
    local mapID = C_Map.GetBestMapForUnit("player")
    if not mapID then return nil end
    local p = C_Map.GetPlayerMapPosition(mapID, "player")
    if not p then return { mapID = mapID } end
    return { mapID = mapID, x = p.x, y = p.y }
end

function MG:StopRuntimeTickers()
    if self.heartbeatTicker and self.heartbeatTicker.Cancel then self.heartbeatTicker:Cancel() end
    if self.progressTicker and self.progressTicker.Cancel then self.progressTicker:Cancel() end
    self.heartbeatTicker = nil
    self.progressTicker = nil
end

function MG:StartRuntimeTickers()
    self:StopRuntimeTickers()
    if not C_Timer or not C_Timer.NewTicker then
        self:Log("WARN", "runtime.timer_missing", "C_Timer.NewTicker ist nicht verfuegbar.")
        return
    end

    self.heartbeatTicker = C_Timer.NewTicker(30, function()
        MG:Safe("heartbeat", function()
            local pos = MG:GetPosition()
            local nav = MG.navigation or {}
            MG:Log("INFO", "addon.heartbeat", "Mewthisch Guides laeuft.", {
                questID = MG.currentStep and MG.currentStep.questID or nil,
                mapID = pos and pos.mapID or nil,
                x = pos and pos.x or nil,
                y = pos and pos.y or nil,
                navigationSource = nav.source,
                distanceYards = nav.distanceYards,
                distanceMeters = nav.distanceMeters,
            })
        end)
    end)

    self.progressTicker = C_Timer.NewTicker(1, function()
        MG:Safe("progress.poll", function() MG:PollQuestProgress() end)
    end)
end

local frame = CreateFrame("Frame")
local events = {
    "PLAYER_LOGIN", "PLAYER_LOGOUT", "PLAYER_ENTERING_WORLD",
    "QUEST_LOG_UPDATE", "QUEST_WATCH_UPDATE", "UNIT_QUEST_LOG_CHANGED",
    "QUEST_ACCEPTED", "QUEST_TURNED_IN", "QUEST_REMOVED",
    "QUEST_DETAIL", "QUEST_PROGRESS", "QUEST_COMPLETE",
    "GOSSIP_SHOW", "QUEST_GREETING", "ZONE_CHANGED_NEW_AREA",
    "PLAYER_LEVEL_UP", "BAG_UPDATE_DELAYED",
    "NAVIGATION_FRAME_CREATED", "NAVIGATION_FRAME_DESTROYED",
    "NAVIGATION_DESTINATION_REACHED",
}
for _, event in ipairs(events) do pcall(frame.RegisterEvent, frame, event) end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }
    MG:Safe("event." .. event, function()
        if event == "PLAYER_LOGIN" then
            MG:EnsureDB()
            MG:StartLogSession()
            if not MG:IsSupportedBuild() then
                local build = MG:GetBuildInfoTable()
                MG:Log("WARN", "build.mismatch", "Forever-Build weicht von der getesteten Interface-Version ab.", {
                    expectedInterface = MG.INTERFACE,
                    actualInterface = build.interfaceVersion,
                    buildNumber = build.buildNumber,
                })
            end
            MG:InitializeUI()
            MG:InitializeNavigator()
            MG:CreateMinimapButton()
            MG:RefreshGuide("PLAYER_LOGIN")
            MG:StartRuntimeTickers()
            print("|cff62d6ffMewthisch Guides|r v" .. MG.VERSION .. " geladen - /mg fuer Befehle")
            return
        end

        if event == "PLAYER_LOGOUT" then
            MG:StopRuntimeTickers()
            MG:EndLogSession("PLAYER_LOGOUT")
            return
        end

        if event == "UNIT_QUEST_LOG_CHANGED" and args[1] and args[1] ~= "player" then return end

        if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" or event == "QUEST_DETAIL" or
           event == "QUEST_PROGRESS" or event == "QUEST_COMPLETE" then
            MG:HandleQuestAutomationEvent(event)
        end

        if event == "QUEST_ACCEPTED" or event == "QUEST_TURNED_IN" or event == "QUEST_REMOVED" then
            MG.manualOffset = 0
        end

        if event == "QUEST_ACCEPTED" then
            MG.automationStatus = "Quest angenommen"
        elseif event == "QUEST_TURNED_IN" then
            MG.automationStatus = "Quest abgegeben"
            MG:Log("INFO", "quest.turnedin_confirmed", "Questabgabe vom Spiel bestaetigt.", { questID = args[1] })
        elseif event == "NAVIGATION_DESTINATION_REACHED" then
            MG:Log("INFO", "navigation.destination_reached", "Navigationsziel erreicht.")
        end

        MG:Log("INFO", "game.event", event, { arg1 = args[1], arg2 = args[2] })

        if event ~= "GOSSIP_SHOW" and event ~= "QUEST_GREETING" and event ~= "QUEST_DETAIL" and
           event ~= "QUEST_PROGRESS" and event ~= "QUEST_COMPLETE" then
            MG:RefreshGuide(event)
        else
            MG:RefreshUI()
            MG:RefreshNavigator()
        end
    end)
end)

local function parseOnOff(value)
    value = string.lower(tostring(value or ""))
    if value == "on" or value == "an" or value == "1" then return true end
    if value == "off" or value == "aus" or value == "0" then return false end
    return nil
end

local function handleSlash(msg)
    MG:Safe("slash", function()
        msg = strtrim(msg or "")
        local command, rest = msg:match("^(%S+)%s*(.-)$")
        command = string.lower(command or "toggle")

        if command == "toggle" then MG:ToggleWindow()
        elseif command == "show" then MG:ShowWindow()
        elseif command == "hide" then MG:HideWindow()
        elseif command == "info" then MG:ToggleInfo()
        elseif command == "settings" or command == "optionen" then MG:ToggleSettings()
        elseif command == "navigator" or command == "arrow" or command == "pfeil" then MG:ToggleNavigator()
        elseif command == "status" then MG:PrintStatus()
        elseif command == "next" then MG:SelectRelativeStep(1, "slash")
        elseif command == "prev" then MG:SelectRelativeStep(-1, "slash")
        elseif command == "refresh" or command == "resync" then MG:RefreshGuide("manual_resync")
        elseif command == "autoaccept" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.autoAcceptQuests = value
                MG:Log("INFO", "settings.auto_accept", "Auto-Annahme geaendert.", { enabled = value })
                MG:RefreshSettings()
            end
            print("|cff62d6ffMewthisch Guides|r Auto-Annahme: " .. tostring(MG.db.settings.autoAcceptQuests))
        elseif command == "autoturnin" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.autoTurnInQuests = value
                MG:Log("INFO", "settings.auto_turnin", "Auto-Abgabe geaendert.", { enabled = value })
                MG:RefreshSettings()
            end
            print("|cff62d6ffMewthisch Guides|r Auto-Abgabe: " .. tostring(MG.db.settings.autoTurnInQuests))
        elseif command == "log" then
            local s = MG:GetLogSummary()
            print("|cff62d6ffMewthisch Guides|r Logs: " .. s.total .. " - Warnungen: " .. s.warnings .. " - Fehler: " .. s.errors)
        elseif command == "clearlog" then
            MG.db.logs = {}
            MG.db.logSequence = 0
            MG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
            print("|cff62d6ffMewthisch Guides|r Diagnoselog geleert.")
        else
            print("|cff62d6ffMewthisch Guides|r /mg | show | hide | info | settings | navigator | status | next | prev | refresh | autoaccept on/off | autoturnin on/off | log | clearlog")
        end
    end)
end

SLASH_MEWTHISCHGUIDES1 = "/mg"
SLASH_MEWTHISCHGUIDES2 = "/fg"
SlashCmdList.MEWTHISCHGUIDES = handleSlash
