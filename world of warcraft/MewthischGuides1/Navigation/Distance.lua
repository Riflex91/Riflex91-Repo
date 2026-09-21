local addonName, MG = ...

MG.NavigationDistance = MG.NavigationDistance or {}
local D = MG.NavigationDistance

function D:Between(position, waypoint)
    if not position or not waypoint then return nil, "missing_position" end
    if tonumber(position.mapID) ~= tonumber(waypoint.mapID) then
        return nil, "different_map"
    end
    if not position.x or not position.y or not waypoint.x or not waypoint.y then
        return nil, "map_coordinates_missing"
    end

    if C_Map and C_Map.GetMapWorldSize then
        local ok, width, height = pcall(C_Map.GetMapWorldSize, waypoint.mapID)
        if ok and tonumber(width) and tonumber(height) then
            local dx = (waypoint.x - position.x) * width
            local dy = (waypoint.y - position.y) * height
            return math.sqrt(dx * dx + dy * dy), "map_world_size"
        end
    end

    return nil, "world_scale_missing"
end
