local addonName, MG = ...

local RouteEngine = {}
MG.RouteEngine = RouteEngine

local SOURCE_SCORE = {
    VerifiedRouteData = 100,
    QuestLine = 95,
    QuestMapPOI = 92,
    QuestNextWaypointForMap = 88,
    QuestNextWaypoint = 84,
    LegacyQuestPOI = 55,
    BlizzardNavigationMap = 45,
}

local function validPoint(candidate)
    return candidate and tonumber(candidate.mapID) and
        tonumber(candidate.x) and tonumber(candidate.y)
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

function RouteEngine:Resolve(step)
    local api = MG.ForeverAPI

    if not step or not step.questID or not api then
        return nil, {}, "missing_step_or_api"
    end

    local player = api:GetPlayerPosition()
    local playerMapID = player and player.mapID or nil
    local candidates = {}

    addCandidate(candidates, explicitCoordinate(step), "route_data")

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

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.route = {
            questID = step.questID,
            phase = step.phase,
            selectedSource = selected and selected.source or nil,
            selectedMapID = selected and selected.mapID or nil,
            selectedX = selected and selected.x or nil,
            selectedY = selected and selected.y or nil,
            selectedScore = selected and selected.score or nil,
            candidateCount = #candidates,
            playerMapID = playerMapID,
        }
    end

    if selected then
        MG:Log("INFO", "route.destination", "RouteEngine hat ein Ziel gewaehlt.", {
            questID = step.questID,
            phase = step.phase,
            source = selected.source,
            mapID = selected.mapID,
            x = selected.x,
            y = selected.y,
            score = selected.score,
            candidates = #candidates,
        })

        return selected, candidates, "resolved"
    end

    MG:Log("WARN", "route.no_destination",
        "RouteEngine konnte keine belastbare Zielkoordinate bestimmen.", {
            questID = step.questID,
            phase = step.phase,
            playerMapID = playerMapID,
        })

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
