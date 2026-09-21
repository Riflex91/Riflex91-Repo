local addonName, MG = ...

MG.NavigationDistance = MG.NavigationDistance or {}
local D = MG.NavigationDistance

local function sameName(a, b)
    if not a or not b then return false end
    return string.lower(tostring(a)) == string.lower(tostring(b))
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

    if effectiveMapID and C_Map and C_Map.GetMapWorldSize then
        local ok, width, height = pcall(C_Map.GetMapWorldSize, effectiveMapID)
        if ok and tonumber(width) and tonumber(height) then
            local dx = (waypoint.x - position.x) * width
            local dy = (waypoint.y - position.y) * height
            return math.sqrt(dx * dx + dy * dy), "map_world_size"
        end
    end

    -- Preserve useful diagnostic distance even on Forever clients without
    -- GetMapWorldSize. This is normalized map distance, not yards.
    local dx, dy = waypoint.x - position.x, waypoint.y - position.y
    return math.sqrt(dx * dx + dy * dy), "normalized_map_distance"
end
