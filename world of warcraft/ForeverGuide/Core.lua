local addonName, FG = ...
_G.ForeverGuide = FG

FG.VERSION = "0.2.0"
FG.INTERFACE = 16001
FG.NAME = "ForeverGuide"
FG.heartbeatTicker = nil
FG.progressTicker = nil

function FG:GetPlayerProfile()
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

function FG:GetBuildInfoTable()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()

    return {
        version = tostring(version or ""),
        buildNumber = tostring(build or ""),
        buildDate = tostring(buildDate or ""),
        interfaceVersion = tonumber(interfaceVersion),
    }
end

function FG:IsSupportedBuild()
    local build = self:GetBuildInfoTable()
    return build.interfaceVersion == self.INTERFACE
end

function FG:GetPosition()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then return nil end

    local mapID = C_Map.GetBestMapForUnit("player")
    if not mapID then return nil end

    local p = C_Map.GetPlayerMapPosition(mapID, "player")
    if not p then return { mapID = mapID } end

    return {
        mapID = mapID,
        x = p.x,
        y = p.y,
    }
end

function FG:StopRuntimeTickers()
    if self.heartbeatTicker and self.heartbeatTicker.Cancel then
        self.heartbeatTicker:Cancel()
    end
    if self.progressTicker and self.progressTicker.Cancel then
        self.progressTicker:Cancel()
    end

    self.heartbeatTicker = nil
    self.progressTicker = nil
end

function FG:StartRuntimeTickers()
    self:StopRuntimeTickers()

    if not C_Timer or not C_Timer.NewTicker then
        self:Log("WARN", "runtime.timer_missing", "C_Timer.NewTicker ist nicht verfuegbar.")
        return
    end

    self.heartbeatTicker = C_Timer.NewTicker(30, function()
        FG:Safe("heartbeat", function()
            local pos = FG:GetPosition()
            local nav = FG.navigation or {}

            FG:Log("INFO", "addon.heartbeat", "ForeverGuide laeuft.", {
                questID = FG.currentStep and FG.currentStep.questID or nil,
                mapID = pos and pos.mapID or nil,
                x = pos and pos.x or nil,
                y = pos and pos.y or nil,
                navigationSource = nav.source,
                distanceYards = nav.distanceYards,
            })
        end)
    end)

    self.progressTicker = C_Timer.NewTicker(1, function()
        FG:Safe("progress.poll", function()
            FG:PollQuestProgress()
        end)
    end)
end

local frame = CreateFrame("Frame")
local events = {
    "PLAYER_LOGIN",
    "PLAYER_LOGOUT",
    "PLAYER_ENTERING_WORLD",
    "QUEST_LOG_UPDATE",
    "QUEST_WATCH_UPDATE",
    "UNIT_QUEST_LOG_CHANGED",
    "QUEST_ACCEPTED",
    "QUEST_TURNED_IN",
    "QUEST_REMOVED",
    "QUEST_DETAIL",
    "QUEST_PROGRESS",
    "QUEST_COMPLETE",
    "GOSSIP_SHOW",
    "QUEST_GREETING",
    "ZONE_CHANGED_NEW_AREA",
    "PLAYER_LEVEL_UP",
    "BAG_UPDATE_DELAYED",
}

for _, event in ipairs(events) do
    pcall(frame.RegisterEvent, frame, event)
end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }

    FG:Safe("event." .. event, function()
        if event == "PLAYER_LOGIN" then
            FG:EnsureDB()
            FG:StartLogSession()

            if not FG:IsSupportedBuild() then
                local build = FG:GetBuildInfoTable()
                FG:Log("WARN", "build.mismatch",
                    "Forever-Build weicht von der getesteten Interface-Version ab.", {
                        expectedInterface = FG.INTERFACE,
                        actualInterface = build.interfaceVersion,
                        buildNumber = build.buildNumber,
                    })
            end

            FG:InitializeUI()
            FG:CreateMinimapButton()
            FG:RefreshGuide("PLAYER_LOGIN")
            FG:StartRuntimeTickers()

            print("|cff62d6ffForeverGuide|r v" .. FG.VERSION .. " geladen - /fg fuer Befehle")
            return
        end

        if event == "PLAYER_LOGOUT" then
            FG:StopRuntimeTickers()
            FG:EndLogSession("PLAYER_LOGOUT")
            return
        end

        if event == "UNIT_QUEST_LOG_CHANGED" and args[1] and args[1] ~= "player" then
            return
        end

        if event == "GOSSIP_SHOW" or
           event == "QUEST_GREETING" or
           event == "QUEST_DETAIL" or
           event == "QUEST_PROGRESS" or
           event == "QUEST_COMPLETE" then
            FG:HandleQuestAutomationEvent(event)
        end

        if event == "QUEST_ACCEPTED" or event == "QUEST_TURNED_IN" or event == "QUEST_REMOVED" then
            FG.manualOffset = 0
        end

        if event == "QUEST_ACCEPTED" then
            FG.automationStatus = "Quest angenommen"
        elseif event == "QUEST_TURNED_IN" then
            FG.automationStatus = "Quest abgegeben"
            FG:Log("INFO", "quest.turnedin_confirmed", "Questabgabe vom Spiel bestaetigt.", {
                questID = args[1],
            })
        elseif event == "QUEST_REMOVED" then
            FG.automationStatus = "Questlog aktualisiert"
        end

        FG:Log("INFO", "game.event", event, {
            arg1 = args[1],
            arg2 = args[2],
        })

        if event ~= "GOSSIP_SHOW" and
           event ~= "QUEST_GREETING" and
           event ~= "QUEST_DETAIL" and
           event ~= "QUEST_PROGRESS" and
           event ~= "QUEST_COMPLETE" then
            FG:RefreshGuide(event)
        else
            FG:RefreshUI()
        end
    end)
end)

local function parseOnOff(value)
    value = string.lower(tostring(value or ""))
    if value == "on" or value == "an" or value == "1" then return true end
    if value == "off" or value == "aus" or value == "0" then return false end
    return nil
end

SLASH_FOREVERGUIDE1 = "/fg"
SlashCmdList.FOREVERGUIDE = function(msg)
    FG:Safe("slash", function()
        msg = strtrim(msg or "")
        local command, rest = msg:match("^(%S+)%s*(.-)$")
        command = string.lower(command or "toggle")

        if command == "toggle" then
            FG:ToggleWindow()
        elseif command == "show" then
            FG:ShowWindow()
        elseif command == "hide" then
            FG:HideWindow()
        elseif command == "info" then
            FG:ToggleInfo()
        elseif command == "settings" or command == "optionen" then
            FG:ToggleSettings()
        elseif command == "minimap" then
            FG:ToggleWindow()
        elseif command == "status" then
            FG:PrintStatus()
        elseif command == "next" then
            FG:SelectRelativeStep(1, "slash")
        elseif command == "prev" then
            FG:SelectRelativeStep(-1, "slash")
        elseif command == "refresh" or command == "resync" then
            FG:RefreshGuide("manual_resync")
        elseif command == "autoaccept" then
            local value = parseOnOff(rest)
            if value ~= nil then
                FG.db.settings.autoAcceptQuests = value
                FG:Log("INFO", "settings.auto_accept", "Auto-Annahme geaendert.", { enabled = value })
                FG:RefreshSettings()
            end
            print("|cff62d6ffForeverGuide|r Auto-Annahme: " .. tostring(FG.db.settings.autoAcceptQuests))
        elseif command == "autoturnin" then
            local value = parseOnOff(rest)
            if value ~= nil then
                FG.db.settings.autoTurnInQuests = value
                FG:Log("INFO", "settings.auto_turnin", "Auto-Abgabe geaendert.", { enabled = value })
                FG:RefreshSettings()
            end
            print("|cff62d6ffForeverGuide|r Auto-Abgabe: " .. tostring(FG.db.settings.autoTurnInQuests))
        elseif command == "log" then
            local s = FG:GetLogSummary()
            print("|cff62d6ffForeverGuide|r Logs: " .. s.total ..
                " - Warnungen: " .. s.warnings ..
                " - Fehler: " .. s.errors)
        elseif command == "clearlog" then
            FG.db.logs = {}
            FG.db.logSequence = 0
            FG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
            print("|cff62d6ffForeverGuide|r Diagnoselog geleert.")
        else
            print("|cff62d6ffForeverGuide|r /fg | show | hide | info | settings | status | next | prev | refresh | autoaccept on/off | autoturnin on/off | log | clearlog")
        end
    end)
end
