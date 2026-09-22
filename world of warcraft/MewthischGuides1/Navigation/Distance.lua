local addonName, MG = ...

MG.NavigationDistance = MG.NavigationDistance or {}
local D = MG.NavigationDistance

local function sameName(a, b)
    if not a or not b then return false end
    return string.lower(tostring(a)) == string.lower(tostring(b))
end

local function vectorXY(value)
    if not value then return nil, nil end
    if tonumber(value.x) and tonumber(value.y) then
        return tonumber(value.x), tonumber(value.y)
    end
    if value.GetXY then
        local ok, x, y = pcall(value.GetXY, value)
        if ok and tonumber(x) and tonumber(y) then
            return tonumber(x), tonumber(y)
        end
    end
    return nil, nil
end

local function mapToBlizzardWorld(mapID, x, y)
    if not tonumber(mapID) or x == nil or y == nil or
       not C_Map or not C_Map.GetWorldPosFromMapPos then
        return nil
    end

    local point = CreateVector2D and CreateVector2D(x, y) or { x=x, y=y }
    local ok, continentID, world =
        pcall(C_Map.GetWorldPosFromMapPos, tonumber(mapID), point)
    if not ok or not world then return nil end

    local wx, wy = vectorXY(world)
    if wx == nil or wy == nil then return nil end

    return {
        continentID = continentID,
        x = wx,
        y = wy,
    }
end

local function blizzardToRestedXP(world)
    if not world then return nil end
    -- RestedXP Forever stores its absolute coordinates in the legacy
    -- coordinate convention: RXP X == Blizzard world Y and
    -- RXP Y == Blizzard world X.
    return {
        continentID = world.continentID,
        x = world.y,
        y = world.x,
        blizzardX = world.x,
        blizzardY = world.y,
    }
end

function D:MapToBlizzardWorld(mapID, x, y)
    return mapToBlizzardWorld(mapID, x, y)
end

function D:MapToRestedXPWorld(mapID, x, y)
    return blizzardToRestedXP(mapToBlizzardWorld(mapID, x, y))
end

function D:Between(position, waypoint)
    if not position or not waypoint then return nil, "missing_position" end
    if position.x == nil or position.y == nil or not tonumber(position.mapID) then
        return nil, "player_map_coordinates_missing"
    end

    if tonumber(waypoint.worldX) and tonumber(waypoint.worldY) then
        local playerWorld = self:MapToRestedXPWorld(
            tonumber(position.mapID),
            tonumber(position.x),
            tonumber(position.y))

        if not playerWorld then
            return nil, "player_world_coordinates_unavailable"
        end

        local dx = tonumber(waypoint.worldX) - playerWorld.x
        local dy = tonumber(waypoint.worldY) - playerWorld.y
        return math.sqrt(dx * dx + dy * dy),
            "restedxp_world_coordinates",
            {
                playerWorld = playerWorld,
                targetWorld = {
                    x = tonumber(waypoint.worldX),
                    y = tonumber(waypoint.worldY),
                },
                deltaX = dx,
                deltaY = dy,
            }
    end

    local effectiveMapID = tonumber(waypoint.mapID)
    if effectiveMapID and tonumber(position.mapID) ~= effectiveMapID then
        return nil, "different_map"
    end

    if not effectiveMapID and waypoint.mapName then
        if not sameName(position.mapName, waypoint.mapName) then
            return nil, "different_map_name"
        end
        effectiveMapID = tonumber(position.mapID)
    end

    if waypoint.x == nil or waypoint.y == nil then
        return nil, "waypoint_map_coordinates_missing"
    end

    if effectiveMapID then
        local playerWorld = mapToBlizzardWorld(
            effectiveMapID, tonumber(position.x), tonumber(position.y))
        local targetWorld = mapToBlizzardWorld(
            effectiveMapID, tonumber(waypoint.x), tonumber(waypoint.y))

        if playerWorld and targetWorld and
           playerWorld.continentID == targetWorld.continentID then
            local dx = targetWorld.x - playerWorld.x
            local dy = targetWorld.y - playerWorld.y
            return math.sqrt(dx * dx + dy * dy),
                "world_coordinates",
                {
                    playerWorld = playerWorld,
                    targetWorld = targetWorld,
                    deltaX = dx,
                    deltaY = dy,
                }
        end
    end

    if effectiveMapID and C_Map and C_Map.GetMapWorldSize then
        local ok, width, height = pcall(C_Map.GetMapWorldSize, effectiveMapID)
        if ok and tonumber(width) and tonumber(height) then
            local dx = (tonumber(waypoint.x) - tonumber(position.x)) * width
            local dy = (tonumber(waypoint.y) - tonumber(position.y)) * height
            return math.sqrt(dx * dx + dy * dy), "map_world_size", {
                deltaX = dx,
                deltaY = dy,
            }
        end
    end

    local dx = tonumber(waypoint.x) - tonumber(position.x)
    local dy = tonumber(waypoint.y) - tonumber(position.y)
    return math.sqrt(dx * dx + dy * dy), "normalized_map_distance", {
        deltaX = dx,
        deltaY = dy,
    }
end
