local addonName, MG = ...

MG.navigation = MG.navigation or {}
MG.lastNavigationSignature = nil

local YARDS_TO_METERS = 0.9144
local TWO_PI = math.pi * 2

local function normalizeRelative(angle)
    while angle > math.pi do angle = angle - TWO_PI end
    while angle < -math.pi do angle = angle + TWO_PI end
    return angle
end

local function atan2(y, x)
    if math.atan2 then return math.atan2(y, x) end
    if x > 0 then return math.atan(y / x) end
    if x < 0 and y >= 0 then return math.atan(y / x) + math.pi end
    if x < 0 and y < 0 then return math.atan(y / x) - math.pi end
    if x == 0 and y > 0 then return math.pi / 2 end
    if x == 0 and y < 0 then return -math.pi / 2 end
    return 0
end

local function normalizeAbsolute(angle)
    while angle >= TWO_PI do angle = angle - TWO_PI end
    while angle < 0 do angle = angle + TWO_PI end
    return angle
end

function MG:ComputeAbsoluteBearing(deltaEast, deltaNorth)
    if deltaEast == nil or deltaNorth == nil then return nil end

    -- Match WoW's GetPlayerFacing()/Texture:SetRotation convention:
    -- 0 = north, positive radians rotate counter-clockwise (towards west).
    return normalizeAbsolute(atan2(-deltaEast, deltaNorth))
end

function MG:ComputeWorldAbsoluteBearing(deltaWorldX, deltaWorldY)
    if deltaWorldX == nil or deltaWorldY == nil then return nil end

    -- Blizzard world coordinates are rotated 90 degrees against UI-map axes:
    -- world X is north/south, world Y is east/west with east being negative.
    -- Feeding them to the map-axis bearing function as ordinary X/Y produces
    -- the ~90 degree arrow error seen in the Forever client.
    return normalizeAbsolute(atan2(deltaWorldY, deltaWorldX))
end

function MG:ComputeRelativeBearing(deltaEast, deltaNorth, playerFacing)
    local targetAngle = self:ComputeAbsoluteBearing(deltaEast, deltaNorth)
    if targetAngle == nil or playerFacing == nil then
        return nil, targetAngle
    end

    return normalizeRelative(targetAngle - playerFacing), targetAngle
end

local function bearingFromPoints(player, target)
    if not player or not target or not MG.ForeverAPI then
        return nil, nil, nil
    end

    if not tonumber(player.mapID) or not tonumber(target.mapID) or
       not tonumber(player.x) or not tonumber(player.y) then
        return nil, nil, nil
    end

    local playerWorld = MG.ForeverAPI:MapToWorld(
        player.mapID,
        player.x,
        player.y)

    if tonumber(target.worldX) and tonumber(target.worldY) and
       MG.ForeverAPI.MapToRestedXPWorld then
        local rxpPlayerWorld = MG.ForeverAPI:MapToRestedXPWorld(
            player.mapID, player.x, player.y)

        if rxpPlayerWorld then
            -- Convert RestedXP world deltas back to Blizzard axis order for
            -- ComputeWorldAbsoluteBearing: Blizzard X=north/south,
            -- Blizzard Y=east/west.
            local deltaNorthSouth = tonumber(target.worldY) - rxpPlayerWorld.y
            local deltaEastWest = tonumber(target.worldX) - rxpPlayerWorld.x
            local angle = MG:ComputeWorldAbsoluteBearing(
                deltaNorthSouth, deltaEastWest)
            local distance = math.sqrt(
                deltaNorthSouth * deltaNorthSouth +
                deltaEastWest * deltaEastWest)

            return angle, distance, "RestedXPWorldCoordinates"
        end
    end

    if not tonumber(target.x) or not tonumber(target.y) then
        return nil, nil, nil
    end

    local targetWorld = MG.ForeverAPI:MapToWorld(
        target.mapID,
        target.x,
        target.y)

    if playerWorld and targetWorld and
       playerWorld.continentID == targetWorld.continentID then

        local deltaX = targetWorld.x - playerWorld.x
        local deltaY = targetWorld.y - playerWorld.y
        local angle = MG:ComputeWorldAbsoluteBearing(deltaX, deltaY)
        local distance = math.sqrt(deltaX * deltaX + deltaY * deltaY)

        return angle, distance, "WorldCoordinates"
    end

    if player.mapID == target.mapID then
        -- UI-map X grows east/right and Y grows south/down.
        local deltaEast = target.x - player.x
        local deltaNorth = player.y - target.y
        local angle = MG:ComputeAbsoluteBearing(deltaEast, deltaNorth)
        local normalizedDistance = math.sqrt(
            deltaEast * deltaEast + deltaNorth * deltaNorth)

        return angle, nil, "NormalizedMap", normalizedDistance
    end

    return nil, nil, nil
end

function MG:ResolveWaypoint(questID)
    if not self.currentStep or
       tonumber(self.currentStep.questID) ~= tonumber(questID) or
       not self.RouteEngine then
        return nil
    end

    local target = self.RouteEngine:Resolve(self.currentStep)
    return target
end


local function updateETA(nav, distanceYards)
    if not nav then return end
    if not distanceYards or distanceYards < 0 then
        nav.etaSeconds = nil
        nav.etaSpeedYards = nil
        return
    end

    nav.etaState = nav.etaState or {
        samples = {},
        lastDistance = nil,
        lastTime = nil,
        smoothedETA = nil,
    }
    local state = nav.etaState
    local now = GetTime and GetTime() or 0

    if distanceYards <= 2 then
        state.smoothedETA = 0
        nav.etaSeconds = 0
        nav.etaSpeedYards = nil
        state.lastDistance = distanceYards
        state.lastTime = now
        return
    end

    local measuredSpeed = nil
    if state.lastDistance and state.lastTime and now > state.lastTime then
        local dt = now - state.lastTime
        if dt >= 0.25 then
            local approach = (state.lastDistance - distanceYards) / dt
            state.lastDistance = distanceYards
            state.lastTime = now

            if approach > 0.15 and approach < 200 then
                state.samples[#state.samples + 1] = approach
                while #state.samples > 8 do table.remove(state.samples, 1) end
            elseif approach <= 0 then
                -- Moving away or standing still should not preserve an
                -- increasingly misleading arrival estimate indefinitely.
                if #state.samples > 0 then table.remove(state.samples, 1) end
            end
        end
    else
        state.lastDistance = distanceYards
        state.lastTime = now
    end

    if #state.samples > 0 then
        local sum = 0
        for _, speed in ipairs(state.samples) do sum = sum + speed end
        measuredSpeed = sum / #state.samples
    end

    local fallbackSpeed = GetUnitSpeed and tonumber(GetUnitSpeed("player")) or nil
    local speed = measuredSpeed
    if not speed and fallbackSpeed and fallbackSpeed > 0.15 then
        speed = fallbackSpeed
    end

    if not speed or speed <= 0 then
        nav.etaSeconds = nil
        nav.etaSpeedYards = nil
        return
    end

    local rawETA = distanceYards / speed
    if rawETA < 0 or rawETA > 86400 then
        nav.etaSeconds = nil
        nav.etaSpeedYards = nil
        return
    end

    if state.smoothedETA == nil or math.abs(state.smoothedETA - rawETA) > 120 then
        state.smoothedETA = rawETA
    else
        state.smoothedETA = state.smoothedETA * 0.70 + rawETA * 0.30
    end

    nav.etaSeconds = state.smoothedETA
    nav.etaSpeedYards = speed
end

function MG:UpdateNavigationRealtime()
    local nav = self.navigation

    if not nav or not nav.questID or not self.ForeverAPI then
        return
    end

    local player = self.ForeverAPI:GetPlayerPosition()
    nav.player = player

    local distanceYards, distanceSource =
        self.ForeverAPI:GetQuestDistanceYards(nav.questID)

    local targetAngle, coordinateDistance, directionSource, normalizedDistance =
        bearingFromPoints(player, nav.target)

    -- Coordinate-derived distance is preferred because it belongs to the same
    -- destination that drives the arrow, while C_Navigation may refer to a
    -- different Blizzard navigation target.
    if coordinateDistance then
        distanceYards = coordinateDistance
        distanceSource = "RouteWorldCoordinates"
    end

    local facing = GetPlayerFacing and GetPlayerFacing() or nil
    local relativeAngle = nil

    if targetAngle ~= nil and facing ~= nil then
        relativeAngle = normalizeRelative(targetAngle - facing)
    end

    nav.relativeAngle = relativeAngle
    nav.targetAngle = targetAngle
    nav.playerFacing = facing
    nav.directionSource = directionSource
    nav.directionReliable =
        relativeAngle ~= nil and
        directionSource ~= nil and
        nav.target ~= nil

    nav.distanceYards = distanceYards
    nav.distanceMeters =
        distanceYards and (distanceYards * YARDS_TO_METERS) or nil
    nav.distanceSource = distanceSource
    nav.normalizedDistance = normalizedDistance

    updateETA(nav, distanceYards)

    if player and nav.target then
        nav.sameMap = tonumber(player.mapID) == tonumber(nav.target.mapID)
    else
        nav.sameMap = false
    end
end

function MG:RefreshNavigation(reason)
    local step = self.currentStep

    if not step then
        self.navigation = {
            available = false,
            directionReliable = false,
            reason = "no_step",
        }
        if self.RefreshWorldMapMarker then self:RefreshWorldMapMarker(nil) end
        return
    end

    local target, candidates, routeReason
    local runtime = self.runtimeState
    local destinationState = runtime and runtime.destinationGoal or nil
    local destinationGoal = destinationState and destinationState.sourceGoal or nil
    local routeStep = step

    if destinationGoal and destinationGoal ~= step.goal then
        routeStep = {}
        for key, value in pairs(step) do routeStep[key] = value end
        routeStep.goal = destinationGoal
        routeStep.navigationGoal = destinationGoal
    end

    if self.RouteEngine then
        target, candidates, routeReason = self.RouteEngine:Resolve(routeStep)
    end

    local nav = {
        available = target ~= nil,
        questID = step.questID,
        target = target,
        source = target and target.source or "NoCoordinate",
        routeScore = target and target.score or nil,
        candidateCount = candidates and #candidates or 0,
        destinationGoalID = destinationState and destinationState.id or nil,
        waypointText =
            (runtime and runtime.viewer and runtime.viewer.primary and runtime.viewer.primary.text) or
            (destinationGoal and destinationGoal.instruction) or
            (step.goal and step.goal.instruction) or
            step.detail or
            step.title,
        reason = routeReason or (target and "resolved" or "no_coordinate"),
        superTrack = true,
    }

    self.navigation = nav
    self:UpdateNavigationRealtime()
    if self.TravelPlanner then
        nav.travelPlan = self.TravelPlanner:Plan(target, step)
        nav.travelHint = self.TravelPlanner:GetPrimaryHint()
    end
    if self.RuntimeEngine then self.RuntimeEngine:UpdateNavigation(target, nav.travelPlan, nil) end
    if self.RefreshWorldMapMarker then self:RefreshWorldMapMarker(target) end

    local signature = table.concat({
        tostring(nav.questID or ""),
        tostring(step.phase or ""),
        tostring(nav.source or ""),
        tostring(target and target.mapID or ""),
        tostring(target and target.x or ""),
        tostring(target and target.y or ""),
        tostring(target and target.worldX or ""),
        tostring(target and target.worldY or ""),
        tostring(nav.directionSource or ""),
    }, "|")

    if self.lastNavigationSignature ~= signature then
        self.lastNavigationSignature = signature

        if target and nav.directionReliable then
            self:Log("INFO", "navigation.direction_ready",
                "Belastbare RouteEngine-Zielrichtung berechnet.", {
                    questID = step.questID,
                    phase = step.phase,
                    source = nav.source,
                    mapID = target.mapID,
                    x = target.x,
                    y = target.y,
                    worldX = target.worldX,
                    worldY = target.worldY,
                    routeScore = nav.routeScore,
                    candidates = nav.candidateCount,
                    directionSource = nav.directionSource,
                    targetAngle = nav.targetAngle,
                    playerFacing = nav.playerFacing,
                    relativeAngle = nav.relativeAngle,
                    distanceMeters = nav.distanceMeters,
                    distanceSource = nav.distanceSource,
                    rxpRoutePointCount = target.rxpRoutePointCount,
                    rxpRoutePointIndex = target.rxpRoutePointIndex,
                    reason = reason,
                })
        elseif target then
            self:Log("WARN", "navigation.direction_unavailable",
                "Route-Ziel vorhanden, aber noch keine belastbare Pfeilrichtung.", {
                    questID = step.questID,
                    phase = step.phase,
                    source = nav.source,
                    mapID = target.mapID,
                    x = target.x,
                    y = target.y,
                    worldX = target.worldX,
                    worldY = target.worldY,
                    routeScore = nav.routeScore,
                    directionSource = nav.directionSource,
                    reason = reason,
                })
        else
            self:Log("WARN", "navigation.no_coordinate",
                "Keine belastbare Route-Zielkoordinate gefunden.", {
                    questID = step.questID,
                    phase = step.phase,
                    candidates = nav.candidateCount,
                    reason = reason,
                })
        end
    end
end

function MG:GetDirectionLabel(angle)
    if angle == nil then return "Richtung nicht verfügbar" end

    local degrees = angle * 180 / math.pi
    if degrees < 0 then degrees = degrees + 360 end

    if degrees >= 337.5 or degrees < 22.5 then return "geradeaus" end
    if degrees < 67.5 then return "vorne links" end
    if degrees < 112.5 then return "links" end
    if degrees < 157.5 then return "hinten links" end
    if degrees < 202.5 then return "hinten" end
    if degrees < 247.5 then return "hinten rechts" end
    if degrees < 292.5 then return "rechts" end
    return "vorne rechts"
end
