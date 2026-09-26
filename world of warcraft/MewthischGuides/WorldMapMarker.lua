local addonName, MG = ...

MG.WorldMapMarker = MG.WorldMapMarker or {}
local Marker = MG.WorldMapMarker

Marker.lastSignature = nil
Marker.owned = false

function MG:RefreshWorldMapMarker(target)
    if not self.db or not self.db.settings then return end
    if not self.ForeverAPI or not self.ForeverAPI.SetWorldMapWaypoint then return end

    if not self.db.settings.showWorldMapMarker then
        if Marker.owned and self.ForeverAPI.ClearWorldMapWaypoint then
            self.ForeverAPI:ClearWorldMapWaypoint()
        end
        Marker.lastSignature = nil
        Marker.owned = false
        return
    end

    if not target then
        if Marker.owned and self.ForeverAPI.ClearWorldMapWaypoint then
            self.ForeverAPI:ClearWorldMapWaypoint()
        end
        Marker.lastSignature = nil
        Marker.owned = false
        return
    end

    local signature = table.concat({
        tostring(target.mapID or ""),
        tostring(target.x or ""),
        tostring(target.y or ""),
        tostring(target.worldX or ""),
        tostring(target.worldY or ""),
    }, "|")

    if Marker.lastSignature == signature then return end

    local ok, detail = self.ForeverAPI:SetWorldMapWaypoint(target)
    if ok then
        Marker.lastSignature = signature
        Marker.owned = true
        self:Log("INFO", "navigation.world_map_marker",
            "Weltkarten-Marker für das aktuelle Ziel gesetzt.", {
                mapID = detail and detail.mapID or target.mapID,
                x = detail and detail.x or target.x,
                y = detail and detail.y or target.y,
                source = target.source,
            })
    else
        Marker.lastSignature = nil
        Marker.owned = false
        self:Log("WARN", "navigation.world_map_marker_unavailable",
            "Weltkarten-Marker konnte nicht gesetzt werden.", {
                reason = detail,
                mapID = target.mapID,
                source = target.source,
            })
    end
end
