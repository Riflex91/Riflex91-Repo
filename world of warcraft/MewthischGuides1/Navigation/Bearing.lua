local addonName, MG = ...

MG.NavigationBearing = MG.NavigationBearing or {}
local B = MG.NavigationBearing
local TWO_PI = math.pi * 2

local function normalizeAbsolute(angle)
    while angle >= TWO_PI do angle = angle - TWO_PI end
    while angle < 0 do angle = angle + TWO_PI end
    return angle
end

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

local function sameName(a, b)
    if not a or not b then return false end
    return string.lower(tostring(a)) == string.lower(tostring(b))
end

function B:AbsoluteFromMapDelta(deltaEast, deltaNorth)
    if deltaEast == nil or deltaNorth == nil then return nil end
    return normalizeAbsolute(atan2(-deltaEast, deltaNorth))
end

function B:AbsoluteFromRestedXPWorldDelta(deltaX, deltaY)
    if deltaX == nil or deltaY == nil then return nil end
    return normalizeAbsolute(atan2(deltaY, deltaX))
end

local function withFacing(absolute, playerFacing, reason, extra)
    if absolute == nil then return nil end
    local result = extra or {}
    result.absolute = absolute
    result.reason = reason

    playerFacing = tonumber(playerFacing)
    if playerFacing == nil then
        result.relative = nil
        result.reliable = false
        result.reason = "player_facing_unavailable"
        return result
    end

    result.relative = normalizeRelative(absolute - playerFacing)
    result.reliable = true
    return result
end

function B:Resolve(position, waypoint, playerFacing)
    if not position or not waypoint then return nil, "missing_position" end
    if position.x == nil or position.y == nil or not tonumber(position.mapID) then
        return nil, "player_map_coordinates_missing"
    end

    if tonumber(waypoint.worldX) and tonumber(waypoint.worldY) and
       MG.CoordinateConverter then
        local playerWorld, reason = MG.CoordinateConverter:MapToRestedXPWorld(
            position.mapID, position.x, position.y)
        if not playerWorld then return nil, reason or "player_world_coordinates_unavailable" end

        local dx = tonumber(waypoint.worldX) - playerWorld.x
        local dy = tonumber(waypoint.worldY) - playerWorld.y
        return withFacing(
            self:AbsoluteFromRestedXPWorldDelta(dx, dy),
            playerFacing,
            "restedxp_world_coordinates",
            {
                playerWorld=playerWorld,
                targetWorld={x=tonumber(waypoint.worldX),y=tonumber(waypoint.worldY)},
                deltaWorldX=dx,deltaWorldY=dy,
            })
    end

    if waypoint.mapID and position.mapID and
       tonumber(waypoint.mapID) ~= tonumber(position.mapID) then
        return nil, "different_map"
    end
    if not waypoint.mapID and waypoint.mapName and position.mapName and
       not sameName(waypoint.mapName, position.mapName) then
        return nil, "different_map_name"
    end
    if waypoint.x == nil or waypoint.y == nil then
        return nil, "waypoint_map_coordinates_missing"
    end

    local effectiveMapID=tonumber(waypoint.mapID) or tonumber(position.mapID)
    if effectiveMapID and MG.CoordinateConverter then
        local playerWorld=MG.CoordinateConverter:MapToBlizzardWorld(
            effectiveMapID,position.x,position.y)
        local targetWorld=MG.CoordinateConverter:MapToBlizzardWorld(
            effectiveMapID,waypoint.x,waypoint.y)
        if playerWorld and targetWorld and
           playerWorld.continentID==targetWorld.continentID then
            local dx=targetWorld.x-playerWorld.x
            local dy=targetWorld.y-playerWorld.y
            return withFacing(
                self:AbsoluteFromRestedXPWorldDelta(dx,dy),
                playerFacing,
                "world_coordinates",
                {playerWorld=playerWorld,targetWorld=targetWorld,
                 deltaWorldX=dx,deltaWorldY=dy})
        end
    end

    local deltaEast = tonumber(waypoint.x) - tonumber(position.x)
    local deltaNorth = tonumber(position.y) - tonumber(waypoint.y)
    return withFacing(
        self:AbsoluteFromMapDelta(deltaEast, deltaNorth),
        playerFacing,
        "normalized_map_fallback",
        {deltaEast=deltaEast,deltaNorth=deltaNorth})
end
