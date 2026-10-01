local addonName, MGR = ...

local frame = CreateFrame("Frame")
local objectiveHashes = {}
local questUpdatePending = false
local routeTicker
local heartbeatTicker
local heartbeatGeneration = 0
local lastRoutePosition
local lastRouteState

local function register(event)
    pcall(frame.RegisterEvent, frame, event)
end

for _, event in ipairs({
    "PLAYER_LOGIN",
    "PLAYER_LOGOUT",
    "PLAYER_LEVEL_UP",
    "QUEST_ACCEPTED",
    "QUEST_REMOVED",
    "QUEST_TURNED_IN",
    "QUEST_LOG_UPDATE",
    "QUEST_WATCH_UPDATE",
    "UNIT_QUEST_LOG_CHANGED",
    "GOSSIP_SHOW",
    "QUEST_GREETING",
    "PLAYER_DEAD",
    "PLAYER_ALIVE",
    "PLAYER_UNGHOST",
    "ZONE_CHANGED",
    "ZONE_CHANGED_INDOORS",
    "ZONE_CHANGED_NEW_AREA",
}) do
    register(event)
end

local function objectiveSnapshot(questID)
    if not C_QuestLog or not C_QuestLog.GetQuestObjectives then return nil end

    local ok, objectives = pcall(C_QuestLog.GetQuestObjectives, questID)
    if not ok or not objectives then return nil end

    local result, hashParts = {}, {}

    for i, objective in ipairs(objectives) do
        local row = {
            index = i,
            text = objective.text,
            type = objective.type,
            finished = objective.finished,
            numFulfilled = objective.numFulfilled,
            numRequired = objective.numRequired,
            optional = objective.optional or objective.isOptional,
        }

        result[#result + 1] = row
        hashParts[#hashParts + 1] = table.concat({
            tostring(row.index),
            tostring(row.text),
            tostring(row.type),
            tostring(row.finished),
            tostring(row.numFulfilled),
            tostring(row.numRequired),
            tostring(row.optional),
        }, ":")
    end

    return result, table.concat(hashParts, "|")
end

local function scanQuestLog(reason)
    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then return end

    local count = C_QuestLog.GetNumQuestLogEntries()
    local seen = {}

    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)

        if info and not info.isHeader and info.questID then
            seen[info.questID] = true

            local objectives, hash = objectiveSnapshot(info.questID)

            local completed = false
            if C_QuestLog.ReadyForTurnIn then
                local ok, value = pcall(C_QuestLog.ReadyForTurnIn, info.questID)
                if ok then completed = value and true or false end
            elseif C_QuestLog.IsComplete then
                local ok, value = pcall(C_QuestLog.IsComplete, info.questID)
                if ok then completed = value and true or false end
            elseif info.isComplete ~= nil then
                completed = info.isComplete and true or false
            end

            local combined = table.concat({
                tostring(completed),
                tostring(info.title),
                tostring(info.level),
                tostring(hash),
            }, "|")

            if objectiveHashes[info.questID] ~= combined then
                objectiveHashes[info.questID] = combined

                MGR:Record("quest.snapshot", info.questID, {
                    reason = reason,
                    title = info.title,
                    level = info.level,
                    suggestedGroup = info.suggestedGroup,
                    frequency = info.frequency,
                    isComplete = completed,
                    objectives = objectives,
                    position = MGR:GetPosition(),
                })
            end
        end
    end

    for questID in pairs(objectiveHashes) do
        if not seen[questID] then
            objectiveHashes[questID] = nil
        end
    end
end

local function recordGossip(event)
    if not C_GossipInfo then return end

    local available, active = {}, {}

    if C_GossipInfo.GetAvailableQuests then
        local ok, quests = pcall(C_GossipInfo.GetAvailableQuests)
        if ok then
            for _, q in ipairs(quests or {}) do
                available[#available + 1] = {
                    questID = q.questID,
                    title = q.title,
                    level = q.level,
                    isTrivial = q.isTrivial,
                    frequency = q.frequency,
                }
            end
        end
    end

    if C_GossipInfo.GetActiveQuests then
        local ok, quests = pcall(C_GossipInfo.GetActiveQuests)
        if ok then
            for _, q in ipairs(quests or {}) do
                active[#active + 1] = {
                    questID = q.questID,
                    title = q.title,
                    level = q.level,
                    isComplete = q.isComplete,
                }
            end
        end
    end

    MGR:Record("npc.gossip", nil, {
        event = event,
        npc = MGR:GetNpc(),
        position = MGR:GetPosition(),
        availableQuests = available,
        activeQuests = active,
    })
end

local function activeQuestIDs()
    local ids = {}

    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then
        return ids
    end

    local count = C_QuestLog.GetNumQuestLogEntries()

    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)
        if info and not info.isHeader and info.questID then
            ids[#ids + 1] = info.questID
        end
    end

    table.sort(ids)
    return ids
end

local function routeState(position)
    return {
        mapID = position and position.mapID or nil,
        x = position and position.x or nil,
        y = position and position.y or nil,
        facing = GetPlayerFacing and GetPlayerFacing() or nil,
        speed = GetUnitSpeed and GetUnitSpeed("player") or nil,
        dead = UnitIsDeadOrGhost and UnitIsDeadOrGhost("player") and true or false,
        inCombat = UnitAffectingCombat and UnitAffectingCombat("player") and true or false,
        mounted = IsMounted and IsMounted() and true or false,
        swimming = IsSwimming and IsSwimming() and true or false,
        flying = IsFlying and IsFlying() and true or false,
        indoors = IsIndoors and IsIndoors() and true or false,
    }
end

local function changedState(state)
    if not lastRouteState then return true end

    return state.dead ~= lastRouteState.dead or
        state.inCombat ~= lastRouteState.inCombat or
        state.mounted ~= lastRouteState.mounted or
        state.swimming ~= lastRouteState.swimming or
        state.flying ~= lastRouteState.flying or
        state.indoors ~= lastRouteState.indoors
end

local function facingChanged(state)
    if not lastRouteState or state.facing == nil or lastRouteState.facing == nil then return false end

    local delta = math.abs(state.facing - lastRouteState.facing)
    if delta > math.pi then delta = (math.pi * 2) - delta end
    return delta >= 0.35
end

local function sampleRoute(reason)
    local p = MGR:GetPosition()
    if not p or not p.mapID or not p.x or not p.y then return end

    local state = routeState(p)
    local shouldRecord = not lastRoutePosition or lastRoutePosition.mapID ~= p.mapID

    if not shouldRecord then
        local dx = p.x - lastRoutePosition.x
        local dy = p.y - lastRoutePosition.y
        shouldRecord = (dx * dx + dy * dy) >= 0.000004
    end

    shouldRecord = shouldRecord or changedState(state) or facingChanged(state)

    if shouldRecord then
        MGR:Record("route.sample", nil, {
            reason = reason or "ticker",
            position = p,
            facing = state.facing,
            speed = state.speed,
            dead = state.dead,
            inCombat = state.inCombat,
            mounted = state.mounted,
            swimming = state.swimming,
            flying = state.flying,
            indoors = state.indoors,
            activeQuestIDs = activeQuestIDs(),
        }, "gameplay-sample")

        lastRoutePosition = { mapID = p.mapID, x = p.x, y = p.y }
        lastRouteState = state
    end
end

local function stopHeartbeat()
    heartbeatGeneration = heartbeatGeneration + 1

    if heartbeatTicker and heartbeatTicker.Cancel then
        heartbeatTicker:Cancel()
    end

    heartbeatTicker = nil
end

local function startHeartbeat()
    stopHeartbeat()
    local generation = heartbeatGeneration

    MGR:Heartbeat("login")

    if C_Timer and C_Timer.NewTicker then
        heartbeatTicker = C_Timer.NewTicker(30, function()
            MGR:Heartbeat("timer")
        end)
        return
    end

    local function tick()
        if generation ~= heartbeatGeneration then return end

        MGR:Heartbeat("timer_fallback")

        if C_Timer and C_Timer.After then
            C_Timer.After(30, tick)
        end
    end

    if C_Timer and C_Timer.After then
        C_Timer.After(30, tick)
    end
end

local function startRouteSampler()
    if routeTicker and routeTicker.Cancel then routeTicker:Cancel() end
    routeTicker = nil

    sampleRoute("login")

    if C_Timer and C_Timer.NewTicker then
        routeTicker = C_Timer.NewTicker(2, function()
            sampleRoute("ticker")
        end)
        return
    end

    if C_Timer and C_Timer.After then
        local generation = time()
        MGR.routeGeneration = generation

        local function tick()
            if MGR.routeGeneration ~= generation then return end
            sampleRoute("ticker_fallback")
            C_Timer.After(2, tick)
        end

        C_Timer.After(2, tick)
    end
end

frame:SetScript("OnEvent", function(_, event, ...)
    if event == "PLAYER_LOGIN" then
        MGR:StartSession()

        MGR:Record("player.login", nil, {
            position = MGR:GetPosition(),
            autoRecording = true,
        })

        print("|cff67d8efMewthisch Guides Recorder|r |cff33ff99AUTO RECORDING|r v" ..
            MGR.ADDON_VERSION .. " - keine Commands noetig")

        if C_Timer and C_Timer.After then
            C_Timer.After(1, function() scanQuestLog("login") end)
        else
            scanQuestLog("login")
        end

        startRouteSampler()
        startHeartbeat()
        return
    end

    if event == "PLAYER_LOGOUT" then
        MGR:Heartbeat("logout")
        sampleRoute("logout")

        MGR:Record("player.logout", nil, {
            position = MGR:GetPosition(),
            sessionId = MGR.session and MGR.session.id or nil,
        })

        MGR:EndSession("PLAYER_LOGOUT")
        stopHeartbeat()

        MGR.routeGeneration = nil
        if routeTicker and routeTicker.Cancel then routeTicker:Cancel() end
        routeTicker = nil
        return
    end

    if event == "PLAYER_LEVEL_UP" then
        local newLevel = ...

        MGR:Record("player.level_up", newLevel, {
            level = newLevel,
            position = MGR:GetPosition(),
        })

        scanQuestLog(event)
        return
    end

    if event == "QUEST_ACCEPTED" then
        local questLogIndex, questID = ...

        MGR:Record("quest.accepted", questID, {
            questLogIndex = questLogIndex,
            npc = MGR:GetNpc(),
            position = MGR:GetPosition(),
        })

        scanQuestLog(event)
        return
    end

    if event == "QUEST_REMOVED" then
        local questID, wasReplayQuest = ...

        MGR:Record("quest.removed", questID, {
            wasReplayQuest = wasReplayQuest,
            position = MGR:GetPosition(),
        })

        objectiveHashes[questID] = nil
        scanQuestLog(event)
        return
    end

    if event == "QUEST_TURNED_IN" then
        local questID, xpReward, moneyReward = ...

        MGR:Record("quest.turned_in", questID, {
            xpReward = xpReward,
            moneyReward = moneyReward,
            npc = MGR:GetNpc(),
            position = MGR:GetPosition(),
        })

        objectiveHashes[questID] = nil
        scanQuestLog(event)
        return
    end

    if event == "QUEST_LOG_UPDATE" or
       event == "QUEST_WATCH_UPDATE" or
       event == "UNIT_QUEST_LOG_CHANGED" then

        if event == "UNIT_QUEST_LOG_CHANGED" then
            local unit = ...
            if unit and unit ~= "player" then return end
        end

        if not questUpdatePending then
            questUpdatePending = true

            local function refresh()
                questUpdatePending = false
                scanQuestLog(event)
            end

            if C_Timer and C_Timer.After then
                C_Timer.After(0.2, refresh)
            else
                refresh()
            end
        end

        return
    end

    if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" then
        recordGossip(event)
        return
    end

    if event == "PLAYER_DEAD" then
        MGR:Record("player.death", nil, {
            position = MGR:GetPosition(),
            activeQuestIDs = activeQuestIDs(),
            level = UnitLevel("player"),
        }, "gameplay-event")

        sampleRoute(event)
        return
    end

    if event == "PLAYER_ALIVE" or event == "PLAYER_UNGHOST" then
        MGR:Record("player.recovered", event, {
            position = MGR:GetPosition(),
            level = UnitLevel("player"),
        }, "gameplay-event")

        sampleRoute(event)
        return
    end

    if event == "ZONE_CHANGED" or
       event == "ZONE_CHANGED_INDOORS" or
       event == "ZONE_CHANGED_NEW_AREA" then

        lastRoutePosition = nil
        lastRouteState = nil

        MGR:Record("player.zone", event, {
            event = event,
            position = MGR:GetPosition(),
            zoneText = GetZoneText and GetZoneText() or nil,
            subZoneText = GetSubZoneText and GetSubZoneText() or nil,
        })

        sampleRoute(event)
    end
end)
