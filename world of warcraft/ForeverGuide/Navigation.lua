local addonName, FG = ...

FG.navigation = FG.navigation or {}
FG.lastNavigationSignature = nil

local function normalizeAngle(angle)
    while angle > math.pi do angle = angle - math.pi * 2 end
    while angle < -math.pi do angle = angle + math.pi * 2 end
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

local function tryQuestWaypointForMap(questID, mapID)
    if not mapID or not C_QuestLog or not C_QuestLog.GetNextWaypointForMap then return nil end

    local ok, x, y = pcall(C_QuestLog.GetNextWaypointForMap, questID, mapID)
    if ok and tonumber(x) and tonumber(y) then
        return {
            mapID = mapID,
            x = x,
            y = y,
            source = "C_QuestLog.GetNextWaypointForMap",
        }
    end

    return nil
end

local function tryQuestWaypoint(questID)
    if not C_QuestLog or not C_QuestLog.GetNextWaypoint then return nil end

    local ok, mapID, x, y = pcall(C_QuestLog.GetNextWaypoint, questID)
    if ok and tonumber(mapID) and tonumber(x) and tonumber(y) then
        return {
            mapID = mapID,
            x = x,
            y = y,
            source = "C_QuestLog.GetNextWaypoint",
        }
    end

    return nil
end

local function tryLegacyQuestPOI(questID, playerMapID)
    if not QuestPOIGetIconInfo or not playerMapID then return nil end

    local ok, completed, x, y, objective = pcall(QuestPOIGetIconInfo, questID)
    if ok and tonumber(x) and tonumber(y) then
        return {
            mapID = playerMapID,
            x = x,
            y = y,
            source = "QuestPOIGetIconInfo",
            objective = objective,
            completed = completed and true or false,
        }
    end

    return nil
end

local function tryNavigationWaypoint(playerMapID)
    if not playerMapID or not C_Navigation or not C_Navigation.GetNextWaypointForMap then return nil end

    local ok, x, y, description = pcall(C_Navigation.GetNextWaypointForMap, playerMapID)
    if ok and tonumber(x) and tonumber(y) then
        return {
            mapID = playerMapID,
            x = x,
            y = y,
            source = "C_Navigation.GetNextWaypointForMap",
            description = description,
        }
    end

    return nil
end

local function getWaypointText(questID)
    if C_QuestLog and C_QuestLog.GetNextWaypointText then
        local ok, text = pcall(C_QuestLog.GetNextWaypointText, questID)
        if ok and text and text ~= "" then return text end
    end

    return nil
end

local function worldXY(mapID, x, y)
    if not mapID or not x or not y or not C_Map or not C_Map.GetWorldPosFromMapPos then
        return nil
    end

    local ok, continentID, world = pcall(C_Map.GetWorldPosFromMapPos, mapID, { x = x, y = y })
    if not ok or not world then return nil end

    local wx = world.x
    local wy = world.y

    if (wx == nil or wy == nil) and world.GetXY then
        local xyOk, rx, ry = pcall(world.GetXY, world)
        if xyOk then
            wx = rx
            wy = ry
        end
    end

    if tonumber(wx) and tonumber(wy) then
        return continentID, wx, wy
    end

    return nil
end

local function questDistance(questID)
    if C_QuestLog and C_QuestLog.GetDistanceSqToQuest then
        local ok, distanceSq, onContinent = pcall(C_QuestLog.GetDistanceSqToQuest, questID)
        if ok and tonumber(distanceSq) and distanceSq >= 0 then
            return math.sqrt(distanceSq), onContinent and "quest-distance" or "quest-distance-crossmap"
        end
    end

    if C_Navigation and C_Navigation.GetDistance then
        local ok, distance = pcall(C_Navigation.GetDistance)
        if ok and tonumber(distance) and distance >= 0 then
            return distance, "C_Navigation.GetDistance"
        end
    end

    return nil
end

function FG:ResolveWaypoint(questID)
    local player = self:GetPosition()
    local playerMapID = player and player.mapID or nil

    local waypoint = tryQuestWaypointForMap(questID, playerMapID)
    if waypoint then return waypoint end

    waypoint = tryQuestWaypoint(questID)
    if waypoint then return waypoint end

    local questMapID = nil
    if GetQuestUiMapID then
        local ok, value = pcall(GetQuestUiMapID, questID, false)
        if ok then questMapID = value end
    end

    if questMapID and questMapID ~= playerMapID then
        waypoint = tryQuestWaypointForMap(questID, questMapID)
        if waypoint then return waypoint end
    end

    waypoint = tryLegacyQuestPOI(questID, playerMapID)
    if waypoint then return waypoint end

    waypoint = tryNavigationWaypoint(playerMapID)
    if waypoint then return waypoint end

    return nil
end

function FG:UpdateNavigationRealtime()
    local nav = self.navigation
    if not nav or not nav.questID then return end

    local player = self:GetPosition()
    nav.player = player

    local target = nav.target
    local distance, distanceSource = questDistance(nav.questID)

    if target and player and
       target.mapID == player.mapID and
       tonumber(target.x) and tonumber(target.y) and
       tonumber(player.x) and tonumber(player.y) then

        nav.sameMap = true

        local pc, px, py = worldXY(player.mapID, player.x, player.y)
        local tc, tx, ty = worldXY(target.mapID, target.x, target.y)

        local bearing = nil

        if pc and tc and pc == tc and px and py and tx and ty then
            local dx = tx - px
            local dy = ty - py
            local worldDistance = math.sqrt(dx * dx + dy * dy)

            if worldDistance >= 0 then
                distance = worldDistance
                distanceSource = "C_Map.GetWorldPosFromMapPos"
            end

            bearing = atan2(dx, dy)
        else
            local dx = target.x - player.x
            local dy = player.y - target.y
            nav.normalizedDistance = math.sqrt(dx * dx + dy * dy)
            bearing = atan2(dx, dy)
        end

        local facing = GetPlayerFacing and GetPlayerFacing() or nil
        if bearing and facing then
            nav.relativeAngle = normalizeAngle(bearing - facing)
        end
    else
        nav.sameMap = false
    end

    nav.distanceYards = distance
    nav.distanceSource = distanceSource
end

function FG:RefreshNavigation(reason)
    local step = self.currentStep

    if not step then
        self.navigation = {
            available = false,
            reason = "no_step",
        }
        return
    end

    local waypoint = self:ResolveWaypoint(step.questID)

    local nav = {
        available = waypoint ~= nil,
        questID = step.questID,
        target = waypoint,
        source = waypoint and waypoint.source or "Blizzard-SuperTrack",
        waypointText = getWaypointText(step.questID) or (waypoint and waypoint.description) or step.detail,
        reason = waypoint and nil or "no_waypoint_api_result",
        superTrack = true,
    }

    self.navigation = nav
    self:UpdateNavigationRealtime()

    local signature = table.concat({
        tostring(nav.questID or ""),
        tostring(nav.source or ""),
        tostring(waypoint and waypoint.mapID or ""),
        tostring(waypoint and waypoint.x or ""),
        tostring(waypoint and waypoint.y or ""),
    }, "|")

    if self.lastNavigationSignature ~= signature then
        self.lastNavigationSignature = signature

        if waypoint then
            self:Log("INFO", "navigation.waypoint", "Quest-Waypoint aktualisiert.", {
                questID = step.questID,
                mapID = waypoint.mapID,
                x = waypoint.x,
                y = waypoint.y,
                source = waypoint.source,
                reason = reason,
            })
        else
            self:Log("WARN", "navigation.fallback",
                "Kein direkter Quest-Waypoint gefunden; SuperTrack bleibt aktiv.", {
                    questID = step.questID,
                    reason = reason,
                })
        end
    end
end

function FG:GetDirectionLabel(angle)
    if angle == nil then return "kein Ziel" end

    local degrees = angle * 180 / math.pi
    if degrees < 0 then degrees = degrees + 360 end

    if degrees >= 337.5 or degrees < 22.5 then return "geradeaus" end
    if degrees < 67.5 then return "vorne rechts" end
    if degrees < 112.5 then return "rechts" end
    if degrees < 157.5 then return "hinten rechts" end
    if degrees < 202.5 then return "hinten" end
    if degrees < 247.5 then return "hinten links" end
    if degrees < 292.5 then return "links" end
    return "vorne links"
end
