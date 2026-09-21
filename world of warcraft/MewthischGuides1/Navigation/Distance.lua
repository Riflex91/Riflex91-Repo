local addonName, MG = ...

MG.NavigationDistance = MG.NavigationDistance or {}
local D = MG.NavigationDistance

local function sameName(a, b)
    if not a or not b then return false end
    return string.lower(tostring(a)) == string.lower(tostring(b))
end

local function vectorXY(value)
    if not value then return nil, nil end
    if tonumber(value.x) and tonumber(value.y) then return tonumber(value.x), tonumber(value.y) end
    if value.GetXY then
        local ok, x, y = pcall(value.GetXY, value)
        if ok and tonumber(x) and tonumber(y) then return tonumber(x), tonumber(y) end
    end
    return nil, nil
end

local function mapToWorld(mapID, x, y)
    if not mapID or not x or not y or not C_Map or not C_Map.GetWorldPosFromMapPos then
        return nil
    end
    local point = CreateVector2D and CreateVector2D(x, y) or {x=x,y=y}
    local ok, continentID, world = pcall(C_Map.GetWorldPosFromMapPos, mapID, point)
    if not ok or not world then return nil end
    local wx, wy = vectorXY(world)
    if not wx or not wy then return nil end
    return {continentID=continentID,x=wx,y=wy}
end

function D:Between(position, waypoint)
    if not position or not waypoint then return nil, "missing_position" end

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

    if not position.x or not position.y or not waypoint.x or not waypoint.y then
        return nil, "map_coordinates_missing"
    end

    if effectiveMapID then
        local playerWorld = mapToWorld(effectiveMapID, position.x, position.y)
        local targetWorld = mapToWorld(effectiveMapID, waypoint.x, waypoint.y)
        if playerWorld and targetWorld and
           playerWorld.continentID == targetWorld.continentID then
            local dx = targetWorld.x - playerWorld.x
            local dy = targetWorld.y - playerWorld.y
            return math.sqrt(dx * dx + dy * dy), "world_coordinates"
        end
    end

    if effectiveMapID and C_Map and C_Map.GetMapWorldSize then
        local ok, width, height = pcall(C_Map.GetMapWorldSize, effectiveMapID)
        if ok and tonumber(width) and tonumber(height) then
            local dx = (waypoint.x - position.x) * width
            local dy = (waypoint.y - position.y) * height
            return math.sqrt(dx * dx + dy * dy), "map_world_size"
        end
    end

    local dx = waypoint.x - position.x
    local dy = waypoint.y - position.y
    return math.sqrt(dx * dx + dy * dy), "normalized_map_distance"
end
