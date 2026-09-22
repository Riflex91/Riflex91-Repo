local addonName, MG = ...

MG.CoordinateConverter = MG.CoordinateConverter or {}
local C = MG.CoordinateConverter

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

local function makeVector(x, y)
    if CreateVector2D then
        local ok, value = pcall(CreateVector2D, x, y)
        if ok and value then return value end
    end
    return { x=x, y=y }
end

function C:MapToBlizzardWorld(mapID, x, y)
    mapID, x, y = tonumber(mapID), tonumber(x), tonumber(y)
    if not mapID or x == nil or y == nil or
       not C_Map or not C_Map.GetWorldPosFromMapPos then
        return nil, "world_from_map_unavailable"
    end

    local ok, continentID, world =
        pcall(C_Map.GetWorldPosFromMapPos, mapID, makeVector(x, y))
    if not ok or not world then return nil, "world_from_map_failed" end

    local wx, wy = vectorXY(world)
    if wx == nil or wy == nil then return nil, "world_vector_invalid" end
    return {
        continentID = tonumber(continentID),
        x = wx,
        y = wy,
    }, "ok"
end

function C:BlizzardWorldToRestedXP(world)
    if not world or tonumber(world.x) == nil or tonumber(world.y) == nil then
        return nil
    end
    -- RestedXP Forever uses the legacy coordinate convention where its X
    -- corresponds to Blizzard world Y and its Y corresponds to Blizzard X.
    return {
        continentID = tonumber(world.continentID),
        x = tonumber(world.y),
        y = tonumber(world.x),
        blizzardX = tonumber(world.x),
        blizzardY = tonumber(world.y),
    }
end

function C:MapToRestedXPWorld(mapID, x, y)
    local world, reason = self:MapToBlizzardWorld(mapID, x, y)
    if not world then return nil, reason end
    return self:BlizzardWorldToRestedXP(world), "ok"
end

function C:RestedXPToBlizzardWorld(worldX, worldY, continentID)
    worldX, worldY = tonumber(worldX), tonumber(worldY)
    if worldX == nil or worldY == nil then return nil end
    return {
        continentID = tonumber(continentID),
        x = worldY,
        y = worldX,
    }
end

local function firstVector(a, b, c)
    for _, value in ipairs({a,b,c}) do
        local x, y = vectorXY(value)
        if x ~= nil and y ~= nil then return x, y end
    end
    return nil, nil
end

function C:RestedXPWorldToMap(mapID, worldX, worldY)
    mapID = tonumber(mapID)
    if not mapID or not C_Map or not C_Map.GetMapPosFromWorldPos then
        return nil, "map_from_world_unavailable"
    end

    local center = self:MapToBlizzardWorld(mapID, 0.5, 0.5)
    local target = self:RestedXPToBlizzardWorld(
        worldX, worldY, center and center.continentID)
    if not target then return nil, "target_world_invalid" end

    local vector = makeVector(target.x, target.y)

    if center and center.continentID then
        local ok, a, b, c = pcall(
            C_Map.GetMapPosFromWorldPos,
            center.continentID,
            vector,
            mapID)
        if ok then
            local x, y = firstVector(a, b, c)
            if x ~= nil and y ~= nil then
                return { mapID=mapID, x=x, y=y }, "continent_signature"
            end
        end
    end

    local ok, a, b, c = pcall(C_Map.GetMapPosFromWorldPos, mapID, vector)
    if ok then
        local x, y = firstVector(a, b, c)
        if x ~= nil and y ~= nil then
            return { mapID=mapID, x=x, y=y }, "map_signature"
        end
    end

    return nil, "map_from_world_failed"
end

function C:WaypointToMap(waypoint)
    if not waypoint then return nil, "missing_waypoint" end
    if tonumber(waypoint.mapID) and tonumber(waypoint.x) and tonumber(waypoint.y) then
        return {
            mapID=tonumber(waypoint.mapID),
            x=tonumber(waypoint.x),
            y=tonumber(waypoint.y),
        }, "native_map"
    end
    if tonumber(waypoint.mapID) and tonumber(waypoint.worldX) and
       tonumber(waypoint.worldY) then
        return self:RestedXPWorldToMap(
            waypoint.mapID, waypoint.worldX, waypoint.worldY)
    end
    return nil, "waypoint_not_convertible"
end
