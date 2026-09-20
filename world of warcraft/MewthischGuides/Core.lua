local addonName, MG = ...
_G.MewthischGuides = MG
_G.ForeverGuide = MG

MG.VERSION = "0.11.2"
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
    if self.ForeverAPI and self.ForeverAPI.GetPlayerPosition then
        return self.ForeverAPI:GetPlayerPosition()
    end
    return nil
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
        self:Log("WARN", "runtime.timer_missing", "C_Timer.NewTicker ist nicht verfügbar.")
        return
    end

    self.heartbeatTicker = C_Timer.NewTicker(30, function()
        MG:Safe("heartbeat", function()
            local pos = MG:GetPosition()
            local nav = MG.navigation or {}
            local diagnostics = MG.Diagnostics and MG.Diagnostics:Collect() or {}
            MG:Log("INFO", "addon.heartbeat", "Mewthisch Guides läuft.", {
                questID = MG.currentStep and MG.currentStep.questID or nil,
                mapID = pos and pos.mapID or nil,
                x = pos and pos.x or nil,
                y = pos and pos.y or nil,
                navigationSource = nav.source,
                routeScore = nav.routeScore,
                routeCandidates = nav.candidateCount,
                directionSource = nav.directionSource,
                distanceMeters = nav.distanceMeters,
                apiMode = MG.ForeverAPI and MG.ForeverAPI.MODE or nil,
                guideID = diagnostics.guideID,
                validation = diagnostics.validation,
            })
        end)
    end)

    self.progressTicker = C_Timer.NewTicker(1, function()
        MG:Safe("progress.poll", function()
            if MG.QuestTracking then MG.QuestTracking:Refresh("progress_poll") end
            MG:PollQuestProgress()
        end)
    end)
end

local frame = CreateFrame("Frame")
local events = {
    "ADDON_LOADED",
    "PLAYER_LOGIN", "PLAYER_LOGOUT", "PLAYER_ENTERING_WORLD",
    "QUEST_LOG_UPDATE", "QUEST_WATCH_UPDATE", "UNIT_QUEST_LOG_CHANGED",
    "QUEST_ACCEPTED", "QUEST_TURNED_IN", "QUEST_REMOVED",
    "QUEST_DETAIL", "QUEST_PROGRESS", "QUEST_COMPLETE",
    "GOSSIP_SHOW", "QUEST_GREETING", "ZONE_CHANGED_NEW_AREA",
    "PLAYER_LEVEL_UP", "BAG_UPDATE_DELAYED", "PLAYER_EQUIPMENT_CHANGED",
    "PLAYER_TALENT_UPDATE", "ACTIVE_TALENT_GROUP_CHANGED", "TRAIT_CONFIG_UPDATED",
    "NAVIGATION_FRAME_CREATED", "NAVIGATION_FRAME_DESTROYED",
    "NAVIGATION_DESTINATION_REACHED",
}
for _, event in ipairs(events) do pcall(frame.RegisterEvent, frame, event) end

local QUEST_STATE_EVENTS = {
    QUEST_LOG_UPDATE = true,
    QUEST_WATCH_UPDATE = true,
    UNIT_QUEST_LOG_CHANGED = true,
    QUEST_ACCEPTED = true,
    QUEST_TURNED_IN = true,
    QUEST_REMOVED = true,
}

local BUILD_EVENTS = {
    PLAYER_TALENT_UPDATE = true,
    ACTIVE_TALENT_GROUP_CHANGED = true,
    TRAIT_CONFIG_UPDATED = true,
}

frame:SetScript("OnEvent", function(_, event, ...)
    local args = { ... }

    MG:Safe("event." .. event, function()
        if event == "ADDON_LOADED" then
            if args[1] == addonName then
                if MG.ForeverAPI and MG.ForeverAPI.MarkSavedVariablesLoad then
                    MG.ForeverAPI:MarkSavedVariablesLoad()
                else
                    MG:EnsureDB()
                end
            end
            return
        end

        if event == "PLAYER_LOGIN" then
            MG:EnsureDB()

            if MG.ForeverAPI and MG.ForeverAPI.Survey then MG.ForeverAPI:Survey() end
            if MG.Themes and MG.Themes.RegisterEllesmereSkin then
                MG.Themes:RegisterEllesmereSkin()
            end
            MG:StartLogSession()

            if MG.DataLoader then MG.DataLoader:Load() end
            if MG.TravelGraph then MG.TravelGraph:Load() end
            if MG.Sync then MG.Sync:Full("PLAYER_LOGIN") end

            if not MG:IsSupportedBuild() then
                local build = MG:GetBuildInfoTable()
                MG:Log("WARN", "build.mismatch",
                    "Forever-Build weicht von der getesteten Interface-Version ab.", {
                        expectedInterface = MG.INTERFACE,
                        actualInterface = build.interfaceVersion,
                        buildNumber = build.buildNumber,
                    })
            end

            MG:InitializeUI()
            MG:InitializeNavigator()
            MG:CreateMinimapButton()
            if MG.RefreshTheme then MG:RefreshTheme() end
            MG:RefreshGuide("PLAYER_LOGIN")
            MG:StartRuntimeTickers()
            if MG.Diagnostics then MG.Diagnostics:Collect() end

            print("|cff62d6ffMewthisch Guides|r v" .. MG.VERSION ..
                " geladen – /mg für Befehle")
            return
        end

        if event == "PLAYER_LOGOUT" then
            MG:StopRuntimeTickers()
            if MG.Diagnostics then MG.Diagnostics:Collect() end
            MG:EndLogSession("PLAYER_LOGOUT")
            return
        end

        if event == "UNIT_QUEST_LOG_CHANGED" and args[1] and args[1] ~= "player" then return end

        if MG.Telemetry then
            MG.Telemetry:Count("game." .. event, { arg1 = args[1], arg2 = args[2] })
        end

        if QUEST_STATE_EVENTS[event] and MG.Sync then MG.Sync:Quest(event) end

        if event == "BAG_UPDATE_DELAYED" or event == "PLAYER_EQUIPMENT_CHANGED" then
            if MG.Sync then MG.Sync:Inventory(event) end
        end

        if BUILD_EVENTS[event] and MG.Sync then MG.Sync:Build(event) end

        if event == "PLAYER_LEVEL_UP" then
            if MG.Sync then MG.Sync:Full(event) end
        elseif event == "ZONE_CHANGED_NEW_AREA" and MG.State then
            MG.State:Refresh(event)
        end

        if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" or
           event == "QUEST_DETAIL" or event == "QUEST_PROGRESS" or
           event == "QUEST_COMPLETE" then
            MG:HandleQuestAutomationEvent(event)
        end

        if event == "QUEST_COMPLETE" and MG.RewardAdvisor then
            MG.RewardAdvisor:Refresh()
        end

        if event == "QUEST_ACCEPTED" or event == "QUEST_TURNED_IN" or event == "QUEST_REMOVED" then
            MG.manualOffset = 0
        end

        if event == "QUEST_ACCEPTED" then
            MG.automationStatus = "Quest angenommen"
        elseif event == "QUEST_TURNED_IN" then
            MG.automationStatus = "Quest abgegeben"
            MG:Log("INFO", "quest.turnedin_confirmed",
                "Questabgabe vom Spiel bestätigt.", { questID = args[1] })
        elseif event == "NAVIGATION_DESTINATION_REACHED" then
            MG:Log("INFO", "navigation.destination_reached", "Navigationsziel erreicht.")
        end

        MG:Log("INFO", "game.event", event, { arg1 = args[1], arg2 = args[2] })

        if event ~= "GOSSIP_SHOW" and event ~= "QUEST_GREETING" and
           event ~= "QUEST_DETAIL" and event ~= "QUEST_PROGRESS" and
           event ~= "QUEST_COMPLETE" then
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

local function printGear()
    local gear = MG.GearAdvisor and MG.GearAdvisor.bestUpgrade or nil
    if not gear then
        print("|cff62d6ffMewthisch Guides|r Gear: kein belastbares Upgrade erkannt")
        return
    end
    print("|cff62d6ffMewthisch Guides|r Gear: " .. tostring(gear.link or gear.itemID) ..
        " / +" .. tostring(gear.delta or 0) .. " Itemlevel / " .. tostring(gear.confidence))
end

local function printReward()
    local reward = MG.RewardAdvisor and MG.RewardAdvisor:GetRecommendation() or nil
    if not reward then
        print("|cff62d6ffMewthisch Guides|r Belohnung: keine belastbare Mehrfachwahl-Empfehlung")
        return
    end
    print("|cff62d6ffMewthisch Guides|r Belohnung: Auswahl " .. tostring(reward.index) ..
        " / " .. tostring(reward.link or reward.evaluation and reward.evaluation.itemID or "-"))
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
        elseif command == "settings" or command == "optionen" or command == "config" then MG:ToggleSettings()
        elseif command == "navigator" or command == "arrow" or command == "pfeil" then MG:ToggleNavigator()
        elseif command == "status" then MG:PrintStatus()
        elseif command == "diag" or command == "diagnose" then
            if MG.Diagnostics then MG.Diagnostics:Print() end
        elseif command == "api" then
            local caps = MG.ForeverAPI and MG.ForeverAPI.capabilities or {}
            local quest, map = caps.quest or {}, caps.map or {}
            print("|cff62d6ffMewthisch Guides|r API: " ..
                "GetQuestsOnMap=" .. tostring(quest.getQuestsOnMap) ..
                " QuestLine=" .. tostring(caps.questLine and caps.questLine.info) ..
                " WorldPos=" .. tostring(map.worldFromMap) ..
                " Secrets=" .. tostring(caps.security and caps.security.secretsNamespace))
        elseif command == "route" then
            local status = MG.RouteEngine and MG.RouteEngine:GetStatus() or {}
            print("|cff62d6ffMewthisch Guides|r Route: Modus=" ..
                tostring(MG.GetRouteMode and MG:GetRouteMode() or "preset") ..
                " Quelle=" .. tostring(status.source or "none") ..
                " Kandidaten=" .. tostring(status.candidates or 0) ..
                " Map=" .. tostring(status.mapID or "-") ..
                " Score=" .. tostring(status.score or "-"))
        elseif command == "mode" or command == "modus" then
            local wanted = string.lower(rest or "")
            if wanted == "manual" or wanted == "manuell" then
                MG:SetRouteMode("manual")
            elseif wanted == "preset" or wanted == "vorgegeben" then
                MG:SetRouteMode("preset")
            end
            print("|cff62d6ffMewthisch Guides|r Routenmodus: " ..
                tostring(MG.GetRouteMode and MG:GetRouteMode() or "preset"))
        elseif command == "mapmarker" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.showWorldMapMarker = value
                if MG.RefreshWorldMapMarker then
                    MG:RefreshWorldMapMarker(MG.navigation and MG.navigation.target or nil)
                end
                if MG.RefreshSettings then MG:RefreshSettings() end
            end
            print("|cff62d6ffMewthisch Guides|r Weltkarten-Marker: " ..
                tostring(MG.db.settings.showWorldMapMarker))
        elseif command == "next" then MG:SelectRelativeStep(1, "slash")
        elseif command == "prev" then MG:SelectRelativeStep(-1, "slash")
        elseif command == "refresh" or command == "resync" then
            if MG.Sync then MG.Sync:Full("manual_resync") end
            MG:RefreshGuide("manual_resync")
        elseif command == "autoaccept" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.autoAcceptQuests = value
                MG:Log("INFO", "settings.auto_accept", "Auto-Annahme geändert.", { enabled = value })
                MG:RefreshSettings()
            end
            print("|cff62d6ffMewthisch Guides|r Auto-Annahme: " ..
                tostring(MG.db.settings.autoAcceptQuests))
        elseif command == "autoturnin" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.autoTurnInQuests = value
                MG:Log("INFO", "settings.auto_turnin", "Auto-Abgabe geändert.", { enabled = value })
                MG:RefreshSettings()
            end
            print("|cff62d6ffMewthisch Guides|r Auto-Abgabe: " ..
                tostring(MG.db.settings.autoTurnInQuests))
        elseif command == "gearauto" then
            local value = parseOnOff(rest)
            if value ~= nil then
                MG.db.settings.gearAutoEquip = value
                MG:Log("INFO", "settings.gear_auto_equip", "Gear-Auto-Equip geändert.", {
                    enabled = value,
                })
            end
            print("|cff62d6ffMewthisch Guides|r Gear-Auto-Equip: " ..
                tostring(MG.db.settings.gearAutoEquip))
        elseif command == "gear" then
            if MG.Sync then MG.Sync:Inventory("slash_gear") end
            printGear()
        elseif command == "reward" then
            if MG.RewardAdvisor then MG.RewardAdvisor:Refresh() end
            printReward()
        elseif command == "talent" then
            local rec = MG.TalentAdvisor and MG.TalentAdvisor:Refresh("slash") or nil
            print("|cff62d6ffMewthisch Guides|r Talent: " ..
                tostring(rec and (rec.name or rec.spellID) or "keine datenbasierte Empfehlung"))
        elseif command == "theme" then
            local wanted = string.lower(rest or "")
            local found = nil
            for name in pairs(MG.Themes and MG.Themes.definitions or {}) do
                if string.lower(name) == wanted then found = name break end
            end
            if found then MG.Themes:Set(found) end
            local _, current = MG.Themes:GetCurrent()
            print("|cff62d6ffMewthisch Guides|r Theme: " .. tostring(current))
        elseif command == "guide" then
            local guide = MG.DataLoader and MG.DataLoader:GetGuide(rest) or nil
            if guide then
                MG.db.settings.preferredGuideID = guide.id
                MG.DataLoader:SelectActiveGuide()
                MG.manualOffset = 0
                MG:RefreshGuide("guide_selected")
            end
            print("|cff62d6ffMewthisch Guides|r Guide: " ..
                tostring(MG:GetActiveGuideDefinition() and MG:GetActiveGuideDefinition().id or "-"))
        elseif command == "log" then
            local s = MG:GetLogSummary()
            print("|cff62d6ffMewthisch Guides|r Logs: " .. s.total ..
                " - Warnungen: " .. s.warnings .. " - Fehler: " .. s.errors)
        elseif command == "clearlog" then
            MG.db.logs = {}
            MG.db.logSequence = 0
            MG:Log("INFO", "log.cleared", "Diagnoselog geleert.")
            print("|cff62d6ffMewthisch Guides|r Diagnoselog geleert.")
        else
            print("|cff62d6ffMewthisch Guides|r /mg | show | hide | info | config | settings | navigator | status | diag | api | route | mode manual/preset | mapmarker on/off | next | prev | refresh | guide <id> | theme <name> | gear | gearauto on/off | reward | talent | autoaccept on/off | autoturnin on/off | log | clearlog")
        end
    end)
end

SLASH_MEWTHISCHGUIDES1 = "/mg"
SLASH_MEWTHISCHGUIDES2 = "/fg"
SlashCmdList.MEWTHISCHGUIDES = handleSlash
