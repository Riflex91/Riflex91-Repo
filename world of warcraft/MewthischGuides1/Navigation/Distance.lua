local addonName, MG = ...

MG.NavigationDistance = MG.NavigationDistance or {}
local D = MG.NavigationDistance

local function sameName(a, b)
    if not a or not b then return false end
    return string.lower(tostring(a)) == string.lower(tostring(b))
end

function D:Between(position, waypoint)
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
        return math.sqrt(dx * dx + dy * dy),
            "restedxp_world_coordinates",
            {
                playerWorld=playerWorld,
                targetWorld={
                    x=tonumber(waypoint.worldX),
                    y=tonumber(waypoint.worldY),
                },
                deltaX=dx,
                deltaY=dy,
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

    if effectiveMapID and MG.CoordinateConverter then
        local playerWorld = MG.CoordinateConverter:MapToBlizzardWorld(
            effectiveMapID, position.x, position.y)
        local targetWorld = MG.CoordinateConverter:MapToBlizzardWorld(
            effectiveMapID, waypoint.x, waypoint.y)
        if playerWorld and targetWorld and
           playerWorld.continentID == targetWorld.continentID then
            local dx = targetWorld.x - playerWorld.x
            local dy = targetWorld.y - playerWorld.y
            return math.sqrt(dx * dx + dy * dy),
                "world_coordinates",
                {
                    playerWorld=playerWorld,
                    targetWorld=targetWorld,
                    deltaX=dx,
                    deltaY=dy,
                }
        end
    end

    if effectiveMapID and C_Map and C_Map.GetMapWorldSize then
        local ok, width, height = pcall(C_Map.GetMapWorldSize, effectiveMapID)
        if ok and tonumber(width) and tonumber(height) then
            local dx = (tonumber(waypoint.x) - tonumber(position.x)) * width
            local dy = (tonumber(waypoint.y) - tonumber(position.y)) * height
            return math.sqrt(dx * dx + dy * dy), "map_world_size", {
                deltaX=dx, deltaY=dy,
            }
        end
    end

    local dx = tonumber(waypoint.x) - tonumber(position.x)
    local dy = tonumber(waypoint.y) - tonumber(position.y)
    return math.sqrt(dx * dx + dy * dy), "normalized_map_distance", {
        deltaX=dx, deltaY=dy,
    }
end
