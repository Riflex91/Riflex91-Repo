local addonName, MG = ...

local RouteEngine = {}
MG.RouteEngine = RouteEngine

local SOURCE_SCORE = {
    VerifiedRouteData = 100,
    RestedXPPublicRouteData = 99,
    ForeverQuestDB = 98.5,
    TravelGraph = 98,
    QuestLine = 95,
    QuestMapPOI = 92,
    QuestNextWaypointForMap = 88,
    QuestNextWaypoint = 84,
    LegacyQuestPOI = 55,
    BlizzardNavigationMap = 45,
}

local function validPoint(candidate)
    if not candidate or not tonumber(candidate.mapID) then return false end
    if tonumber(candidate.x) and tonumber(candidate.y) then return true end
    if tonumber(candidate.worldX) and tonumber(candidate.worldY) then return true end
    return false
end

local function addCandidate(candidates, candidate, reason)
    if not validPoint(candidate) then return end

    candidate.score = SOURCE_SCORE[candidate.source] or 10
    candidate.reason = reason

    if candidate.phaseMatch == false then
        candidate.score = candidate.score - 30
    end

    candidates[#candidates + 1] = candidate
end

local function explicitCoordinate(step)
    if not step or not step.definition then return nil end

    local phase = step.phase
    local value

    if phase == "accept" then value = step.definition.acceptCoordinate
    elseif phase == "turnin" then value = step.definition.turninCoordinate
    else value = step.definition.objectiveCoordinate end

    if type(value) ~= "table" then return nil end

    if tonumber(value.mapID) and tonumber(value.x) and tonumber(value.y) then
        return {
            mapID = tonumber(value.mapID),
            x = tonumber(value.x),
            y = tonumber(value.y),
            source = "VerifiedRouteData",
            verification = value.verification or step.verification,
            phaseMatch = true,
        }
    end

    return nil
end

function RouteEngine:EstimateDistanceToTarget(target, player)
    local api = MG.ForeverAPI
    player = player or (api and api:GetPlayerPosition() or nil)
    if not target or not player or not api then return nil, "missing" end

    local playerWorld = nil
    local targetWorld = nil

    if tonumber(target.worldX) and tonumber(target.worldY) and
       api.MapToRestedXPWorld then
        playerWorld = api:MapToRestedXPWorld(player.mapID, player.x, player.y)
        targetWorld = {
            continentID = playerWorld and playerWorld.continentID or nil,
            x = tonumber(target.worldX),
            y = tonumber(target.worldY),
        }
    elseif tonumber(target.mapID) and tonumber(target.x) and tonumber(target.y) then
        playerWorld = api:MapToWorld(player.mapID, player.x, player.y)
        targetWorld = api:MapToWorld(target.mapID, target.x, target.y)
    end

    if playerWorld and targetWorld and
       (not targetWorld.continentID or playerWorld.continentID == targetWorld.continentID) then
        local dx = targetWorld.x - playerWorld.x
        local dy = targetWorld.y - playerWorld.y
        return math.sqrt(dx * dx + dy * dy), "world"
    end

    if tonumber(player.mapID) == tonumber(target.mapID) and
       tonumber(player.x) and tonumber(player.y) and
       tonumber(target.x) and tonumber(target.y) then
        local dx = target.x - player.x
        local dy = target.y - player.y
        return math.sqrt(dx * dx + dy * dy), "normalized_map"
    end

    return nil, "unresolved"
end

function RouteEngine:Resolve(step, options)
    options = options or {}
    local api = MG.ForeverAPI

    if not step or not step.questID or not api then
        return nil, {}, "missing_step_or_api"
    end

    local player = api:GetPlayerPosition()
    local playerMapID = player and player.mapID or nil
    local candidates = {}

    addCandidate(candidates, explicitCoordinate(step), "route_data")

    if MG.RestEDXPImport and step.definition then
        addCandidate(
            candidates,
            MG.RestEDXPImport:GetCoordinate(
                step.definition,
                step.phase,
                MG:GetPlayerProfile(),
                step.goal and step.goal.index or nil),
            "restedxp_public_route")
    end

    if MG.ForeverQuestDB then
        addCandidate(candidates, MG.ForeverQuestDB:Resolve(step.questID, step.phase, MG:GetPlayerProfile(), player), "forever_quest_db")
    end

    if MG.TravelGraph then
        addCandidate(candidates, MG.TravelGraph:GetNextHopTarget(step), "travel_graph")
    end

    if step.phase == "accept" then
        addCandidate(
            candidates,
            api:GetQuestLineCoordinate(step.questID, playerMapID),
            "quest_line_start")
    end

    addCandidate(
        candidates,
        api:FindQuestOnMaps(step.questID, playerMapID, step.phase),
        "modern_quest_map_poi")

    addCandidate(
        candidates,
        api:GetNextQuestWaypoint(step.questID, playerMapID),
        "quest_waypoint")

    addCandidate(
        candidates,
        api:GetLegacyQuestPOI(step.questID, playerMapID),
        "legacy_compatibility")

    addCandidate(
        candidates,
        api:GetNavigationCoordinate(playerMapID),
        "blizzard_navigation")

    table.sort(candidates, function(a, b)
        if a.score == b.score then
            return tostring(a.source) < tostring(b.source)
        end
        return a.score > b.score
    end)

    local selected = candidates[1]

    if MG.db and not options.preview then
        MG.db.runtime = MG.db.runtime or {}

        local candidateSummary = {}
        for index, candidate in ipairs(candidates) do
            if index > 12 then break end

            candidateSummary[#candidateSummary + 1] = {
                source = candidate.source,
                score = candidate.score,
                reason = candidate.reason,
                mapID = candidate.mapID,
                x = candidate.x,
                y = candidate.y,
                worldX = candidate.worldX,
                worldY = candidate.worldY,
                floor = candidate.floor,
                phaseMatch = candidate.phaseMatch,
                isQuestStart = candidate.isQuestStart,
                inProgress = candidate.inProgress,
                rxpRoutePointCount = candidate.rxpRoutePointCount,
                rxpRoutePointIndex = candidate.rxpRoutePointIndex,
            }
        end

        MG.db.runtime.route = {
            questID = step.questID,
            phase = step.phase,
            selectedSource = selected and selected.source or nil,
            selectedMapID = selected and selected.mapID or nil,
            selectedX = selected and selected.x or nil,
            selectedY = selected and selected.y or nil,
            selectedScore = selected and selected.score or nil,
            candidateCount = #candidates,
            candidates = candidateSummary,
            playerMapID = playerMapID,
        }
    end

    if selected then
        if not options.preview then
            MG:Log("INFO", "route.destination", "RouteEngine hat ein Ziel gewählt.", {
            questID = step.questID,
            phase = step.phase,
            source = selected.source,
            mapID = selected.mapID,
            x = selected.x,
            y = selected.y,
            worldX = selected.worldX,
            worldY = selected.worldY,
            floor = selected.floor,
            score = selected.score,
            candidates = #candidates,
            candidateSummary = MG.db and MG.db.runtime and MG.db.runtime.route and
                MG.db.runtime.route.candidates or nil,
            })
        end

        if MG.ForeverQuestDB and selected.source ~= "ForeverQuestDB" and selected.source ~= "BlizzardNavigationMap" then
            MG.ForeverQuestDB:Learn(step.questID, step.phase, selected)
        end
        return selected, candidates, "resolved"
    end

    if not options.preview then
        MG:Log("WARN", "route.no_destination",
            "RouteEngine konnte keine belastbare Zielkoordinate bestimmen.", {
                questID = step.questID,
                phase = step.phase,
                playerMapID = playerMapID,
            })
    end

    return nil, candidates, "no_coordinate"
end

function RouteEngine:GetStatus()
    local route = MG.db and MG.db.runtime and MG.db.runtime.route or nil

    if not route then
        return {
            source = "none",
            candidates = 0,
        }
    end

    return {
        source = route.selectedSource or "none",
        candidates = route.candidateCount or 0,
        mapID = route.selectedMapID,
        score = route.selectedScore,
    }
end

return RouteEngine
