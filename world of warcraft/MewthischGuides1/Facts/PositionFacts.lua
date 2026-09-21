local addonName, MG = ...

MG.PositionFacts = MG.PositionFacts or {}
local P = MG.PositionFacts

local function currentZoneName(mapID)
    if C_Map and C_Map.GetMapInfo and mapID then
        local ok, info = pcall(C_Map.GetMapInfo, mapID)
        if ok and type(info) == "table" and info.name then return info.name end
    end
    if GetZoneText then
        local ok, name = pcall(GetZoneText)
        if ok and name and name ~= "" then return name end
    end
    return nil
end

function P:Snapshot()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then
        return {
            mapName = currentZoneName(nil),
        }
    end

    local ok, mapID = pcall(C_Map.GetBestMapForUnit, "player")
    if not ok or not mapID then return { mapName = currentZoneName(nil) } end

    local good, pos = pcall(C_Map.GetPlayerMapPosition, mapID, "player")
    if not good or not pos then
        return { mapID=mapID, mapName=currentZoneName(mapID) }
    end

    local x, y
    if pos.GetXY then x, y = pos:GetXY() else x, y = pos.x, pos.y end
    return {
        mapID = mapID,
        mapName = currentZoneName(mapID),
        x = tonumber(x),
        y = tonumber(y),
    }
end
