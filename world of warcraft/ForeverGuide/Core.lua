local addonName, FG = ...
_G.ForeverGuide = FG

FG.VERSION = "0.1.0"
FG.INTERFACE = 16001
FG.NAME = "ForeverGuide"

function FG:GetPlayerProfile()
    local _, classFile, classID = UnitClass("player")
    local _, raceFile, raceID = UnitRace("player")
    return { level = UnitLevel("player"), class = classFile, classID = classID, race = raceFile, raceID = raceID, faction = UnitFactionGroup("player") }
end

function FG:GetBuildInfoTable()
    local version, build, buildDate, interfaceVersion = GetBuildInfo()
    return { version = tostring(version or ""), buildNumber = tostring(build or ""), buildDate = tostring(buildDate or ""), interfaceVersion = tonumber(interfaceVersion) }
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
    return { mapID = mapID, x = p.x, y = p.y }
end

local frame = CreateFrame("Frame")
for _, event in ipairs({
    "PLAYER_LOGIN", "PLAYER_LOGOUT", "PLAYER_ENTERING_WORLD", "QUEST_LOG_UPDATE",
    "QUEST_ACCEPTED", "QUEST_TURNED_IN", "QUEST_REMOVED", "ZONE_CHANGED_NEW_AREA", "PLAYER_LEVEL_UP",
}) do frame:RegisterEvent(event) end

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }
    FG:Safe("event." .. event, function()
        if event == "PLAYER_LOGIN" then
            FG:EnsureDB()
            FG:StartLogSession()
            if not FG:IsSupportedBuild() then
                local build = FG:GetBuildInfoTable()
                FG:Log("WARN", "build.mismatch", "Forever-Build weicht von der getesteten Interface-Version ab.", {
                    expectedInterface = FG.INTERFACE,
                    actualInterface = build.interfaceVersion,
                    buildNumber = build.buildNumber,
                })
            end
            FG:InitializeUI()
            FG:RefreshGuide("PLAYER_LOGIN")

            if C_Timer and C_Timer.NewTicker then
                if FG.heartbeatTicker and FG.heartbeatTicker.Cancel then FG.heartbeatTicker:Cancel() end
                FG.heartbeatTicker = C_Timer.NewTicker(30, function()
                    FG:Safe("heartbeat", function()
                        local pos = FG:GetPosition()
                        FG:Log("INFO", "addon.heartbeat", "ForeverGuide läuft.", {
                            questID = FG.currentStep and FG.currentStep.questID or nil,
                            mapID = pos and pos.mapID or nil,
                            x = pos and pos.x or nil,
                            y = pos and pos.y or nil,
                        })
                    end)
                end)
            end

            print("|cff62d6ffForeverGuide|r v" .. FG.VERSION .. " geladen · /fg für Befehle")
        elseif event == "PLAYER_LOGOUT" then
            if FG.heartbeatTicker and FG.heartbeatTicker.Cancel then FG.heartbeatTicker:Cancel() end
            FG.heartbeatTicker = nil
            FG:EndLogSession("PLAYER_LOGOUT")
        else
            FG:Log("INFO", "game.event", event, { arg1 = args[1], arg2 = args[2] })
            FG:RefreshGuide(event)
        end
    end)
end)

SLASH_FOREVERGUIDE1 = "/fg"
SlashCmdList.FOREVERGUIDE = function(msg)
    FG:Safe("slash", function()
        msg = strtrim(msg or "")
        local command = string.lower(msg ~= "" and msg or "toggle")
        if command == "toggle" then FG:ToggleWindow()
        elseif command == "show" then FG:ShowWindow()
        elseif command == "hide" then FG:HideWindow()
        elseif command == "info" then FG:ToggleInfo()
        elseif command == "status" then FG:PrintStatus()
        elseif command == "next" then FG:SelectRelativeStep(1, "slash")
        elseif command == "prev" then FG:SelectRelativeStep(-1, "slash")
        elseif command == "refresh" or command == "resync" then FG:RefreshGuide("manual_resync")
        elseif command == "log" then
            local s = FG:GetLogSummary()
            print("|cff62d6ffForeverGuide|r Logs: " .. s.total .. " · Warnungen: " .. s.warnings .. " · Fehler: " .. s.errors)
        elseif command == "clearlog" then
            FG.db.logs = {}; FG.db.logSequence = 0
            FG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
            print("|cff62d6ffForeverGuide|r Diagnoselog geleert.")
        else
            print("|cff62d6ffForeverGuide|r /fg | show | hide | info | status | next | prev | refresh | log | clearlog")
        end
    end)
end
