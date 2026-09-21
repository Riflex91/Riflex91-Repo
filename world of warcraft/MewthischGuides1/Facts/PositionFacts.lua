local addonName, MG = ...

MG.PositionFacts = MG.PositionFacts or {}
local P = MG.PositionFacts

function P:Snapshot()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then
        return {}
    end
    local ok, mapID = pcall(C_Map.GetBestMapForUnit, "player")
    if not ok or not mapID then return {} end
    local good, pos = pcall(C_Map.GetPlayerMapPosition, mapID, "player")
    if not good or not pos then return { mapID = mapID } end
    local x, y
    if pos.GetXY then x, y = pos:GetXY() else x, y = pos.x, pos.y end
    return { mapID = mapID, x = tonumber(x), y = tonumber(y) }
end
