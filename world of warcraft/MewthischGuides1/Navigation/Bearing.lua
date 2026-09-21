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
    -- WoW facing convention used by the minimap arrow:
    -- 0 = north, positive rotation turns towards west.
    return normalizeAbsolute(atan2(-deltaEast, deltaNorth))
end

function B:Resolve(position, waypoint, playerFacing)
    if not position or not waypoint then return nil, "missing_position" end
    if not position.x or not position.y or not waypoint.x or not waypoint.y then
        return nil, "map_coordinates_missing"
    end

    if waypoint.mapID and position.mapID and
       tonumber(waypoint.mapID) ~= tonumber(position.mapID) then
        return nil, "different_map"
    end

    if not waypoint.mapID and waypoint.mapName and position.mapName and
       not sameName(waypoint.mapName, position.mapName) then
        return nil, "different_map_name"
    end

    local deltaEast = tonumber(waypoint.x) - tonumber(position.x)
    -- UI-map Y grows downwards, so north is the inverse Y delta.
    local deltaNorth = tonumber(position.y) - tonumber(waypoint.y)
    local absolute = self:AbsoluteFromMapDelta(deltaEast, deltaNorth)
    if absolute == nil then return nil, "bearing_unavailable" end

    playerFacing = tonumber(playerFacing)
    if playerFacing == nil then
        return {
            absolute = absolute,
            relative = nil,
            reliable = false,
            reason = "player_facing_unavailable",
        }
    end

    return {
        absolute = absolute,
        relative = normalizeRelative(absolute - playerFacing),
        reliable = true,
        reason = "map_delta_and_player_facing",
    }
end
